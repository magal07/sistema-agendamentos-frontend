import api from "./api";

export const categoryService = {
  findAll: async () => {
    // O token é injetado automaticamente pelo api.ts!
    const res = await api.get("/categories");

    // Mantemos apenas a lógica de "desembrulhar" os dados
    if (res.data && res.data.rows) {
      return res.data.rows;
    }

    if (res.data && res.data.categories) {
      return res.data.categories;
    }

    return res.data;
  },

  findById: async (id: number) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
};
