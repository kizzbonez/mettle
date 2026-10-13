'use client';

import { TextField } from '@/design/primitives/field';
import type { TotpEnrollment } from '@/types/account';

interface TotpEnrollmentPanelProps {
  enrollment: TotpEnrollment;
  code: string;
  onCodeChange: (value: string) => void;
  error?: string;
}

/** Splits the secret into groups of four, the way authenticator apps show it. */
const grouped = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim();

/** Step one, scan the code; step two, type what the app shows. */
export function TotpEnrollmentPanel({ enrollment, code, onCodeChange, error }: TotpEnrollmentPanelProps) {
  const qr = `data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qrSvg)}`;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 border border-rule bg-white p-5 sm:flex-row sm:items-center">
        {/* A plain img: the source is an inline data URI, so there is nothing to optimize. */}
        <img src={qr} alt="QR code to scan with your authenticator app" className="size-40 shrink-0 self-center" />
        <div className="min-w-0 text-sm text-ink-2">
          <p className="font-semibold text-ink">1. Scan this with an authenticator app</p>
          <p className="mt-1 text-steel">Any TOTP app works: Google Authenticator, 1Password, Authy, Aegis and others.</p>
          <p className="label-spec mt-4 text-steel">Or enter this key by hand</p>
          <p className="mt-1 font-mono text-[13px] break-all select-all" data-testid="totp-secret" data-secret={enrollment.secret}>
            {grouped(enrollment.secret)}
          </p>
        </div>
      </div>
      <TextField
        label="2. Enter the 6-digit code it shows"
        value={code}
        onChange={(event) => onCodeChange(event.target.value.replace(/[^\d\s]/g, '').slice(0, 7))}
        error={error}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123 456"
        className="font-mono text-lg tracking-[0.3em]"
      />
    </div>
  );
}
