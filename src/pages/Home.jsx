import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PdfUploader } from '../components/PdfUploader';
import { FilePreview } from '../components/FilePreview';
import { ConversionStatus } from '../components/ConversionStatus';
import { DownloadCard } from '../components/DownloadCard';
import { ErrorMessage } from '../components/ErrorMessage';
import { Footer } from '../components/Footer';

import { validatePdfFile } from '../utils/formatters';
import { convertPdfToWordApi } from '../services/pdfService';

export const Home = () => {
  // State machine: 'idle' | 'selected' | 'converting' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedData, setConvertedData] = useState(null); // { blob, filename }
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (file) => {
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file selected.');
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    setErrorMsg('');
    setStatus('selected');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setConvertedData(null);
    setErrorMsg('');
    setStatus('idle');
  };

  const handleConvert = async () => {
    if (!selectedFile || status === 'converting') return;

    setStatus('converting');
    setErrorMsg('');

    try {
      const result = await convertPdfToWordApi(selectedFile);
      setConvertedData(result);
      setStatus('success');
    } catch (err) {
      console.error('Conversion error:', err);
      setErrorMsg(err.message || 'An error occurred during PDF conversion.');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!convertedData || !convertedData.blob) return;

    const blob = new Blob([convertedData.blob], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', convertedData.filename || 'converted.docx');
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Delay revocation to give mobile browsers time to initiate download
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12 w-full">
        {/* Title Section */}
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            Convert <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">PDF to Word</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Transform your PDF documents into editable Microsoft Word (.docx) files instantly while keeping text structure intact.
          </p>
        </div>

        {/* Dynamic Workflow Area */}
        <div className="w-full">
          {status === 'idle' && (
            <PdfUploader onFileSelect={handleFileSelect} />
          )}

          {status === 'selected' && (
            <FilePreview
              file={selectedFile}
              onRemove={handleRemoveFile}
              onConvert={handleConvert}
            />
          )}

          {status === 'converting' && (
            <ConversionStatus fileName={selectedFile?.name || 'document.pdf'} />
          )}

          {status === 'success' && convertedData && (
            <DownloadCard
              filename={convertedData.filename}
              onDownload={handleDownload}
              onReset={handleRemoveFile}
            />
          )}

          {status === 'error' && (
            <ErrorMessage
              message={errorMsg}
              onRetry={selectedFile ? handleConvert : null}
              onReset={handleRemoveFile}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
