/**
 * Docker multiplexes stdout and stderr of a non-TTY exec into frames:
 * 1 byte stream id, 3 zero bytes, 4 byte big-endian length, then the payload.
 */

const HEADER_BYTES = 8;
const STDERR_STREAM = 2;
const TAIL_BYTES = 256;

export interface Captured {
  stdout: string;
  stderr: string;
  /** The last bytes of stdout, kept even when the capture itself was capped. */
  stdoutTail: string;
  truncated: boolean;
}

class CappedBuffer {
  private chunks: Buffer[] = [];
  private size = 0;
  private tail: Buffer = Buffer.alloc(0);
  truncated = false;

  constructor(private readonly limit: number) {}

  push(chunk: Buffer): void {
    this.tail = Buffer.concat([this.tail, chunk]).subarray(-TAIL_BYTES);
    const room = this.limit - this.size;
    if (room <= 0) {
      this.truncated = true;
      return;
    }
    const kept = chunk.length > room ? chunk.subarray(0, room) : chunk;
    if (kept.length < chunk.length) this.truncated = true;
    this.chunks.push(kept);
    this.size += kept.length;
  }

  text(): string {
    return Buffer.concat(this.chunks).toString('utf8');
  }

  tailText(): string {
    return this.tail.toString('utf8');
  }
}

export class Demuxer {
  private pending: Buffer = Buffer.alloc(0);
  private readonly out: CappedBuffer;
  private readonly err: CappedBuffer;

  constructor(limitBytes: number) {
    this.out = new CappedBuffer(limitBytes);
    this.err = new CappedBuffer(limitBytes);
  }

  write(chunk: Buffer): void {
    this.pending = this.pending.length ? Buffer.concat([this.pending, chunk]) : chunk;
    while (this.pending.length >= HEADER_BYTES) {
      const length = this.pending.readUInt32BE(4);
      const end = HEADER_BYTES + length;
      if (this.pending.length < end) return;
      const target = this.pending[0] === STDERR_STREAM ? this.err : this.out;
      target.push(this.pending.subarray(HEADER_BYTES, end));
      this.pending = this.pending.subarray(end);
    }
  }

  result(): Captured {
    return {
      stdout: this.out.text(),
      stderr: this.err.text(),
      stdoutTail: this.out.tailText(),
      truncated: this.out.truncated || this.err.truncated,
    };
  }
}
