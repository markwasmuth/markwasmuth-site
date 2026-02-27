// api/voice.js — Mission Control Voice API
// Receives audio → Whisper transcription → Claude response → ElevenLabs TTS → returns audio

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const VOICE_MAP = {
  cos:     'oLurv7R3k04bqLHoxjqG', // Sam Mid 30's — Alan
  alan:    'oLurv7R3k04bqLHoxjqG',
  madison: 'P6DYRhyswh9rvm7ssmem', // Lydia — Madison Harper
  cmo:     'FGY2WhTYpPnrIDTdsKH5', // Laura — Alexis Monroe
  ceo:     'nPczCjzI2devNBz1zQrb', // Brian — deep, resonant
  coo:     'JBFqnCBsd6RMkjVDRZzb', // George — warm, captivating
  cfo:     'pqHfZKP75CvOlQylNhV4', // Bill — wise, mature
  cto:     'IKne3meq5aSn9XLyUdCD', // Charlie — deep, confident
  cro:     'iP95p4xoKVk53GoZ742B', // Chris — charming
  legal:   'onwK4e9ZLuTAKqWW03F9', // Daniel — steady broadcaster
  media:   'cgSgspJ2msm6clMCkdW9', // Jessica — bright, warm
  intel:   'N2lVS1w4EtoT3dr4eOWO', // Callum — husky
  hr:      'XrExE9yKIg1WjnnlVkGX', // Matilda — knowledgeable
  comms:   'EXAVITQu4vr4xnSDxMaL', // Sarah — confident
};

const DEFAULT_VOICE = 'oLurv7R3k04bqLHoxjqG'; // Sam

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType = 'audio/webm', agentSlug = 'cos', systemPrompt = '' } = req.body;

    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    // --- Step 1: Transcribe with OpenAI Whisper ---
    const audioBuffer = Buffer.from(audio, 'base64');
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    const whisperForm = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    whisperForm.append('file', audioBlob, `audio.${ext}`);
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'en');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('Whisper error:', err);
      return res.status(500).json({ error: 'Transcription failed', detail: err });
    }

    const { text: transcript } = await whisperRes.json();
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'No speech detected' });
    }

    // --- Step 2: Get agent response from Claude ---
    const basePrompt = systemPrompt || `You are Alan, Chief of Staff for Mark Wasmuth's Command Center. 
You respond via voice — keep answers concise, conversational, and under 150 words. 
No markdown, no bullet points. Speak naturally like you're on a call.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: basePrompt + '\n\nIMPORTANT: This is a voice response. Be concise — max 2-3 sentences unless asked for detail. No lists, no headers, plain conversational speech.',
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude error:', err);
      return res.status(500).json({ error: 'Agent response failed', detail: err });
    }

    const claudeData = await claudeRes.json();
    const responseText = claudeData.content?.[0]?.text || 'I had trouble forming a response. Try again.';

    // --- Step 3: Convert to speech with ElevenLabs ---
    const voiceId = VOICE_MAP[agentSlug?.toLowerCase()] || DEFAULT_VOICE;

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'content-type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: responseText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!elevenRes.ok) {
      const err = await elevenRes.text();
      console.error('ElevenLabs error:', err);
      // Fallback: return text only
      return res.status(200).json({ transcript, responseText, audioFailed: true });
    }

    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    return res.status(200).json({
      transcript,
      responseText,
      audio: audioBase64,
      mimeType: 'audio/mpeg',
    });

  } catch (err) {
    console.error('Voice API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
