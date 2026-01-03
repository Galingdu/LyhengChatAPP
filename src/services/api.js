import axios from "axios";
const apiUrl = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL:`${ apiUrl}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ RESPONSE: Handle expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired → logging out");

      localStorage.removeItem("token");
      localStorage.removeItem("ios_youtube_notice_shown"); // ✅ reset

      // 🔄 Redirect safely
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
export default api;
