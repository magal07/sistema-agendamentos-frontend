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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import styles from "../styles/agenda.module.scss";
import availabilityService from "../src/services/availabilityService";
import profileService from "../src/services/profileService";
import { professionalService } from "../src/services/professionalService";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [schedule, setSchedule] = useState<any[]>([]);

  const fetchAvailabilityData = async (profId?: number) => {
    setLoading(true);
    try {
      const data = profId
        ? await availabilityService.getByProfessionalId(profId)
        : await availabilityService.getMyAvailability();

      const initialSchedule = DAYS.map((day) => {
        const found = data.find((d: any) => d.dayOfWeek === day.id);
        return {
          dayOfWeek: day.id,
          active: !!found,
          startTime: found?.startTime || "08:00",
          endTime: found?.endTime || "18:00",
          lunchStart: found?.lunchStart || "",
          lunchEnd: found?.lunchEnd || "",
        };
      });
      setSchedule(initialSchedule);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = await profileService.fetchCurrent();
        setUserRole(user.role);

        if (user.role === "client") {
          router.replace("/agenda");
          return;
        }

        if (user.role === "admin" || user.role === "company_admin") {
          const profs = await professionalService.getAll();
          setProfessionals(profs);
          if (profs.length > 0) {
            setSelectedProfId(profs[0].id);
            await fetchAvailabilityData(profs[0].id);
          } else {
            setLoading(false);
          }
        } else {
          await fetchAvailabilityData();
        }
      } catch (error) {
        router.push("/login");
      }
    };
    init();
  }, [router]);

  const handleProfChange = async (id: number) => {
    setSelectedProfId(id);
    await fetchAvailabilityData(id);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    if (userRole !== "admin" && userRole !== "company_admin") return;

    setSaving(true);
    try {
      const toSave = schedule
        .filter((day) => day.active)
        .map(({ dayOfWeek, startTime, endTime, lunchStart, lunchEnd }) => ({
          dayOfWeek,
          startTime,
          endTime,
          lunchStart: lunchStart || null,
          lunchEnd: lunchEnd || null,
        }));

      // Chama o serviço ajustado
      await availabilityService.saveAvailability({
        availabilities: toSave,
        professionalId: selectedProfId,
      });

      setModalTitle("Sucesso!");
      setModalMessage("Horários e pausas atualizados com sucesso!");
      setIsSuccess(true);
      setModalOpen(true);
    } catch (error) {
      setModalTitle("Erro");
      setModalMessage("Erro ao salvar as configurações.");
      setIsSuccess(false);
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const canEdit = userRole === "admin" || userRole === "company_admin";

  if (loading && professionals.length === 0 && userRole !== "professional") {
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
        <title>Configurar Horários | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          <div className={styles.headerSection}>
            <h2 className={styles.title}>Configurar Horários ⏰</h2>
            {!canEdit && (
              <p className="text-muted text-center">
                Seus horários são gerenciados pela administração. Entre em
                contato para alterações.
              </p>
            )}
          </div>

          {canEdit && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                backgroundColor: "#fff0f3",
                border: "1px solid #d48498",
              }}
            >
              <Label className="fw-bold">Gerenciando horários de:</Label>
              <Input
                type="select"
                value={selectedProfId || ""}
                onChange={(e) => handleProfChange(Number(e.target.value))}
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </Input>
            </div>
          )}

          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <div className="text-center py-4">
                <Spinner color="secondary" /> <p>Carregando horários...</p>
              </div>
            ) : (
              <Form>
                {schedule.map((day, index) => (
                  <div key={day.dayOfWeek} className="mb-4 pb-3 border-bottom">
                    <Row className="align-items-center mb-2">
                      <Col xs="12" md="3">
                        <FormGroup check>
                          <Label
                            check
                            style={{
                              fontWeight: day.active ? "bold" : "normal",
                              fontSize: "1.1rem",
                              color: day.active ? "#000" : "#999",
                            }}
                          >
                            <Input
                              type="checkbox"
                              checked={day.active}
                              disabled={!canEdit}
                              onChange={(e) =>
                                handleChange(index, "active", e.target.checked)
                              }
                            />{" "}
                            {DAYS[day.dayOfWeek].name}
                          </Label>
                        </FormGroup>
                      </Col>
                      {day.active && (
                        <Col xs="12" md="9">
                          <Row>
                            {/* Mudei de xs="6" para xs="12" e adicionei mb-3 no mobile para dar espaço */}
                            <Col
                              xs="12"
                              md="5"
                              className="d-flex align-items-center gap-2 mb-3 mb-md-0"
                            >
                              <div className="w-100">
                                <small className="text-muted d-block mb-1">
                                  Início Exp.
                                </small>
                                <Input
                                  type="time"
                                  value={day.startTime}
                                  disabled={!canEdit}
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <span className="mt-4">-</span>
                              <div className="w-100">
                                <small className="text-muted d-block mb-1">
                                  Fim Exp.
                                </small>
                                <Input
                                  type="time"
                                  value={day.endTime}
                                  disabled={!canEdit}
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </Col>

                            <Col
                              md="1"
                              className="d-none d-md-flex align-items-center justify-content-center pt-3"
                            >
                              <span style={{ color: "#ddd" }}>|</span>
                            </Col>

                            {/* Mudei de xs="6" para xs="12" aqui também */}
                            <Col
                              xs="12"
                              md="5"
                              className="d-flex align-items-center gap-2"
                            >
                              <div className="w-100">
                                <small className="text-muted d-block mb-1">
                                  Início Almoço
                                </small>
                                <Input
                                  type="time"
                                  value={day.lunchStart}
                                  disabled={!canEdit}
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "lunchStart",
                                      e.target.value
                                    )
                                  }
                                  style={{ borderColor: "#b0d4f1" }}
                                />
                              </div>
                              <span className="mt-4">-</span>
                              <div className="w-100">
                                <small className="text-muted d-block mb-1">
                                  Fim Almoço
                                </small>
                                <Input
                                  type="time"
                                  value={day.lunchEnd}
                                  disabled={!canEdit}
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "lunchEnd",
                                      e.target.value
                                    )
                                  }
                                  style={{ borderColor: "#b0d4f1" }}
                                />
                              </div>
                            </Col>
                          </Row>
                        </Col>
                      )}{" "}
                    </Row>
                  </div>
                ))}

                <div className="d-flex justify-content-end mt-4">
                  {canEdit ? (
                    <>
                      <Button
                        color="secondary"
                        outline
                        className="me-3"
                        onClick={() => router.back()}
                      >
                        Voltar
                      </Button>
                      <Button
                        style={{ backgroundColor: "#d48498", border: "none" }}
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <Spinner size="sm" />
                        ) : (
                          "Salvar Configurações"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      color="secondary"
                      outline
                      onClick={() => router.back()}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              </Form>
            )}
          </div>
        </Container>

        <Modal isOpen={modalOpen} toggle={toggleModal} centered>
          <ModalHeader
            toggle={toggleModal}
            className={
              isSuccess ? "bg-success text-white" : "bg-danger text-white"
            }
          >
            {modalTitle}
          </ModalHeader>
          <ModalBody>{modalMessage}</ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleModal}>
              OK
            </Button>
          </ModalFooter>
        </Modal>
        <MenuMobile />
      </main>
    </>
  );
}
