import api from "./api";

export interface Professional {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
}

export const professionalService = {
  // Agora aceita um companyId opcional
  getAll: async (companyId?: number) => {
    // Passa como query param: /users/professionals?companyId=1
    const res = await api.get("/users/professionals", {
      params: { companyId },
    });
    return res.data;
  },
};
