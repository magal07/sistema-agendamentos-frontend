import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  FormGroup,
  Label,
} from "reactstrap";
import { format, parseISO } from "date-fns";
import api from "../../../src/services/api";
import { appointmentService } from "../../../src/services/appointmentService";
import { professionalService } from "../../../src/services/professionalService";
import profileService from "../../../src/services/profileService";
import styles from "./styles.module.scss";

interface ProfessionalAgendaProps {
  professionalId?: number | null;
}

export default function ProfessionalAgenda({
  professionalId: initialProfId,
}: ProfessionalAgendaProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Estados para o Filtro de Admin
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<number | null>(
    initialProfId || null
  );

  // Modais e Estados de Conclusão
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert" as "alert" | "confirm" | "success" | "warning",
    confirmAction: null as null | (() => Promise<void>),
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // 1. Carrega dados iniciais (Role e Lista de Profissionais se for Admin)
  useEffect(() => {
    const fetchInitialInfo = async () => {
      const user = await profileService.fetchCurrent();
      setUserRole(user.role);

      if (user.role === "admin" || user.role === "company_admin") {
        const profs = await professionalService.getAll();
        setProfessionals(profs);
        // Se não veio um ID por prop, seleciona o primeiro da lista para não vir vazio
        if (!selectedProfId && profs.length > 0) {
          setSelectedProfId(profs[0].id);
        }
      }
    };
    fetchInitialInfo();
  }, []);

  // 2. Função de carregamento da agenda (Memoizada para evitar loops)
  const loadAgenda = useCallback(async () => {
    setLoading(true);
    try {
      // Importante: Se for admin, usamos o selectedProfId do filtro local ou da prop
      const idToFilter = selectedProfId;

      const url = idToFilter
        ? `/appointments?professionalId=${idToFilter}`
        : "/appointments";

      const res = await api.get(url);
      setAppointments(res.data);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProfId]);

  useEffect(() => {
    // Só carrega se tivermos a role definida ou se for profissional (que não precisa de ID no filtro)
    if (userRole === "professional" || selectedProfId) {
      loadAgenda();
    }
  }, [loadAgenda, userRole, selectedProfId]);

  const handleCancelClick = (id: number) => {
    setModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: "Tem certeza que deseja cancelar este agendamento?",
      type: "confirm",
      confirmAction: async () => {
        try {
          await api.delete(`/appointments/${id}`);
          setModal({
            isOpen: true,
            title: "Sucesso",
            message: "Cancelado!",
            type: "success",
            confirmAction: null,
          });
          loadAgenda();
        } catch (err: any) {
          setModal({
            isOpen: true,
            title: "Erro",
            message: "Erro ao cancelar",
            type: "alert",
            confirmAction: null,
          });
        }
      },
    });
  };

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
      loadAgenda();
    } catch (error) {
      alert("Erro ao finalizar serviço.");
    }
  };

  return (
    <div className="py-4">
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

      {/* FILTRO DE PROFISSIONAL (Aparece apenas para ADMIN/COMPANY_ADMIN) */}
      {(userRole === "admin" || userRole === "company_admin") && (
        <div className="mt-4 p-3 bg-white rounded shadow-sm border">
          <FormGroup className="mb-0" style={{ maxWidth: "400px" }}>
            <Label className="fw-bold">
              Selecionar Profissional para Gestão:
            </Label>
            <Input
              type="select"
              value={selectedProfId || ""}
              onChange={(e) => setSelectedProfId(Number(e.target.value))}
            >
              <option value="">Selecione para ver a agenda...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </Input>
          </FormGroup>
        </div>
      )}

      {loading ? (
        <p className="text-center mt-5">Carregando agendamentos...</p>
      ) : (
        <div className="table-responsive mt-4">
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
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    style={{ opacity: appt.status === "cancelled" ? 0.5 : 1 }}
                  >
                    <td data-label="Horário">
                      <strong>
                        {format(parseISO(appt.appointmentDate), "dd/MM")}
                      </strong>
                      <br />
                      {format(parseISO(appt.appointmentDate), "HH:mm")}
                    </td>
                    <td data-label="Cliente">
                      {appt.client?.firstName} {appt.client?.lastName}
                      <br />
                      <small className="text-muted">{appt.client?.phone}</small>
                    </td>
                    <td data-label="Serviço">{appt.Service?.name}</td>
                    <td data-label="Status">
                      <Badge
                        color={
                          appt.status === "confirmed"
                            ? "primary"
                            : appt.status === "completed"
                            ? "success"
                            : "danger"
                        }
                      >
                        {appt.status === "confirmed"
                          ? "Confirmado"
                          : appt.status === "completed"
                          ? "Realizado"
                          : "Cancelado"}
                      </Badge>
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
                            >
                              ✅
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              onClick={() => handleCancelClick(appt.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    Nenhum agendamento encontrado para este profissional.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modais omitidos para brevidade, mantenha os que você já tem no arquivo */}
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

      <Modal isOpen={modal.isOpen} toggle={closeModal} centered>
        <ModalHeader
          toggle={closeModal}
          className={modal.type === "success" ? "text-success" : "text-danger"}
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
