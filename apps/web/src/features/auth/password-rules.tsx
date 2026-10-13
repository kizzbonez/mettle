import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PasswordRule {
  label: string;
  met: boolean;
}

/** The same rules the API enforces, checked as the user types. */
export function passwordRules(password: string): PasswordRule[] {
  return [
    { label: 'At least 10 characters', met: password.length >= 10 },
    { label: 'A letter', met: /[A-Za-z]/.test(password) },
    { label: 'A number', met: /\d/.test(password) },
  ];
}

export function passwordIsAcceptable(password: string): boolean {
  return passwordRules(password).every((rule) => rule.met) && new TextEncoder().encode(password).length <= 72;
}

/**
 * 0 to 4. Beyond the required rules, length is what makes a password hard to
 * guess, so that is what moves the meter.
 */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  const required = passwordRules(password).filter((rule) => rule.met).length;
  if (required < 3) return 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 16 || (password.length >= 13 && variety >= 3)) return 4;
  return password.length >= 12 || variety >= 3 ? 3 : 2;
}

const LABELS = ['', 'Too weak', 'Acceptable', 'Strong', 'Very strong'];
const COLORS = ['bg-rule', 'bg-crimson', 'bg-temper-1', 'bg-patina', 'bg-patina'];

/** A four-segment meter and a checklist that ticks off as each rule is met. */
export function PasswordMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);
  return (
    <div aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((segment) => (
            <div key={segment} className={cn('h-1.5 flex-1 transition-colors duration-300', segment <= strength ? COLORS[strength] : 'bg-rule')} />
          ))}
        </div>
        <span className="label-spec w-24 text-right text-steel">{LABELS[strength]}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {passwordRules(password).map((rule) => (
          <li key={rule.label} className={cn('flex items-center gap-1.5 text-[13px] transition-colors', rule.met ? 'text-patina' : 'text-steel')}>
            {rule.met ? <Check className="size-3.5" strokeWidth={3} /> : <Circle className="size-3" />}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
