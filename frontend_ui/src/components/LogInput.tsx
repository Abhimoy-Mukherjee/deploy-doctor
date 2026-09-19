import React, { useRef, useState, DragEvent } from 'react';
import { ArrowRight, Loader2, Upload } from 'lucide-react';

interface LogInputProps {
  logContent: string;
  setLogContent: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  validationError: string | null;
  setValidationError: (err: string | null) => void;
}

export const LogInput: React.FC<LogInputProps> = ({
  logContent,
  setLogContent,
  onSubmit,
  isLoading,
  validationError,
  setValidationError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const charCount = logContent.length;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setLogContent(text);
        setValidationError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLogContent(e.target.value);
    if (validationError) setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="bg-dev-surface border border-dev-border rounded-lg p-4 space-y-3">
      
      {/* Input Header */}
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="font-semibold text-dev-primary tracking-wider uppercase">
          Deployment Log
        </span>

        <div className="flex items-center space-x-3 text-dev-secondary">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".log,.txt,.json,.out"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="hover:text-dev-primary transition-colors flex items-center space-x-1"
          >
            <Upload className="w-3 h-3" />
            <span>Drop or upload .log file</span>
          </button>
        </div>
      </div>

      {/* Textarea Area */}
      <div 
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-dev-input/90 border border-dashed border-emerald-500 rounded flex items-center justify-center text-xs font-mono text-emerald-400">
            Drop .log file here...
          </div>
        )}

        <textarea
          value={logContent}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={`Paste your deployment or CI/CD failure log here...

Example:
Error: Process completed with exit code 1
npm ERR! Missing environment variable: DATABASE_URL`}
          className="w-full h-56 sm:h-64 p-3 bg-dev-input border border-dev-border rounded text-dev-primary font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-dev-secondary placeholder:text-dev-muted transition-colors resize-y"
          spellCheck={false}
        />

        {/* Character Count */}
        <div className="absolute bottom-2.5 right-3 text-[11px] font-mono text-dev-muted pointer-events-none">
          {charCount.toLocaleString()} / 50,000
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="text-xs text-amber-400 font-mono">
          {validationError}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-dev-secondary hidden sm:inline">
          Paste logs from GitHub Actions, Docker, or K8s
        </span>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-semibold font-sans transition-all ${
            isLoading
              ? 'bg-dev-input border border-dev-border text-dev-muted cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing log...</span>
            </>
          ) : (
            <>
              <span>Diagnose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
