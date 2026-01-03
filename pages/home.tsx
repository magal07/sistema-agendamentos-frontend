import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Button, Spinner, Row, Col } from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import { appointmentService } from "../src/services/appointmentService";
import profileService from "../src/services/profileService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "../styles/homeAuth.module.scss";

export default function HomeAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [userName, setUserName] = useState("Cliente"); // Estado para o nome

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [listData, userData] = await Promise.all([
        appointmentService.getMyList(),
        profileService.fetchCurrent(), // Busca o usuário para dar "Oi"
      ]);
      setAppointments(listData);
      setUserName(userData.firstName);
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

  return (
    <>
      <Head>
        <title>Minha Agenda - Espaço Mulher</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* --- HERO SECTION (BANNER ROSA) --- */}
        <div className={styles.heroSection}>
          <Container className="d-flex justify-content-between align-items-center">
            <div>
              <p className={styles.welcomeTitle}>Olá, seja bem-vinda</p>
              <h1 className={styles.userName}>{userName}</h1>
            </div>

            {/* Botão flutuante no Desktop (Hero) */}
            <Button
              className={styles.btnCta}
              onClick={() => router.push("/book")}
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 0 }}>+</span>{" "}
              Agendar Horário
            </Button>
          </Container>
        </div>

        {/* --- CONTEÚDO --- */}
        <Container className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Seus Horários</span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="danger" />
            </div>
          ) : appointments.length > 0 ? (
            <Row>
              {appointments.map((appt) => (
                <Col md={12} key={appt.id}>
                  <div className={styles.appointmentCard}>
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
                        {format(new Date(appt.appointmentDate), "EEEE, HH:mm", {
                          locale: ptBR,
                        })}
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

                      {appt.status !== "cancelled" && (
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
            <div
              className="text-center py-5 mt-4"
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                padding: "3rem",
                boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
              }}
            >
              <img
                src="/logo.svg"
                alt="Empty"
                style={{ width: "60px", opacity: 0.3, marginBottom: "20px" }}
              />
              <h4 className="text-muted mb-3">Nenhum agendamento futuro</h4>
              <p className="text-muted mb-4">
                Seu visual merece um upgrade. Vamos agendar algo?
              </p>
              <Button
                color="secondary"
                outline
                onClick={() => router.push("/book")}
              >
                Ver disponibilidade
              </Button>
            </div>
          )}
        </Container>

        <Footer />
      </main>
    </>
  );
}
