// pages/404.tsx
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/registerLogin.module.scss";
import { Button, Container } from "reactstrap";
import HeaderGeneric from "../src/components/common/headerGeneric";
import Footer from "../src/components/common/footer";

const Custom404 = function () {
  return (
    <>
      <Head>
        <title>Sistema de Agendamentos - Página não encontrada</title>
        <link rel="shortcut icon" href="/favicon.svg" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderGeneric
          logoUrl="/logoVerboMAX.svg"
          btnUrl="/login"
          btnContent="Quero fazer login"
        />

        <Container
          className="py-5 text-center text-white d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "60vh" }}
        >
          <h1
            style={{ fontSize: "10rem", fontWeight: "800", color: "#d4af37" }}
          >
            404
          </h1>
          <h2 className="mb-4">
            Ops! Parece que sua sessão expirou ou esta página não existe.
          </h2>
          <p className="mb-5" style={{ fontSize: "1.2rem", maxWidth: "600px" }}>
            Para sua segurança, quando detectamos dados de cache antigos ou
            inconsistências, sugerimos que você refaça seu login.
          </p>

          <Link href="/login">
            <Button
              outline
              color="light"
              size="lg"
              style={{ border: "2px solid #d4af37", color: "#d4af37" }}
            >
              VOLTAR PARA O LOGIN
            </Button>
          </Link>
        </Container>

        <div className={styles.footerPositon}>
          <Footer />
        </div>
      </main>
    </>
  );
};

export default Custom404;
