import Footer from "../src/components/common/footer";
import HeaderGeneric from "../src/components/common/headerGeneric";
import styles from "../styles/registerLogin.module.scss";
import Head from "next/head";
import { Container, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { FormEvent, useState } from "react";
import { authService } from "../src/services/authService"; // Ajuste o import se não for export default
import { useRouter } from "next/router";
import ToastComponent from "../src/components/common/toast";
// import { useLoggedInRedirect } from "../utils/util"; // Se tiver essa util, pode descomentar
import { formatCPF, formatPhone, cleanMask, validateCPF } from "../utils/masks"; // Ajuste o caminho se necessário

const Register = function () {
  const router = useRouter();
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Estados controlados para máscaras
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  // useLoggedInRedirect(); // Redireciona se já estiver logado

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName")!.toString();
    const lastName = formData.get("lastName")!.toString();
    const birth = formData.get("birth")!.toString();
    const email = formData.get("email")!.toString();
    const password = formData.get("password")!.toString();
    const confirmPassword = formData.get("confirmPassword")!.toString();

    if (password !== confirmPassword) {
      setToastType("error");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      setToastMessage("Senha e confirmação são diferentes!");
      return;
    }

    if (!validateCPF(cpf)) {
      setToastType("error");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      setToastMessage("CPF inválido. Verifique os números.");
      return;
    }

    const params = {
      firstName,
      lastName,
      phone: cleanMask(phone), // Limpa a máscara antes de enviar ((11) 9... -> 119...)
      birth,
      email,
      password,
      cpf: cleanMask(cpf), // Limpa a máscara (123.456... -> 123456...)
    };

    try {
      const { status } = await authService.register(params);

      if (status === 201) {
        router.push("/login?registred=true");
      }
    } catch (error: any) {
      setToastType("error");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      // Pega a mensagem de erro do backend (ex: "Email já cadastrado")
      setToastMessage(
        error.response?.data?.message || "Erro ao realizar cadastro."
      );
    }
  };

  return (
    <>
      <Head>
        <title>Registro</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderGeneric
          logoUrl="/"
          btnUrl="/login"
          btnContent="Já tenho uma conta"
        />
        <Container className="py-5">
          <p className={styles.formTitle}>
            <strong>Bem-vinda ao Espaço Mulher</strong>
          </p>
          <Form className={styles.form} onSubmit={handleRegister}>
            <p className="text-center">
              <strong>Crie sua conta</strong>
            </p>
            <FormGroup>
              <Label for="firstName" className={styles.label}>
                NOME
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Qual o seu nome?"
                required
                maxLength={20}
                className={styles.inputName}
              />
            </FormGroup>
            <FormGroup>
              <Label for="lastName" className={styles.label}>
                SOBRENOME
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Qual o seu sobrenome?"
                required
                maxLength={20}
                className={styles.inputName}
              />
            </FormGroup>

            <FormGroup>
              <Label for="cpf" className={styles.label}>
                CPF
              </Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="000.000.000-00"
                required
                maxLength={14}
                className={styles.input}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
              />
            </FormGroup>

            <FormGroup>
              <Label for="phone" className={styles.label}>
                WHATSAPP / CELULAR
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(xx) 9xxxx-xxxx"
                required
                maxLength={15}
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
              />
            </FormGroup>

            <FormGroup>
              <Label for="email" className={styles.label}>
                EMAIL
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Digite o seu e-mail"
                required
                maxLength={50}
                className={styles.input}
              />
            </FormGroup>

            <FormGroup>
              <Label for="birth" className={styles.label}>
                DATA DE NASCIMENTO
              </Label>
              <Input
                id="birth"
                name="birth"
                type="date"
                min="1930-01-01"
                max={new Date().toISOString().split("T")[0]} // Data máxima = Hoje
                required
                className={styles.input}
              />
            </FormGroup>

            <FormGroup>
              <Label for="password" className={styles.label}>
                SENHA
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite a sua senha (Min 6 caracteres)"
                required
                minLength={6}
                maxLength={20}
                className={styles.input}
              />
            </FormGroup>

            <FormGroup>
              <Label for="confirmPassword" className={styles.label}>
                CONFIRME SUA SENHA
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme a sua senha"
                required
                minLength={6}
                maxLength={20}
                className={styles.input}
              />
            </FormGroup>

            <Button type="submit" outline className={styles.formBtn}>
              CADASTRAR
            </Button>
          </Form>
        </Container>
        <Footer />
        <ToastComponent
          type={toastType}
          isOpen={toastIsOpen}
          message={toastMessage}
        />
      </main>
    </>
  );
};

export default Register;
