import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Ensure all requests have trailing slash to avoid 307 redirects
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Add trailing slash if missing (avoids FastAPI 307 redirects that break CORS)
  if (req.url && !req.url.endsWith('/') && !req.url.includes('?')) {
    req.url = req.url + '/';
  }

  return req;
});

export default API;
