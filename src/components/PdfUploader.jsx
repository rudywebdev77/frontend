import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, ShieldCheck, ScanText } from 'lucide-react';

export const PdfUploader = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 shadow-sm ${
        isDragging
          ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
          : 'border-slate-300 bg-white hover:border-indigo-500/70 hover:bg-slate-50/80'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf,.pdf"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        id="pdf-file-input"
        title="Choose PDF file"
      />

      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105'
        }`}>
          <UploadCloud className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-2">
            <ScanText className="w-3.5 h-3.5" /> Normal & Scanned PDFs Auto-Supported
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            Upload your PDF
          </h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            Tap here or drag & drop your PDF file to convert it into editable Word.
          </p>
        </div>

        <div className="pt-2">
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all duration-200">
            <FileUp className="w-4 h-4" />
            Browse PDF File
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-200 w-full max-w-xs">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Safe & Private
          </span>
          <span>•</span>
          <span>Max File Size: 10MB</span>
        </div>
      </div>
    </div>
  );
};
