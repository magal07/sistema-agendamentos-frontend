import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import { Container, Spinner } from "reactstrap";
import HeaderAuth from "../../src/components/common/headerAuth";
import Footer from "../../src/components/common/footer";
import MenuMobile from "../../src/components/common/menuMobile"; // Seu menu novo
import { appointmentService } from "../../src/services/appointmentService";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../../styles/homeAuth.module.scss"; // Reaproveitando os estilos da Home

// Tipagem (Igual a da Home)
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

  // Carrega os dados
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

  const handleCancel = async (id: number) => {
    if (!confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      await appointmentService.cancel(id);
      fetchAppointments(); // Recarrega a lista
    } catch (err) {
      alert("Erro ao cancelar.");
    }
  };

  // Separação das Listas (Futuros vs Histórico)
  const { upcomingList, historyList } = useMemo(() => {
    const now = new Date();
    const upcoming: Appointment[] = [];
    const history: Appointment[] = [];

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.appointmentDate);
      // Considera 'upcoming' apenas o que é futuro e não está cancelado/concluído
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

    // Ordenação
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

          {/* ABAS DE NAVEGAÇÃO */}
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

          {/* LISTAGEM */}
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

                  {/* Botão Cancelar (Apenas para Futuros) */}
                  {activeTab === "upcoming" && appt.status !== "cancelled" && (
                    <div className={styles.actionBox}>
                      <button
                        className={styles.btnIconCancel}
                        onClick={() => handleCancel(appt.id)}
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

        {/* Adiciona o Menu Mobile aqui também */}
        <MenuMobile />
      </main>
    </>
  );
}
