import React, { useState } from 'react';
import { DiagnosisResponse, DiagnosisCategory, ConfidenceLevel } from '../types/diagnosis';
import { EvidenceViewer } from './EvidenceViewer';
import { Copy, Check, CheckCircle2 } from 'lucide-react';

interface DiagnosisResultProps {
  diagnosis: DiagnosisResponse;
}

type FixPart = 
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; code: string };

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ diagnosis }) => {

  const getCategoryMeta = (category: DiagnosisCategory) => {
    switch (category) {
      case 'missing_config':
        return { label: 'Missing configuration', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'port_conflict':
        return { label: 'Port conflict', color: 'bg-orange-500/10 text-orange-300 border-orange-500/30' };
      case 'build_failure':
        return { label: 'Build failure', color: 'bg-red-500/10 text-red-300 border-red-500/30' };
      case 'health_check_failure':
        return { label: 'Health check failed', color: 'bg-sky-500/10 text-sky-300 border-sky-500/30' };
      case 'resource_limit':
        return { label: 'Resource limit (OOM)', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'dependency_conflict':
        return { label: 'Dependency conflict', color: 'bg-amber-400/10 text-amber-200 border-amber-400/30' };
      default:
        return { label: 'Deployment error', color: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30' };
    }
  };

  const getConfidenceMeta = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'high':
        return { label: 'High confidence', dot: 'bg-emerald-400', text: 'text-emerald-400' };
      case 'medium':
        return { label: 'Medium confidence', dot: 'bg-amber-400', text: 'text-amber-400' };
      default:
        return { label: 'Low confidence', dot: 'bg-red-400', text: 'text-red-400' };
    }
  };

  const catMeta = getCategoryMeta(diagnosis.category);
  const confMeta = getConfidenceMeta(diagnosis.confidence);

  // Helper to parse code blocks in suggested_fix
  const renderFormattedFix = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts: FixPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'bash',
        code: match[2].trim(),
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3 text-xs sm:text-sm text-dev-primary leading-relaxed">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return <CodeBlock key={idx} lang={p.lang} code={p.code} />;
          }
          return (
            <div key={idx} className="whitespace-pre-line text-dev-secondary">
              {p.content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-8 p-6 bg-dev-surface border border-dev-border rounded-lg space-y-6 transition-all duration-300">
      
      {/* Diagnosis Header: Section Title + Metadata */}
      <div className="flex items-center justify-between pb-3 border-b border-dev-border-subtle">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-dev-secondary">
          Diagnosis
        </span>
        <span className="font-mono text-[11px] text-dev-muted">
          Analyzed just now
        </span>
      </div>

      {/* Category & Confidence Ribbon */}
      <div className="flex flex-wrap items-center space-x-3">
        <span className={`px-2.5 py-1 rounded border font-mono text-xs ${catMeta.color}`}>
          {catMeta.label}
        </span>
        <span className="flex items-center space-x-1.5 font-mono text-xs text-dev-secondary">
          <span className={`w-1.5 h-1.5 rounded-full ${confMeta.dot}`}></span>
          <span className={confMeta.text}>{confMeta.label}</span>
        </span>
      </div>

      {/* Primary Root Cause Headline */}
      <div className="space-y-1">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-dev-muted">
          Root Cause
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-dev-primary leading-snug tracking-tight">
          {diagnosis.root_cause}
        </h2>
      </div>

      <div className="border-t border-dev-border-subtle"></div>

      {/* Evidence Section */}
      <EvidenceViewer evidence={diagnosis.evidence} />

      {/* Suggested Fix Section */}
      <div className="space-y-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-dev-secondary">
          Suggested Fix
        </span>
        <div className="pt-1">
          {renderFormattedFix(diagnosis.suggested_fix)}
        </div>
      </div>

      {/* Informational Auto-Fix Badge (Informational only — NO buttons) */}
      {diagnosis.auto_fix && (
        <div className="pt-4 border-t border-dev-border-subtle space-y-1">
          <div className="flex items-center space-x-1.5 font-mono text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ Auto-fixable via PR</span>
          </div>
          <p className="text-xs text-dev-secondary font-mono leading-relaxed">
            This category of issue can be automatically fixed via a pull request when detected in a real CI pipeline.
          </p>
        </div>
      )}

    </div>
  );
};

// Sub-component for individual Code Block with Copy
const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded bg-dev-input border border-dev-border p-3 font-mono text-xs overflow-x-auto">
      <div className="flex items-center justify-between text-[11px] text-dev-muted mb-1.5 pb-1 border-b border-dev-border-subtle">
        <span className="font-semibold text-dev-secondary uppercase">{lang || 'CODE'}</span>
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
      <pre className="text-emerald-300">
        {code}
      </pre>
    </div>
  );
};
