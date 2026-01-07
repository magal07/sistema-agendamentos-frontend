import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderAuth from "../src/components/common/headerAuth";
import AgendaComponent from "../src/components/common/agenda";
import { Container, Button, Spinner } from "reactstrap"; // Adicione Button aqui
import profileService from "../src/services/profileService";
import styles from "../styles/agenda.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

const AgendaPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(""); // <--- 1. ESTADO PARA GUARDAR O CARGO

  useEffect(() => {
    const checkPermission = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const user = await profileService.fetchCurrent();
        setUserRole(user.role); // <--- 2. SALVA O CARGO
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
        style={{ height: "100vh", backgroundColor: "#fafafa" }}
      >
        <Spinner color="dark" />
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Minha Agenda | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>

      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          <div className={styles.headerSection}>
            <h2 className={styles.title}>Minha Agenda 🌸</h2>

            {/* 3. CONDIÇÃO: SÓ MOSTRA SE NÃO FOR CLIENTE */}
            {userRole !== "client" && (
              <Button
                className={styles.configBtn}
                onClick={() => router.push("/availability")}
                title="Configurar Horários"
              >
                Configure Seus Horários ⚙️
              </Button>
            )}
          </div>

          <p className={styles.subtitle}>
            Visualize seus agendamentos futuros e passados.
          </p>

          <AgendaComponent />
        </Container>
        <MenuMobile />
      </main>
    </>
  );
};

export default AgendaPage;
