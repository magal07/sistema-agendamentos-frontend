import api from "./api";

export interface Professional {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
}

export const professionalService = {
  getAll: async () => {
    // Token vai automático agora
    const response = await api.get("/users/professionals");

    if (response.data && response.data.rows) {
      return response.data.rows;
    }

    return response.data;
  },
};
