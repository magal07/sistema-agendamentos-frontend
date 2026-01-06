import api from "./api";

export interface DashboardFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  professionalId?: number | string;
}

export interface DashboardData {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalExpenses: number;
    netProfit: number;
  };
}

const reportsService = {
  getFinancialDashboard: async (
    filters: DashboardFilters
  ): Promise<DashboardData> => {
    // Converte os filtros em query string
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    if (filters.professionalId) {
      params.append("professionalId", filters.professionalId.toString());
    }

    const res = await api.get(`/reports/financial?${params.toString()}`);
    return res.data;
  },
};

export default reportsService;
