import { useRouter } from "next/router"; //
import { useEffect } from "react";

export const useLoggedInRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("onebitflix-token")) {
      router.push("/home");
    }
  }, [router]);
};
