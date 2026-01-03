export interface UserType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birth: string;
  cpf: string;
  role: "admin" | "client" | "professional";
}
