import Head from "next/head";
import styles from "../styles/registerLogin.module.scss";
import HeaderGeneric from "../src/components/common/headerGeneric";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import Footer from "../src/components/common/footer";
import { useState, FormEvent } from "react";
import { authService } from "../src/services/authService";
import ToastComponent from "../src/components/common/toast";

const ForgotPassword = function () {
  const [email, setEmail] = useState("");
  const [toastColor, setToastColor] = useState("");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const res = await authService.forgotPassword(email);

    if (res.status === 200) {
      setToastColor("bg-success");
      setToastIsOpen(true);
      setToastMessage("E-mail enviado! Verifique sua caixa de entrada.");
    } else {
      setToastColor("bg-danger");
      setToastIsOpen(true);
      setToastMessage(res.data.message || "Erro ao processar solicitação.");
    }
  };

  return (
    <>
      <Head>
        <title>Sistema de Agendamentos - Esqueci minha senha</title>
        <link rel="shortcut icon" href="/favicon.svg" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderGeneric
          logoUrl="/"
          btnUrl="/login"
          btnContent="Voltar ao Login"
        />
        <Container className="py-5 d-flex flex-column align-items-center">
          <Form onSubmit={handleForgotPassword} className={styles.form}>
            <h3 className={styles.formTitle}>Recuperar Senha</h3>
            <p className="text-center text-white-50 mb-4">
              Digite seu e-mail cadastrado para receber o link de redefinição.
            </p>
            <FormGroup>
              <Label for="email" className={styles.label}>
                E-MAIL
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Qual o seu e-mail?"
                required
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormGroup>
            <Button type="submit" outline className={styles.formBtn}>
              ENVIAR LINK DE RECUPERAÇÃO
            </Button>
          </Form>
        </Container>
        <div className={styles.footerPositon}>
          <Footer />
        </div>
        <ToastComponent
          color={toastColor}
          isOpen={toastIsOpen}
          message={toastMessage}
        />
      </main>
    </>
  );
};

export default ForgotPassword;
