import React from 'react';
import { Lock, Zap, FileText } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 mt-1">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900 mb-1">Instant Extraction</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts text, paragraphs, and structure from PDFs directly into clean, editable Microsoft Word (.docx) files.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 mt-1">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900 mb-1">Private & Secure</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uploaded files are processed securely in temporary memory and immediately deleted from server disk after conversion.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 mt-1">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900 mb-1">Production-Ready API</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Decoupled backend architecture ready for production deployment on Render, Railway, Vercel, or custom VPS.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PDF2Word Converter. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built for production deployments.</p>
        </div>
      </div>
    </footer>
  );
};
