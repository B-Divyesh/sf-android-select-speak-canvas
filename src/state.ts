export type Selection = { x: number; y: number; width: number; height: number };

export const defaultSelection = (width: number, height: number): Selection => ({
  x: Math.round(width * 0.1),
  y: Math.round(height * 0.25),
  width: Math.round(width * 0.8),
  height: Math.round(height * 0.5),
});

export function clampSelection(selection: Selection, canvasWidth: number, canvasHeight: number): Selection {
  const minWidth = Math.min(20, canvasWidth);
  const minHeight = Math.min(20, canvasHeight);
  const width = Math.max(minWidth, Math.min(selection.width, canvasWidth));
  const height = Math.max(minHeight, Math.min(selection.height, canvasHeight));
  return {
    x: Math.max(0, Math.min(selection.x, canvasWidth - width)),
    y: Math.max(0, Math.min(selection.y, canvasHeight - height)),
    width,
    height,
  };
}

export function normalizedSelection(selection: Selection, width: number, height: number): Selection {
  return {
    x: selection.x / width,
    y: selection.y / height,
    width: selection.width / width,
    height: selection.height / height,
  };
}

export function denormalizedSelection(selection: Selection, width: number, height: number): Selection {
  return clampSelection({
    x: selection.x * width,
    y: selection.y * height,
    width: selection.width * width,
    height: selection.height * height,
  }, width, height);
}

export function sanitizeOcrText(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function licenseIsFresh(checkedAt: number, now = Date.now()): boolean {
  return now - checkedAt < 24 * 60 * 60 * 1000;
}
