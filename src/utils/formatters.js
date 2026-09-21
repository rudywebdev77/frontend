/**
 * Formats file size in bytes to human-readable string (KB, MB).
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validates selected file on frontend.
 * @param {File} file 
 * @param {number} maxSizeBytes 
 * @returns {{ valid: boolean, error?: string }}
 */
export const validatePdfFile = (file, maxSizeBytes = 10 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'Please select a file.' };
  }

  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  const isPdfExtension = fileName.endsWith('.pdf');
  const isPdfMime = fileType.includes('pdf') || fileType === 'application/pdf';

  // Mobile file pickers might leave file.type empty or provide application/octet-stream
  if (!isPdfExtension && !isPdfMime) {
    return { valid: false, error: 'Invalid file format. Only PDF (.pdf) files are allowed.' };
  }

  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds the limit of ${sizeMB}MB.` };
  }

  return { valid: true };
};
