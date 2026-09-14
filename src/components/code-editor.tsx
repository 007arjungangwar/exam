"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodeEditor({ language, value, onChange }: { language: string; value: string; onChange: (value: string) => void }) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 4,
        scrollBeyondLastLine: false,
        automaticLayout: true
      }}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}
