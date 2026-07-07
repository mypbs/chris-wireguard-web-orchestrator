export function TerminalBox({ output }: { output?: string | null }) {
  if (!output) return null;

  return (
    <div className="mt-4 bg-[#0a0a0a] border border-border rounded-md overflow-hidden">
      <div className="flex items-center px-4 py-2 border-b border-border/50 bg-black/40">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <span className="ml-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Command Output</span>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
          {output}
        </pre>
      </div>
    </div>
  );
}
