// Sample N frames evenly from a video file and return them as JPEG data URLs.
// Runs entirely in the browser via <video> + <canvas>.

export async function extractFrames(
  file: File,
  count = 8,
  maxWidth = 512,
): Promise<{ frames: string[]; duration: number }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = url;

  const cleanup = () => URL.revokeObjectURL(url);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load video"));
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Invalid video duration");
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    const scale = Math.min(1, maxWidth / vw);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2d unavailable");

    const frames: string[] = [];
    // Evenly spaced timestamps, avoiding exact 0 and end.
    for (let i = 0; i < count; i++) {
      const t = ((i + 0.5) / count) * duration;
      await seekTo(video, Math.min(duration - 0.05, Math.max(0, t)));
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas.toDataURL("image/jpeg", 0.7));
    }

    return { frames, duration };
  } finally {
    cleanup();
  }
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      // Small delay ensures the frame is actually painted.
      setTimeout(resolve, 30);
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Seek failed"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}