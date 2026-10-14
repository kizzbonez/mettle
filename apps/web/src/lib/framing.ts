/**
 * Who may show these pages inside a frame. By default nobody, which stops
 * clickjacking. FRAME_ANCESTORS lists sites that may, such as a portfolio that
 * embeds the app: origins separated by spaces or commas. Anything that is not
 * a plain origin is ignored, so the setting cannot inject into a header.
 */

const ORIGIN = /^https?:\/\/[a-z0-9.-]+(:\d{1,5})?$/i;

export function frameAncestors(setting: string | undefined): string[] {
  return (setting ?? '').split(/[\s,]+/).filter((origin) => ORIGIN.test(origin));
}

/** The `frame-ancestors` directive for these origins. */
export function frameAncestorsDirective(origins: string[]): string {
  return origins.length > 0 ? `frame-ancestors 'self' ${origins.join(' ')}` : "frame-ancestors 'none'";
}
