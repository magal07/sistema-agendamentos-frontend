import api from "./api";

export interface Company {
  id: number;
  name: string;
  city: string;
  district: string;
  street: string;
  number: string;
  thumbnailUrl: string;
}

const companyService = {
  getCities: async (): Promise<string[]> => {
    const res = await api.get("/public/cities");
    return res.data;
  },

  getCompanies: async (city?: string): Promise<Company[]> => {
    const params = city ? { city } : {};
    const res = await api.get("/public/companies", { params });
    return res.data;
  },
};

export default companyService;
