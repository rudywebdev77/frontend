import api from './api';

export const convertPdfToWordApi = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await api.post('/api/pdf-to-word', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      onUploadProgress,
    });

    let filename = `${file.name.replace(/\.pdf$/i, '')}.docx`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    return { blob: response.data, filename };
  } catch (error) {
    // Backend errors come back as JSON inside a Blob
    if (error.response && error.response.data instanceof Blob) {
      try {
        const json = JSON.parse(await error.response.data.text());
        if (json && json.message) throw new Error(json.message);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.name !== 'SyntaxError') {
          throw parseError;
        }
      }
    }

    if (!error.response) {
      throw new Error('Cannot reach the server. Please check your connection and try again.');
    }
    throw new Error('Conversion failed. Please try again.');
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data?.success === true;
  } catch (error) {
    return false;
  }
};