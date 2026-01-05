import Head from "next/head";
import styles from "../styles/registerLogin.module.scss";
import HeaderGeneric from "../src/components/common/headerGeneric";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import Footer from "../src/components/common/footer";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "../src/services/authService";
import ToastComponent from "../src/components/common/toast";

const ResetPassword = function () {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setToastType("error");
      setToastIsOpen(true);
      setToastMessage("As senhas não coincidem!");
      return;
    }

    if (typeof token !== "string") {
      setToastType("error");
      setToastIsOpen(true);
      setToastMessage("Token inválido ou ausente.");
      return;
    }

    const res = await authService.resetPassword(token, password);

    if (res.status === 200) {
      setToastType("success");
      setToastIsOpen(true);
      setToastMessage("Senha alterada com sucesso! Redirecionando...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      setToastType("error");
      setToastIsOpen(true);
      setToastMessage(res.data.message || "Erro ao redefinir senha.");
    }
  };

  return (
    <>
      <Head>
        <title>Espaço Virtuosa - Nova Senha</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderGeneric logoUrl="/" btnUrl="/login" btnContent="Ir para Login" />
        <Container className="py-5 d-flex flex-column align-items-center">
          <Form onSubmit={handleResetPassword} className={styles.form}>
            <h3 className={styles.formTitle}>Nova Senha</h3>
            <p className="text-center text-white-50 mb-4">
              Crie uma nova senha segura para a sua conta.
            </p>

            <FormGroup>
              <Label for="password" className={styles.label}>
                NOVA SENHA
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label for="confirmPassword" className={styles.label}>
                CONFIRMAR NOVA SENHA
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormGroup>

            <Button type="submit" outline className={styles.formBtn}>
              REDEFINIR SENHA
            </Button>
          </Form>
        </Container>
        <div className={styles.footerPositon}>
          <Footer />
        </div>
        <ToastComponent
          type={toastType}
          isOpen={toastIsOpen}
          message={toastMessage}
        />
      </main>
    </>
  );
};

export default ResetPassword;
