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

// Ícones Novos
import { FiPieChart, FiUserPlus, FiCalendar, FiClock } from "react-icons/fi";

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

  // Modais
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Saudação
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
        appointmentService.getMyList(), // Para profissional, isso traz a agenda dele
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

  // --- LÓGICA DE COMPLETAR SERVIÇO ---
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
        message: "Comissão gerada!",
        type: "success",
      });
      fetchInitialData();
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Erro",
        message: "Falha ao finalizar.",
        type: "alert",
      });
    }
  };

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
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* HERO SIMPLIFICADO PARA ADMIN */}
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
          {/* GRID DE CARDS (O Menu Principal do Admin) */}
          <div className={styles.dashboardGrid}>
            {/* Relatórios (Só Admin/Dono) */}
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

            {/* Agendar Cliente */}
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

            {/* Agenda Completa */}
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

          {/* LISTA DE PRÓXIMOS AGENDAMENTOS */}
          <div className="mt-5">
            <h3 className={styles.appointmentsTitle}>
              Seus Próximos Atendimentos
            </h3>

            {loading ? (
              <SkeletonCard />
            ) : appointments.length > 0 ? (
              <div className={styles.listContainer}>
                {appointments.slice(0, 10).map((appt) => (
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
                      style={{ flexDirection: "column", gap: "8px" }}
                    >
                      {/* Botão Finalizar */}
                      <button
                        className={styles.btnIconCancel}
                        style={{ borderColor: "#28a745", color: "#28a745" }}
                        onClick={() => openCompleteModal(appt)}
                        title="Finalizar Serviço"
                      >
                        ✅
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                Nenhum atendimento agendado para hoje.
              </p>
            )}
          </div>
        </Container>

        <Footer />
        <MenuMobile />

        {/* MODAL COMPLETAR SERVIÇO */}
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

        {/* MODAL ALERTA */}
        <Modal
          isOpen={modal.isOpen}
          toggle={() => setModal({ ...modal, isOpen: false })}
          centered
        >
          <ModalHeader>{modal.title}</ModalHeader>
          <ModalBody>{modal.message}</ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => setModal({ ...modal, isOpen: false })}
            >
              Ok
            </Button>
          </ModalFooter>
        </Modal>
      </main>
    </AuthGuard>
  );
}
