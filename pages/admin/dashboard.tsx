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
import HeaderAuth from "../../src/components/common/headerAuth";
import Footer from "../../src/components/common/footer";
import MenuMobile from "../../src/components/common/menuMobile";
import AuthGuard from "../../src/components/common/authGuard";
import { appointmentService } from "../../src/services/appointmentService";
import profileService from "../../src/services/profileService";
import { format, parseISO, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../../styles/homeAuth.module.scss";

// Adicionei FiTrash2 (Lixeira)
import {
  FiPieChart,
  FiUserPlus,
  FiCalendar,
  FiClock,
  FiTrash2,
} from "react-icons/fi";

const Icons = {
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userName, setUserName] = useState("Profissional");
  const [userRole, setUserRole] = useState("");

  // --- 1. ATUALIZAÇÃO DO MODAL (Para suportar Confirmação de Cancelamento) ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>), // Callback para o botão "Sim"
  });

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

  // --- 2. FILTRAGEM (Remove cancelados e concluídos da lista) ---
  const activeAppointments = useMemo(() => {
    return (
      appointments
        .filter(
          (appt) => appt.status !== "cancelled" && appt.status !== "completed"
        )
        // Opcional: Garantir ordenação por data
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        )
    );
  }, [appointments]);

  // --- LÓGICA DE CANCELAMENTO ---
  const handleCancelClick = (appt: Appointment) => {
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: `Tem certeza que deseja cancelar o atendimento de ${appt.client?.firstName}?`,
      type: "confirm",
      confirmAction: async () => {
        try {
          // Precisamos do userId e role para o service (ou o backend pega do token)
          // Como o service front geralmente só pede ID, ajustamos aqui:
          const res = await appointmentService.cancel(appt.id);

          // Verifica se retornou aviso (ex: falta de whats) ou sucesso
          if (
            (res as any).status === "pending_approval" ||
            (res as any).type === "warning"
          ) {
            setModal({
              isOpen: true,
              title: "Aviso",
              message: (res as any).message || "Cancelamento pendente.",
              type: "warning",
              confirmAction: null,
            });
          } else {
            setModal({
              isOpen: true,
              title: "Sucesso",
              message: "Agendamento cancelado.",
              type: "success",
              confirmAction: null,
            });
            fetchInitialData(); // Atualiza a lista removendo o item
          }
        } catch (error: any) {
          setModal({
            isOpen: true,
            title: "Erro",
            message: error.response?.data?.message || "Erro ao cancelar.",
            type: "alert",
            confirmAction: null,
          });
        }
      },
    });
  };

  // --- LÓGICA DE COMPLETAR ---
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
        title: "✅ Sucesso",
        message: "Comissão gerada! O agendamento foi finalizado.",
        type: "success",
        confirmAction: null,
      });
      fetchInitialData();
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Erro",
        message: "Falha ao finalizar.",
        type: "alert",
        confirmAction: null,
      });
    }
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const SkeletonCard = () => (
    <div className={`${styles.appointmentCard} ${styles.skeletonPulse}`}>
      <div
        className={styles.dateBox}
        style={{ background: "#e0e0e0", color: "transparent" }}
      >
        00
      </div>
      <div className={styles.infoBox} style={{ width: "100%" }}>
        <div
          style={{
            height: 16,
            width: "60%",
            background: "#e0e0e0",
            marginBottom: 8,
          }}
        ></div>
      </div>
    </div>
  );

  return (
    <AuthGuard allowedRoles={["admin", "company_admin", "professional"]}>
      <Head>
        <title>Painel Profissional - Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <div
          className={styles.heroSection}
          style={{ minHeight: "200px", paddingBottom: "40px" }}
        >
          <Container>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.greeting}>
                  {greeting}, {userName}!
                </p>
                <h1 className={styles.pageTitle}>Painel de Gestão</h1>
              </div>
              <div
                className={styles.avatar}
                onClick={() => router.push("/profile")}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-4" style={{ marginTop: "-40px" }}>
          <div className={styles.dashboardGrid}>
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
            <div
              className={styles.dashboardCard}
              onClick={() => router.push("/agenda")}
            >
              <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                <FiCalendar />
              </div>
              <div className={styles.cardContent}>
                <h3>Minha Agenda</h3>
                <p>Visualizar calendário</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h3 className={styles.appointmentsTitle}>
              Seus Próximos Atendimentos
            </h3>

            {loading ? (
              <SkeletonCard />
            ) : activeAppointments.length > 0 ? (
              <div className={styles.listContainer}>
                {/* 3. Renderiza apenas os ATIVOS (limitado a 10) */}
                {activeAppointments.slice(0, 10).map((appt) => (
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

                    {/* 4. BOTÕES DE AÇÃO (Finalizar e Cancelar) */}
                    <div
                      className={styles.actionBox}
                      style={{ flexDirection: "column", gap: "8px" }}
                    >
                      <button
                        className={styles.btnIconCancel}
                        style={{ borderColor: "#28a745", color: "#28a745" }}
                        onClick={() => openCompleteModal(appt)}
                        title="Finalizar Serviço"
                      >
                        ✅
                      </button>

                      <button
                        className={styles.btnIconCancel}
                        style={{ borderColor: "#dc3545", color: "#dc3545" }}
                        onClick={() => handleCancelClick(appt)}
                        title="Cancelar Agendamento"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                Nenhum atendimento pendente na agenda.
              </p>
            )}
          </div>
        </Container>

        <Footer />
        <MenuMobile />

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

        {/* 5. MODAL GENÉRICO ATUALIZADO (Confirmação/Sucesso/Erro) */}
        <Modal isOpen={modal.isOpen} toggle={closeModal} centered>
          <ModalHeader
            toggle={closeModal}
            className={
              modal.type === "success"
                ? "text-success"
                : modal.type === "confirm"
                ? "text-danger"
                : modal.type === "warning"
                ? "text-warning"
                : ""
            }
          >
            {modal.title}
          </ModalHeader>
          <ModalBody>{modal.message}</ModalBody>
          <ModalFooter>
            {modal.type === "confirm" ? (
              <>
                <Button outline color="secondary" onClick={closeModal}>
                  Voltar
                </Button>
                <Button
                  color="danger"
                  onClick={() => modal.confirmAction && modal.confirmAction()}
                >
                  Confirmar Cancelamento
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
    </AuthGuard>
  );
}
