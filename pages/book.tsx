import Head from "next/head";
import { useEffect, useState } from "react";
import {
  Container,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  Row,
  Col,
  Modal, // <--- NOVO
  ModalHeader, // <--- NOVO
  ModalBody, // <--- NOVO
  ModalFooter, // <--- NOVO
} from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import styles from "../styles/book.module.scss";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { parseISO, format } from "date-fns";
import { appointmentService } from "../src/services/appointmentService";
import { professionalService } from "../src/services/professionalService";
import availabilityService from "../src/services/availabilityService";
import companyService, { Company } from "../src/services/companyService";
import ToastComponent from "../src/components/common/toast";
import MenuMobile from "../src/components/common/menuMobile";

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [availability, setAvailability] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedProf, setSelectedProf] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [startDate, setStartDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);

  // --- MODAL STATES (IGUAL AO PROFISSIONAL) ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "review" | "success" | "error"
  >("review");
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState("");
  const [executing, setExecuting] = useState(false);

  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder.png";
    const cleanPath = path.replace(/\\/g, "/");
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${
      cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath
    }`;
  };

  // --- EFEITOS DE CARREGAMENTO (Cidades, Empresas, Profissionais...) ---
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const data = await companyService.getCities();
        setCities(data);
      } catch (error) {
        showToast("error", "Erro ao carregar cidades.");
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  const handleCitySelect = async (e: any) => {
    const city = e.target.value;
    setSelectedCity(city);
    if (city) {
      setLoading(true);
      try {
        const data = await companyService.getCompanies(city);
        setCompanies(data);
        setStep(2);
      } catch (error) {
        showToast("error", "Erro ao buscar empresas.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setStep(3);
  };

  useEffect(() => {
    if (step === 3 && selectedCompany) {
      const loadProfessionals = async () => {
        try {
          setLoading(true);
          const profsData = await professionalService.getAll(
            selectedCompany.id
          );
          setProfessionals(
            Array.isArray(profsData) ? profsData : profsData.rows || []
          );
        } catch (err) {
          showToast("error", "Erro ao carregar profissionais.");
        } finally {
          setLoading(false);
        }
      };
      loadProfessionals();
    }
  }, [step, selectedCompany]);

  useEffect(() => {
    if (selectedProf) {
      const prof = professionals.find((p) => p.id.toString() === selectedProf);
      if (prof && prof.services) {
        const uniqueCategories = prof.services.reduce(
          (acc: any[], current: any) => {
            const x = acc.find((item) => item.id === current.Category.id);
            if (!x) return acc.concat([current.Category]);
            return acc;
          },
          []
        );
        setCategories(uniqueCategories);
      } else {
        setCategories([]);
      }
      availabilityService
        .getByProfessionalId(Number(selectedProf))
        .then((data: any) => setAvailability(data));
    } else {
      setCategories([]);
      setAvailability([]);
    }
    setSelectedCat("");
    setSelectedService("");
    setServices([]);
    setAvailableSlots([]);
    setSelectedTimeSlot(null);
  }, [selectedProf, professionals]);

  useEffect(() => {
    if (selectedCat && selectedProf) {
      const prof = professionals.find((p) => p.id.toString() === selectedProf);
      if (prof && prof.services) {
        const filtered = prof.services.filter(
          (s: any) => s.categoryId.toString() === selectedCat
        );
        setServices(filtered);
      }
    } else {
      setServices([]);
    }
    setSelectedService("");
    setSelectedTimeSlot(null);
  }, [selectedCat, selectedProf, professionals]);

  // --- BUSCA SLOT DE HORÁRIOS ---
  useEffect(() => {
    const fetchSlots = async () => {
      setAvailableSlots([]);
      setSelectedTimeSlot(null);

      if (selectedProf && selectedService && startDate) {
        setLoadingSlots(true);
        try {
          const slotsStr = await availabilityService.getAvailableSlots(
            Number(selectedProf),
            Number(selectedService),
            startDate
          );
          const slotsDate = slotsStr.map((s: string) => parseISO(s));
          setAvailableSlots(slotsDate);
        } catch (error) {
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [startDate, selectedProf, selectedService]);

  const isDateAvailable = (date: Date) => {
    if (!selectedProf) return false;
    if (availability.length === 0) return true;
    const dayOfWeek = date.getDay();
    return availability.some((a) => a.dayOfWeek === dayOfWeek);
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToastType(type);
    setToastMessage(msg);
    setToastIsOpen(true);
    setTimeout(() => setToastIsOpen(false), 3000);
  };

  // --- ABERTURA DO MODAL ---
  const handleOpenConfirm = () => {
    if (!selectedProf || !selectedService || !selectedTimeSlot) {
      showToast("error", "Preencha todos os campos.");
      return;
    }
    setModalStatus("review");
    setConfirmModalOpen(true);
  };

  // --- EXECUÇÃO DO AGENDAMENTO ---
  const executeSchedule = async () => {
    setExecuting(true);
    try {
      await appointmentService.create(
        Number(selectedProf),
        Number(selectedService),
        selectedTimeSlot!
      );
      setModalStatus("success");
    } catch (err: any) {
      setModalStatus("error");
      setModalFeedbackMsg(err.response?.data?.message || "Erro ao agendar.");
    } finally {
      setExecuting(false);
    }
  };

  const handleCloseSuccess = () => {
    setConfirmModalOpen(false);
    router.push("/agenda"); // Vai para a página 'Meus Agendamentos'
  };

  // Helpers para exibir nomes no modal
  const getProfName = () => {
    const p = professionals.find((x) => x.id.toString() === selectedProf);
    return p ? `${p.firstName} ${p.lastName}` : "";
  };
  const getServiceName = () => {
    const s = services.find((x) => x.id.toString() === selectedService);
    return s ? s.name : "";
  };

  const currentProfObj = professionals.find(
    (p) => p.id.toString() === selectedProf
  );

  return (
    <>
      <Head>
        <title>Agendamento | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* HERO */}
        <div className={styles.heroBook}>
          <div className={styles.heroOverlay}>
            <Container className="text-center">
              <h1 className={styles.heroTitle}>Sua Beleza, Nossa Arte</h1>
              <p className={styles.heroSubtitle}>
                {step === 1 && "Vamos começar? Onde você está?"}
                {step === 2 && `Unidades em ${selectedCity}`}
                {step === 3 && selectedCompany && selectedCompany.name}
              </p>
              <div className={styles.stepper}>
                <div
                  className={`${styles.step} ${step >= 1 ? styles.active : ""}`}
                >
                  1
                </div>
                <div className={styles.line}></div>
                <div
                  className={`${styles.step} ${step >= 2 ? styles.active : ""}`}
                >
                  2
                </div>
                <div className={styles.line}></div>
                <div
                  className={`${styles.step} ${step >= 3 ? styles.active : ""}`}
                >
                  3
                </div>
              </div>
            </Container>
          </div>
        </div>

        <Container
          className="py-5"
          style={{ minHeight: "60vh", position: "relative", zIndex: 10 }}
        >
          {/* ETAPA 1: CIDADE */}
          {step === 1 && (
            <div className={styles.fadeIn}>
              <div className={styles.cardFloating}>
                <h3 className={styles.sectionTitle}>Selecione sua Cidade</h3>
                <FormGroup>
                  <Input
                    type="select"
                    className={styles.elegantSelect}
                    value={selectedCity}
                    onChange={handleCitySelect}
                  >
                    <option value="">Clique para escolher...</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                {loading && (
                  <div className="text-center mt-4">
                    <Spinner color="dark" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 2: EMPRESAS */}
          {step === 2 && (
            <div className={styles.fadeIn}>
              <div className={styles.controlBar}>
                <Button
                  color="link"
                  onClick={() => setStep(1)}
                  className={styles.backLink}
                >
                  &larr; Voltar
                </Button>
                <span className="text-muted small fw-bold">
                  {companies.length} Unidades encontradas
                </span>
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="dark" />
                </div>
              ) : (
                <Row className="g-3">
                  {companies.map((company) => (
                    <Col xs={6} sm={6} md={3} key={company.id}>
                      <Card
                        className={styles.companyCard}
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className={styles.cardImageWrapper}>
                          <img
                            src={getImageUrl(company.thumbnailUrl)}
                            alt={company.name}
                            className={styles.cardImage}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/300x400?text=Virtuosa";
                            }}
                          />
                        </div>
                        <CardBody
                          className={`${styles.cardBodyCompact} text-center`}
                        >
                          <CardTitle tag="h6" className={styles.cardTitle}>
                            {company.name}
                          </CardTitle>
                          <CardSubtitle className={styles.cardSubtitle}>
                            {company.district}
                          </CardSubtitle>
                          <Button className={styles.btnOutlineCompact}>
                            Ver Agenda
                          </Button>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                  {companies.length === 0 && (
                    <div className="text-center text-muted py-5 col-12">
                      <p>Nenhuma unidade encontrada.</p>
                    </div>
                  )}
                </Row>
              )}
            </div>
          )}

          {/* ETAPA 3: AGENDAMENTO */}
          {step === 3 && (
            <div className={styles.fadeIn}>
              <div className="d-flex justify-content-center">
                <div className={styles.cardFloatingLarge}>
                  <Button
                    color="link"
                    onClick={() => {
                      setStep(2);
                      setProfessionals([]);
                    }}
                    className={styles.backLink}
                  >
                    &larr; Voltar
                  </Button>

                  <h3 className={styles.sectionTitle}>
                    Detalhes do Agendamento
                  </h3>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="dark" />
                    </div>
                  ) : (
                    <Form className="mt-4">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label className={styles.labelElegant}>
                              Profissional
                            </Label>

                            {/* [NOVO] Bloco que exibe a foto se houver seleção */}
                            {selectedProf && currentProfObj && (
                              <div className="d-flex align-items-center mb-2 animate__animated animate__fadeIn">
                                <img
                                  src={getImageUrl(currentProfObj.avatarUrl)}
                                  alt="Foto"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    marginRight: "10px",
                                    border: "2px solid #b06075",
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.png";
                                  }}
                                />
                                <div>
                                  <small
                                    className="text-muted d-block"
                                    style={{ lineHeight: 1 }}
                                  >
                                    Você escolheu:
                                  </small>
                                  <strong>
                                    {currentProfObj.firstName}{" "}
                                    {currentProfObj.lastName}
                                  </strong>
                                </div>
                              </div>
                            )}

                            <Input
                              type="select"
                              className={styles.elegantSelect}
                              value={selectedProf}
                              onChange={(e) => setSelectedProf(e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              {professionals.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.firstName} {p.lastName}
                                </option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>{" "}
                        <Col md={6}>
                          <FormGroup>
                            <Label className={styles.labelElegant}>
                              Categoria
                            </Label>
                            <Input
                              type="select"
                              className={styles.elegantSelect}
                              value={selectedCat}
                              onChange={(e) => setSelectedCat(e.target.value)}
                              disabled={!selectedProf}
                            >
                              <option value="">Selecione...</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <FormGroup>
                        <Label className={styles.labelElegant}>Serviço</Label>
                        <Input
                          type="select"
                          className={styles.elegantSelect}
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          disabled={!selectedCat}
                        >
                          <option value="">Selecione...</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} - R$ {Number(s.price).toFixed(2)}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>

                      <FormGroup>
                        <Label className={styles.labelElegant}>Data</Label>
                        <div className={styles.datePickerContainer}>
                          <DatePicker
                            selected={startDate}
                            onChange={(date: Date | null) => {
                              if (date) setStartDate(date);
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale="pt-BR"
                            className={styles.elegantInput}
                            minDate={new Date()}
                            filterDate={isDateAvailable}
                            disabled={!selectedService}
                            placeholderText={
                              !selectedService
                                ? "Selecione o serviço primeiro"
                                : "Escolha o dia"
                            }
                          />
                        </div>
                      </FormGroup>

                      {selectedService && (
                        <div className="mt-4">
                          <Label className={styles.labelElegant}>
                            Horários Disponíveis
                          </Label>
                          {loadingSlots && (
                            <div className="py-2">
                              <Spinner size="sm" color="secondary" /> Buscando
                              horários...
                            </div>
                          )}
                          {!loadingSlots && availableSlots.length === 0 && (
                            <p className="text-muted small">
                              Nenhum horário disponível para esta data.
                            </p>
                          )}

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(80px, 1fr))",
                              gap: "10px",
                              marginTop: "10px",
                            }}
                          >
                            {availableSlots.map((slotDate, index) => {
                              const isSelected =
                                selectedTimeSlot &&
                                slotDate.getTime() ===
                                  selectedTimeSlot.getTime();
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setSelectedTimeSlot(slotDate)}
                                  style={{
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: isSelected
                                      ? "2px solid #D4AF37"
                                      : "1px solid #ddd",
                                    backgroundColor: isSelected
                                      ? "#fff8e1"
                                      : "#fff",
                                    color: isSelected ? "#333" : "#666",
                                    fontWeight: isSelected ? "bold" : "normal",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {/* CORREÇÃO DO ERRO 2026: Exibir apenas a HORA formatada */}
                                  {format(slotDate, "HH:mm")}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-center mt-5">
                        <Button
                          className={styles.btnGold}
                          onClick={handleOpenConfirm}
                          disabled={
                            !selectedProf ||
                            !selectedService ||
                            !selectedTimeSlot
                          }
                          style={{ minWidth: "200px", padding: "12px" }}
                        >
                          Confirmar Agendamento
                        </Button>
                      </div>
                    </Form>
                  )}
                </div>
              </div>
            </div>
          )}
        </Container>

        <Footer />
        <ToastComponent
          type={toastType}
          isOpen={toastIsOpen}
          message={toastMessage}
        />
        <MenuMobile />

        {/* --- MODAL DE CONFIRMAÇÃO --- */}
        <Modal
          isOpen={confirmModalOpen}
          toggle={() =>
            modalStatus === "success"
              ? handleCloseSuccess()
              : setConfirmModalOpen(false)
          }
          centered
          backdrop="static"
        >
          <ModalHeader
            toggle={() =>
              modalStatus === "success"
                ? handleCloseSuccess()
                : setConfirmModalOpen(false)
            }
            className="text-center"
            style={{ borderBottom: "none" }}
          >
            {modalStatus === "review" && "Confirmar Agendamento 📅"}
            {modalStatus === "success" && (
              <span className="text-success">Sucesso! 🎉</span>
            )}
            {modalStatus === "error" && (
              <span className="text-danger">Atenção ⚠️</span>
            )}
          </ModalHeader>
          <ModalBody>
            {modalStatus === "review" && (
              <div className="text-center py-2">
                <p className="text-muted mb-4">
                  Confira os dados antes de finalizar:
                </p>
                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "10px",
                    textAlign: "left",
                  }}
                >
                  <p className="mb-2">
                    💇‍♀️ <strong>Profissional:</strong> {getProfName()}
                  </p>
                  <p className="mb-2">
                    💅 <strong>Serviço:</strong> {getServiceName()}
                  </p>
                  <hr style={{ borderColor: "#eaeaea" }} />
                  <p
                    className="mb-0 text-center"
                    style={{
                      fontSize: "1.2rem",
                      color: "#d48498",
                      fontWeight: "bold",
                    }}
                  >
                    {/* Exibe: 13/01/2026 às 16:30 */}
                    {selectedTimeSlot &&
                      format(selectedTimeSlot, "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>
            )}
            {modalStatus === "success" && (
              <div className="text-center py-4">
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>✅</div>
                <h4 style={{ fontWeight: "bold", color: "#28a745" }}>
                  Agendado com Sucesso!
                </h4>
                <p className="text-muted">
                  Seu horário foi reservado. Te esperamos lá!
                </p>
              </div>
            )}
            {modalStatus === "error" && (
              <div className="text-center py-4">
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>❌</div>
                <h4 style={{ fontWeight: "bold", color: "#dc3545" }}>
                  Erro ao Agendar
                </h4>
                <p className="text-muted">{modalFeedbackMsg}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="justify-content-center border-0 pb-4">
            {modalStatus === "review" && (
              <>
                <Button
                  color="secondary"
                  outline
                  onClick={() => setConfirmModalOpen(false)}
                  style={{ minWidth: "100px" }}
                >
                  Voltar
                </Button>
                <Button
                  color="success"
                  onClick={executeSchedule}
                  style={{ minWidth: "140px", fontWeight: "bold" }}
                >
                  {executing ? <Spinner size="sm" /> : "CONFIRMAR"}
                </Button>
              </>
            )}
            {modalStatus === "success" && (
              <Button
                color="primary"
                onClick={handleCloseSuccess}
                style={{ minWidth: "150px", borderRadius: "25px" }}
              >
                Ver Meus Agendamentos
              </Button>
            )}
            {modalStatus === "error" && (
              <Button
                color="secondary"
                onClick={() => setModalStatus("review")}
                style={{ minWidth: "120px" }}
              >
                Tentar Novamente
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </main>
    </>
  );
}
