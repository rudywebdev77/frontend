import axios from 'axios';

// Obtain API base URL from Vite environment variables (fallback for local dev)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minute timeout for larger conversions
});

export default api;
