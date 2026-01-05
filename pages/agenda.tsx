import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderAuth from "../src/components/common/headerAuth";
import AgendaComponent from "../src/components/common/agenda";
import { Container, Spinner } from "reactstrap";
import profileService from "../src/services/profileService";

// IMPORTANTE: Importar o novo arquivo de estilos
import styles from "../styles/agenda.module.scss";

const AgendaPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const user = await profileService.fetchCurrent();

        /* caso queira bloquear o acesso a tela de agendamentos somente para admin/professional
         if (user.role !== "admin" && user.role !== "professional") {
           router.push("/home");
           return;
         } */

        await profileService.fetchCurrent();
        setLoading(false);
      } catch (error) {
        router.push("/login");
      }
    };

    checkPermission();
  }, [router]);

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh", backgroundColor: "#d48498" }} // Spinner com fundo rosa
      >
        <Spinner color="light" />
      </Container>
    );
  }

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
        <title>Agenda | Espaço Virtuosa</title>
      </Head>

      {/* Aplica o fundo rosa da classe .main */}
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          <div className={styles.headerSection}>
            <h2 className={styles.title}>Minha Agenda Profissional 🌸</h2>
          </div>

          <p className={styles.subtitle}>
            Visualize e gerencie seus atendimentos. Arraste os cards para
            reagendar.
          </p>
          <AgendaComponent />
        </Container>
      </main>
    </>
  );
};

export default AgendaPage;
