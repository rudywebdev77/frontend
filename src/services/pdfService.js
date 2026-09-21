import api from './api';
import { convertPdfToWordClientSide } from './clientPdfService';

/**
 * Converts PDF file to Word (.docx) document.
 * Tries the backend API endpoint first; if unavailable (404/Network Error on static hosts like Vercel),
 * automatically falls back to in-browser conversion.
 *
 * @param {File} file - PDF file to convert.
 * @param {Function} [onUploadProgress] - Callback for progress updates.
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
    // If backend returns a structured JSON error inside Blob response (e.g., 400 Bad Request, scanned PDF)
    if (error.response && error.response.status !== 404 && error.response.data instanceof Blob) {
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

    const isNetworkOr404Error =
      !error.response ||
      error.response.status === 404 ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.message === 'Network Error' ||
      error.message.includes('404');

    if (isNetworkOr404Error) {
      console.warn('Backend service unavailable on current host. Falling back to client-side in-browser PDF conversion.');
      return await convertPdfToWordClientSide(file, onUploadProgress);
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
