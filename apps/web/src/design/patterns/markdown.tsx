import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

interface MarkdownProps {
  children: string;
  /** Dark variant for the lab workspace. */
  forge?: boolean;
  /** Tighter spacing for short text such as exam questions. */
  compact?: boolean;
  className?: string;
}

/** A link to another site opens in a new tab, so following a source does not lose the lesson or the exam. */
function Anchor({ href, children, ...rest }: ComponentProps<'a'>) {
  const external = href?.startsWith('https://') || href?.startsWith('http://');
  return <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

/**
 * Renders lesson, question and lab text. Raw HTML in the source is not
 * rendered (react-markdown escapes it), so content written by an instructor
 * cannot inject markup or script into a learner's page.
 */
export function Markdown({ children, forge, compact, className }: MarkdownProps) {
  return (
    <div className={cn('prose-mettle', forge && 'prose-forge', compact && 'prose-compact', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]} components={{ a: Anchor }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
