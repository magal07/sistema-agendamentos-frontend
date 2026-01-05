import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/locale/pt-br";
import { appointmentService } from "../../../services/appointmentService";
import profileService from "../../../services/profileService"; // Importe o ProfileService
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import styles from "./styles.module.scss";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const AgendaComponent = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>(Views.WEEK); // Cliente geralmente prefere ver Mês ou Lista, mas Semana é ok
  const [date, setDate] = useState(new Date());
  const [userRole, setUserRole] = useState<string>(""); // Para saber quem está vendo

  // 1. Descobrir quem é o usuário para configurar a visualização
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
        // LÓGICA DO TÍTULO:
        // Se sou cliente, quero ver o Profissional e o Serviço
        // Se sou Profissional/Admin, quero ver o Cliente e o Serviço
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
  }, [date, userRole]); // Recarrega se o role mudar

  useEffect(() => {
    if (userRole) {
      // Só busca quando soubermos quem é o usuário
      fetchAppointments();
    }
  }, [fetchAppointments, userRole]);

  const onEventDrop = async ({ event, start, end }: any) => {
    // SEGURANÇA VISUAL: Cliente não pode arrastar
    if (userRole === "client") return;

    const originalEvents = [...events];
    const updatedEvents = events.map((evt) =>
      evt.id === event.id ? { ...evt, start, end } : evt
    );
    setEvents(updatedEvents);

    try {
      await appointmentService.reschedule(event.id, { start, end });
    } catch (error) {
      alert("Erro ao reagendar.");
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
        // BLOQUEIA ARRASTAR SE FOR CLIENTE
        draggableAccessor={() => userRole !== "client"}
        components={{ event: CustomEvent }}
        step={30}
        timeslots={2}
        selectable={userRole !== "client"} // Cliente não clica para criar (por enquanto)
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
