import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/locale/pt-br";
import { appointmentService } from "../../../services/appointmentService";
import profileService from "../../../services/profileService";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
// Importando componentes do Reactstrap para o Modal
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
} from "reactstrap";
import styles from "./styles.module.scss";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const AgendaComponent = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>("");

  // --- ESTADOS DO MODAL ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // --- CONFIGURAÇÃO VISUAL ---
  const minTime = new Date();
  minTime.setHours(6, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(22, 0, 0);

  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      if (user.role) setUserRole(user.role);
    });
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const start = moment(date).startOf("month").subtract(1, "month").format();
      const end = moment(date).endOf("month").add(1, "month").format();

      const data = await appointmentService.getAll({ start, end });

      const formattedEvents = data.map((appt: any) => {
        let title = "Agendamento";
        if (userRole === "client") {
          title = `${appt.Service?.name} (com ${
            appt.professional?.firstName || "Profissional"
          })`;
        } else {
          title = `${appt.client?.firstName} (${appt.Service?.name})`;
        }

        return {
          id: appt.id,
          title: title,
          start: new Date(appt.appointmentDate),
          end: new Date(
            appt.endDate || moment(appt.appointmentDate).add(1, "hour").toDate()
          ),
          resource: appt,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    }
  }, [date, userRole]);

  useEffect(() => {
    if (userRole) {
      fetchAppointments();
    }
  }, [fetchAppointments, userRole]);

  const onEventDrop = async ({ event, start, end }: any) => {
    if (userRole === "client") return;

    const originalEvents = [...events];
    const updatedEvents = events.map((evt) =>
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    setEvents(updatedEvents);

    try {
      await appointmentService.reschedule(event.id, { start, end });
    } catch (error) {
      alert("Erro ao reagendar: " + (error as any).message);
      setEvents(originalEvents);
    }
  };

  // --- NOVO: FUNÇÃO PARA ABRIR O MODAL ---
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) setSelectedEvent(null); // Limpa ao fechar
  };

  const CustomEvent = ({ event }: any) => {
    if (view === Views.MONTH) {
      return (
        <div title={event.title} className={styles.monthEvent}>
          <span className={styles.monthIcon}>🌸</span>
          <span className={styles.monthText}>{event.title}</span>
        </div>
      );
    }
    // Mobile: Mesmo que o texto corte, o usuário sabe que pode clicar
    return (
      <div className={styles.timeEvent}>
        <strong>{event.title}</strong>
      </div>
    );
  };

  const eventPropGetter = (event: any) => {
    const status = event.resource?.status;
    let backgroundColor = "#b06075";

    if (status === "confirmed") backgroundColor = "#28a745";
    if (status === "cancelled") backgroundColor = "#dc3545";

    if (view === Views.MONTH) {
      return { className: styles.eventBlockMonth, style: {} };
    }

    return {
      className: styles.eventBlockTime,
      style: { backgroundColor },
    };
  };

  // Helper para cor do status no Modal
  const getStatusBadge = (status: string) => {
    if (status === "confirmed")
      return <Badge color="success">Confirmado</Badge>;
    if (status === "cancelled") return <Badge color="danger">Cancelado</Badge>;
    return <Badge color="warning">Pendente</Badge>;
  };

  return (
    <div className={styles.calendarContainer}>
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor={(event: any) => event.start}
        endAccessor={(event: any) => event.end}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        min={minTime}
        max={maxTime}
        draggableAccessor={() => userRole !== "client"}
        components={{ event: CustomEvent }}
        step={30}
        timeslots={2}
        selectable={true}
        resizable={userRole !== "client"}
        onEventDrop={onEventDrop}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Lista",
          date: "Data",
          time: "Hora",
          event: "Evento",
          showMore: (total) => `+${total} mais`,
        }}
      />

      {/* --- MODAL DE DETALHES --- */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="sm">
        <ModalHeader toggle={toggleModal}>
          Detalhes do Agendamento 🌸
        </ModalHeader>
        <ModalBody>
          {selectedEvent && (
            <div className="d-flex flex-column gap-2">
              <div>
                <strong>Serviço:</strong> <br />
                {selectedEvent.resource?.Service?.name}
              </div>

              <hr className="my-2" />

              <div>
                <strong>Data:</strong> <br />
                {moment(selectedEvent.start).format("dddd, D [de] MMMM")}
              </div>

              <div>
                <strong>Horário:</strong> <br />
                {moment(selectedEvent.start).format("HH:mm")} às{" "}
                {moment(selectedEvent.end).format("HH:mm")}
              </div>

              <hr className="my-2" />

              {/* Se for Admin/Profissional mostra o cliente, se for Cliente mostra o Profissional */}
              {userRole === "client" ? (
                <div>
                  <strong>Profissional:</strong> <br />
                  {selectedEvent.resource?.professional?.firstName ||
                    "Não informado"}
                </div>
              ) : (
                <div>
                  <strong>Cliente:</strong> <br />
                  {selectedEvent.resource?.client?.firstName}{" "}
                  {selectedEvent.resource?.client?.lastName}
                </div>
              )}

              <div className="mt-3 text-center">
                {getStatusBadge(selectedEvent.resource?.status)}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AgendaComponent;
