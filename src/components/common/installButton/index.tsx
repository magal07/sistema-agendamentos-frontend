import { useEffect, useState } from "react";
import { Button } from "reactstrap";
import styles from "./styles.module.scss"; // <--- Importação do estilo

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReady(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsReady(false);
      }
    });
  };

  if (!isReady) return null;

  return (
    <Button
      outline
      color="light"
      className={styles.installBtn} // <--- Classe do SCSS
      onClick={handleInstallClick}
    >
      📲 Instalar App
    </Button>
  );
};

export default InstallButton;
