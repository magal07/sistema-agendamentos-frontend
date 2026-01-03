import styles from "../styles/registerLogin.module.scss";
import Head from "next/head";
import HeaderGeneric from "../src/components/common/headerGeneric";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import Footer from "../src/components/common/footer";
import { useRouter } from "next/router";
import { useEffect, useState, type FormEvent } from "react";
import ToastComponent from "../src/components/common/toast";
import { authService } from "../src/services/authService";
import { useLoggedInRedirect } from "../utils/util";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link"; // 1. Importação necessária

const Login = function () {
  const router = useRouter();
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Estado para armazenar o token do Cloudflare
  const [turnstileToken, setTurnstileToken] = useState("");

  useLoggedInRedirect();

  useEffect(() => {
    const registerSuccess = router.query.registred;

    if (registerSuccess === "true") {
      setToastType("success");
      setToastIsOpen(true);
      setTimeout(() => {
        setToastIsOpen(false);
      }, 1000 * 3);
      setToastMessage("Cadastro feito com sucesso!");
    }
  }, [router.query]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
      setToastType("error");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      setToastMessage("Por favor, verifique que você não é um robô.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")!.toString();
    const password = formData.get("password")!.toString();
    const params = { email, password, turnstileToken };

    try {
      const { status } = await authService.login(params);

      if (status === 200) {
        router.push("/home");
      }
    } catch (error: any) {
      // AGORA O ERRO É CAPTURADO AQUI E NÃO TRAVA MAIS
      setToastType("error");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      setToastMessage(
        error.response?.data?.message || "Email ou senha incorretos!"
      );
    }
  };

  return (
    <>
      <Head>
        <title>VerboMAX - Login</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderGeneric
          logoUrl="/"
          btnUrl="/register"
          btnContent="Quero fazer parte"
        />
        <Container className="py-5">
          <p className={styles.formTitle}>Bem vindo(a) de volta!</p>
          <Form className={styles.form} onSubmit={handleLogin}>
            <p className="text-center">
              <strong>Bem vindo(a) ao nosso Sistema de Agendamentos!</strong>
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
              ></Input>
            </FormGroup>
            <FormGroup>
              <Label for="password" className={styles.label}>
                SENHA
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Qual a sua senha?"
                required
                className={styles.input}
              ></Input>
            </FormGroup>

            {/* --- LINK ESQUECI MINHA SENHA --- */}
            <div className="d-flex justify-content-end mb-3">
              <Link
                href="/forgot-password"
                style={{
                  color: "#000000",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* --- WIDGET CLOUDFLARE --- */}
            <div className="d-flex justify-content-center mb-4 mt-3">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{
                  theme: "light",
                  language: "pt-BR",
                }}
              />
            </div>

            <Button type="submit" outline className={styles.formBtn}>
              ENTRAR
            </Button>
          </Form>
          <ToastComponent
            type={toastType}
            isOpen={toastIsOpen}
            message={toastMessage}
          />
          <Footer />
        </Container>
      </main>
    </>
  );
};

export default Login;
