/**
 * Append a hex alpha channel to a hex color string.
 * Supports 3-char (#fff) and 6-char (#ffffff) input.
 * Alpha is clamped to [0, 1].
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  // Expand 3-char shorthand
  let h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  const clamped = Math.min(1, Math.max(0, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${h}${alphaHex}`;
}
