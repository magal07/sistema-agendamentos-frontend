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

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    // 'file' deve ser o mesmo nome que configuramos no backend (upload.single('file'))
    formData.append("file", file);

    const res = await api.patch("/users/current/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data; // Retorna o usuário atualizado com a nova URL
  },

  searchClientByCpf: async (cpf: string) => {
    // Remove caracteres não numéricos antes de enviar, se necessário, ou envia com máscara
    // O backend que criamos remove, mas enviar limpo é boa prática
    const cleanCpf = cpf.replace(/\D/g, "");
    const res = await api.get(`/users/search/cpf?cpf=${cleanCpf}`);
    return res.data;
  },
};

export default profileService;
