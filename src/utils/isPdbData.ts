/** Validates that a string looks like PDB format (not HTML or other response) */
export const isPdbData = (text: string) =>
  /^(HEADER|ATOM|MODEL|REMARK)/m.test(text);
