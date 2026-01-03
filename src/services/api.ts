import axios from "axios";
import Cookies from "js-cookie"; // <--- Faltou importar isso

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const api = axios.create({
  baseURL,
});

// --- ADICIONE ESTE BLOCO (REQUEST INTERCEPTOR) ---
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// -------------------------------------------------

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      localStorage.clear();
      // Cookies.remove("token"); // Boa prática remover o cookie também

      const publicRoutes = ["/login", "/register", "/session-expired", "/"];
      const currentPath = window.location.pathname;

      if (!publicRoutes.includes(currentPath)) {
        window.location.href = "/session-expired";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
