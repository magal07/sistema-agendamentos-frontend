import api from "./api";

export const appointmentService = {
  // Meus agendamentos
  getMyList: async () => {
    const res = await api.get("/appointments");
    return res.data;
  },
  // Criar agendamento
  create: async (professionalId: number, serviceId: number, date: Date) => {
    const res = await api.post("/appointments", {
      professionalId,
      serviceId,
      date: date.toISOString(),
    });
    return res.data;
  },
  // Cancelar
  cancel: async (id: number) => {
    const res = await api.delete(`/appointments/${id}`);
    return res;
  },
};
