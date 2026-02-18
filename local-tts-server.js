import express from 'express';
import cors from 'cors';
import say from 'say';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.text({ type: 'text/plain' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const unlinkAsync = promisify(fs.unlink);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: 'Local Native TTS (Cross-Platform)',
        platform: os.platform()
    });
});

async function synthesize(text, res) {
    if (!text) {
        return res.status(400).json({ error: 'Missing text' });
    }

    const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

    console.log(`[TTS] Synthesizing: "${text}" to ${tempFile}`);

    // Export to WAV using 'say' library
    // This works on macOS (say), Windows (Powershell), and Linux (Festival)
    say.export(text, null, 1.0, tempFile, async (err) => {
        if (err) {
            console.error(`[TTS] Export failed: ${err}`);
            return res.status(500).json({ error: 'TTS generation failed' });
        }

        try {
            // Read the file
            const buffer = await fs.promises.readFile(tempFile);

            console.log(`[TTS] Generated ${buffer.length} bytes`);

            res.set('Content-Type', 'audio/wav');
            res.set('Content-Length', buffer.length);
            res.send(buffer);

            // Cleanup
            await unlinkAsync(tempFile);
        } catch (readErr) {
            console.error('[TTS] Error reading/sending file:', readErr);
            res.status(500).json({ error: 'Failed to read audio file' });
        }
    });
}

app.get('/', (req, res) => synthesize(req.query.text, res));
app.post('/', (req, res) => {
    let text;
    if (typeof req.body === 'string') text = req.body;
    else if (req.body && req.body.text) text = req.body.text;
    synthesize(text, res);
});

app.listen(PORT, () => {
    console.log(`🎙️  Local TTS Server running on http://localhost:${PORT}`);
    console.log(`   Platform: ${os.platform()}`);
});
