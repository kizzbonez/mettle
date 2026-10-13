import type { RunnerFile } from '@mettle/shared';

/** Minimal ustar writer: regular files only, enough to ship sources to a sandbox. */

const BLOCK = 512;
const SAFE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

export function assertSafePath(path: string): void {
  const segments = path.split('/');
  const safe = SAFE_PATH.test(path) && path.length <= 99 && !segments.includes('..');
  if (!safe) throw new Error(`Unsafe file path: ${path}`);
}

function writeOctal(header: Buffer, value: number, offset: number, length: number): void {
  header.write(value.toString(8).padStart(length - 1, '0') + '\0', offset, length, 'ascii');
}

function header(path: string, size: number): Buffer {
  const block = Buffer.alloc(BLOCK);
  block.write(path, 0, 100, 'utf8');
  writeOctal(block, 0o644, 100, 8);
  writeOctal(block, 0, 108, 8);
  writeOctal(block, 0, 116, 8);
  writeOctal(block, size, 124, 12);
  writeOctal(block, 0, 136, 12);
  block.write('        ', 148, 8, 'ascii'); // checksum field counts as spaces
  block.write('0', 156, 1, 'ascii'); // regular file
  block.write('ustar\0', 257, 6, 'ascii');
  block.write('00', 263, 2, 'ascii');
  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  return block;
}

export function packTar(files: RunnerFile[]): Buffer {
  const parts: Buffer[] = [];
  for (const file of files) {
    assertSafePath(file.path);
    const data = Buffer.from(file.content, 'utf8');
    parts.push(header(file.path, data.length), data);
    const remainder = data.length % BLOCK;
    if (remainder) parts.push(Buffer.alloc(BLOCK - remainder));
  }
  parts.push(Buffer.alloc(BLOCK * 2));
  return Buffer.concat(parts);
}
