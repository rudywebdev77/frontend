import 'react';

import { FileText, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <FileText className="w-6 h-6 text-white" />
            
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">PDF2Word</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Pro
              </span>
            </div>
            <p className="text-xs text-slate-500">Fast & Secure Document Converter</p>
          </div>
        </div>


      </div>
    </header>
  );
};


