import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap"; // <--- Adicionamos os imports do Modal
import HeaderAuth from "../../src/components/common/headerAuth";
import Footer from "../../src/components/common/footer";
import MenuMobile from "../../src/components/common/menuMobile";
import { appointmentService } from "../../src/services/appointmentService";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../../styles/homeAuth.module.scss";

interface Appointment {
  id: number;
  appointmentDate: string | Date;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  Service?: { name: string };
  professional?: { firstName: string };
}

export default function MyAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );

  // --- 1. ESTADO DO MODAL (Igual ao da Home) ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const listData = await appointmentService.getMyList();
      setAppointments(listData);
    } catch (err) {
      console.error("Erro ao carregar agendamentos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // --- 2. LÓGICA DE CANCELAMENTO VIA MODAL ---
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
          message: "Agendamento cancelado com sucesso!",
          type: "success",
          confirmAction: null,
        });
        fetchAppointments(); // Recarrega a lista
      }
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Erro",
        message: "Não foi possível cancelar o agendamento.",
        type: "alert",
        confirmAction: null,
      });
    }
  };

  const handleCancelClick = (id: number) => {
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: "Tem certeza que deseja cancelar este agendamento?",
      type: "confirm",
      confirmAction: () => executeCancellation(id),
    });
  };

  const { upcomingList, historyList } = useMemo(() => {
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

    return { upcomingList: upcoming, historyList: history };
  }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcomingList : historyList;

  return (
    <>
      <Head>
        <title>Meus Agendamentos | Espaço Virtuosa</title>
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="py-5 mb-5">
          <h1
            className={styles.pageTitle}
            style={{ marginBottom: "20px", fontSize: "1.8rem" }}
          >
            Meus Agendamentos 📅
          </h1>

          <div className={styles.tabsModern}>
            <button
              className={activeTab === "upcoming" ? styles.active : ""}
              onClick={() => setActiveTab("upcoming")}
            >
              Próximos
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
              <div className="text-center py-5">
                <Spinner color="dark" />
              </div>
            ) : displayList.length > 0 ? (
              displayList.map((appt) => (
                <div
                  key={appt.id}
                  className={`${styles.appointmentCard} ${styles[appt.status]}`}
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
                      className={`${styles.statusPill} ${styles[appt.status]}`}
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

                  {/* 3. BOTÃO CHAMA O handleCancelClick */}
                  {activeTab === "upcoming" && appt.status !== "cancelled" && (
                    <div className={styles.actionBox}>
                      <button
                        className={styles.btnIconCancel}
                        onClick={() => handleCancelClick(appt.id)}
                        title="Cancelar Agendamento"
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
                    ? "Você não tem agendamentos futuros."
                    : "Nenhum histórico encontrado."}
                </p>
              </div>
            )}
          </div>
        </Container>

        <Footer />
        <MenuMobile />

        {/* 4. COMPONENTE VISUAL DO MODAL */}
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
