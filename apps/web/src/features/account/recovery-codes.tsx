'use client';

import { Check, Copy, Download } from 'lucide-react';
import { useState } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';

interface RecoveryCodesProps {
  codes: string[];
  siteName?: string;
}

/** The one time recovery codes are shown: a grid, plus copy and download. */
export function RecoveryCodes({ codes, siteName = 'Mettle' }: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false);
  const text = [`${siteName} recovery codes`, 'Each code works once.', '', ...codes].join('\n');

  async function copy() {
    await navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${siteName.toLowerCase()}-recovery-codes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Notice tone="warning" title="Save these now">
        They are shown once. If you lose your authenticator, a recovery code is the only way back in.
      </Notice>
      <ol className="grid grid-cols-2 gap-px border border-rule bg-rule font-mono text-[15px]" data-testid="recovery-codes">
        {codes.map((code, index) => (
          <li key={code} className="flex items-center gap-3 bg-white px-3 py-2">
            <span className="label-spec w-4 text-steel-2">{String(index + 1).padStart(2, '0')}</span>
            <span className="tracking-wide">{code}</span>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={copy} icon={copied ? <Check className="size-4 text-patina" /> : <Copy className="size-4" />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="secondary" size="sm" onClick={download} icon={<Download className="size-4" />}>
          Download
        </Button>
      </div>
    </div>
  );
}
