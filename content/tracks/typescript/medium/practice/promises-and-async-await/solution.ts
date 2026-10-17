export interface Branch {
  name: string;
  copiesOf(title: string): Promise<number>;
}

export async function totalCopies(branches: readonly Branch[], title: string): Promise<number> {
  const counts = await Promise.all(branches.map((branch) => branch.copiesOf(title)));
  return counts.reduce((sum, copies) => sum + copies, 0);
}

export async function shelfReport(branches: readonly Branch[], title: string): Promise<string[]> {
  const outcomes = await Promise.allSettled(branches.map((branch) => branch.copiesOf(title)));
  return outcomes.map((outcome, index) => {
    const name = branches[index].name;
    return outcome.status === "fulfilled" ? `${name}: ${outcome.value}` : `${name}: offline`;
  });
}

async function nameIfStocked(branch: Branch, title: string): Promise<string> {
  const copies = await branch.copiesOf(title);
  if (copies < 1) {
    throw new Error(`${branch.name} has no copy of ${title}`);
  }
  return branch.name;
}

export function firstWithCopy(branches: readonly Branch[], title: string): Promise<string> {
  return Promise.any(branches.map((branch) => nameIfStocked(branch, title)));
}

export function withDeadline<T>(work: Promise<T>, deadline: Promise<void>): Promise<T> {
  const expired = deadline.then((): never => {
    throw new Error("deadline passed");
  });
  return Promise.race([work, expired]);
}
