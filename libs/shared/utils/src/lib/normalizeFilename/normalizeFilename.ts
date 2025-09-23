export function normalizeFilename(input: string): string {
  // Trim whitespace
  const name = input.trim();

  let base = name;
  let ext = '';

  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
    base = name.slice(0, lastDotIndex);
    ext = name.slice(lastDotIndex + 1);
  } else {
    // keep whole name as base (no extension or dotfile)
    base = name;
    ext = '';
  }

  // Normalize Unicode (decompose) and remove diacritic marks
  // e.g. "résumé" -> "resume"
  const removeDiacritics = (s: string) =>
    s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  base = removeDiacritics(base);
  ext = removeDiacritics(ext);

  // Replace whitespace sequences with single hyphen
  base = base.replace(/\s+/g, '-');

  // Remove control characters
  // eslint-disable-next-line no-control-regex
  base = base.replace(/[\x00-\x1F\x7F]/g, '');
  // eslint-disable-next-line no-control-regex
  ext = ext.replace(/[\x00-\x1F\x7F]/g, '');

  // Keep only safe characters: letters, digits, dot, underscore, hyphen
  // For base we also allow dots (.) but will collapse consecutive dots below.
  base = base.replace(/[^A-Za-z0-9._-]+/g, '-');
  ext = ext.replace(/[^A-Za-z0-9._-]+/g, '');

  // Collapse repeated separators (hyphens, underscores, dots)
  base = base.replace(/[-_]{2,}/g, '-');
  base = base.replace(/\.{2,}/g, '.');

  // Trim separators from start/end
  base = base.replace(/^[-_.]+|[-_.]+$/g, '');

  return ext ? `${base}.${ext}` : base;
}
