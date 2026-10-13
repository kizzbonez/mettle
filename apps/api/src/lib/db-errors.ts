import { conflict } from './errors';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

function pgCode(error: unknown): string | undefined {
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate?.cause?.code ?? candidate?.code;
}

/** Runs a write and turns a unique-index violation into a 409 with a useful message. */
export async function uniqueOrConflict<T>(work: () => Promise<T>, message: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION) throw conflict(message, 'already_exists');
    if (pgCode(error) === FOREIGN_KEY_VIOLATION) throw conflict('That refers to something that does not exist.', 'bad_reference');
    throw error;
  }
}
