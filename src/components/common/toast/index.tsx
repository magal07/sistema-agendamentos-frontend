// src/components/common/toast/index.tsx
import { Toast, ToastBody } from "reactstrap";
import styles from "./styles.module.scss";

interface props {
  isOpen: boolean;
  message: string;
  type: "success" | "error" | "warning";
}

const ToastComponent = function ({ isOpen, message, type }: props) {
  let toastClass = "";

  if (type === "success") toastClass = "bg-success";
  else if (type === "error") toastClass = "bg-danger";
  else if (type === "warning") toastClass = "bg-warning";

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
