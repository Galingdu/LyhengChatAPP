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

export default api;
