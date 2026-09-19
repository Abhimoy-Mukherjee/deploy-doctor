import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

interface EvidenceViewerProps {
  evidence: string;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidence }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(evidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono font-semibold tracking-wider uppercase text-dev-secondary">
        <div className="flex items-center space-x-1.5">
          <Code className="w-3 h-3 text-dev-secondary" />
          <span>Evidence</span>
        </div>
        <button
          onClick={handleCopy}
          className="hover:text-dev-primary transition-colors flex items-center space-x-1 font-normal"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 bg-dev-input border border-dev-border rounded font-mono text-xs text-red-300 leading-relaxed overflow-x-auto selection:bg-red-950 selection:text-red-200">
        <pre className="whitespace-pre-wrap break-all font-mono">
          {evidence}
        </pre>
      </div>
    </div>
  );
};
