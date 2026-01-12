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

export default function ProfessionalAgenda() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais de Ação
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Estados para Conclusão
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // --- 1. ESTADO DO MODAL GLOBAL (Substituindo o Toast simples para alertas maiores) ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // Helper para abrir o modal de alerta/sucesso
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

  // --- 2. LÓGICA DE CANCELAMENTO (Professional) ---
  const executeCancel = async (id: number) => {
    try {
      const res = await api.delete(`/appointments/${id}`);

      // Verifica Warning
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
      <h4 className="mb-4">Painel de Controle 🛠️</h4>

      {loading ? (
        <p>Carregando agenda...</p>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle">
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
                  <td>
                    <strong>
                      {format(parseISO(appt.appointmentDate), "dd/MM")}
                    </strong>{" "}
                    <br />
                    {format(parseISO(appt.appointmentDate), "HH:mm")}
                  </td>
                  <td>
                    {appt.client?.firstName || "Cliente"} <br />
                    <small className="text-muted">{appt.client?.phone}</small>
                  </td>
                  <td>
                    {appt.Service?.name || appt.service?.name || "Serviço"}
                  </td>
                  <td>
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
                  <td className="text-end">
                    {appt.status !== "cancelled" &&
                      appt.status !== "completed" && (
                        <>
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
                        </>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* MODAL DE CONCLUSÃO (ESPECÍFICO DESTA TELA) */}
      <Modal
        isOpen={modalComplete}
        toggle={() => setModalComplete(!modalComplete)}
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

      {/* 3. MODAL GLOBAL DE AVISOS/CONFIRMAÇÃO */}
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
