import api from "./api";

interface ListParams {
  start: string;
  end: string;
}

// Tipagem para o reagendamento
interface RescheduleParams {
  start: Date;
  end: Date;
}

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
      appointmentDate: date.toISOString(),
    });
    return res.data;
  },
  // Cancelar
  cancel: async (id: number) => {
    const res = await api.delete(`/appointments/${id}`);
    return res;
  },

  // Busca agendamentos filtrando por data (Otimizado para o calendário)
  getAll: async (params: ListParams) => {
    const response = await api.get("/appointments", {
      params: {
        start: params.start,
        end: params.end,
      },
    });
    return response.data;
  },

  // Reagendar (Drag and Drop)
  reschedule: async (id: number, params: RescheduleParams) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, {
      start: params.start,
      end: params.end,
    });
    return response.data;
  },
};
