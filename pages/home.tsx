import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import { Container } from "reactstrap"; // Mantendo Container do reactstrap se for o que usas
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import profileService from "../src/services/profileService";
import { format, isAfter, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

// --- Componentes de Ícones (Simples) ---
const Icons = {
  Calendar: () => <span>📅</span>,
  User: () => <span>👤</span>,
  History: () => <span>📜</span>,
  Support: () => <span>💬</span>,
  Clock: () => <span>⏰</span>,
};

// --- Definição da Interface (Tipagem) ---
interface Appointment {
  id: number;
  appointmentDate: string | Date;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  Service?: { name: string };
  professional?: { firstName: string };
}

export default function HomeAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userName, setUserName] = useState("Cliente");
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );

  // --- SAUDAÇÃO DINÂMICA ---
  const greeting = useMemo(() => {
    const hour = getHours(new Date());
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [listData, userData] = await Promise.all([
        appointmentService.getMyList(),
        profileService.fetchCurrent(),
      ]);
      setAppointments(listData);
      setUserName(userData.firstName);
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
    if (!confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      await appointmentService.cancel(id);
      fetchInitialData();
    } catch (err) {
      alert("Erro ao cancelar.");
    }
  };

  // --- LÓGICA DE FILTRAGEM (Correção do TypeScript aplicada aqui) ---
  const { upcomingList, historyList, nextAppointment } = useMemo<{
    upcomingList: Appointment[];
    historyList: Appointment[];
    nextAppointment: Appointment | null;
  }>(() => {
    const now = new Date();
    const upcoming: Appointment[] = [];
    const history: Appointment[] = [];

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.appointmentDate);
      if (
        isAfter(apptDate, now) &&
        appt.status !== "cancelled" &&
        appt.status !== "completed"
      ) {
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

    const nextAppt = upcoming.length > 0 ? upcoming[0] : null;
    const listWithoutNext = upcoming.length > 0 ? upcoming.slice(1) : [];

    return {
      upcomingList: listWithoutNext,
      historyList: history,
      nextAppointment: nextAppt,
    };
  }, [appointments]);

  // A lista de exibição agora herda a tipagem correta
  const displayList = activeTab === "upcoming" ? upcomingList : historyList;

  // --- SKELETON LOADING ---
  const SkeletonCard = () => (
    <div className={`${styles.appointmentCard} ${styles.skeletonPulse}`}>
      <div
        className={styles.dateBox}
        style={{ background: "#e0e0e0", color: "transparent" }}
      >
        00
      </div>
      <div className={styles.infoBox}>
        <div
          style={{
            height: 16,
            width: "60%",
            background: "#e0e0e0",
            marginBottom: 8,
            borderRadius: 4,
          }}
        ></div>
        <div
          style={{
            height: 12,
            width: "40%",
            background: "#e0e0e0",
            borderRadius: 4,
          }}
        ></div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Minha Agenda - Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* HERO SECTION */}
        <div className={styles.heroSection}>
          <Container>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.greeting}>
                  {greeting}, {userName}!
                </p>
                <h1 className={styles.pageTitle}>Seu espaço de beleza</h1>
              </div>
              <div
                className={styles.avatar}
                onClick={() => router.push("/profile")}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* CARD DESTAQUE */}
            {userRole === "client" && !loading && nextAppointment && (
              <div className={styles.highlightCard}>
                <div className={styles.glassEffect}>
                  <div className={styles.highlightHeader}>
                    <span className={styles.badgeNext}>Próximo Horário</span>
                    <span className={styles.badgeConfirmed}>Confirmado</span>
                  </div>

                  <div className={styles.highlightContent}>
                    <div className={styles.bigDate}>
                      <span>
                        {format(
                          new Date(nextAppointment.appointmentDate),
                          "dd"
                        )}
                      </span>
                      <small>
                        {format(
                          new Date(nextAppointment.appointmentDate),
                          "MMM",
                          { locale: ptBR }
                        )}
                      </small>
                    </div>
                    <div className={styles.details}>
                      <h3>{nextAppointment.Service?.name}</h3>
                      <p>
                        <Icons.Clock />{" "}
                        {format(
                          new Date(nextAppointment.appointmentDate),
                          "HH:mm"
                        )}{" "}
                        •{" "}
                        {format(
                          new Date(nextAppointment.appointmentDate),
                          "EEEE",
                          { locale: ptBR }
                        )}
                      </p>
                      <p>
                        <Icons.User /> com{" "}
                        <strong>
                          {nextAppointment.professional?.firstName}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EMPTY STATE HERO */}
            {userRole === "client" && !loading && !nextAppointment && (
              <div className={styles.emptyHeroCard}>
                <h3>Tudo tranquilo por aqui ✨</h3>
                <p>Que tal reservar um momento para você?</p>
                <button
                  className={styles.btnPrimary}
                  onClick={() => router.push("/book")}
                >
                  Agendar Novo Horário
                </button>
              </div>
            )}
          </Container>
        </div>

        {/* MENU DE AÇÕES RÁPIDAS */}
        {userRole === "client" && (
          <div className={styles.actionsContainer}>
            <Container>
              <div className={styles.scrollableRow}>
                <button
                  className={styles.actionBtn}
                  onClick={() => router.push("/book")}
                >
                  <div className={styles.iconCircle}>+</div>
                  <span>Agendar</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => router.push("/profile")}
                >
                  <div className={styles.iconCircle}>
                    <Icons.User />
                  </div>
                  <span>Perfil</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => setActiveTab("history")}
                >
                  <div className={styles.iconCircle}>
                    <Icons.History />
                  </div>
                  <span>Histórico</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() =>
                    window.open("https://wa.me/5511948683746", "_blank")
                  }
                >
                  <div className={`${styles.iconCircle} ${styles.whatsapp}`}>
                    <Icons.Support />
                  </div>
                  <span>Ajuda</span>
                </button>
              </div>
            </Container>
          </div>
        )}

        <Container className="py-4">
          {userRole === "client" ? (
            <>
              {/* ABAS */}
              <div className={styles.tabsModern}>
                <button
                  className={activeTab === "upcoming" ? styles.active : ""}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Agendados
                </button>
                <button
                  className={activeTab === "history" ? styles.active : ""}
                  onClick={() => setActiveTab("history")}
                >
                  Histórico
                </button>
              </div>

              {/* LISTA DE AGENDAMENTOS */}
              <div className={styles.listContainer}>
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : displayList.length > 0 ? (
                  displayList.map((appt) => (
                    <div
                      key={appt.id}
                      className={`${styles.appointmentCard} ${
                        styles[appt.status]
                      }`}
                    >
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

                      <div className={styles.infoBox}>
                        <h4>{appt.Service?.name || "Serviço"}</h4>
                        <p className={styles.timeRow}>
                          {format(new Date(appt.appointmentDate), "HH:mm")} •{" "}
                          {appt.professional?.firstName}
                        </p>

                        <span
                          className={`${styles.statusPill} ${
                            styles[appt.status]
                          }`}
                        >
                          {appt.status === "confirmed"
                            ? "Confirmado"
                            : appt.status === "pending"
                            ? "Pendente"
                            : appt.status === "cancelled"
                            ? "Cancelado"
                            : "Concluído"}
                        </span>
                      </div>

                      {activeTab === "upcoming" &&
                        appt.status !== "cancelled" && (
                          <div className={styles.actionBox}>
                            <button
                              className={styles.btnIconCancel}
                              onClick={() => handleCancel(appt.id)}
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyList}>
                    <p className="text-muted">
                      {activeTab === "upcoming"
                        ? "Nenhum outro agendamento futuro."
                        : "Seu histórico está vazio."}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Visão Admin/Profissional
            <div className={styles.adminDashboard}>
              <h3>Olá, {userName} </h3>
              <p>
                Este é o seu painel administrativo para conferir suas métricas
                detalhadas e gerenciar agendamentos.
              </p>

              {/* Container Flex para alinhar os botões lado a lado */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {(userRole === "admin" || userRole === "company_admin") && (
                  <button
                    className={styles.btnPrimary}
                    onClick={() => router.push("/reports/financial")}
                  >
                    📊 Ir para Relatórios
                  </button>
                )}

                <button
                  className={styles.btnPrimary}
                  onClick={() => (window.location.href = "/agenda")}
                >
                  📅 Ir para Agenda
                </button>
              </div>
            </div>
          )}
        </Container>

        <Footer />
        <MenuMobile />
      </main>
    </>
  );
}
