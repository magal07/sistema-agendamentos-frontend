import api from "./api";
import Cookies from "js-cookie";

export const authService = {
  register: async (params: any) => {
    const res = await api.post("/auth/register", params);
    return res.data;
  },

  login: async (params: any) => {
    const res = await api.post("/auth/login", params);

    if (res.status === 200) {
      Cookies.set("token", res.data.token, { expires: 1 });
      localStorage.setItem("user-data", JSON.stringify(res.data));
    }
    return res;
  },

  logout: () => {
    Cookies.remove("token");
    localStorage.removeItem("user-data");
    window.location.href = "/login";
  },

  // --- NOVOS MÉTODOS ---

  // Envia o e-mail para recuperação
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgotPassword", { email });
    return res;
  },

  // Envia o token e a nova senha para efetivar a troca
  resetPassword: async (token: string, password: string) => {
    const res = await api.post("/auth/resetPassword", { token, password });
    return res;
  },
};
