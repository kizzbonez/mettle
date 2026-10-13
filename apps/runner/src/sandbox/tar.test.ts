import { describe, expect, it } from 'vitest';
import { assertSafePath, packTar } from './tar';

const BLOCK = 512;

function readEntry(archive: Buffer, offset: number) {
  const header = archive.subarray(offset, offset + BLOCK);
  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
  const size = Number.parseInt(header.subarray(124, 135).toString('ascii'), 8);
  const body = archive.subarray(offset + BLOCK, offset + BLOCK + size).toString('utf8');
  return { header, name, size, body };
}

describe('packTar', () => {
  it('writes each file as a header block followed by padded content', () => {
    const archive = packTar([
      { path: 'solution.rs', content: 'fn main() {}' },
      { path: 'data/input.txt', content: 'héllo' },
    ]);
    expect(archive.length % BLOCK).toBe(0);
    const first = readEntry(archive, 0);
    expect(first.name).toBe('solution.rs');
    expect(first.body).toBe('fn main() {}');
    const second = readEntry(archive, BLOCK * 2);
    expect(second.name).toBe('data/input.txt');
    expect(second.size).toBe(Buffer.byteLength('héllo'));
    expect(second.body).toBe('héllo');
  });

  it('writes a checksum that matches the header bytes', () => {
    const { header } = readEntry(packTar([{ path: 'a.py', content: 'x' }]), 0);
    const stored = Number.parseInt(header.subarray(148, 154).toString('ascii'), 8);
    const copy = Buffer.from(header);
    copy.fill(' ', 148, 156);
    expect(stored).toBe(copy.reduce((sum, byte) => sum + byte, 0));
  });

  it('ends with two empty blocks', () => {
    const archive = packTar([]);
    expect(archive.length).toBe(BLOCK * 2);
    expect(archive.every((byte) => byte === 0)).toBe(true);
  });
});

describe('assertSafePath', () => {
  it.each(['../etc/passwd', '/etc/passwd', 'a/../b', 'a//b', 'with space', '', 'x'.repeat(120)])(
    'rejects %j',
    (path) => {
      expect(() => assertSafePath(path)).toThrow(/Unsafe file path/);
    },
  );

  it.each(['solution.rs', 'data/auth.log', 'case_1.py', 'data/nested/file-2.txt'])('accepts %j', (path) => {
    expect(() => assertSafePath(path)).not.toThrow();
  });
});
