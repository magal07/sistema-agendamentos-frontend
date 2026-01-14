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

import {
  FiPieChart,
  FiUserPlus,
  FiCalendar,
  FiClock,
  FiTrash2,
  FiUser,
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
  // Adicionei phone aqui para mostrar no modal de detalhes
  client?: {
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userName, setUserName] = useState("Profissional");
  const [userRole, setUserRole] = useState("");

  // --- 1. ATUALIZAÇÃO DO MODAL DE AVISO/ERRO ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  // Modal de Conclusão (Comissão)
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // --- NOVO: Modal de Detalhes do Cliente ---
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);

  const getImageUrl = (path?: string) => {
    if (!path) return "";
    const cleanPath = path.replace(/\\/g, "/");
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${
      cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath
    }`;
  };

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

  const activeAppointments = useMemo(() => {
    return appointments
      .filter(
        (appt) => appt.status !== "cancelled" && appt.status !== "completed"
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  }, [appointments]);

  // --- ABRIR DETALHES ---
  const handleOpenDetails = (appt: Appointment) => {
    setViewAppt(appt);
    setDetailsModalOpen(true);
  };

  // --- CANCELAMENTO ---
  const handleCancelClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation(); // Impede que abra o modal de detalhes ao clicar no botão
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: `Tem certeza que deseja cancelar o atendimento de ${appt.client?.firstName}?`,
      type: "confirm",
      confirmAction: async () => {
        try {
          const res = await appointmentService.cancel(appt.id);
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
            fetchInitialData();
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

  // --- COMPLETAR SERVIÇO ---
  const handleCompleteClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation(); // Impede que abra o modal de detalhes
    setSelectedAppt(appt);
    const dt =
      typeof appt.appointmentDate === "string"
        ? parseISO(appt.appointmentDate)
        : appt.appointmentDate;
    setNewDate(format(dt, "yyyy-MM-dd"));
    setNewTime(format(dt, "HH:mm"));
    setModalComplete(true);
  };

  const handleCompleteConfirm = async () => {
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
                {activeAppointments.slice(0, 10).map((appt) => (
                  <div
                    key={appt.id}
                    className={`${styles.appointmentCard} ${styles.confirmed}`}
                    style={{
                      borderLeft: "4px solid #b06075",
                      cursor: "pointer", // Indica que é clicável
                      transition: "transform 0.2s",
                    }}
                    onClick={() => handleOpenDetails(appt)} // Clique no Card abre detalhes
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
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
                      {/* HEADER DO CLIENTE */}
                      <div className="d-flex align-items-center mb-2">
                        {appt.client?.avatarUrl ? (
                          <img
                            src={getImageUrl(appt.client.avatarUrl)}
                            alt="Cliente"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              marginRight: "8px",
                              border: "1px solid #ddd",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              marginRight: "8px",
                              background: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#888",
                              border: "1px solid #ddd",
                            }}
                          >
                            <FiUser size={16} />
                          </div>
                        )}
                        <div>
                          <p
                            className="mb-0 text-muted small"
                            style={{ lineHeight: 1 }}
                          >
                            Cliente
                          </p>
                          <h4 className="mb-0" style={{ fontSize: "1rem" }}>
                            {appt.client?.firstName} {appt.client?.lastName}
                          </h4>
                        </div>
                      </div>

                      <p className={styles.timeRow}>
                        <Icons.Clock />{" "}
                        {format(new Date(appt.appointmentDate), "HH:mm")} •{" "}
                        {appt.Service?.name}
                      </p>
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div
                      className={styles.actionBox}
                      style={{ flexDirection: "column", gap: "8px" }}
                    >
                      <button
                        className={styles.btnIconCancel}
                        style={{ borderColor: "#28a745", color: "#28a745" }}
                        onClick={(e) => handleCompleteClick(e, appt)} // Passando 'e'
                        title="Finalizar Serviço"
                      >
                        ✅
                      </button>

                      <button
                        className={styles.btnIconCancel}
                        style={{ borderColor: "#dc3545", color: "#dc3545" }}
                        onClick={(e) => handleCancelClick(e, appt)} // Passando 'e'
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

        {/* --- MODAL DE DETALHES (NOVO) --- */}
        <Modal
          isOpen={detailsModalOpen}
          toggle={() => setDetailsModalOpen(false)}
          centered
          size="sm" // Modal mais estreito, tipo cartão de visita
        >
          <ModalHeader
            toggle={() => setDetailsModalOpen(false)}
            className="border-0 pb-0"
          ></ModalHeader>
          <ModalBody className="text-center pt-0">
            {viewAppt && (
              <div className="d-flex flex-column align-items-center">
                {/* FOTO GRANDE */}
                <div className="mb-3 position-relative">
                  {viewAppt.client?.avatarUrl ? (
                    <img
                      src={getImageUrl(viewAppt.client.avatarUrl)}
                      alt="Cliente"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid #fff",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: "#f8f9fa",
                        border: "4px solid #fff",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#adb5bd",
                      }}
                    >
                      <FiUser size={50} />
                    </div>
                  )}
                </div>

                <h3
                  className="mb-1"
                  style={{ fontWeight: "bold", color: "#333" }}
                >
                  {viewAppt.client?.firstName} {viewAppt.client?.lastName}
                </h3>
                <p className="text-muted mb-4">
                  {viewAppt.client?.phone || "Sem telefone informado"}
                </p>

                <div
                  className="w-100 text-start p-3 rounded"
                  style={{ background: "#fdfdfd", border: "1px solid #eee" }}
                >
                  <div className="mb-2">
                    <small
                      className="text-uppercase text-muted"
                      style={{ fontSize: "0.7rem", fontWeight: "bold" }}
                    >
                      Serviço
                    </small>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        color: "#b06075",
                        fontWeight: "600",
                      }}
                    >
                      {viewAppt.Service?.name}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between">
                    <div>
                      <small
                        className="text-uppercase text-muted"
                        style={{ fontSize: "0.7rem", fontWeight: "bold" }}
                      >
                        Data
                      </small>
                      <div>
                        {format(
                          new Date(viewAppt.appointmentDate),
                          "dd/MM/yyyy"
                        )}
                      </div>
                    </div>
                    <div>
                      <small
                        className="text-uppercase text-muted"
                        style={{ fontSize: "0.7rem", fontWeight: "bold" }}
                      >
                        Horário
                      </small>
                      <div>
                        {format(new Date(viewAppt.appointmentDate), "HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  block
                  className="mt-4 w-100"
                  style={{
                    borderRadius: "30px",
                    background: "#333",
                    border: "none",
                  }}
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            )}
          </ModalBody>
        </Modal>

        {/* MODAL DE CONCLUSÃO */}
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
            <Button color="success" onClick={handleCompleteConfirm}>
              Confirmar
            </Button>
          </ModalFooter>
        </Modal>

        {/* MODAL GENÉRICO DE AVISOS */}
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
    </AuthGuard>
  );
}
