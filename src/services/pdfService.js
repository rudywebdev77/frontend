import api from './api';

/**
 * Sends PDF file to backend for conversion into a .docx Word document.
 * @param {File} file - PDF file to convert.
 * @param {Function} onUploadProgress - Callback for upload progress tracking.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export const convertPdfToWordApi = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await api.post('/api/pdf-to-word', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
      onUploadProgress,
    });

    // Extract filename from Content-Disposition header if available
    let filename = `${file.name.replace(/\.pdf$/i, '')}.docx`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    return {
      blob: response.data,
      filename,
    };
  } catch (error) {
    // If response is a Blob error (JSON sent with error status code)
    if (error.response && error.response.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const json = JSON.parse(errorText);
        if (json && json.message) {
          throw new Error(json.message);
        }
      } catch (parseError) {
        if (parseError.message && parseError.message !== 'Unexpected token') {
          throw parseError;
        }
      }
    }

    const message = error.response?.data?.message || error.message || 'Failed to convert PDF. Please try again.';
    throw new Error(message);
  }
};

/**
 * Health check endpoint test.
 * @returns {Promise<boolean>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data?.success === true;
  } catch (error) {
    return false;
  }
};
