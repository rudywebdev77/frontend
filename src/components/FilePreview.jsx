import React from 'react';
import { FileText, Trash2, ArrowRight } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

export const FilePreview = ({ file, onRemove, onConvert }) => {
  if (!file) return null;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
      {/* File Info */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
              {file.name}
            </h4>
            <p className="text-xs text-slate-500">
              {formatFileSize(file.size)} • PDF Document
            </p>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="p-2.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Remove file"
          type="button"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onConvert}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-200"
          type="button"
        >
          Convert PDF to Word
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onRemove}
          className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors border border-slate-200"
          type="button"
        >
          Choose Different File
        </button>
      </div>
    </div>
  );
};
