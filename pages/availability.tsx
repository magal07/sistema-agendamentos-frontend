import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Spinner,
} from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import styles from "../styles/agenda.module.scss";
import availabilityService from "../src/services/availabilityService";
import profileService from "../src/services/profileService"; // IMPORTANTE
import { useRouter } from "next/router";
import MenuMobile from "../src/components/common/menuMobile";

const DAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
];

export default function AvailabilityPage() {
  const router = useRouter();

  // O segredo está aqui: começamos carregando e só paramos se for autorizado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<
    {
      dayOfWeek: number;
      active: boolean;
      startTime: string;
      endTime: string;
    }[]
  >([]);

  useEffect(() => {
    const init = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // 1. Verifica QUEM é o usuário
        const user = await profileService.fetchCurrent();

        // 2. SE FOR CLIENTE -> CHUTA PRA FORA IMEDIATAMENTE
        if (user.role === "client") {
          router.replace("/agenda"); // Use replace para não deixar voltar
          return; // PARA AQUI. O loading continua true, então ele não vê nada.
        }

        // 3. SE FOR PROFISSIONAL/ADMIN -> CARREGA OS DADOS
        const data = await availabilityService.getMyAvailability();

        const initialSchedule = DAYS.map((day) => {
          const found = data.find((d: any) => d.dayOfWeek === day.id);
          return {
            dayOfWeek: day.id,
            active: !!found,
            startTime: found?.startTime || "08:00",
            endTime: found?.endTime || "18:00",
          };
        });

        setSchedule(initialSchedule);

        // 4. SÓ AGORA LIBERA A TELA
        setLoading(false);
      } catch (error) {
        console.error(error);
        router.push("/login");
      }
    };

    init();
  }, [router]);

  const handleChange = (index: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    // @ts-ignore
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = schedule
        .filter((day) => day.active)
        .map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        }));

      await availabilityService.saveAvailability(toSave);
      alert("Horários salvos com sucesso!");
      router.push("/agenda");
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // --- O PORTEIRO ---
  // Enquanto estiver carregando ou verificando permissão,
  // retorna APENAS o spinner. O conteúdo HTML abaixo nunca é montado para o cliente.
  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner color="dark" />
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Meus Horários | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          <div className={styles.headerSection}>
            <h2 className={styles.title}>Configurar Horários ⏰</h2>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
            }}
          >
            <p className="text-muted mb-4">
              Selecione os dias que você atende e o horário de início e fim.
            </p>

            <Form>
              {schedule.map((day, index) => (
                <div key={day.dayOfWeek} className="mb-3 pb-3 border-bottom">
                  <Row className="align-items-center">
                    <Col xs="12" md="4">
                      <FormGroup check>
                        <Label
                          check
                          style={{
                            fontWeight: day.active ? "bold" : "normal",
                            fontSize: "1.1rem",
                            color: "#333",
                          }}
                        >
                          <Input
                            type="checkbox"
                            checked={day.active}
                            onChange={(e) =>
                              handleChange(index, "active", e.target.checked)
                            }
                          />{" "}
                          {DAYS[day.dayOfWeek].name}
                        </Label>
                      </FormGroup>
                    </Col>

                    {day.active && (
                      <>
                        <Col xs="5" md="3">
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              handleChange(index, "startTime", e.target.value)
                            }
                          />
                        </Col>
                        <Col
                          xs="2"
                          md="1"
                          className="text-center"
                          style={{ color: "#555" }}
                        >
                          às
                        </Col>
                        <Col xs="5" md="3">
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              handleChange(index, "endTime", e.target.value)
                            }
                          />
                        </Col>
                      </>
                    )}
                  </Row>
                </div>
              ))}

              <div className="d-flex justify-content-end mt-4">
                <Button
                  color="secondary"
                  outline
                  className="me-3"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  style={{ backgroundColor: "#d48498", border: "none" }}
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner size="sm" /> : "Salvar Configurações"}
                </Button>
              </div>
            </Form>
          </div>
        </Container>
        <MenuMobile />
      </main>
    </>
  );
}
