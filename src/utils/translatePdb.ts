/**
 * Translate PDB ATOM/HETATM coordinates by an offset vector.
 * Preserves PDB fixed-width column format (8.3f for X/Y/Z at cols 31-54).
 */
export function translatePdb(
  pdb: string,
  offset: { x: number; y: number; z: number },
): string {
  if (offset.x === 0 && offset.y === 0 && offset.z === 0) return pdb;

  return pdb
    .split("\n")
    .map((line) => {
      if (!line.startsWith("ATOM  ") && !line.startsWith("HETATM")) return line;

      const x = parseFloat(line.substring(30, 38)) + offset.x;
      const y = parseFloat(line.substring(38, 46)) + offset.y;
      const z = parseFloat(line.substring(46, 54)) + offset.z;

      return (
        line.substring(0, 30) +
        x.toFixed(3).padStart(8) +
        y.toFixed(3).padStart(8) +
        z.toFixed(3).padStart(8) +
        line.substring(54)
      );
    })
    .join("\n");
}
