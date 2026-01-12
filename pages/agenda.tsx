import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderAuth from "../src/components/common/headerAuth";
import AgendaComponent from "../src/components/common/agenda";
import ProfessionalAgenda from "../src/components/dashboard/ProfessionalAgenda";
import { Container, Button, Spinner } from "reactstrap";
import profileService from "../src/services/profileService";
import styles from "../styles/agenda.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

const AgendaPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Estado para controlar a visão (False = Calendário, True = Lista de Gestão)
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const user = await profileService.fetchCurrent();
        setUserRole(user.role);
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
        style={{ height: "100vh" }}
      >
        <Spinner color="dark" />
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Minha Agenda | Espaço Virtuosa</title>
      </Head>

      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          {/* LÓGICA DE EXIBIÇÃO:
              Se showManagement for TRUE, mostramos APENAS o componente ProfessionalAgenda 
              (que já tem seu próprio cabeçalho e botão de voltar).
              
              Se for FALSE, mostramos o cabeçalho padrão da agenda e o Calendário.
          */}

          {showManagement ? (
            // --- MODO GESTÃO (Tabela) ---
            <ProfessionalAgenda />
          ) : (
            // --- MODO CALENDÁRIO ---
            <>
              <div className={styles.headerSection}>
                <h2 className={styles.title}>Minha Agenda 🌸</h2>

                <div className="d-flex gap-2 flex-wrap justify-content-end">
                  {/* Botão para ir ao Painel de Gestão */}
                  {userRole !== "client" && (
                    <Button
                      color="primary"
                      className={styles.configBtn}
                      onClick={() => setShowManagement(true)}
                    >
                      Gerencie seus Agendamentos 📋
                    </Button>
                  )}

                  {/* Botão Configurar Horários */}
                  {userRole !== "client" && (
                    <Button
                      className={styles.configBtn}
                      outline
                      onClick={() => router.push("/availability")}
                    >
                      Configurar Horários ⚙️
                    </Button>
                  )}
                </div>
              </div>

              <p className={styles.subtitle}>
                Visualize seus agendamentos no calendário mensal.
              </p>

              <AgendaComponent />
            </>
          )}
        </Container>
        <MenuMobile />
      </main>
    </>
  );
};

export default AgendaPage;
