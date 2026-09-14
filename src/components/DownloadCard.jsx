import React from 'react';
import { CheckCircle2, Download, RotateCcw, FileSpreadsheet } from 'lucide-react';

export const DownloadCard = ({ filename, onDownload, onReset }) => {
  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full inline-block">
          Ready for Download
        </span>
        <h3 className="text-2xl font-bold text-slate-900">
          Conversion completed successfully
        </h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto truncate" title={filename}>
          {filename}
        </p>
      </div>

      <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{filename}</p>
            <p className="text-[11px] text-slate-500">Microsoft Word (.docx)</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 shrink-0">Ready</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
        <button
          onClick={onDownload}
          className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all duration-200"
          type="button"
        >
          <Download className="w-5 h-5" />
          Download Word File
        </button>
        <button
          onClick={onReset}
          className="w-full sm:w-auto py-4 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2 transition-colors shrink-0"
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
          Convert Another
        </button>
      </div>
    </div>
  );
};
