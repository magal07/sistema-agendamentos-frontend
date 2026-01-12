// src/components/dashboard/ProfessionalAgenda.tsx
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
import ToastComponent from "../common/toast";

export default function ProfessionalAgenda() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais e Seleção
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Estados para o Modal de Conclusão
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Estado do Toast (Igual ao book.tsx)
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning">(
    "success"
  );

  const showToast = (type: "success" | "error" | "warning", msg: string) => {
    setToastType(type);
    setToastMessage(msg);
    setToastIsOpen(true);
    setTimeout(() => setToastIsOpen(false), 3000);
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const loadAgenda = async () => {
    setLoading(true);
    try {
      // Usa api direta ou appointmentService.getAll se tiver suporte a sem params
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- AÇÃO: CANCELAR ---
  const handleCancel = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar?")) return;

    try {
      // Chama o serviço de delete via API direta para pegar o retorno customizado
      const res = await api.delete(`/appointments/${id}`);

      // Verifica se o backend devolveu o alerta de "Cancelamento Tardio"
      if (res.data && res.data.type === "warning") {
        showToast("warning", res.data.message);
      } else {
        showToast("success", "Agendamento cancelado!");
        loadAgenda();
      }
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Erro ao cancelar");
    }
  };

  // --- AÇÃO: PREPARAR CONCLUSÃO ---
  const openCompleteModal = (appt: any) => {
    setSelectedAppt(appt);
    // Preenche inputs com data/hora original
    const dt = parseISO(appt.appointmentDate);
    setNewDate(format(dt, "yyyy-MM-dd"));
    setNewTime(format(dt, "HH:mm"));
    setModalComplete(true);
  };

  // --- AÇÃO: CONFIRMAR CONCLUSÃO ---
  const handleComplete = async () => {
    if (!selectedAppt) return;

    try {
      const finalDate = parseISO(`${newDate}T${newTime}:00`);

      await appointmentService.complete(selectedAppt.id, finalDate);

      showToast("success", "Serviço finalizado! Comissão gerada. 💰");
      setModalComplete(false);
      loadAgenda();
    } catch (error: any) {
      showToast("error", "Erro ao finalizar.");
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
                            title="Finalizar Serviço"
                          >
                            ✅
                          </Button>

                          <Button
                            size="sm"
                            color="danger"
                            onClick={() => handleCancel(appt.id)}
                            title="Cancelar Agendamento"
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

      {/* MODAL DE CONCLUSÃO */}
      <Modal
        isOpen={modalComplete}
        toggle={() => setModalComplete(!modalComplete)}
      >
        <ModalHeader>Finalizar Serviço</ModalHeader>
        <ModalBody>
          <p>O serviço foi realizado no horário agendado?</p>
          <p className="small text-muted">
            Se houve atraso ou adiantamento, ajuste abaixo para o relatório
            ficar correto.
          </p>
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
            Confirmar Finalização
          </Button>
        </ModalFooter>
      </Modal>

      <ToastComponent
        isOpen={toastIsOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  );
}
