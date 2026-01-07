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
} from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import styles from "../styles/book.module.scss";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { parseISO } from "date-fns";
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

  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // HELPER IMAGEM
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder.png";
    const cleanPath = path.replace(/\\/g, "/");
    const finalPath = cleanPath.startsWith("/")
      ? cleanPath.substring(1)
      : cleanPath;
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${finalPath}`;
  };

  // LOGICA (Mantida)
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
  }, [selectedCat, selectedProf, professionals]);

  useEffect(() => {
    const fetchSlots = async () => {
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

  const handleBook = async () => {
    if (!selectedProf || !selectedService || !startDate) {
      showToast("error", "Preencha todos os campos.");
      return;
    }
    try {
      await appointmentService.create(
        Number(selectedProf),
        Number(selectedService),
        startDate
      );
      showToast("success", "Agendamento realizado!");
      setTimeout(() => router.push("/home"), 2000);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Erro ao agendar.");
    }
  };

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

              {/* STEPPER */}
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
              {/* BARRA DE CONTROLE FLUTUANTE (Resolve o problema do botão cortado) */}
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
                  {" "}
                  {/* g-3 ajusta o espaçamento entre colunas */}
                  {companies.map((company) => (
                    // AQUI ESTÁ A MÁGICA: xs={6} coloca 2 cards por linha no celular
                    <Col xs={6} sm={6} md={3} key={company.id}>
                      <Card
                        className={styles.companyCard}
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className={styles.cardImageWrapper}>
                          {company.thumbnailUrl ? (
                            <img
                              src={getImageUrl(company.thumbnailUrl)}
                              alt={company.name}
                              className={styles.cardImage}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/300x400?text=Virtuosa";
                              }}
                            />
                          ) : (
                            <div className={styles.noImage}>Virtuosa</div>
                          )}
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
                          {/* Botão menor e mais compacto para mobile */}
                          <Button className={styles.btnOutlineCompact}>
                            Ver Agenda
                          </Button>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                  {companies.length === 0 && (
                    <div className="text-center text-muted py-5 col-12">
                      <p>Nenhuma unidade encontrada nesta cidade.</p>
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

                  <h3 className={styles.sectionTitle}>Detalhes</h3>

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
                        </Col>
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
                        <Label className={styles.labelElegant}>
                          Data e Hora
                        </Label>
                        <div className={styles.datePickerContainer}>
                          <DatePicker
                            selected={startDate}
                            onChange={(date: Date | null) => {
                              if (date) setStartDate(date);
                            }}
                            showTimeSelect
                            includeTimes={availableSlots}
                            timeCaption="Horas"
                            timeIntervals={30}
                            dateFormat="dd/MM/yyyy - HH:mm"
                            locale="pt-BR"
                            className={styles.elegantInput}
                            minDate={new Date()}
                            filterDate={isDateAvailable}
                            disabled={!selectedService}
                            placeholderText={
                              !selectedService
                                ? "Selecione o serviço"
                                : "Escolha a data"
                            }
                          />
                        </div>
                        {loadingSlots && (
                          <small className="text-muted d-block mt-1">
                            Buscando horários...
                          </small>
                        )}
                        {selectedService &&
                          !loadingSlots &&
                          availableSlots.length === 0 && (
                            <small className="text-warning mt-2 d-block">
                              Sem horários para hoje.
                            </small>
                          )}
                      </FormGroup>

                      <div className="text-center mt-4">
                        <Button
                          className={styles.btnGold}
                          onClick={handleBook}
                          disabled={
                            !selectedProf ||
                            !selectedService ||
                            availableSlots.length === 0
                          }
                        >
                          Agendar
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
      </main>
    </>
  );
}
