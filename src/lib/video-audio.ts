// Extract the audio track from a video file in the browser and encode it as
// a 16 kHz mono WAV. Returns null if the file has no decodable audio.

const TARGET_SR = 16_000;
const MAX_SECONDS = 90;

export async function extractAudioWav(file: File): Promise<Blob | null> {
  try {
    const buf = await file.arrayBuffer();
    const AC: typeof AudioContext =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    if (!AC) return null;
    const decodeCtx = new AC();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await decodeCtx.decodeAudioData(buf.slice(0));
    } catch {
      await decodeCtx.close().catch(() => {});
      return null;
    }
    await decodeCtx.close().catch(() => {});

    const srcDuration = Math.min(audioBuffer.duration, MAX_SECONDS);
    if (srcDuration <= 0.1) return null;

    // Downmix + resample via OfflineAudioContext at target SR.
    const targetLen = Math.floor(srcDuration * TARGET_SR);
    const offline = new OfflineAudioContext(1, targetLen, TARGET_SR);
    // We can't feed a truncated AudioBuffer directly; use a source and stop().
    const src = offline.createBufferSource();
    src.buffer = audioBuffer;
    // Mixdown: connect all channels into destination (mono = 1 channel).
    src.connect(offline.destination);
    src.start(0, 0, srcDuration);
    const rendered = await offline.startRendering();

    const channel = rendered.getChannelData(0);
    return encodeWav16bit(channel, TARGET_SR);
  } catch {
    return null;
  }
}

function encodeWav16bit(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}