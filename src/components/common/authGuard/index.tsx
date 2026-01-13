import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import profileService from "../../../services/profileService";
import FullScreenLoader from "../fullScreenLoader";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // Ex: ['admin', 'professional', 'client']
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthorized"
  >("loading");

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      // 1. Sem token? Manda pro Login direto.
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // 2. Busca o usuário para saber a role
        const user = await profileService.fetchCurrent();

        // 3. Verifica se a role dele está permitida nessa página
        if (!allowedRoles.includes(user.role)) {
          // Se ele não pode estar aqui, redireciona para a "casa" dele
          if (user.role === "client") {
            router.replace("/home");
          } else {
            router.replace("/agenda"); // ou painel admin
          }
          setStatus("unauthorized");
        } else {
          // 4. Tudo certo! Libera a renderização
          setStatus("authenticated");
        }
      } catch (error) {
        // Se o token for inválido ou expirar
        sessionStorage.clear();
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // ENQUANTO CARREGA OU SE NÃO TIVER PERMISSÃO, MOSTRA LOADER
  // Isso impede o "Flicker" da tela errada aparecer.
  if (status === "loading" || status === "unauthorized") {
    return <FullScreenLoader />;
  }

  // SE PASSOU, RENDERIZA A PÁGINA
  return <>{children}</>;
}
