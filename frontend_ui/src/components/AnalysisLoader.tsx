import React from 'react';
import { Loader2 } from 'lucide-react';

export const AnalysisLoader: React.FC = () => {
  return (
    <div className="mt-6 p-4 rounded-lg bg-dev-surface border border-dev-border space-y-3 font-mono text-xs">
      <div className="flex items-center space-x-2 text-dev-primary">
        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span className="font-semibold">Analyzing your deployment log...</span>
      </div>

      <div className="space-y-1.5 pt-1 text-dev-secondary">
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Reading failure signature</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400 font-bold">•</span>
          <span>Identifying likely root cause</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-dev-muted">○</span>
          <span className="text-dev-muted">Preparing recommended fix</span>
        </div>
      </div>
    </div>
  );
};
