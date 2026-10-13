import { dockerOk } from './docker/http';
import { destroySandbox } from './sandbox/container';
import { SANDBOX_LABEL } from './sandbox/spec';

const MAX_AGE_SECONDS = 5 * 60;
const INTERVAL_MS = 60_000;

interface ContainerSummary {
  Id: string;
  Created: number;
}

/** Removes sandboxes that outlived any possible run, e.g. after a runner crash. */
export async function reapStaleSandboxes(): Promise<number> {
  const filters = encodeURIComponent(JSON.stringify({ label: [`${SANDBOX_LABEL}=1`] }));
  const containers = await dockerOk<ContainerSummary[]>(
    'GET',
    `/containers/json?all=true&filters=${filters}`,
  );
  const cutoff = Date.now() / 1000 - MAX_AGE_SECONDS;
  const stale = containers.filter((container) => container.Created < cutoff);
  await Promise.all(stale.map((container) => destroySandbox(container.Id)));
  return stale.length;
}

export function startReaper(onError: (error: unknown) => void): NodeJS.Timeout {
  const tick = () => {
    reapStaleSandboxes().catch(onError);
  };
  tick();
  const timer = setInterval(tick, INTERVAL_MS);
  timer.unref();
  return timer;
}
