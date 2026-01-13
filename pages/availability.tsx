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

  // Estados para gestão múltipla
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [schedule, setSchedule] = useState<any[]>([]);

  // Função para carregar horários (pode ser o "meu" ou de um ID específico)
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
    setSaving(true);
    try {
      const toSave = schedule
        .filter((day) => day.active)
        .map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
          // Se for admin, enviamos o ID da profissional selecionada
          professionalId:
            userRole === "admin" || userRole === "company_admin"
              ? selectedProfId
              : undefined,
        }));

      await availabilityService.saveAvailability(toSave);

      setModalTitle("Sucesso!");
      setModalMessage("Horários salvos com sucesso!");
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
    if (isSuccess) router.push("/agenda");
  };

  if (loading && professionals.length === 0) {
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
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          <div className={styles.headerSection}>
            <h2 className={styles.title}>Configurar Horários ⏰</h2>
          </div>

          {/* SELEÇÃO DE PROFISSIONAL PARA O ADMIN */}
          {(userRole === "admin" || userRole === "company_admin") && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                backgroundColor: "#fff0f3",
                border: "1px solid #d48498",
              }}
            >
              <Label className="fw-bold">Alterar horários de:</Label>
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
                  <div key={day.dayOfWeek} className="mb-3 pb-3 border-bottom">
                    <Row className="align-items-center">
                      <Col xs="12" md="4">
                        <FormGroup check>
                          <Label
                            check
                            style={{
                              fontWeight: day.active ? "bold" : "normal",
                              fontSize: "1.1rem",
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
                          <Col xs="2" md="1" className="text-center">
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
