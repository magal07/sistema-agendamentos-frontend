import api from "./api";

export const authService = {
  register: async (params: any) => {
    const res = await api.post("/auth/register", params);
    return res.data;
  },

  login: async (params: any) => {
    const res = await api.post("/auth/login", params);

    if (res.status === 200) {
      // CORREÇÃO CRUCIAL:
      // Agora salvamos no sessionStorage com o nome que o api.ts procura ("onebitflix-token")
      sessionStorage.setItem("onebitflix-token", res.data.token);

      // Mantemos o user-data se você usa em outros lugares
      localStorage.setItem("user-data", JSON.stringify(res.data));
    }
    return res;
  },

  logout: () => {
    // Limpa do local correto agora
    sessionStorage.removeItem("onebitflix-token");
    localStorage.removeItem("user-data");

    // Redireciona
    window.location.href = "/login";
  },

  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgotPassword", { email });
    return res;
  },

  resetPassword: async (token: string, password: string) => {
    const res = await api.post("/auth/resetPassword", { token, password });
    return res;
  },
};
