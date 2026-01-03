import api from "./api";

export const categoryService = {
  getStats: async () => {
    // Se não tiver rota de stats, pode remover ou criar uma no backend
    return { data: [] };
  },
  findAll: async () => {
    const res = await api.get("/categories");
    return res.data;
  },
  findById: async (id: number) => {
    // Backend retorna categoria com LISTA DE SERVIÇOS agora
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
};
