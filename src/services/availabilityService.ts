import api from "./api";

const availabilityService = {
  getMyAvailability: async () => {
    const res = await api.get("/availability");
    return res.data;
  },

  getByProfessionalId: async (professionalId: number) => {
    const res = await api.get(`/availability/professional/${professionalId}`);
    return res.data;
  },

  saveAvailability: async (availabilities: any[]) => {
    const res = await api.put("/availability", { availabilities });
    return res.data;
  },
};

export default availabilityService;
