import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PresetBar } from './components/PresetBar';
import { LogInput } from './components/LogInput';
import { AnalysisLoader } from './components/AnalysisLoader';
import { DiagnosisResult } from './components/DiagnosisResult';
import { SampleScenario, DiagnosisResponse } from './types/diagnosis';
import { SAMPLE_SCENARIOS } from './data/sampleLogs';
import { requestDiagnosis } from './services/api';
import { RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

export function App() {
  const [logContent, setLogContent] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize with first preset (Missing env var)
  useEffect(() => {
    const defaultPreset = SAMPLE_SCENARIOS[0];
    setLogContent(defaultPreset.rawLog);
    setSelectedScenarioId(defaultPreset.id);
  }, []);

  const handleSelectScenario = (scenario: SampleScenario) => {
    setLogContent(scenario.rawLog);
    setSelectedScenarioId(scenario.id);
    setError(null);
    setValidationError(null);
    setDiagnosis(null);
  };

  const handleClear = () => {
    setLogContent('');
    setSelectedScenarioId(null);
    setDiagnosis(null);
    setError(null);
    setValidationError(null);
  };

  const handleDiagnose = async () => {
    if (!logContent.trim()) {
      setValidationError("Paste a deployment log to diagnose it.");
      return;
    }

    setValidationError(null);
    setIsLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const result = await requestDiagnosis(logContent);
      setDiagnosis(result);
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setError(err.message || "The diagnosis service couldn't process the request. Check the log content and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dev-bg text-dev-primary flex flex-col font-sans selection:bg-dev-border selection:text-white">
      
      {/* Restrained Header */}
      <Header />

      {/* Main Container (Max Width 1100–1200px) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* Compact Hero */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dev-primary">
            Diagnose the failure. <br className="hidden sm:inline" />
            <span className="text-dev-secondary font-bold">Ship the fix.</span>
          </h1>
          <p className="text-xs sm:text-sm text-dev-secondary max-w-2xl leading-relaxed">
            Paste a CI/CD failure log and Deploy Doctor identifies the root cause, surfaces the evidence, and suggests the next fix.
          </p>
        </div>

        {/* Hero Component: Log Input */}
        <LogInput
          logContent={logContent}
          setLogContent={(val) => {
            setLogContent(val);
            if (selectedScenarioId) setSelectedScenarioId(null);
          }}
          onSubmit={handleDiagnose}
          isLoading={isLoading}
          validationError={validationError}
          setValidationError={setValidationError}
        />

        {/* Example Log Buttons */}
        <PresetBar
          selectedId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          disabled={isLoading}
        />

        {/* Empty / Pre-Diagnosis Understated Helper */}
        {!diagnosis && !isLoading && !error && (
          <div className="p-4 rounded-lg bg-dev-surface/40 border border-dev-border-subtle font-mono text-xs text-dev-secondary space-y-1">
            <span className="font-semibold text-dev-primary">DEPLOY DOCTOR</span>
            <p className="leading-relaxed">
              Your deployment log is the only thing you need. Paste it above and we'll break the failure down into cause, evidence, and next steps.
            </p>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30 text-red-200 flex items-start justify-between gap-4 font-mono text-xs">
            <div className="flex items-start space-x-2.5">
              {error.includes('reach') ? (
                <WifiOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold text-red-300">
                  {error.includes('reach') ? 'Diagnosis service unavailable' : 'Unable to diagnose this log'}
                </div>
                <div className="text-red-300/80 leading-relaxed">{error}</div>
              </div>
            </div>

            <button
              onClick={handleDiagnose}
              className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded bg-red-900/40 hover:bg-red-900/60 text-white font-medium border border-red-700/50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* Loading Experience */}
        {isLoading && <AnalysisLoader />}

        {/* Result Section */}
        {diagnosis && !isLoading && (
          <DiagnosisResult diagnosis={diagnosis} />
        )}

      </main>

      {/* Restrained Minimal Footer */}
      <footer className="border-t border-dev-border-subtle bg-dev-bg py-6 text-center font-mono text-xs text-dev-muted">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span>Deploy Doctor · Deployment diagnosis engine</span>
          <span>DevOps Hackathon</span>
        </div>
      </footer>

    </div>
  );
}
