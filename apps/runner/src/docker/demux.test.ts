import { describe, expect, it } from 'vitest';
import { Demuxer } from './demux';

function frame(stream: 1 | 2, text: string): Buffer {
  const payload = Buffer.from(text, 'utf8');
  const header = Buffer.alloc(8);
  header[0] = stream;
  header.writeUInt32BE(payload.length, 4);
  return Buffer.concat([header, payload]);
}

describe('Demuxer', () => {
  it('separates stdout from stderr', () => {
    const demuxer = new Demuxer(1024);
    demuxer.write(Buffer.concat([frame(1, 'out-1 '), frame(2, 'err-1'), frame(1, 'out-2')]));
    expect(demuxer.result()).toMatchObject({ stdout: 'out-1 out-2', stderr: 'err-1', truncated: false });
  });

  it('reassembles frames split across chunks', () => {
    const demuxer = new Demuxer(1024);
    const bytes = Buffer.concat([frame(1, 'hello world'), frame(2, 'warning')]);
    for (const byte of bytes) demuxer.write(Buffer.from([byte]));
    expect(demuxer.result()).toMatchObject({ stdout: 'hello world', stderr: 'warning' });
  });

  it('caps each stream and reports the truncation', () => {
    const demuxer = new Demuxer(10);
    demuxer.write(frame(1, 'x'.repeat(25)));
    demuxer.write(frame(1, 'y'.repeat(5)));
    const result = demuxer.result();
    expect(result.stdout).toBe('x'.repeat(10));
    expect(result.truncated).toBe(true);
  });

  it('keeps the end of stdout even when the capture was capped', () => {
    const demuxer = new Demuxer(10);
    demuxer.write(frame(1, 'x'.repeat(5000)));
    demuxer.write(frame(1, '\nfinal-marker\n'));
    expect(demuxer.result().stdoutTail.endsWith('\nfinal-marker\n')).toBe(true);
  });
});
