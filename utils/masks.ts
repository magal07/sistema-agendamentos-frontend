// Formata CPF: 000.000.000-00
export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

// Formata Telefone: (00) 00000-0000
export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
};

// Limpa a máscara (deixa só números)
export const cleanMask = (value: string) => {
  return value.replace(/\D/g, "");
};

// Validação matemática de CPF
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

export const formatData = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não é número
    .replace(/(\d{2})(\d)/, "$1/$2") // Coloca a barra após o dia
    .replace(/(\d{2})(\d)/, "$1/$2") // Coloca a barra após o mês
    .replace(/(\d{4})(\d)/, "$1"); // Limita a 8 dígitos (DD/MM/AAAA)
};
