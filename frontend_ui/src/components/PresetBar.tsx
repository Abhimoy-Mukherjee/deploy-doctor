import React from 'react';
import { SampleScenario } from '../types/diagnosis';
import { SAMPLE_SCENARIOS } from '../data/sampleLogs';

interface PresetBarProps {
  selectedId: string | null;
  onSelectScenario: (scenario: SampleScenario) => void;
  disabled: boolean;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  selectedId,
  onSelectScenario,
  disabled,
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-dev-border-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
        <span className="text-xs font-semibold text-dev-primary">
          Try an example
        </span>
        <span className="text-xs text-dev-secondary">
          See how Deploy Doctor handles common deployment failures.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const isSelected = selectedId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              disabled={disabled}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition-all duration-150 border ${
                isSelected
                  ? 'bg-dev-input border-dev-secondary text-dev-primary font-medium'
                  : 'bg-dev-surface/80 hover:bg-dev-input border-dev-border text-dev-secondary hover:text-dev-primary'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
