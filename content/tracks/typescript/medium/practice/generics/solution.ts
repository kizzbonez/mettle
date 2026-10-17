export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginate<T>(items: readonly T[], perPage: number, page: number): Page<T> {
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page,
    totalPages: Math.ceil(items.length / perPage),
  };
}

export function playableWith<T extends { minPlayers: number; maxPlayers: number }>(
  games: readonly T[],
  players: number,
): T[] {
  return games.filter((game) => game.minPlayers <= players && players <= game.maxPlayers);
}

export class Waitlist<T = string> {
  #entries: T[] = [];

  add(entry: T): number {
    return this.#entries.push(entry);
  }

  next(): T | undefined {
    return this.#entries.shift();
  }

  peek(): T | undefined {
    return this.#entries[0];
  }

  get size(): number {
    return this.#entries.length;
  }
}
