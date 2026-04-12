/** Take a screenshot of the current canvas and download it as PNG. */
export function captureScreenshot(canvas: HTMLCanvasElement, filename = 'eyeball-screenshot.png') {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/** Export trail data as JSON and download. */
export interface ExportedTrailData {
  version: 1;
  exportedAt: string;
  trailPoints: Array<{
    tipPosition: [number, number, number];
    tiltAlpha: number;
    tiltBeta: number;
    insertionDepth: number;
    timestamp: number;
  }>;
}

export function exportTrailJSON(
  trailData: Array<{
    tipPosition: [number, number, number];
    tiltAlpha: number;
    tiltBeta: number;
    insertionDepth: number;
    timestamp: number;
  }>,
  filename = 'eyeball-trail.json'
) {
  const data: ExportedTrailData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trailPoints: trailData,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import trail data from a JSON file, returning parsed data or null on error. */
export function importTrailJSON(file: File): Promise<ExportedTrailData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Record<string, unknown>;
        if (
          typeof data.version === 'number' &&
          data.version === 1 &&
          Array.isArray(data.trailPoints)
        ) {
          resolve(data as unknown as ExportedTrailData);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
}

/** Screen recording state and controls. */
export interface ScreenRecorder {
  start: () => void;
  stop: () => void;
  isRecording: () => boolean;
}

export function createScreenRecorder(canvas: HTMLCanvasElement): ScreenRecorder {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    start: () => {
      if (mediaRecorder?.state === 'recording') return;

      const stream = canvas.captureStream(60); // 60 FPS
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.start();
    },

    stop: () => {
      if (mediaRecorder?.state !== 'recording') return;

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        chunks = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eyeball-recording-${String(Date.now())}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.stop();
    },

    isRecording: () => {
      return mediaRecorder?.state === 'recording';
    },
  };
}
