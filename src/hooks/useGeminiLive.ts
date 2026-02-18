import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LiveStatus, MessageLog } from '../types/voice';
import { createPcmBlob, base64ToBytes, decodeAudioData } from '../utils/audioUtils';

const BASE_SYSTEM_INSTRUCTION = `YOU ARE:
A real-time voice-based conversational assistant designed to conduct a professional yet friendly interview.

1. Core Personality & Speaking Style
- Speak in a friendly, warm, and natural tone — like a calm, confident human interviewer.
- Keep responses concise unless the user asks for detail.
- Use spoken-language style, not text-style (short sentences, natural fillers, pauses where appropriate).
- Never sound robotic or overly formal.
- Adapt tone to match user emotion.

2. Real-Time Interaction Rules
- Respond quickly.
- Allow interruptions; if user speaks while you’re talking, stop immediately.
- If the user pauses, wait for input.

3. Context & Memory Handling
- Maintain short-term conversational memory.
- Use the provided context (Resume, LinkedIn, GitHub) to ask relevant questions.

4. Voice-Friendly Output Formatting
- Use natural phrasing like "Sure, let me think..." or "Okay, here's what I found...".
- Avoid long lists.

5. Error Handling & Uncertainty
- If unclear, ask "Wait, could you repeat that?".
- If unknown, say "I'm not sure about that".

6. Capabilities
- Ask interview questions based on the user's profile.
- Help with tasks, explain concepts.

7. Limitations
- Never break character.
- Do not mention you are an AI unless asked directly.

8. Final Output Format
- Voice-optimized, conversational, adaptive, interruptible.`;

interface UseGeminiLiveReturn {
    status: LiveStatus;
    connect: (context?: string) => Promise<void>;
    disconnect: () => void;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
    logs: MessageLog[];
}

export function useGeminiLive(): UseGeminiLiveReturn {
    const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<MessageLog[]>([]);

    // Refs for audio context and resources
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Audio playback management
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Session management
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const currentSessionRef = useRef<any>(null); // To store the resolved session for cleanup

    // Transcription buffer
    const currentInputTransRef = useRef('');
    const currentOutputTransRef = useRef('');

    const cleanupAudioContexts = () => {
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (inputProcessorRef.current) {
            inputProcessorRef.current.disconnect();
            inputProcessorRef.current = null;
        }
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Stop all playing sources
        activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore */ }
        });
        activeSourcesRef.current.clear();

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        nextStartTimeRef.current = 0;
    };

    const disconnect = useCallback(() => {
        if (currentSessionRef.current) {
            try {
                // Attempt to close the session if the method exists
                currentSessionRef.current.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
        }

        cleanupAudioContexts();
        setStatus(LiveStatus.DISCONNECTED);
        setIsUserSpeaking(false);
        setIsAiSpeaking(false);
        setVolume(0);
        sessionPromiseRef.current = null;
        currentSessionRef.current = null;
    }, []);

    const connect = useCallback(async (context?: string) => {
        if (status === LiveStatus.CONNECTED || status === LiveStatus.CONNECTING) return;

        setStatus(LiveStatus.CONNECTING);

        try {
            // 1. Initialize Audio Contexts
            // Input: 16kHz for speech recognition optimization
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // Output: 24kHz for higher quality playback
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);

            // 2. Get Microphone Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // 3. Initialize Gemini Client
            // Note: In a real app, you should proxy this through your backend to hide the API key
            // or use a short-lived token. For this demo, we assume it's safe or local.
            const apiKey = "AIzaSyCwRtDf63QZxPKP6cS5hThx04kxfpUsJQU";
            if (!apiKey) {
                console.error("API Key not found");
                setStatus(LiveStatus.ERROR);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });

            const fullSystemInstruction = context
                ? `${BASE_SYSTEM_INSTRUCTION}\n\nCONTEXT FOR INTERVIEW:\n${context}`
                : BASE_SYSTEM_INSTRUCTION;

            // 4. Setup Connection
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: fullSystemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log('Gemini Live Session Opened');
                        setStatus(LiveStatus.CONNECTED);

                        // Start Audio Streaming Logic
                        const source = inputCtx.createMediaStreamSource(stream);
                        inputSourceRef.current = source;

                        // ScriptProcessor for raw audio access (bufferSize, inputChannels, outputChannels)
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        inputProcessorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);

                            // Calculate volume for visualizer
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i++) {
                                sum += inputData[i] * inputData[i];
                            }
                            const rms = Math.sqrt(sum / inputData.length);
                            // Simple threshold for user speaking state
                            const isSpeakingNow = rms > 0.02;
                            setIsUserSpeaking(isSpeakingNow);
                            setVolume(Math.min(1, rms * 5)); // Amplify for visualizer

                            // Convert to PCM and Send
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle interruptions
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            console.log('Interrupted by user');
                            activeSourcesRef.current.forEach(src => {
                                try { src.stop(); } catch (e) { }
                            });
                            activeSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setIsAiSpeaking(false);
                        }

                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            setIsAiSpeaking(true);

                            // Ensure playback timing is correct
                            const currentTime = outputCtx.currentTime;
                            if (nextStartTimeRef.current < currentTime) {
                                nextStartTimeRef.current = currentTime;
                            }

                            try {
                                const rawBytes = base64ToBytes(base64Audio);
                                const audioBuffer = await decodeAudioData(rawBytes, outputCtx, 24000, 1);

                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);

                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;

                                activeSourcesRef.current.add(source);
                                source.onended = () => {
                                    activeSourcesRef.current.delete(source);
                                    if (activeSourcesRef.current.size === 0) {
                                        setIsAiSpeaking(false);
                                    }
                                };
                            } catch (e) {
                                console.error("Error decoding/playing audio", e);
                            }
                        }

                        // Handle Transcriptions
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTransRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTransRef.current += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            if (currentInputTransRef.current) {
                                setLogs(prev => [...prev, {
                                    id: Date.now().toString() + '-user',
                                    role: 'user',
                                    text: currentInputTransRef.current,
                                    timestamp: new Date()
                                }]);
                                currentInputTransRef.current = '';
                            }
                            if (currentOutputTransRef.current) {
                                setLogs(prev => [...prev, {
                                    id: Date.now().toString() + '-ai',
                                    role: 'assistant',
                                    text: currentOutputTransRef.current,
                                    timestamp: new Date()
                                }]);
                                currentOutputTransRef.current = '';
                            }
                        }
                    },
                    onclose: () => {
                        console.log('Session closed');
                        disconnect();
                    },
                    onerror: (err) => {
                        console.error('Session error:', err);
                        disconnect();
                        setStatus(LiveStatus.ERROR);
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;
            sessionPromise.then(sess => {
                currentSessionRef.current = sess;
            });

        } catch (error) {
            console.error("Connection failed:", error);
            disconnect();
            setStatus(LiveStatus.ERROR);
        }
    }, [status, disconnect]);

    return {
        status,
        connect,
        disconnect,
        isUserSpeaking,
        isAiSpeaking,
        volume,
        logs
    };
}
