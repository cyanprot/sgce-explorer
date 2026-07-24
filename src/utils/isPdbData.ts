/**
 * Validates that a string looks like PDB format (not HTML or another response).
 *
 * The record-keyword test alone accepted any text containing a line that merely
 * starts with one of these words — an SPA index.html fallback or an error page
 * that happens to mention REMARK passed, and was handed to the 3D viewer as a
 * structure. Rule out markup explicitly first; that is the failure mode actually
 * seen, and a stricter column-level parse would reject legitimate fragments.
 */
const PDB_RECORD = /^(HEADER|ATOM|HETATM|MODEL|REMARK)/m;
const LOOKS_LIKE_MARKUP = /^\s*(<!doctype|<html|<\?xml|<head|<body)/i;

export const isPdbData = (text: string) =>
  !!text && !LOOKS_LIKE_MARKUP.test(text) && PDB_RECORD.test(text);
