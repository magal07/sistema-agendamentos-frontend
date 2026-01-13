import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/locale/pt-br";
import { appointmentService } from "../../../services/appointmentService";
import profileService from "../../../services/profileService";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
} from "reactstrap";
import styles from "./styles.module.scss";
import CustomToolbar from "../customToolbar";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

interface AgendaProps {
  professionalId?: number | null;
}

const customFormats = {
  dayFormat: (date: Date, culture: any, localizer: any) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return localizer.format(date, "DD", culture);
    }
    return localizer.format(date, "DD ddd", culture);
  },
};

const AgendaComponent = ({ professionalId }: AgendaProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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

      // Aqui o professionalId é enviado para o service
      const data = await appointmentService.getAll({
        start,
        end,
        professionalId: professionalId ?? undefined,
      });

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
  }, [date, userRole, professionalId]); // Recarrega se o profissional selecionado mudar

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

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) setSelectedEvent(null);
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
    return (
      <div className={styles.timeEvent}>
        <strong>{event.title}</strong>
      </div>
    );
  };

  const eventPropGetter = (event: any) => {
    const status = event.resource?.status;
    let backgroundColor = "#b06075";
    if (status === "completed") backgroundColor = "#28a745";
    if (status === "cancelled") backgroundColor = "#dc3545";
    return {
      className:
        view === Views.MONTH ? styles.eventBlockMonth : styles.eventBlockTime,
      style: { backgroundColor },
    };
  };

  const { components } = useMemo(
    () => ({
      components: { event: CustomEvent, toolbar: CustomToolbar },
    }),
    [view]
  );

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
        components={components}
        formats={customFormats}
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
          showMore: (total) => `+${total} mais`,
        }}
      />

      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="sm">
        <ModalHeader toggle={toggleModal}>Detalhes 🌸</ModalHeader>
        <ModalBody>
          {selectedEvent && (
            <div className="d-flex flex-column gap-2">
              <div>
                <strong>Serviço:</strong>{" "}
                {selectedEvent.resource?.Service?.name}
              </div>
              <div>
                <strong>Data:</strong>{" "}
                {moment(selectedEvent.start).format("DD/MM/YYYY")}
              </div>
              <div>
                <strong>Horário:</strong>{" "}
                {moment(selectedEvent.start).format("HH:mm")} às{" "}
                {moment(selectedEvent.end).format("HH:mm")}
              </div>
              <hr />
              {userRole === "client" ? (
                <div>
                  <strong>Profissional:</strong>{" "}
                  {selectedEvent.resource?.professional?.firstName}
                </div>
              ) : (
                <div>
                  <strong>Cliente:</strong>{" "}
                  {selectedEvent.resource?.client?.firstName}{" "}
                  {selectedEvent.resource?.client?.lastName}
                </div>
              )}
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
