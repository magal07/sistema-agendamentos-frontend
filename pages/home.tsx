import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import profileService from "../src/services/profileService";
import { format, isAfter, getHours, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

// --- NOVOS ÍCONES PARA OS CARDS ---
import { FiPieChart, FiUserPlus, FiCalendar, FiClock } from "react-icons/fi";

// --- Componentes de Ícones (Legado) ---
const Icons = {
  Calendar: () => <span>📅</span>,
  User: () => <span>👤</span>,
  History: () => <span>📜</span>,
  Support: () => <span>💬</span>,
  Clock: () => <span>⏰</span>,
};

interface Appointment {
  id: number;
  appointmentDate: string | Date;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  Service?: { name: string };
  professional?: { firstName: string };
  client?: { firstName: string; lastName?: string };
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

  // --- ESTADOS DO MODAL GLOBAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- ESTADOS PARA FINALIZAR SERVIÇO ---
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

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

  const openCompleteModal = (appt: Appointment) => {
    setSelectedAppt(appt);
    const dt =
      typeof appt.appointmentDate === "string"
        ? parseISO(appt.appointmentDate)
        : appt.appointmentDate;
    setNewDate(format(dt, "yyyy-MM-dd"));
    setNewTime(format(dt, "HH:mm"));
    setModalComplete(true);
  };

  const handleComplete = async () => {
    if (!selectedAppt) return;
    try {
      const finalDate = parseISO(`${newDate}T${newTime}:00`);
      await appointmentService.complete(selectedAppt.id, finalDate);
      setModalComplete(false);
      setModal({
        isOpen: true,
        title: "✅ Serviço Realizado",
        message: "Comissão gerada com sucesso! 💰",
        type: "success",
        confirmAction: null,
      });
      fetchInitialData();
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: "Erro",
        message: "Erro ao finalizar serviço.",
        type: "alert",
        confirmAction: null,
      });
    }
  };

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
        allUpcoming: upcoming,
      };
    }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcomingList : historyList;

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

        {userRole === "client" ? (
          <>
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
                    {" "}
                    <SkeletonCard /> <SkeletonCard />{" "}
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
            {/* GRID DE CARDS CHARMOSOS (NOVO DESIGN) */}
            <div className={styles.dashboardGrid}>
              {/* CARD: RELATÓRIOS (Só Admin) */}
              {(userRole === "admin" || userRole === "company_admin") && (
                <div
                  className={styles.dashboardCard}
                  onClick={() => router.push("/reports/financial")}
                >
                  <div className={`${styles.cardIcon} ${styles.iconPurple}`}>
                    <FiPieChart />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Relatórios</h3>
                    <p>Financeiro e métricas</p>
                  </div>
                </div>
              )}

              {/* CARD: AGENDAR CLIENTE */}
              <div
                className={styles.dashboardCard}
                onClick={() => router.push("/schedule-client")}
              >
                <div className={`${styles.cardIcon} ${styles.iconPink}`}>
                  <FiUserPlus />
                </div>
                <div className={styles.cardContent}>
                  <h3>Novo Agendamento</h3>
                  <p>Marcar para cliente</p>
                </div>
              </div>

              {/* CARD: VER AGENDA */}
              <div
                className={styles.dashboardCard}
                onClick={() => (window.location.href = "/agenda")}
              >
                <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                  <FiCalendar />
                </div>
                <div className={styles.cardContent}>
                  <h3>Agenda Completa</h3>
                  <p>Visualizar calendário</p>
                </div>
              </div>
            </div>
            {/* FIM GRID */}

            {userRole === "professional" && (
              <div className="mt-5">
                <h3 className={styles.appointmentsTitle}>
                  Seus Próximos Agendamentos
                </h3>
                {loading ? (
                  <SkeletonCard />
                ) : allUpcoming.length > 0 ? (
                  <div className={styles.listContainer}>
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
                        <div
                          className={styles.actionBox}
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexDirection: "column",
                          }}
                        >
                          <button
                            className={styles.btnIconCancel}
                            style={{
                              borderColor: "#28a745",
                              color: "#28a745",
                              backgroundColor: "transparent",
                            }}
                            onClick={() => openCompleteModal(appt)}
                            title="Finalizar"
                          >
                            ✅
                          </button>
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
          </Container>
        )}

        <Footer />
        <MenuMobile />

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
                {" "}
                <Button color="secondary" outline onClick={closeModal}>
                  Voltar
                </Button>{" "}
                <Button
                  color="danger"
                  onClick={() => modal.confirmAction && modal.confirmAction()}
                >
                  Confirmar
                </Button>{" "}
              </>
            ) : (
              <Button color="primary" onClick={closeModal}>
                Ok
              </Button>
            )}
          </ModalFooter>
        </Modal>

        <Modal
          isOpen={modalComplete}
          toggle={() => setModalComplete(!modalComplete)}
          centered
        >
          <ModalHeader>Finalizar Serviço</ModalHeader>
          <ModalBody>
            <p>O serviço foi realizado no horário agendado?</p>
            <div className="d-flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button outline onClick={() => setModalComplete(false)}>
              Cancelar
            </Button>
            <Button color="success" onClick={handleComplete}>
              Confirmar
            </Button>
          </ModalFooter>
        </Modal>
      </main>
    </>
  );
}
