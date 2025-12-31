import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

const languageExtensions: Record<string, Extension> = {
  typescript: javascript({ jsx: true, typescript: true }),
  javascript: javascript({ jsx: true }),
  tsx: javascript({ jsx: true, typescript: true }),
  jsx: javascript({ jsx: true }),
  ts: javascript({ typescript: true }),
  js: javascript(),
  python: python(),
  py: python(),
  go: go(),
  java: java(),
  php: php(),
  rust: rust(),
  rs: rust(),
  sql: sql(),
};

// High-contrast dark theme for code blocks
const codeTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0f172a", // slate-950
      color: "#e2e8f0", // slate-200
    },
    ".cm-content": {
      caretColor: "#3b82f6", // blue-500
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#3b82f6",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "#1e3a8a", // blue-900
      },
    ".cm-activeLine": {
      backgroundColor: "#1e293b", // slate-800
    },
    ".cm-gutters": {
      backgroundColor: "#0f172a",
      color: "#64748b", // slate-500
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#1e293b",
      color: "#94a3b8", // slate-400
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "3em",
      paddingRight: "1em",
    },
  },
  { dark: true },
);

export function CodeBlock({
  code,
  language = "typescript",
  title,
  showLineNumbers = true,
  maxHeight = "600px",
  className = "",
}: CodeBlockProps) {
  const extensions = [
    languageExtensions[language.toLowerCase()] || javascript(),
    codeTheme,
  ];

  return (
    <div
      className={`code-block rounded-lg border border-slate-700 overflow-hidden ${className}`}
    >
      {title && (
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">{title}</span>
          <span className="text-xs text-slate-500 uppercase font-mono">
            {language}
          </span>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight: maxHeight }}>
        <CodeMirror
          value={code}
          extensions={extensions}
          editable={false}
          basicSetup={{
            lineNumbers: showLineNumbers,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightSelectionMatches: false,
            closeBracketsKeymap: false,
            searchKeymap: false,
            foldKeymap: false,
            completionKeymap: false,
            lintKeymap: false,
          }}
          className="text-sm"
        />
      </div>
    </div>
  );
}
