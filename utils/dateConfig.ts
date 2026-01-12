import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- CENTRAL DE DATAS E CONFIGURAÇÕES ---

// 1. Converte string "YYYY-MM-DD" para Date Local (00:00:00)
// Essencial para evitar que o dia volte (ex: dia 13 virar dia 12)
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// 2. Combina Data + Hora para envio ao Backend
export const combineDateAndTime = (
  dateString: string,
  timeString: string
): Date => {
  return new Date(`${dateString}T${timeString}:00`);
};

// 3. Formata Data para Exibição (ex: "13 de Janeiro")
export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const date = parseLocalDate(dateString);
  // Define meio-dia para garantir que a exibição fique estável
  date.setHours(12);
  return format(date, "dd 'de' MMMM", { locale: ptBR });
};

// 4. Retorna Data de Hoje (YYYY-MM-DD)
export const getTodayISO = (): string => {
  return new Date().toISOString().split("T")[0];
};

// 5. Retorna Data de Amanhã (YYYY-MM-DD)
export const getTomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

// 6. Extrai apenas HH:mm de strings como "2026-01-01 10:00"
export const extractTimeHHMM = (slotString: string): string => {
  const parts = slotString.split(" ");
  // Pega a segunda parte (hora) ou os primeiros 5 chars
  return parts.length > 1
    ? parts[1].substring(0, 5)
    : slotString.substring(0, 5);
};
