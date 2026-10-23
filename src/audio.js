import { validateFile } from './utils.js';
export async function readAudio(file) {
  validateFile(file, ['wav', 'mp3', 'm4a', 'mp4', 'webm', 'ogg', 'flac', 'aac'], 40);
  const ctx = new AudioContext();
  let decoded;
  try { decoded = await ctx.decodeAudioData(await file.arrayBuffer()); }
  catch { throw new Error('Your browser could not read this audio format. Try exporting it as WAV or MP3.'); }
  finally { await ctx.close(); }
  if (decoded.duration > 600) throw new Error('Please split recordings into clips of 10 minutes or less.');
  if (decoded.duration < 0.2) throw new Error('This recording is too short to transcribe.');
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
  const result = await offline.startRendering();
  return { samples: result.getChannelData(0).slice(), duration: decoded.duration };
}
