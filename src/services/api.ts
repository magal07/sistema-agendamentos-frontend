import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const api = axios.create({
  baseURL,
});

// --- INTERCEPTOR DE REQUISIÇÃO (O Segredo) ---
api.interceptors.request.use((config) => {
  // Verifica se está no navegador para evitar erro no servidor (Next.js)
  if (typeof window !== "undefined") {
    // Busca o token onde ele realmente está salvo (SessionStorage)
    const token = sessionStorage.getItem("onebitflix-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- INTERCEPTOR DE RESPOSTA (Logout automático se der 401) ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        const currentPath = window.location.pathname;
        const publicRoutes = ["/login", "/register", "/"];

        // Só redireciona se não estiver em rota pública
        if (!publicRoutes.includes(currentPath)) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
