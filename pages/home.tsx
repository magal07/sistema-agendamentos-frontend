import { useEffect } from "react";
import { useRouter } from "next/router";
import profileService from "../src/services/profileService";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const user = await profileService.fetchCurrent();
        if (user.role === "client") router.replace("/client/dashboard");
        else router.replace("/admin/dashboard");
      } catch {
        router.replace("/login");
      }
    };
    check();
  }, []);

  return null; // Não renderiza nada
}
