import axios from 'axios';

// Obtain API base URL from Vite environment variables or dynamic fallback for local network & live deployments
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const { hostname, protocol, origin } = window.location;
    
    // In local dev when accessing via localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // In local dev when accessing via local Wi-Fi IP (e.g., http://192.168.x.x:5173)
    if (/^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(hostname)) {
      return `${protocol}//${hostname}:5000`;
    }

    // On live hosted domain (Vercel) without VITE_API_URL set, use relative origin
    return origin;
  }
  
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000, // 2 minute timeout for larger conversions
});

export default api;
