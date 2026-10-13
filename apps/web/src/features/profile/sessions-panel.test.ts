import { describe, expect, it } from 'vitest';
import { describeDevice } from './sessions-panel';

const UA = {
  chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  edgeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  safariPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
};

describe('describeDevice', () => {
  it('names the browser and the system', () => {
    expect(describeDevice(UA.chromeWindows).name).toBe('Chrome on Windows');
    expect(describeDevice(UA.safariMac).name).toBe('Safari on macOS');
    expect(describeDevice(UA.firefoxLinux).name).toBe('Firefox on Linux');
  });

  it('tells Edge from Chrome, and an iPhone from a Mac', () => {
    expect(describeDevice(UA.edgeWindows).name).toBe('Edge on Windows');
    expect(describeDevice(UA.safariPhone).name).toBe('Safari on iOS');
    expect(describeDevice(UA.chromeAndroid).name).toBe('Chrome on Android');
  });

  it('flags phones', () => {
    expect(describeDevice(UA.safariPhone).mobile).toBe(true);
    expect(describeDevice(UA.chromeAndroid).mobile).toBe(true);
    expect(describeDevice(UA.chromeWindows).mobile).toBe(false);
  });

  it('copes with a missing or unfamiliar user agent', () => {
    expect(describeDevice(null)).toEqual({ name: 'Unknown device', mobile: false });
    expect(describeDevice('curl/8.9.0').name).toBe('A browser on an unknown system');
  });
});
