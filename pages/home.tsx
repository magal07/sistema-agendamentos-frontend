import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Button, Spinner, Alert } from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss"; // Vamos criar esse CSS simples abaixo

export default function HomeAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getMyList();
      setAppointments(data);
    } catch (err) {
      setError("Erro ao carregar agendamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    try {
      await appointmentService.cancel(id);
      fetchAppointments(); // Recarrega a lista
      alert("Agendamento cancelado com sucesso.");
    } catch (err) {
      alert("Erro ao cancelar.");
    }
  };

  return (
    <>
      <Head>
        <title>Minha Agenda</title>
      </Head>
      <main
        style={{ minHeight: "100vh", backgroundColor: "#000", color: "#FFF" }}
      >
        <HeaderAuth />

        <Container className="py-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 style={{ fontWeight: "bold" }}>Meus Agendamentos</h2>
            <Button
              color="warning"
              className="fw-bold text-white"
              onClick={() => router.push("/book")} // Vamos criar essa rota depois
            >
              + Novo Agendamento
            </Button>
          </div>

          {error && <Alert color="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="light" />
            </div>
          ) : appointments.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {appointments.map((appt) => (
                <div key={appt.id} className={styles.appointmentCard}>
                  <div className={styles.dateBox}>
                    <span className={styles.day}>
                      {format(new Date(appt.appointmentDate), "dd", {
                        locale: ptBR,
                      })}
                    </span>
                    <span className={styles.month}>
                      {format(new Date(appt.appointmentDate), "MMM", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className={styles.infoBox}>
                    <h4>{appt.Service?.name || "Serviço"}</h4>
                    <p className="mb-1 text-muted">
                      {format(new Date(appt.appointmentDate), "EEEE, HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    <p className="mb-0 text-white small">
                      Profissional: {appt.professional?.firstName}
                    </p>
                  </div>

                  <div className={styles.statusBox}>
                    <span
                      className={`badge ${
                        appt.status === "confirmed"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {appt.status === "confirmed" ? "Confirmado" : appt.status}
                    </span>
                    {appt.status !== "cancelled" && (
                      <Button
                        outline
                        color="danger"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleCancel(appt.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 opacity-50">
              <h4>Você não tem agendamentos futuros.</h4>
              <p>Que tal dar um tapa no visual?</p>
            </div>
          )}
        </Container>

        <Footer />
      </main>
    </>
  );
}
