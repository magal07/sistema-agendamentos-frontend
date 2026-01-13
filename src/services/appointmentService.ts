import api from "./api";

interface ListParams {
  start: string;
  end: string;
  professionalId?: number | null;
}

interface RescheduleParams {
  start: Date;
  end: Date;
}

export const appointmentService = {
  // Meus agendamentos
  getMyList: async () => {
    const res = await api.get("/appointments"); // ou /appointments dependendo da sua rota
    return res.data;
  },

  // --- CORREÇÃO AQUI: Adicionado customClientId como 4º argumento opcional ---
  create: async (
    professionalId: number,
    serviceId: number,
    date: Date | string,
    customClientId?: number // <--- Importante para o "Agendar Cliente"
  ) => {
    const appointmentDate = date instanceof Date ? date.toISOString() : date;

    const res = await api.post("/appointments", {
      professionalId,
      serviceId,
      appointmentDate,
      customClientId, // Envia para o backend se existir
    });
    return res.data;
  },

  cancel: async (id: number) => {
    const res = await api.delete(`/appointments/${id}`);
    return res;
  },

  complete: async (id: number, datetime: Date) => {
    const res = await api.put(`/appointments/${id}`, {
      status: "completed",
      appointmentDate: datetime.toISOString(),
    });
    return res.data;
  },

  getAll: async (params: ListParams) => {
    const response = await api.get("/appointments", {
      params: {
        start: params.start,
        end: params.end,
      },
    });
    return response.data;
  },

  reschedule: async (id: number, params: RescheduleParams) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, {
      start: params.start,
      end: params.end,
    });
    return response.data;
  },
};
