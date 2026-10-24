'use client';

import Editor, { loader, type BeforeMount, type OnMount } from '@monaco-editor/react';
import type { LabLanguage } from '@mettle/shared';
import monacoManifest from 'monaco-editor/package.json';
import { useRef } from 'react';
import { Spinner } from '@/design/primitives/spinner';

// Monaco is served from this origin (see scripts/copy-monaco.mjs), not a CDN,
// so the Content Security Policy never has to allow a third-party host. The path
// is absolute because language workers (TypeScript's) start from a blob: URL, where
// a path without an origin cannot be resolved.
const origin = typeof window === 'undefined' ? '' : window.location.origin;
loader.config({ paths: { vs: `${origin}/monaco/${monacoManifest.version}/vs` } });

const MONACO_LANGUAGE: Record<LabLanguage, string> = {
  rust: 'rust', python: 'python', bash: 'shell', cpp: 'cpp', csharp: 'csharp', yaml: 'yaml', typescript: 'typescript', go: 'go',
};
const THEME = 'mettle-forge';

const defineTheme: BeforeMount = (monaco) => {
  // The editor sees one file without Node's types, so its own type checks would flag correct
  // code; the sandbox type-checks strictly. Syntax errors are still underlined as you type.
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  monaco.editor.defineTheme(THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7f8c90', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff9d5c' },
      { token: 'string', foreground: '9bd6a3' },
      { token: 'number', foreground: 'e2b86b' },
      { token: 'type', foreground: '7fc8f8' },
      { token: 'type.identifier', foreground: '7fc8f8' },
      { token: 'delimiter', foreground: 'b6c0c3' },
    ],
    colors: {
      'editor.background': '#0e1214',
      'editor.foreground': '#e7eae9',
      'editorLineNumber.foreground': '#3d494f',
      'editorLineNumber.activeForeground': '#97a3a7',
      'editor.lineHighlightBackground': '#161b1e',
      'editor.selectionBackground': '#f2641955',
      'editorCursor.foreground': '#f26419',
      'editorIndentGuide.background1': '#1f262a',
      'editorWidget.background': '#161b1e',
      'editorWidget.border': '#2d373c',
      'scrollbarSlider.background': '#2d373c88',
    },
  });
};

interface CodeEditorProps {
  language: LabLanguage;
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter. */
  onRun: () => void;
  /** Ctrl/Cmd+Shift+Enter. */
  onSubmit: () => void;
  readOnly?: boolean;
}

export function CodeEditor({ language, value, onChange, onRun, onSubmit, readOnly }: CodeEditorProps) {
  // The editor keeps the first handlers it is given, so they are read through refs.
  const run = useRef(onRun);
  const submit = useRef(onSubmit);
  run.current = onRun;
  submit.current = onSubmit;

  const bindKeys: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submit.current());
    editor.focus();
  };

  return (
    <Editor
      height="100%"
      theme={THEME}
      language={MONACO_LANGUAGE[language]}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      beforeMount={defineTheme}
      onMount={bindKeys}
      loading={<Spinner className="text-ember" label="Loading the editor" />}
      options={{
        readOnly,
        fontFamily: "var(--font-plex-mono), 'Cascadia Mono', Consolas, monospace",
        fontSize: 13.5,
        lineHeight: 22,
        fontLigatures: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: language === 'bash' || language === 'yaml' || language === 'typescript' ? 2 : 4,
        // gofmt indents Go with tabs.
        insertSpaces: language !== 'go',
        renderWhitespace: 'selection',
        padding: { top: 14, bottom: 14 },
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
