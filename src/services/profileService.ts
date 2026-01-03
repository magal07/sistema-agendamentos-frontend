import api from "./api";

interface UserParams {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface PasswordParams {
  currentPassword: string;
  newPassword: string;
}

const profileService = {
  // Busca os dados do usuário logado
  fetchCurrent: async () => {
    const res = await api.get("/users/current");
    return res.data;
  },

  // Atualiza dados cadastrais
  userUpdate: async (params: UserParams) => {
    const res = await api.put("/users/current", params);
    return res.status;
  },

  // Atualiza a senha
  passwordUpdate: async (params: PasswordParams) => {
    const res = await api.put("/users/current/password", params);
    return res.status;
  },
};

export default profileService;
