// pages/session-expired.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Container, Spinner } from "reactstrap";
import styles from "../styles/registerLogin.module.scss";
import Footer from "../src/components/common/footer";

export default function SessionExpired() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    // Garantia extra: limpa ao montar a página
    sessionStorage.clear();
    localStorage.clear();

    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirect = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>Espaço Virtuosa - Sessão Expirada</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main
        className={styles.main}
        style={{
          backgroundColor: "#0b0b0b",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Container className="text-center text-white my-auto">
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: "200px", marginBottom: "40px" }}
          />
          <h1 style={{ color: "#a10a6f", fontWeight: "bold" }}>
            Sua sessão expirou
          </h1>
          <p className="my-4" style={{ fontSize: "1.2rem", opacity: 0.8 }}>
            Por segurança, você foi desconectado. <br />
            Estamos te levando para a tela de login...
          </p>
          <div className="d-flex align-items-center justify-content-center gap-3">
            <Spinner color="warning" size="sm" />
            <span>Redirecionando em {seconds}s</span>
          </div>
        </Container>
        <Footer />
      </main>
    </>
  );
}
