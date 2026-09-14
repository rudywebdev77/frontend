import React from 'react';
import { Loader2, FileText, FileCheck } from 'lucide-react';

export const ConversionStatus = ({ fileName }) => {
  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center space-y-6">
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping"></div>
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">
          Converting PDF to Word...
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto truncate">
          {fileName}
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
          <span>Processing Document</span>
          <span className="text-indigo-600">Please wait...</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Extracting Text Content</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <FileCheck className="w-4 h-4 text-violet-600 shrink-0" />
          <span>Building DOCX Layout</span>
        </div>
      </div>
    </div>
  );
};
