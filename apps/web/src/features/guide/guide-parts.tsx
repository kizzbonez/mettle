import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import manifest from '../../../package.json';

/**
 * Address of a guide screenshot. The app version is part of the URL: these
 * files keep their names between releases, and a CDN in front of the site
 * would otherwise go on serving the previous release's pictures.
 */
export const shot = (name: string) => `/guide-shots/${name}.png?v=${manifest.version}`;

interface SectionProps {
  id: string;
  number: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}

/** A numbered chapter of the guide. The id is what the table of contents links to. */
export function Section({ id, number, title, lead, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-rule py-14 first:border-t-0 first:pt-0">
      <p className="label-spec text-ember-deep">Part {number}</p>
      <h2 className="display mt-2 text-4xl sm:text-5xl">{title}</h2>
      {lead ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-steel">{lead}</p> : null}
      <div className="mt-8 space-y-8">{children}</div>
    </section>
  );
}

interface FigureProps {
  src: string;
  alt: string;
  caption: ReactNode;
  /** Intrinsic size of the image, so the page does not jump as it loads. */
  width?: number;
  height?: number;
}

/** A screenshot in a frame, with a caption that says what to look at. */
export function Figure({ src, alt, caption, width = 1440, height = 900 }: FigureProps) {
  return (
    <figure className="border border-ink bg-forge shadow-lift">
      <div className="flex items-center gap-1.5 border-b border-forge-rule px-3 py-2" aria-hidden>
        <i className="size-2.5 rounded-full bg-forge-rule" />
        <i className="size-2.5 rounded-full bg-forge-rule" />
        <i className="size-2.5 rounded-full bg-forge-rule" />
      </div>
      {/* A plain img: these are static screenshots, served exactly as they were captured. */}
      <img src={src} alt={alt} width={width} height={height} loading="lazy" className="block h-auto w-full" />
      <figcaption className="border-t border-forge-rule px-4 py-3 text-[13px] leading-relaxed text-forge-muted">{caption}</figcaption>
    </figure>
  );
}

/** A short how-to: numbered steps with a bold lead-in each. */
export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="max-w-2xl space-y-4">
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-4">
          <span className="display grid size-9 shrink-0 place-items-center bg-ink text-lg text-white">{index + 1}</span>
          <div className="pt-1">
            <p className="font-semibold">{item.title}</p>
            <div className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('max-w-2xl space-y-4 text-[16px] leading-relaxed text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink', className)}>{children}</div>;
}

/** A side note: a tip, a limit worth knowing, or a common mistake. */
export function Tip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="max-w-2xl border-l-4 border-ember bg-white px-5 py-4">
      <p className="label-spec text-ember-deep">{title}</p>
      <div className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{children}</div>
    </aside>
  );
}

/** A two-column reference table: a term, then what it means. */
export function Reference({ rows, headers }: { headers: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="max-w-3xl overflow-x-auto border border-rule bg-plate">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-rule bg-rule-soft/60 text-left">
            {headers.map((header) => <th key={header} className="label-spec px-4 py-2.5 font-medium text-steel">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule-soft">
          {rows.map(([term, meaning], index) => (
            <tr key={index}>
              <td className="px-4 py-3 align-top font-semibold whitespace-nowrap">{term}</td>
              <td className="px-4 py-3 text-ink-2">{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[3px] border border-rule border-b-2 bg-white px-1.5 py-0.5 font-mono text-[13px] text-ink">{children}</kbd>;
}
