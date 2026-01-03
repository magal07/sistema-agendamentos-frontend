import { FormEvent, useEffect, useState } from "react";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import styles from "../../../../styles/profile.module.scss";
import profileService from "../../../services/profileService";
import ToastComponent from "../../common/toast";

const PasswordForm = function () {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // REMOVIDO: O useEffect que buscava senha.
  // Senhas devem começar sempre vazias.

  const handlePasswordUpdate = async function (
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Validação 1: Senhas iguais
    if (newPassword !== confirmNewPassword) {
      setToastIsOpen(true);
      setErrorMessage("Senha e confirmação de senha diferentes!");
      setToastType("error"); // Ajustado
      setTimeout(() => setToastIsOpen(false), 3000);
      return;
    }

    // Validação 2: Nova senha igual a atual (opcional, mas boa prática)
    if (currentPassword === newPassword) {
      setToastIsOpen(true);
      setErrorMessage("A nova senha deve ser diferente da atual!");
      setToastType("error"); // Ajustado
      setTimeout(() => setToastIsOpen(false), 3000);
      return;
    }

    try {
      // Tenta atualizar
      const status = await profileService.passwordUpdate({
        currentPassword,
        newPassword,
      });

      // Se chegou aqui, é sucesso (204)
      if (status === 204) {
        setToastIsOpen(true);
        setErrorMessage("Senha alterada com sucesso!");
        setToastType("success");
        setTimeout(() => setToastIsOpen(false), 3000);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error: any) {
      // Se der erro (ex: senha atual incorreta -> 400) cai aqui
      setToastIsOpen(true);
      // Pega a mensagem do backend ou usa uma genérica
      setErrorMessage(
        error.response?.data?.message || "Erro ao atualizar senha."
      );
      setToastType("error");
      setTimeout(() => setToastIsOpen(false), 3000);
    }
  };

  return (
    <>
      <Form onSubmit={handlePasswordUpdate} className={styles.form}>
        <div className={styles.inputNormalDiv}>
          <FormGroup>
            <Label className={styles.label} for="currentPassword">
              SENHA ATUAL
            </Label>
            <Input
              name="currentPassword"
              type="password"
              id="currentPassword"
              placeholder="********"
              required
              minLength={6}
              maxLength={20}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={styles.input}
            />
          </FormGroup>
        </div>
        <div className={styles.inputFlexDiv}>
          <FormGroup>
            <Label for="newPassword" className={styles.label}>
              NOVA SENHA
            </Label>
            <Input
              name="newPassword"
              type="password"
              id="newPassword"
              placeholder="********"
              required
              minLength={6}
              maxLength={20}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={styles.inputFlex}
            />
          </FormGroup>
          <FormGroup>
            <Label for="confirmNewPassword" className={styles.label}>
              CONFIRMAR NOVA SENHA
            </Label>
            <Input
              name="confirmNewPassword"
              type="password"
              id="confirmNewPassword"
              placeholder="********"
              required
              minLength={6}
              maxLength={20}
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              className={styles.inputFlex}
            />
          </FormGroup>
        </div>
        <Button type="submit" className={styles.formBtn} outline>
          Salvar Alterações
        </Button>
      </Form>
      <ToastComponent
        type={toastType}
        isOpen={toastIsOpen}
        message={errorMessage}
      />
    </>
  );
};

export default PasswordForm;
