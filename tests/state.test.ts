import { describe, expect, it } from 'vitest';
import { clampSelection, defaultSelection, denormalizedSelection, normalizedSelection, sanitizeOcrText } from '../src/state';

describe('reading frame', () => {
  it('starts inset and occupies the useful centre of an image', () => {
    expect(defaultSelection(1000, 600)).toEqual({ x: 100, y: 150, width: 800, height: 300 });
  });

  it('never moves outside the image or collapses below the minimum', () => {
    expect(clampSelection({ x: -50, y: 90, width: 5, height: 80 }, 100, 100)).toEqual({ x: 0, y: 20, width: 20, height: 80 });
  });

  it('round trips a frame between image sizes', () => {
    const source = { x: 100, y: 50, width: 400, height: 200 };
    expect(denormalizedSelection(normalizedSelection(source, 1000, 500), 500, 250)).toEqual({ x: 50, y: 25, width: 200, height: 100 });
  });
});

describe('OCR output', () => {
  it('removes scanner whitespace without flattening paragraphs', () => {
    expect(sanitizeOcrText(' First   line  \n\n\nSecond line  ')).toBe('First line\n\nSecond line');
  });
});
