import api from "./api";
import { format } from "date-fns";

const availabilityService = {
  getMyAvailability: async () => {
    const res = await api.get("/availability");
    return res.data;
  },

  getByProfessionalId: async (professionalId: number) => {
    const res = await api.get(`/availability/professional/${professionalId}`);
    return res.data;
  },

  getAvailableSlots: async (
    professionalId: number,
    serviceId: number,
    date: Date
  ) => {
    // Formata a data para YYYY-MM-DD
    const dateStr = format(date, "yyyy-MM-dd");
    const res = await api.get(
      `/availability/slots/${professionalId}?date=${dateStr}&serviceId=${serviceId}`
    );
    return res.data; // Retorna array de strings ["2023-10-25 08:00", ...]
  },

  saveAvailability: async (availabilities: any[]) => {
    const res = await api.put("/availability", { availabilities });
    return res.data;
  },
};

export default availabilityService;
