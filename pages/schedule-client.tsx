import Head from "next/head";
import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Button,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { useRouter } from "next/router";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import MenuMobile from "../src/components/common/menuMobile";
import styles from "../styles/scheduleClient.module.scss";

import { formatCPF } from "../utils/masks";
// --- DATE FNS ---
import { format, parseISO } from "date-fns";
import {
  getTodayISO,
  getTomorrowISO,
  formatDateDisplay,
  combineDateAndTime,
} from "../utils/dateConfig";

import profileService from "../src/services/profileService";
import { professionalService } from "../src/services/professionalService";
import availabilityService from "../src/services/availabilityService";
import { appointmentService } from "../src/services/appointmentService";
import { categoryService } from "../src/services/categoriesService";

import { FiSearch, FiUser, FiCalendar, FiCheckCircle } from "react-icons/fi";

export default function ScheduleClient() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [cpfSearch, setCpfSearch] = useState("");
  const [clientFound, setClientFound] = useState<any>(null);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");

  // --- CONTROLE DO MODAL ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "review" | "success" | "error"
  >("review");
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState("");

  // Helper para imagem
  const getImageUrl = (path?: string) => {
    if (!path) return "";
    const cleanPath = path.replace(/\\/g, "/");
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${
      cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath
    }`;
  };

  useEffect(() => {
    // Inicializa com a data de hoje
    setSelectedDate(getTodayISO());

    professionalService.getAll().then(setProfessionals).catch(console.error);

    categoryService
      .findAll()
      .then((cats: any) => {
        const list = Array.isArray(cats)
          ? cats
          : cats.categories || cats.rows || [];
        const allServices: any[] = [];
        list.forEach((c: any) => {
          if (c.Services) allServices.push(...c.Services);
        });
        setServices(allServices);
      })
      .catch(console.error);
  }, []);

  const fetchAndFormatSlots = async (
    dateStr: string,
    profId: number,
    srvId: number
  ) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);

    const slots = await availabilityService.getAvailableSlots(
      profId,
      srvId,
      dateObj
    );

    return slots.map((slot: string) => {
      if (slot.includes("T")) {
        return format(parseISO(slot), "HH:mm");
      }
      return slot.substring(0, 5);
    });
  };

  const handleSearchCpf = async () => {
    if (cpfSearch.length < 14) {
      setErrorMsg("Por favor, digite um CPF válido.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setClientFound(null);

    try {
      const user = await profileService.searchClientByCpf(cpfSearch);
      setClientFound(user);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Cliente não encontrado.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = async (srv: any) => {
    setSelectedService(srv);
    setAvailableSlots([]);
    setSelectedTime("");

    if (selectedProfessional && selectedDate) {
      setLoading(true);
      try {
        let slots = await fetchAndFormatSlots(
          selectedDate,
          Number(selectedProfessional.id),
          Number(srv.id)
        );

        if (slots.length === 0 && selectedDate === getTodayISO()) {
          const tomorrow = getTomorrowISO();
          const slotsTomorrow = await fetchAndFormatSlots(
            tomorrow,
            Number(selectedProfessional.id),
            Number(srv.id)
          );

          if (slotsTomorrow.length > 0) {
            setSelectedDate(tomorrow);
            slots = slotsTomorrow;
          }
        }
        setAvailableSlots(slots);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (!selectedProfessional || !selectedService) return;

    setLoading(true);
    try {
      const slots = await fetchAndFormatSlots(
        date,
        Number(selectedProfessional.id),
        Number(selectedService.id)
      );
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = () => {
    if (
      !clientFound ||
      !selectedProfessional ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    )
      return;
    setModalStatus("review");
    setConfirmModalOpen(true);
  };

  const executeSchedule = async () => {
    setLoading(true);
    try {
      const fullDate = combineDateAndTime(selectedDate, selectedTime);

      await appointmentService.create(
        Number(selectedProfessional.id),
        Number(selectedService.id),
        fullDate,
        Number(clientFound.id)
      );

      setModalStatus("success");
    } catch (err: any) {
      setModalStatus("error");
      setModalFeedbackMsg(
        err.response?.data?.message || "Ocorreu um erro ao tentar agendar."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setConfirmModalOpen(false);
    router.push("/agenda");
  };

  return (
    <>
      <Head>
        <title>Agendar Cliente | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="py-5">
          <h1 className={styles.pageTitle}>
            Agendar <span>Cliente</span>
          </h1>

          {/* BUSCA */}
          <div className={styles.searchContainer}>
            <Label style={{ fontWeight: "600", color: "#666" }}>
              Buscar Cliente por CPF
            </Label>
            <div className={styles.inputGroup}>
              <Input
                value={cpfSearch}
                onChange={(e) => setCpfSearch(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={step > 0}
              />
              <button onClick={handleSearchCpf} disabled={step > 0 || loading}>
                {loading ? <Spinner size="sm" /> : <FiSearch />}
              </button>
            </div>
            {errorMsg && <p className="text-danger mt-2 small">{errorMsg}</p>}

            {clientFound && (
              <div className={styles.clientFoundCard}>
                {/* --- FOTO DO CLIENTE --- */}
                <div
                  className={styles.avatarPlaceholder}
                  style={{
                    overflow: "hidden",
                    padding: 0,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {clientFound.avatarUrl ? (
                    <img
                      src={getImageUrl(clientFound.avatarUrl)}
                      alt="Cliente"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <FiUser />
                  )}
                </div>

                <div className={styles.clientInfo}>
                  <h4>
                    {clientFound.firstName} {clientFound.lastName}
                  </h4>
                  <p>
                    <strong>CPF:</strong> {clientFound.cpf}
                  </p>
                </div>
                <div className="ms-auto">
                  {step === 0 ? (
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => setStep(1)}
                    >
                      Selecionar
                    </Button>
                  ) : (
                    <Button
                      color="secondary"
                      outline
                      size="sm"
                      onClick={() => {
                        setStep(0);
                        setClientFound(null);
                        setCpfSearch("");
                      }}
                    >
                      Trocar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SELEÇÃO E AGENDAMENTO (WIZARD) */}
          {step >= 1 && (
            <>
              <Row>
                <Col md={6} className="mb-4">
                  <div className={styles.stepContainer}>
                    <h3 className={styles.stepTitle}>
                      <FiUser /> Profissional
                    </h3>
                    <div className={styles.selectionGrid}>
                      {professionals.map((prof) => (
                        <div
                          key={prof.id}
                          className={`${styles.selectionCard} ${
                            selectedProfessional?.id === prof.id
                              ? styles.active
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedProfessional(prof);
                            setAvailableSlots([]);
                            setSelectedService(null);
                          }}
                        >
                          <h5>{prof.firstName}</h5>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-4">
                  <div className={styles.stepContainer}>
                    <h3 className={styles.stepTitle}>
                      <FiCheckCircle /> Serviço
                    </h3>
                    <div className={styles.selectionGrid}>
                      {services
                        .filter(
                          (srv) =>
                            selectedProfessional &&
                            (srv.professionalId === selectedProfessional.id ||
                              !srv.professionalId)
                        )
                        .map((srv) => (
                          <div
                            key={srv.id}
                            className={`${styles.selectionCard} ${
                              selectedService?.id === srv.id
                                ? styles.active
                                : ""
                            }`}
                            onClick={() => handleSelectService(srv)}
                          >
                            <h5>{srv.name}</h5>
                            <span>
                              {srv.duration} min - R$ {srv.price}
                            </span>
                          </div>
                        ))}
                      {selectedProfessional &&
                        services.filter(
                          (srv) =>
                            srv.professionalId === selectedProfessional.id
                        ).length === 0 && (
                          <p className="text-muted small text-center w-100 mt-3">
                            Nenhum serviço disponível.
                          </p>
                        )}
                    </div>
                  </div>
                </Col>
              </Row>

              {selectedProfessional && selectedService && (
                <div className={`${styles.stepContainer} mt-2`}>
                  <h3 className={styles.stepTitle}>
                    <FiCalendar /> Data e Horário
                  </h3>
                  <Row>
                    <Col md={4} className="mb-3">
                      <FormGroup>
                        <Label style={{ fontWeight: "600", color: "#666" }}>
                          Selecione o Dia
                        </Label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          style={{ padding: "10px" }}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={8}>
                      <Label style={{ fontWeight: "600", color: "#666" }}>
                        Horários Disponíveis
                      </Label>
                      {loading ? (
                        <div className="py-3">
                          <Spinner color="secondary" size="sm" /> Buscando...
                        </div>
                      ) : (
                        <div className={styles.timeSlotsGrid}>
                          {availableSlots.length > 0 ? (
                            availableSlots.map((time) => (
                              <div
                                key={time}
                                className={`${styles.timeSlot} ${
                                  selectedTime === time ? styles.selected : ""
                                }`}
                                onClick={() => setSelectedTime(time)}
                              >
                                {time}
                              </div>
                            ))
                          ) : (
                            <p className="text-muted small">
                              {selectedDate === getTodayISO()
                                ? "Sem vagas hoje. Tente outra data."
                                : "Nenhum horário livre."}
                            </p>
                          )}
                        </div>
                      )}
                    </Col>
                  </Row>

                  {selectedTime && (
                    <div className={styles.summaryBox}>
                      <p>Tudo pronto para agendar.</p>
                      <button
                        className={styles.btnPrimary}
                        onClick={handleOpenConfirm}
                        disabled={loading}
                      >
                        REVISAR E CONFIRMAR
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
        <Footer />
        <MenuMobile />

        {/* --- MODAL INTELIGENTE (REVISÃO / SUCESSO / ERRO) --- */}
        <Modal
          isOpen={confirmModalOpen}
          toggle={() =>
            modalStatus === "success"
              ? handleCloseSuccess()
              : setConfirmModalOpen(false)
          }
          centered
          backdrop="static"
        >
          <ModalHeader
            toggle={() =>
              modalStatus === "success"
                ? handleCloseSuccess()
                : setConfirmModalOpen(false)
            }
            className="text-center"
            style={{ borderBottom: "none" }}
          >
            {modalStatus === "review" && "Confirmar Agendamento 📅"}
            {modalStatus === "success" && (
              <span className="text-success">Sucesso! 🎉</span>
            )}
            {modalStatus === "error" && (
              <span className="text-danger">Atenção ⚠️</span>
            )}
          </ModalHeader>

          <ModalBody>
            {modalStatus === "review" && (
              <div className="text-center py-2">
                <p className="text-muted mb-4">
                  Confira os dados antes de finalizar:
                </p>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  {/* --- BLOC DO CLIENTE COM FOTO --- */}
                  <div
                    className="d-flex align-items-center mb-3 p-2 rounded"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #eee",
                    }}
                  >
                    <div style={{ marginRight: "10px", flexShrink: 0 }}>
                      {clientFound?.avatarUrl ? (
                        <img
                          src={getImageUrl(clientFound.avatarUrl)}
                          alt="Cliente"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "#eee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FiUser size={20} color="#777" />
                        </div>
                      )}
                    </div>
                    <div>
                      <small
                        className="text-muted d-block"
                        style={{ lineHeight: 1 }}
                      >
                        Cliente
                      </small>
                      <strong style={{ color: "#333" }}>
                        {clientFound?.firstName} {clientFound?.lastName}
                      </strong>
                    </div>
                  </div>

                  <p className="mb-2">
                    💇‍♀️ <strong>Profissional:</strong>{" "}
                    {selectedProfessional?.firstName}
                  </p>
                  <p className="mb-2">
                    💅 <strong>Serviço:</strong> {selectedService?.name}
                  </p>
                  <hr style={{ borderColor: "#eaeaea" }} />
                  <p
                    className="mb-0 text-center"
                    style={{
                      fontSize: "1.2rem",
                      color: "#d48498",
                      fontWeight: "bold",
                    }}
                  >
                    {formatDateDisplay(selectedDate)} às {selectedTime}
                  </p>
                </div>
              </div>
            )}

            {modalStatus === "success" && (
              <div className="text-center py-4">
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>✅</div>
                <h4 style={{ fontWeight: "bold", color: "#28a745" }}>
                  Agendado com Sucesso!
                </h4>
                <p className="text-muted">
                  O horário foi reservado na agenda do profissional.
                </p>
              </div>
            )}

            {modalStatus === "error" && (
              <div className="text-center py-4">
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>❌</div>
                <h4 style={{ fontWeight: "bold", color: "#dc3545" }}>
                  Erro ao Agendar
                </h4>
                <p className="text-muted">{modalFeedbackMsg}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="justify-content-center border-0 pb-4">
            {modalStatus === "review" && (
              <>
                <Button
                  color="secondary"
                  outline
                  onClick={() => setConfirmModalOpen(false)}
                  style={{ minWidth: "100px" }}
                >
                  Voltar
                </Button>
                <Button
                  color="success"
                  onClick={executeSchedule}
                  style={{ minWidth: "140px", fontWeight: "bold" }}
                >
                  {loading ? <Spinner size="sm" /> : "CONFIRMAR"}
                </Button>
              </>
            )}

            {modalStatus === "success" && (
              <Button
                color="primary"
                onClick={handleCloseSuccess}
                style={{ minWidth: "150px", borderRadius: "25px" }}
              >
                Fechar e Ir para Agenda
              </Button>
            )}

            {modalStatus === "error" && (
              <Button
                color="secondary"
                onClick={() => setModalStatus("review")}
                style={{ minWidth: "120px" }}
              >
                Tentar Novamente
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </main>
    </>
  );
}
