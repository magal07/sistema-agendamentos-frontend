import { Toast, ToastBody } from "reactstrap";
import styles from "./styles.module.scss"; // Vamos criar este arquivo

interface props {
  isOpen: boolean;
  message: string;
  type: "success" | "error"; // Agora usamos tipos específicos
}

const ToastComponent = function ({ isOpen, message, type }: props) {
  // Definimos a classe baseada no tipo
  const toastClass =
    type === "success" ? styles.toastSuccess : styles.toastError;

  return (
    <Toast
      className={`${toastClass} text-white fixed-top ms-auto mt-3 me-3`}
      isOpen={isOpen}
      transition={{ timeout: 600 }}
      style={{ zIndex: 9999, border: "none" }}
    >
      <ToastBody className="text-center font-weight-bold">{message}</ToastBody>
    </Toast>
  );
};

export default ToastComponent;
