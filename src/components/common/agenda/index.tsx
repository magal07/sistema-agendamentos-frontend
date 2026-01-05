import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/locale/pt-br";
import { appointmentService } from "../../../services/appointmentService";
import profileService from "../../../services/profileService";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import styles from "./styles.module.scss";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const AgendaComponent = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>("");

  // --- CONFIGURAÇÃO VISUAL: LIMITES DE HORÁRIO (06:00 às 22:00) ---
  const minTime = new Date();
  minTime.setHours(6, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(22, 0, 0);
  // ----------------------------------------------------------------

  // 1. Descobrir quem é o usuário
  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      if (user.role) setUserRole(user.role);
    });
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const start = moment(date).startOf("month").subtract(1, "month").format();
      const end = moment(date).endOf("month").add(1, "month").format();

      // Busca no backend (agora filtrando Admin, Profissional ou Cliente lá no controller)
      const data = await appointmentService.getAll({ start, end });

      const formattedEvents = data.map((appt: any) => {
        // LÓGICA DO TÍTULO:
        // Cliente vê: Serviço + Profissional
        // Profissional/Admin vê: Cliente + Serviço
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
    // Cliente não arrasta
    if (userRole === "client") return;

    const originalEvents = [...events];
    const updatedEvents = events.map((evt) =>
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    setEvents(updatedEvents);

    try {
      await appointmentService.reschedule(event.id, { start, end });
    } catch (error) {
      alert("Erro ao reagendar: " + (error as any).message); // Mostra erro do backend (ex: horário indisponível)
      setEvents(originalEvents);
    }
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
    let backgroundColor = "#b06075"; // Rosa

    if (status === "confirmed") backgroundColor = "#28a745"; // Verde
    if (status === "cancelled") backgroundColor = "#dc3545"; // Vermelho

    if (view === Views.MONTH) {
      return { className: styles.eventBlockMonth, style: {} };
    }

    return {
      className: styles.eventBlockTime,
      style: { backgroundColor },
    };
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
        // --- LIMITES VISUAIS APLICADOS AQUI ---
        min={minTime}
        max={maxTime}
        // --------------------------------------

        draggableAccessor={() => userRole !== "client"}
        components={{ event: CustomEvent }}
        step={30}
        timeslots={2}
        selectable={userRole !== "client"}
        resizable={userRole !== "client"}
        onEventDrop={onEventDrop}
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
    </div>
  );
};

export default AgendaComponent;
