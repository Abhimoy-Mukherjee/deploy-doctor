import React from 'react';
import { Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-dev-border bg-dev-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Left: Product Name + Tiny Descriptor */}
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-dev-surface border border-dev-border flex items-center justify-center text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-dev-primary">
            Deploy Doctor
          </span>
          <span className="text-dev-border select-none">|</span>
          <span className="text-xs font-mono text-dev-secondary">
            Deployment Intelligence
          </span>
        </div>

        {/* Right: Small Status Indicator */}
        <div className="flex items-center space-x-1.5 text-xs text-dev-secondary font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Diagnosis Engine Online</span>
        </div>

      </div>
    </header>
  );
};
