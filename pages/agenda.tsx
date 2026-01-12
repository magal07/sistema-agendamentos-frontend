// pages/agenda.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderAuth from "../src/components/common/headerAuth";
import AgendaComponent from "../src/components/common/agenda"; // O Calendário
import ProfessionalAgenda from "../src/components/dashboard/ProfessionalAgenda"; // A Lista de Gestão (criada anteriormente)
import { Container, Button, Spinner } from "reactstrap";
import profileService from "../src/services/profileService";
import styles from "../styles/agenda.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

const AgendaPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // 1. Estado para controlar qual visão exibir (Calendário vs Painel)
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
          <div className={styles.headerSection}>
            <h2 className={styles.title}>
              {/* Muda o título dependendo da tela */}
              {showManagement ? "Gestão de Agendamentos 🛠️" : "Minha Agenda 🌸"}
            </h2>

            <div className="d-flex gap-2 flex-wrap justify-content-end">
              {/* BOTÃO 1: Alterna entre Calendário e Painel de Gestão */}
              {userRole !== "client" && (
                <Button
                  // Estilo "outline" quando não está ativo, ou cor sólida para destaque
                  color={showManagement ? "secondary" : "primary"}
                  className={styles.configBtn}
                  onClick={() => setShowManagement(!showManagement)}
                >
                  {showManagement
                    ? "Ver Calendário 📅"
                    : "Gerencie seus Agendamentos 📋"}
                </Button>
              )}

              {/* BOTÃO 2: Configurar Horários (Disponibilidade) */}
              {/* Só mostramos quando estamos no modo Calendário para não poluir o Painel */}
              {userRole !== "client" && !showManagement && (
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
            {showManagement
              ? "Finalize serviços, cancele ou edite agendamentos."
              : "Visualize seus agendamentos no calendário mensal."}
          </p>

          {/* LÓGICA DE EXIBIÇÃO */}
          {showManagement ? (
            // Modo Painel (Lista com botões de Ação)
            <ProfessionalAgenda />
          ) : (
            // Modo Calendário (AgendaComponent Padrão)
            <AgendaComponent />
          )}
        </Container>
        <MenuMobile />
      </main>
    </>
  );
};

export default AgendaPage;
