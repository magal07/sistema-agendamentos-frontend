import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import { Container, Button, Spinner, Row, Col } from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import profileService from "../src/services/profileService";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss";

// 1. DEFININDO A INTERFACE (Tipo dos dados)
interface Appointment {
  id: number;
  appointmentDate: string | Date;
  status: "confirmed" | "pending" | "cancelled";
  Service?: {
    name: string;
  };
  professional?: {
    firstName: string;
  };
}

export default function HomeAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 2. Estados
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userName, setUserName] = useState("Cliente");
  // -- ALTERAÇÃO: Novo estado para guardar a função do usuário --
  const [userRole, setUserRole] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Buscamos os dados. Nota: Se não for cliente, getMyList pode vir vazio ou nem ser necessário,
      // mas mantemos aqui para simplicidade, o filtro visual será feito no JSX.
      const [listData, userData] = await Promise.all([
        appointmentService.getMyList(),
        profileService.fetchCurrent(),
      ]);

      setAppointments(listData);
      setUserName(userData.firstName);
      // -- ALTERAÇÃO: Salvando a role do usuário --
      setUserRole(userData.role);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar?")) return;
    try {
      await appointmentService.cancel(id);
      fetchInitialData();
    } catch (err) {
      alert("Erro ao cancelar.");
    }
  };

  // --- LÓGICA DE FILTRAGEM ---
  const { upcomingList, historyList } = useMemo(() => {
    const now = new Date();
    const upcoming: Appointment[] = [];
    const history: Appointment[] = [];

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.appointmentDate);
      if (isAfter(apptDate, now) && appt.status !== "cancelled") {
        upcoming.push(appt);
      } else {
        history.push(appt);
      }
    });

    upcoming.sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );

    history.sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    );

    return { upcomingList: upcoming, historyList: history };
  }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcomingList : historyList;

  return (
    <>
      <Head>
        <title>Minha Agenda - Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* --- HERO SECTION --- */}
        <div className={styles.heroSection}>
          <Container className="d-flex justify-content-between align-items-center">
            <div>
              <p className={styles.welcomeTitle}>Olá, seja bem-vinda</p>
              <h1 className={styles.userName}>{userName}</h1>
            </div>

            <div className="d-flex gap-3">
              {/* -- ALTERAÇÃO: Botão de Relatórios (Apenas Admin/CompanyAdmin) -- */}
              {(userRole === "admin" || userRole === "company_admin") && (
                <Button
                  className={styles.btnCta} // Usando mesmo estilo ou crie um novo btnReport
                  style={{ backgroundColor: "#fff", color: "#333" }} // Pequeno ajuste inline se quiser diferenciar
                  onClick={() => router.push("/reports/financial")}
                >
                  📊 Relatórios Financeiros
                </Button>
              )}

              {/* -- ALTERAÇÃO: Botão de Novo Agendamento (Apenas Clientes) -- */}
              {userRole === "client" && (
                <Button
                  className={styles.btnCta}
                  onClick={() => router.push("/book")}
                >
                  <span style={{ fontSize: "1.2rem", lineHeight: 0 }}>+</span>{" "}
                  Novo Agendamento
                </Button>
              )}
            </div>
          </Container>
        </div>

        {/* --- CONTEÚDO --- */}
        <Container className={styles.contentContainer}>
          {/* -- ALTERAÇÃO: Lógica para mostrar listas APENAS se for Cliente -- */}
          {userRole === "client" ? (
            <>
              {/* NAV TABS CUSTOMIZADA */}
              <div className={styles.tabsContainer}>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "upcoming" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Próximos Agendamentos
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "history" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  Histórico de Agendamentos
                </button>
              </div>

              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  {activeTab === "upcoming"
                    ? "Seus próximos horários"
                    : "Histórico de atendimentos"}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="danger" />
                </div>
              ) : displayList.length > 0 ? (
                <Row>
                  {displayList.map((appt) => (
                    <Col md={12} key={appt.id}>
                      <div
                        className={`${styles.appointmentCard} ${
                          appt.status === "cancelled"
                            ? styles.cardCancelled
                            : ""
                        }`}
                      >
                        {/* Data */}
                        <div className={styles.dateBox}>
                          <span className={styles.day}>
                            {format(new Date(appt.appointmentDate), "dd")}
                          </span>
                          <span className={styles.month}>
                            {format(new Date(appt.appointmentDate), "MMM", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        {/* Informações */}
                        <div className={styles.infoBox}>
                          <h4>{appt.Service?.name || "Serviço Especial"}</h4>
                          <div className={styles.timeInfo}>
                            {format(
                              new Date(appt.appointmentDate),
                              "EEEE, HH:mm",
                              {
                                locale: ptBR,
                              }
                            )}
                          </div>
                          <div className={styles.profInfo}>
                            Profissional: {appt.professional?.firstName}
                          </div>
                        </div>

                        {/* Status e Ações */}
                        <div className={styles.statusBox}>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[appt.status] || ""
                            }`}
                          >
                            {appt.status === "confirmed"
                              ? "Confirmado"
                              : appt.status === "cancelled"
                              ? "Cancelado"
                              : "Pendente"}
                          </span>

                          {activeTab === "upcoming" &&
                            appt.status !== "cancelled" && (
                              <button
                                className={styles.btnCancel}
                                onClick={() => handleCancel(appt.id)}
                              >
                                Cancelar
                              </button>
                            )}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                // EMPTY STATE
                <div className={styles.emptyState}>
                  <img
                    src="/logo.png"
                    alt="Empty"
                    className={styles.emptyIcon}
                  />
                  <h4 className="text-muted mb-2">
                    {activeTab === "upcoming"
                      ? "Nenhum horário marcado"
                      : "Nenhum histórico encontrado"}
                  </h4>
                  <p className="text-muted mb-4">
                    {activeTab === "upcoming"
                      ? "Que tal cuidar de você hoje? Agende um horário."
                      : "Seus atendimentos anteriores aparecerão aqui."}
                  </p>

                  {/* Botão do Empty State também só aparece para quem pode agendar */}
                  <Button
                    color="secondary"
                    outline
                    onClick={() => router.push("/book")}
                  >
                    Ver disponibilidade
                  </Button>
                </div>
              )}
            </>
          ) : (
            // -- ALTERAÇÃO: O que mostrar para Admin/Profissional se não ver a lista --
            <div className="text-center py-5">
              <h3 className="text-muted">Bem-vindo ao Painel Administrativo</h3>
              <p className="text-muted">
                Utilize o menu para navegar ou acessar os relatórios.
              </p>

              {/* Se quiser adicionar atalhos rápidos para Admin aqui futuramente, este é o lugar */}
            </div>
          )}
        </Container>

        <Footer />
      </main>
    </>
  );
}
