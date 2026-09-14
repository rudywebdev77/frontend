import React from 'react';
import { AlertTriangle, RefreshCw, UploadCloud } from 'lucide-react';

export const ErrorMessage = ({ message, onRetry, onReset }) => {
  const isScannedPdfError = message && message.toLowerCase().includes('scanned');

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-6 border-red-200 bg-red-50/50">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h3 className="text-xl font-bold text-slate-900">
          Conversion Failed
        </h3>
        <p className="text-sm text-red-700 bg-red-100/70 border border-red-200 p-4 rounded-xl leading-relaxed">
          {message}
        </p>
      </div>

      {isScannedPdfError && (
        <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-slate-200 text-left text-xs text-slate-600 space-y-1 shadow-xs">
          <p className="font-semibold text-slate-900">💡 Why did this happen?</p>
          <p>
            The PDF file contains images of scanned pages rather than extractable text. Full OCR image-text recognition is planned for a future update.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2 transition-colors"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        <button
          onClick={onReset}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
          type="button"
        >
          <UploadCloud className="w-4 h-4" />
          Select Another PDF
        </button>
      </div>
    </div>
  );
};
