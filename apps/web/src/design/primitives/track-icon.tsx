import {
  Binary, Bot, Boxes, Braces, BrainCircuit, Bug, Cloud, Code, Cog, Cpu, Database, FlaskConical, GitBranch,
  Globe, Layers, Lock, Network, Server, ShieldCheck, Sparkles, Terminal, Workflow, type LucideIcon,
} from 'lucide-react';

/**
 * Tracks name their icon in the database. Only icons listed here can be shown,
 * which keeps the whole icon set out of the bundle; anything else falls back.
 */
const ICONS: Record<string, LucideIcon> = {
  Binary, Bot, Boxes, Braces, BrainCircuit, Bug, Cloud, Code, Cog, Cpu, Database, FlaskConical, GitBranch,
  Globe, Layers, Lock, Network, Server, ShieldCheck, Sparkles, Terminal, Workflow,
};

export const TRACK_ICON_NAMES = Object.keys(ICONS);

export function TrackIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Boxes;
  return <Icon className={className} aria-hidden />;
}
