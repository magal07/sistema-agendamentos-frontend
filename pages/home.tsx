import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import profileService from "../src/services/profileService";
import { format, isAfter, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

// --- Componentes de Ícones ---
const Icons = {
  Calendar: () => <span>📅</span>,
  User: () => <span>👤</span>,
  History: () => <span>📜</span>,
  Support: () => <span>💬</span>,
  Clock: () => <span>⏰</span>,
};

// --- 1. ATUALIZAÇÃO DA INTERFACE (Adicionado 'client') ---
interface Appointment {
  id: number;
  appointmentDate: string | Date;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  Service?: { name: string };
  professional?: { firstName: string };
  client?: { firstName: string; lastName?: string }; // <--- NOVO
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

  // --- ESTADOS DO MODAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- SAUDAÇÃO ---
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

  // --- FUNÇÃO DE CANCELAR ---
  const executeCancellation = async (id: number) => {
    try {
      const res = await appointmentService.cancel(id);

      if (res.data && res.data.type === "warning") {
        setModal({
          isOpen: true,
          title: "⚠️ Atenção",
          message: res.data.message,
          type: "warning",
          confirmAction: null,
        });
      } else {
        setModal({
          isOpen: true,
          title: "✅ Cancelado",
          message: "Seu agendamento foi cancelado com sucesso!",
          type: "success",
          confirmAction: null,
        });
        fetchInitialData();
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        title: "Erro",
        message: err.response?.data?.message || "Não foi possível cancelar.",
        type: "alert",
        confirmAction: null,
      });
    }
  };

  const handleCancelClick = (id: number) => {
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message:
        "Tem certeza que deseja cancelar este horário? Essa ação não pode ser desfeita.",
      type: "confirm",
      confirmAction: () => executeCancellation(id),
    });
  };

  // --- 2. LÓGICA DE FILTRAGEM (Atualizada para expor allUpcoming) ---
  const { upcomingList, historyList, nextAppointment, allUpcoming } =
    useMemo(() => {
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

      return {
        upcomingList: upcoming.length > 0 ? upcoming.slice(1) : [],
        historyList: history,
        nextAppointment: upcoming.length > 0 ? upcoming[0] : null,
        allUpcoming: upcoming, // <--- Lista completa para a Profissional
      };
    }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcomingList : historyList;

  // --- SKELETON ---
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
                <h1 className={styles.pageTitle}>
                  {userRole === "client"
                    ? "Seu espaço de beleza"
                    : "Painel Profissional"}
                </h1>
              </div>
              <div
                className={styles.avatar}
                onClick={() => router.push("/profile")}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* DESTAQUE (APENAS CLIENTE) */}
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

                  <div
                    className="mt-3 text-end"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.2)",
                      paddingTop: "10px",
                    }}
                  >
                    <Button
                      size="sm"
                      color="danger"
                      outline
                      style={{ color: "#fff", borderColor: "#fff" }}
                      onClick={() => handleCancelClick(nextAppointment.id)}
                    >
                      Cancelar Horário
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* EMPTY STATE CLIENTE */}
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

        {/* --- CONTEÚDO PRINCIPAL --- */}
        {userRole === "client" ? (
          // VISÃO CLIENTE
          <>
            <div className={styles.actionsContainer}>
              {/* ... (Botões de Ação do Cliente - inalterados) ... */}
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

            <Container className="py-4">
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
                            : "Cancelado"}
                        </span>
                      </div>
                      {activeTab === "upcoming" &&
                        appt.status !== "cancelled" && (
                          <div className={styles.actionBox}>
                            <button
                              className={styles.btnIconCancel}
                              onClick={() => handleCancelClick(appt.id)}
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
                        : "Histórico vazio."}
                    </p>
                  </div>
                )}
              </div>
            </Container>
          </>
        ) : (
          // --- VISÃO ADMIN / PROFISSIONAL ---
          <Container className="py-4">
            {/* 3. LISTA DE PRÓXIMOS 10 AGENDAMENTOS (SÓ PROFISSIONAL) */}
            {userRole === "professional" && (
              <div className="mb-5">
                <h3 className={styles.appointmentsTitle}>
                  Seus Próximos Agendamentos
                </h3>

                {loading ? (
                  <SkeletonCard />
                ) : allUpcoming.length > 0 ? (
                  <div className={styles.listContainer}>
                    {/* PEGA OS 10 PRIMEIROS */}
                    {allUpcoming.slice(0, 10).map((appt) => (
                      <div
                        key={appt.id}
                        className={`${styles.appointmentCard} ${styles.confirmed}`}
                        style={{ borderLeft: "4px solid #b06075" }}
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
                          {/* Mostra nome do CLIENTE */}
                          <p className="mb-1 text-muted small">Cliente</p>
                          <h4 className="mb-1">
                            {appt.client?.firstName} {appt.client?.lastName}
                          </h4>
                          <p className={styles.timeRow}>
                            <Icons.Clock />{" "}
                            {format(new Date(appt.appointmentDate), "HH:mm")} •{" "}
                            {appt.Service?.name}
                          </p>
                        </div>

                        {/* Botão de Cancelar Rápido (Opcional, mas útil) */}
                        <div className={styles.actionBox}>
                          <button
                            className={styles.btnIconCancel}
                            onClick={() => handleCancelClick(appt.id)}
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">
                    Você não tem agendamentos futuros no momento.
                  </p>
                )}
              </div>
            )}

            {/* DASHBOARD GERAL (Botões) */}
            <div className={styles.adminDashboard}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {(userRole === "admin" || userRole === "company_admin") && (
                  <button
                    className={styles.btnPrimary}
                    onClick={() => router.push("/reports/financial")}
                  >
                    📊 Relatórios
                  </button>
                )}

                {/* BOTÃO AGENDAR CLIENTE */}
                <button
                  className={styles.btnPrimary}
                  onClick={() => router.push("/schedule-client")}
                >
                  ➕ Agendar Cliente
                </button>
                {/* Botão Agenda */}
                <button
                  className={styles.btnPrimary}
                  onClick={() => (window.location.href = "/agenda")}
                >
                  📅 Ver Agenda Completa
                </button>
              </div>
            </div>
          </Container>
        )}

        <Footer />
        <MenuMobile />

        {/* MODAL GLOBAL */}
        <Modal isOpen={modal.isOpen} toggle={closeModal} centered>
          <ModalHeader
            toggle={closeModal}
            className={
              modal.type === "success"
                ? "text-success"
                : modal.type === "warning"
                ? "text-warning"
                : modal.type === "confirm"
                ? "text-danger"
                : ""
            }
          >
            {modal.title}
          </ModalHeader>
          <ModalBody>{modal.message}</ModalBody>
          <ModalFooter>
            {modal.type === "confirm" ? (
              <>
                <Button color="secondary" outline onClick={closeModal}>
                  Voltar
                </Button>
                <Button
                  color="danger"
                  onClick={() => modal.confirmAction && modal.confirmAction()}
                >
                  Confirmar
                </Button>
              </>
            ) : (
              <Button color="primary" onClick={closeModal}>
                Ok
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </main>
    </>
  );
}
