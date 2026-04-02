/** Converts CSS hex color string to integer (e.g. "#3b82f6" → 0x3b82f6) */
export const hexToInt = (hex: string) => parseInt(hex.slice(1), 16);
