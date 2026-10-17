// Board Game Café
//
// Everything below works for any kind of item, but only because it says `any`, which switches
// type checking off. Replace every `any` with a type parameter (and a constraint where the code
// needs one), then write the bodies marked `throw new Error("Not implemented")`.

// Task 1: make Page generic.
export interface Page {
  items: any[];
  page: number;
  totalPages: number;
}

// Task 2
export function paginate(items: readonly any[], perPage: number, page: number): Page {
  throw new Error("Not implemented");
}

// Task 3: constrain the type parameter so the body may read minPlayers and maxPlayers.
export function playableWith(games: readonly any[], players: number): any[] {
  throw new Error("Not implemented");
}

// Task 4: a generic class whose type parameter defaults to string.
export class Waitlist {
  add(entry: any): number {
    throw new Error("Not implemented");
  }

  next(): any {
    throw new Error("Not implemented");
  }

  peek(): any {
    throw new Error("Not implemented");
  }

  get size(): number {
    throw new Error("Not implemented");
  }
}
