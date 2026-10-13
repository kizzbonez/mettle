/** Pure exam arithmetic: no database, no clock. */

/** Correct only when the chosen set equals the correct set. No partial credit. */
export function isAnswerCorrect(correctIds: readonly string[], selectedIds: readonly string[]): boolean {
  if (correctIds.length === 0 || correctIds.length !== new Set(selectedIds).size) return false;
  const correct = new Set(correctIds);
  return selectedIds.every((id) => correct.has(id));
}

export interface Score {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export function scoreAttempt(results: readonly boolean[], passPercent: number): Score {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 10_000) / 100;
  return { correct, total, percent, passed: total > 0 && percent >= passPercent };
}

/** Fisher-Yates. `random` returns a float in [0, 1); injected so tests are deterministic. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** A selection is acceptable if every id is an option of the question and the type allows the count. */
export function isValidSelection(
  type: 'single' | 'multiple' | 'true_false',
  optionIds: readonly string[],
  selectedIds: readonly string[],
): boolean {
  if (new Set(selectedIds).size !== selectedIds.length) return false;
  if (type !== 'multiple' && selectedIds.length > 1) return false;
  return selectedIds.every((id) => optionIds.includes(id));
}
