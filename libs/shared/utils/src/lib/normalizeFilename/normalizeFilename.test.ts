import { normalizeFilename } from './normalizeFilename';

describe('normalizeFilename', () => {
  it.each<[string, string]>([
    // Trimming and basic extension handling
    [' file.txt ', 'file.txt'],
    ['archive.tar.gz', 'archive.tar.gz'],
    ['file.', 'file'],
    ['...', ''],

    // Dotfiles (leading dot is trimmed from start/end)
    ['.env', 'env'],

    // Whitespace normalization
    ['my  file   name.txt', 'my-file-name.txt'],
    [' report . pdf ', 'report.pdf'],
    ['file.p d f', 'file.pdf'],

    // Unicode and diacritics
    ['résumé.pdf', 'resume.pdf'],
    ['photo.jpég', 'photo.jpeg'],

    // Collapse repeated separators and dots (base only)
    ['a..b....c.txt', 'a.b.c.txt'],
    ['__file--__--.TXT', 'file.TXT'],
    ['--hello__world--', 'hello-world'],

    // Control characters removed (both base and ext)
    ['file\u0000name.\u0001t\u0002x\u0003t', 'filename.txt'],

    // Keep only safe characters
    ['abc.DEF-ghi_jkl.mno.txt', 'abc.DEF-ghi_jkl.mno.txt'],

    // Path-like input sanitization
    ['C:\\temp\\my file.txt', 'C-temp-my-file.txt'],

    // Non-ASCII letters replaced in base; ext preserved
    ['文件.txt', '.txt'],

    // Mixed punctuation and symbols
    ['spécial—chars©2023!.md', 'special-chars-2023.md'],
  ])('normalizeFilename(%j) -> %j', (input, expected) => {
    expect(normalizeFilename(input)).toBe(expected);
  });

  it('removes trailing separators from base when ext gets stripped to empty', () => {
    // ext is only spaces -> stripped to empty; base trailing separator is trimmed
    expect(normalizeFilename('file.   ')).toBe('file');
  });

  it('does not force lowercase extension (preserves case)', () => {
    expect(normalizeFilename('Report.DOCX')).toBe('Report.DOCX');
  });

  it('handles names with no extension and only unsafe chars by returning empty string', () => {
    expect(normalizeFilename('—©!')).toBe('');
  });
});
