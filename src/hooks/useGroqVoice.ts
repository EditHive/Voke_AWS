import { useState, useRef, useCallback, useEffect } from 'react';
import Groq from 'groq-sdk';
import { LiveStatus, MessageLog } from '../types/voice';
// import { HfInference } from '@huggingface/inference';

// Initialize Groq client
// Initialize Groq client safely
const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        console.warn("VITE_GROQ_API_KEY is missing. Voice features will be disabled.");
        return null;
    }
    return new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
};

const groq = getGroqClient();

// Initialize Hugging Face client
// const hf = new HfInference(import.meta.env.VITE_HUGGING_FACE_TOKEN);

const SYSTEM_INSTRUCTION = `YOU ARE:
A real-time voice-based conversational assistant designed to conduct a professional yet friendly interview.

1. Core Personality & Speaking Style
- Speak in a friendly, warm, and natural tone.
- Keep responses concise (1-3 sentences max) unless asked for detail.
- Use spoken-language style (short sentences, natural fillers).
- Never sound robotic or overly formal.

2. Interaction Rules
- Respond quickly.
- If unclear, ask "Could you repeat that?".
- Do not mention you are an AI unless asked.
`;

interface UseGroqVoiceReturn {
    status: LiveStatus;
    connect: (context?: string) => Promise<void>;
    disconnect: () => void;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
    logs: MessageLog[];
    errorDetails: string | null;
}

export function useGroqVoice(): UseGroqVoiceReturn {
    const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<MessageLog[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const contextRef = useRef<string>('');
    const conversationHistoryRef = useRef<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([]);
    const statusRef = useRef(status);
    const isAiSpeakingRef = useRef(isAiSpeaking);
    const isListeningRef = useRef(false);

    useEffect(() => {
        statusRef.current = status;
        isAiSpeakingRef.current = isAiSpeaking;
    }, [status, isAiSpeaking]);

    const speakResponse = async (text: string) => {
        if (!text) return;

        try {
            console.log('DEBUG: Generating speech with Local macOS TTS...');
            setIsAiSpeaking(true);
            setVolume(0.8);

            // Call local TTS server
            const response = await fetch('http://localhost:5001', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error(`TTS Server error: ${response.statusText}`);
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            // Play the audio
            const audio = new Audio(audioUrl);

            audio.onplay = () => {
                console.log('DEBUG: Audio started');
            };

            audio.onended = () => {
                console.log('DEBUG: Audio finished');
                setIsAiSpeaking(false);
                setVolume(0);
                URL.revokeObjectURL(audioUrl);

                // Resume listening after speaking
                if (statusRef.current === LiveStatus.CONNECTED) {
                    setTimeout(() => startListening(), 500);
                }
            };

            audio.onerror = (e) => {
                console.error("DEBUG: Audio playback error:", e);
                setIsAiSpeaking(false);
                setVolume(0);
            };

            console.log('DEBUG: Playing audio for:', text);
            await audio.play();

        } catch (error) {
            console.error('DEBUG: Local TTS error:', error);
            setIsAiSpeaking(false);
            setVolume(0);

            // Fallback to browser TTS
            console.log('DEBUG: Falling back to browser TTS');
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => {
                setIsAiSpeaking(false);
                if (statusRef.current === LiveStatus.CONNECTED) {
                    setTimeout(() => startListening(), 500);
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
        try {
            console.log('DEBUG: Transcribing audio with Groq Whisper...');

            // Convert blob to File
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

            if (!groq) {
                console.error('DEBUG: Groq client not initialized (missing API key)');
                return '';
            }

            const transcription = await groq.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3-turbo',
                temperature: 0,
                response_format: 'verbose_json',
            });

            console.log('DEBUG: Transcription:', transcription.text);
            return transcription.text || '';
        } catch (error) {
            console.error('DEBUG: Whisper transcription error:', error);
            return '';
        }
    };

    const handleUserMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: MessageLog = {
            id: Date.now().toString() + '-user',
            role: 'user',
            text: text,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, userMsg]);
        conversationHistoryRef.current.push({ role: 'user', content: text });

        try {
            console.log('DEBUG: Sending to Groq...');

            const messages = [
                { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current },
                ...conversationHistoryRef.current
            ];

            console.log('DEBUG: Full messages being sent:', JSON.stringify(messages, null, 2));

            if (!groq) {
                const errorText = "I cannot process your request because my API key is missing.";
                speakResponse(errorText);
                return;
            }

            const completion = await groq.chat.completions.create({
                messages: messages as any,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 300,
            });

            const aiText = completion.choices[0]?.message?.content || "I didn't catch that.";
            console.log('DEBUG: Groq response:', aiText);

            const aiMsg: MessageLog = {
                id: Date.now().toString() + '-ai',
                role: 'assistant',
                text: aiText,
                timestamp: new Date(),
            };
            setLogs(prev => [...prev, aiMsg]);
            conversationHistoryRef.current.push({ role: 'assistant', content: aiText });

            speakResponse(aiText);

        } catch (error) {
            console.error('DEBUG: Groq API Error:', error);
            console.error('DEBUG: Error details:', JSON.stringify(error, null, 2));
            if (error instanceof Error) {
                console.error('DEBUG: Error message:', error.message);
                console.error('DEBUG: Error stack:', error.stack);
            }
            const errorText = "I'm having trouble connecting to my brain right now.";
            speakResponse(errorText);
        }
    };

    const startListening = async () => {
        if (isListeningRef.current || isAiSpeakingRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            audioChunksRef.current = [];
            isListeningRef.current = true;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                console.log('DEBUG: Recording started');
                setIsUserSpeaking(true);
                setVolume(0.5);
            };

            mediaRecorder.onstop = async () => {
                console.log('DEBUG: Recording stopped');
                setIsUserSpeaking(false);
                setVolume(0);
                isListeningRef.current = false;

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const transcription = await transcribeAudio(audioBlob);

                    if (transcription) {
                        await handleUserMessage(transcription);
                    } else {
                        // Resume listening if no transcription
                        if (statusRef.current === LiveStatus.CONNECTED) {
                            setTimeout(() => startListening(), 500);
                        }
                    }
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            // Auto-stop after 10 seconds (or when user stops speaking)
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 10000);

        } catch (error) {
            console.error('DEBUG: Microphone error:', error);
            setErrorDetails('Microphone access denied. Please allow microphone access.');
            setStatus(LiveStatus.ERROR);
        }
    };

    const connect = useCallback(async (context?: string) => {
        if (status === LiveStatus.CONNECTED) return;

        console.log('DEBUG: Connect called');
        setStatus(LiveStatus.CONNECTING);
        contextRef.current = context || '';
        conversationHistoryRef.current = [];

        try {
            // Test microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            setStatus(LiveStatus.CONNECTED);

            // Generate personalized greeting using Groq
            try {
                console.log('DEBUG: Generating personalized greeting...');
                if (!groq) {
                    throw new Error("Groq client not initialized");
                }

                const greetingCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current
                        },
                        {
                            role: 'user',
                            content: 'Generate a warm, personalized greeting for the user. Address them by name if available in the context. Keep it to 1-2 sentences and invite them to introduce themselves or talk about their experience.'
                        }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.8,
                    max_tokens: 100,
                });

                const greeting = greetingCompletion.choices[0]?.message?.content || "Hello! I'm ready to interview you. Please introduce yourself.";
                console.log('DEBUG: Generated greeting:', greeting);

                conversationHistoryRef.current.push({ role: 'assistant', content: greeting });
                setLogs([{
                    id: 'init',
                    role: 'assistant',
                    text: greeting,
                    timestamp: new Date()
                }]);

                speakResponse(greeting);
            } catch (error) {
                console.error('DEBUG: Failed to generate greeting:', error);
                const fallbackGreeting = "Hello! I'm ready to interview you. Please introduce yourself.";
                conversationHistoryRef.current.push({ role: 'assistant', content: fallbackGreeting });
                setLogs([{
                    id: 'init',
                    role: 'assistant',
                    text: fallbackGreeting,
                    timestamp: new Date()
                }]);
                speakResponse(fallbackGreeting);
            }
        } catch (e) {
            console.error("DEBUG: Connection failed", e);
            setErrorDetails("Failed to access microphone. Please allow microphone access.");
            setStatus(LiveStatus.ERROR);
        }
    }, [status]);

    const disconnect = useCallback(() => {
        console.log('DEBUG: Disconnect called');
        setStatus(LiveStatus.DISCONNECTED);
        isListeningRef.current = false;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setIsUserSpeaking(false);
        setIsAiSpeaking(false);
    }, []);

    return {
        status,
        connect,
        disconnect,
        isUserSpeaking,
        isAiSpeaking,
        volume,
        logs,
        errorDetails
    };
}
