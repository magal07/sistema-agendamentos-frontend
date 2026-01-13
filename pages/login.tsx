import styles from "../styles/registerLogin.module.scss";
import Head from "next/head";
import HeaderGeneric from "../src/components/common/headerGeneric";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import Footer from "../src/components/common/footer";
import { useRouter } from "next/router";
import { useEffect, useState, type FormEvent } from "react";
import ToastComponent from "../src/components/common/toast";
import { authService } from "../src/services/authService";
import profileService from "../src/services/profileService"; // <--- IMPORTANTE
import { useLoggedInRedirect } from "../utils/util";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";

const Login = function () {
  const router = useRouter();
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false); // <--- Estado de Loading no botão

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
      showToast("error", "Por favor, verifique que você não é um robô.");
      return;
    }

    setLoading(true); // Trava o botão
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")!.toString().toLowerCase();
    const password = formData.get("password")!.toString();
    const params = { email, password, turnstileToken };

    try {
      const { status, data } = await authService.login(params);

      if (status === 200) {
        // 1. Salva Token
        sessionStorage.setItem("onebitflix-token", data.token);

        // 2. Descobre a Role (Perfil)
        // Tenta pegar direto da resposta do login, se não vier, busca o perfil
        let role = data.user?.role;

        if (!role) {
          const user = await profileService.fetchCurrent();
          role = user.role;
        }

        // 3. Redirecionamento Baseado no Perfil
        // Normalizamos para lowercase para evitar erro de ADMIN vs admin
        const roleLower = role.toLowerCase();

        if (roleLower === "client") {
          router.push("/client/dashboard");
        } else {
          // ADMIN, COMPANY_ADMIN e PROFESSIONAL vão para a gestão
          router.push("/admin/dashboard");
        }
      }
    } catch (error: any) {
      setLoading(false); // Destrava botão
      showToast(
        "error",
        error.response?.data?.message || "Email ou senha incorretos!"
      );
      // Reseta o Turnstile se der erro (opcional, mas recomendado)
      setTurnstileToken("");
    }
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToastType(type);
    setToastMessage(msg);
    setToastIsOpen(true);
    setTimeout(() => setToastIsOpen(false), 3000);
  };

  return (
    <>
      <Head>
        <title>ESPAÇO VIRTUOSA - Login</title>
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

            <div className="d-flex justify-content-center mb-4 mt-3">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{ theme: "light", language: "pt-BR" }}
              />
            </div>

            <Button
              type="submit"
              outline
              className={styles.formBtn}
              disabled={loading}
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
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
