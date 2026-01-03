import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Table, Badge } from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import api from "../src/services/api";
import { format } from "date-fns";
import styles from "../styles/profile.module.scss";

export default function Schedule() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/appointments/schedule").then((res) => {
      setAppointments(res.data);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Minha Agenda - Barbeiro</title>
      </Head>
      <main className={styles.main}>
        <HeaderAuth />
        <Container className="py-5">
          <h2 className="text-white mb-4">Minha Agenda ✂️</h2>
          <Table dark striped hover responsive>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    {format(new Date(appt.appointmentDate), "dd/MM - HH:mm")}
                  </td>
                  <td>{appt.client?.firstName}</td>
                  <td>{appt.client?.phone}</td>
                  <td>
                    <Badge
                      color={
                        appt.status === "confirmed" ? "success" : "warning"
                      }
                    >
                      {appt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>
      </main>
    </>
  );
}
