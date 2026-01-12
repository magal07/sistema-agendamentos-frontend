import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "reactstrap";
import { format, parseISO } from "date-fns";
import api from "../../services/api";
import { appointmentService } from "../../services/appointmentService";
import styles from "./styles.module.scss"; // Importando o CSS

export default function ProfessionalAgenda() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais de Ação
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Estados para Conclusão
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // --- 1. ESTADO DO MODAL GLOBAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const showAlert = (
    type: "success" | "warning" | "alert",
    title: string,
    msg: string
  ) => {
    setModal({ isOpen: true, type, title, message: msg, confirmAction: null });
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const loadAgenda = async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LÓGICA DE CANCELAMENTO ---
  const executeCancel = async (id: number) => {
    try {
      const res = await api.delete(`/appointments/${id}`);

      if (res.data && res.data.type === "warning") {
        showAlert("warning", "Aviso", res.data.message);
      } else {
        showAlert("success", "Sucesso", "Agendamento cancelado!");
        loadAgenda();
      }
    } catch (error: any) {
      showAlert(
        "alert",
        "Erro",
        error.response?.data?.message || "Erro ao cancelar"
      );
    }
  };

  const handleCancelClick = (id: number) => {
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: "Tem certeza que deseja cancelar este agendamento?",
      type: "confirm",
      confirmAction: () => executeCancel(id),
    });
  };

  // --- LÓGICA DE CONCLUSÃO ---
  const openCompleteModal = (appt: any) => {
    setSelectedAppt(appt);
    const dt = parseISO(appt.appointmentDate);
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
      showAlert(
        "success",
        "Serviço Realizado",
        "Comissão gerada com sucesso! 💰"
      );
      loadAgenda();
    } catch (error: any) {
      showAlert("alert", "Erro", "Erro ao finalizar serviço.");
    }
  };

  return (
    <div className="py-4">
      {/* HEADER: Título e Botão Ver Calendário alinhados */}
      <div className={styles.headerContainer}>
        <h4 className="mb-0">Painel de Controle 🛠️</h4>
        <Button
          className={styles.btnCalendar}
          outline
          onClick={() => (window.location.href = "/agenda")}
        >
          📅 Ver Calendário
        </Button>
      </div>

      {loading ? (
        <p className="text-center">Carregando agenda...</p>
      ) : (
        <div className="table-responsive">
          {/* Adicionada a classe responsiveTable do CSS module */}
          <Table hover className={`align-middle ${styles.responsiveTable}`}>
            <thead className="table-dark">
              <tr>
                <th>Horário</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr
                  key={appt.id}
                  style={{ opacity: appt.status === "cancelled" ? 0.5 : 1 }}
                >
                  {/* data-label é usado pelo CSS no mobile */}
                  <td data-label="Horário">
                    <div>
                      <strong>
                        {format(parseISO(appt.appointmentDate), "dd/MM")}
                      </strong>
                      <br className={styles.hideMobile} />{" "}
                      {format(parseISO(appt.appointmentDate), "HH:mm")}
                    </div>
                  </td>

                  <td data-label="Cliente">
                    <div>
                      {appt.client?.firstName || "Cliente"}
                      <br className={styles.hideMobile} />{" "}
                      <small className="text-muted">{appt.client?.phone}</small>
                    </div>
                  </td>

                  <td data-label="Serviço">
                    {appt.Service?.name || appt.service?.name || "Serviço"}
                  </td>

                  <td data-label="Status">
                    {appt.status === "confirmed" && (
                      <Badge color="primary">Confirmado</Badge>
                    )}
                    {appt.status === "completed" && (
                      <Badge color="success">Realizado</Badge>
                    )}
                    {appt.status === "cancelled" && (
                      <Badge color="danger">Cancelado</Badge>
                    )}
                  </td>

                  <td className="text-end" data-label="Ações">
                    {appt.status !== "cancelled" &&
                      appt.status !== "completed" && (
                        <div className={styles.actionsGroup}>
                          <Button
                            size="sm"
                            color="success"
                            className="me-1"
                            onClick={() => openCompleteModal(appt)}
                            title="Finalizar"
                          >
                            ✅
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            onClick={() => handleCancelClick(appt.id)}
                            title="Cancelar"
                          >
                            🗑️
                          </Button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

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
          <Button color="success" onClick={handleComplete}>
            Confirmar
          </Button>
        </ModalFooter>
      </Modal>

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
    </div>
  );
}
