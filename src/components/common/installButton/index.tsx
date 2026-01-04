import { useEffect, useState } from "react";
import { Button } from "reactstrap";

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Captura o evento antes do navegador disparar
    const handler = (e: any) => {
      e.preventDefault(); // Impede o banner nativo de aparecer sozinho e sumir
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Verifica se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReady(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // 2. Dispara o prompt quando o usuário clica
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsReady(false);
      }
    });
  };

  // Só mostra o botão se o navegador permitir instalação
  if (!isReady) return null;

  return (
    <Button
      outline
      color="light"
      className="ms-2 me-2 fw-bold"
      onClick={handleInstallClick}
      style={{ borderColor: "#b06075", color: "#b06075" }}
    >
      📲 Instalar App
    </Button>
  );
};

export default InstallButton;
