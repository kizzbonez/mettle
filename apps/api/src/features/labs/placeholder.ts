/**
 * Starter code marks what the learner has to write with a placeholder that
 * fails when it runs: `todo!()` in Rust, `raise NotImplementedError` in
 * Python, `throw new NotImplementedException()` in C#. Running the starter
 * untouched is the first thing most people do, so the reason shown says in
 * plain words what happened instead of echoing the language's own message.
 */
export function explainPlaceholder(message: string): string {
  const rust = /^not (?:yet )?implemented(?::\s*(.+))?$/.exec(message);
  if (rust) {
    const what = rust[1] ? `\`${rust[1]}\`` : 'This part';
    return `${what} is not written yet: it still has the starter's todo!() placeholder. Replace it with your code.`;
  }
  const python = /^NotImplementedError(?::\s*(.+))?$/.exec(message);
  if (python) {
    const what = python[1]?.replace(/\.$/, '') ?? 'This part is not written yet';
    return `${what}: replace the starter's "raise NotImplementedError" with your code.`;
  }
  if (message.startsWith('unexpected NotImplementedException')) {
    return 'This part is not written yet: replace the starter\'s "throw new NotImplementedException()" with your code.';
  }
  return message;
}
