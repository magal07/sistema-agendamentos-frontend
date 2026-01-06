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

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE NAVEGAÇÃO (WIZARD) ---
  const [step, setStep] = useState(1); // 1: Cidade, 2: Empresa, 3: Agendamento
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // --- ESTADOS DO AGENDAMENTO (ETAPA 3) ---
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Seleções Finais
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState(new Date());

  // Toast
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // =========================================================================
  // HELPER: CORREÇÃO DE IMAGENS (WINDOWS PATH FIX)
  // =========================================================================
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder.png"; // Imagem padrão se não houver foto

    // 1. Substitui barras invertidas do Windows (\) por barras normais (/)
    const cleanPath = path.replace(/\\/g, "/");

    // 2. Remove barra inicial se existir para evitar "//"
    const finalPath = cleanPath.startsWith("/")
      ? cleanPath.substring(1)
      : cleanPath;

    // Use a variável que funcionou para você (API_URL)
    return `${process.env.NEXT_PUBLIC_BASE_URL}/${finalPath}`;
  };

  // =========================================================================
  // ETAPA 1: CARREGAR CIDADES
  // =========================================================================
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const data = await companyService.getCities();
        setCities(data);
      } catch (error) {
        showToast("error", "Erro ao carregar cidades disponíveis.");
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
        setStep(2); // Avança para etapa 2
      } catch (error) {
        showToast("error", "Erro ao buscar empresas.");
      } finally {
        setLoading(false);
      }
    }
  };

  // =========================================================================
  // ETAPA 2: SELECIONAR EMPRESA
  // =========================================================================
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setStep(3); // Avança para o agendamento
  };

  // =========================================================================
  // ETAPA 3: CARREGAR PROFISSIONAIS DA EMPRESA SELECIONADA
  // =========================================================================
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
          showToast("error", "Erro ao carregar profissionais desta empresa.");
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
        .then((data: any) => {
          setAvailability(data);
        });
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
          console.error("Erro ao buscar slots", error);
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
      showToast("error", "Por favor, preencha todos os campos.");
      return;
    }
    try {
      await appointmentService.create(
        Number(selectedProf),
        Number(selectedService),
        startDate
      );
      showToast("success", "Agendamento realizado com sucesso!");
      setTimeout(() => {
        router.push("/home");
      }, 2000);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Erro ao agendar.");
    }
  };

  return (
    <>
      <Head>
        <title>Novo Agendamento - Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* HERO SECTION DINÂMICO */}
        <div className={styles.heroBook}>
          <Container>
            {step === 1 && (
              <>
                <h2 className={styles.nameTitle}>🌸 Espaço Virtuosa 🌸</h2>
                <h2 className={styles.title}>Onde você está localizada?</h2>
                <p className={styles.subtitle}>
                  Escolha sua cidade e selecione sua profissional.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className={styles.title}>Escolha a Unidade</h2>
                <p className={styles.subtitle}>
                  Encontramos estas opções em {selectedCity}.
                </p>
              </>
            )}
            {step === 3 && selectedCompany && (
              <>
                <h2 className={styles.title}>{selectedCompany.name}</h2>
                <p className={styles.subtitle}>
                  {selectedCompany.street}, {selectedCompany.number} -{" "}
                  {selectedCompany.district}
                </p>
              </>
            )}
          </Container>
        </div>

        <Container className="py-5" style={{ minHeight: "50vh" }}>
          {/* ================= ETAPA 1: CIDADE ================= */}
          {step === 1 && (
            <div className="d-flex justify-content-center">
              <div className="col-md-6">
                <FormGroup>
                  <Label className={styles.labelDark}>Selecione a Cidade</Label>
                  <Input
                    type="select"
                    className={styles.selectLg}
                    value={selectedCity}
                    onChange={handleCitySelect}
                  >
                    <option value="">Selecione...</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                {loading && (
                  <div className="text-center mt-3">
                    <Spinner color="primary" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ETAPA 2: EMPRESAS (CARDS VERTICAIS) ================= */}
          {step === 2 && (
            <div>
              <Button
                color="link"
                onClick={() => setStep(1)}
                className="mb-3 ps-0 text-decoration-none text-muted"
              >
                &larr; Voltar para cidades
              </Button>

              {loading ? (
                <div className="text-center">
                  <Spinner color="primary" />
                </div>
              ) : (
                <Row>
                  {companies.map((company) => (
                    // md={3} = 4 cards por linha em desktop (Mais estreito)
                    <Col
                      xs={12}
                      sm={6}
                      md={3}
                      key={company.id}
                      className="mb-4"
                    >
                      <Card
                        className="h-100 shadow-sm border-0 cursor-pointer"
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          overflow: "hidden", // Arredonda a imagem junto com o card
                        }}
                        onClick={() => handleCompanySelect(company)}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.transform = "translateY(-5px)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.transform = "translateY(0)")
                        }
                      >
                        <div
                          style={{
                            height: "320px", // ALTURA DE RETRATO
                            overflow: "hidden",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {company.thumbnailUrl ? (
                            <img
                              src={getImageUrl(company.thumbnailUrl)}
                              alt={company.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover", // PREENCHE O RETÂNGULO
                                objectPosition: "top center", // FOCA NO ROSTO
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/300x400?text=Sem+Foto";
                              }}
                            />
                          ) : (
                            <span className="text-muted">Sem Foto</span>
                          )}
                        </div>
                        <CardBody className="text-center">
                          <CardTitle tag="h5" className="fw-bold text-dark">
                            {company.name}
                          </CardTitle>
                          <CardSubtitle className="mb-2 text-muted small">
                            {company.street}, {company.number}
                            <br />
                            {company.district}
                          </CardSubtitle>
                          <Button
                            color="primary"
                            outline
                            block
                            size="sm"
                            className="mt-3 rounded-pill"
                          >
                            Ver Agenda
                          </Button>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                  {companies.length === 0 && (
                    <p className="text-center">
                      Nenhuma empresa encontrada nesta cidade.
                    </p>
                  )}
                </Row>
              )}
            </div>
          )}

          {/* ================= ETAPA 3: AGENDAMENTO (FORMULÁRIO) ================= */}
          {step === 3 && (
            <div className="d-flex justify-content-center">
              <div className={`col-md-8 col-lg-6 ${styles.containerForm}`}>
                <Button
                  color="link"
                  onClick={() => {
                    setStep(2);
                    setProfessionals([]);
                    setAvailability([]);
                  }}
                  className="mb-3 ps-0 text-decoration-none text-muted"
                >
                  &larr; Trocar de Unidade
                </Button>

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner color="secondary" />
                  </div>
                ) : (
                  <Form>
                    {/* 1. SELECIONA PROFISSIONAL */}
                    <FormGroup>
                      <Label className={styles.label}>Profissional</Label>
                      <Input
                        type="select"
                        className={styles.select}
                        value={selectedProf}
                        onChange={(e) => setSelectedProf(e.target.value)}
                      >
                        <option value="">Quem vai te atender?</option>
                        {professionals.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>

                    {/* 2. CATEGORIA */}
                    <FormGroup>
                      <Label className={styles.label}>Categoria</Label>
                      <Input
                        type="select"
                        className={styles.select}
                        value={selectedCat}
                        onChange={(e) => setSelectedCat(e.target.value)}
                        disabled={!selectedProf}
                      >
                        <option value="">
                          {selectedProf
                            ? "O que deseja fazer?"
                            : "Selecione um profissional primeiro"}
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>

                    {/* 3. SERVIÇO */}
                    <FormGroup>
                      <Label className={styles.label}>Serviço</Label>
                      <Input
                        type="select"
                        className={styles.select}
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        disabled={!selectedCat}
                      >
                        <option value="">
                          {selectedCat
                            ? "Escolha o serviço"
                            : "Selecione a categoria"}
                        </option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} - R$ {Number(s.price).toFixed(2)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>

                    {/* 4. DATA E HORA */}
                    <FormGroup>
                      <Label className={styles.label}>
                        Data e Hora
                        {loadingSlots && (
                          <Spinner
                            size="sm"
                            color="secondary"
                            className="ms-2"
                          />
                        )}
                      </Label>
                      <div className={styles.datePickerWrapper}>
                        <DatePicker
                          selected={startDate}
                          onChange={(date: Date | null) => {
                            if (date) setStartDate(date);
                          }}
                          showTimeSelect
                          includeTimes={availableSlots}
                          timeCaption={
                            loadingSlots ? "Carregando..." : "Horários"
                          }
                          timeIntervals={30}
                          dateFormat="dd/MM/yyyy - HH:mm"
                          locale="pt-BR"
                          className={styles.input}
                          minDate={new Date()}
                          filterDate={isDateAvailable}
                          disabled={!selectedService}
                          placeholderText={
                            !selectedService
                              ? "Selecione o serviço primeiro"
                              : "Escolha um horário disponível"
                          }
                        />
                      </div>

                      {/* Avisos */}
                      {selectedProf && availability.length === 0 && (
                        <small className="text-danger mt-1 d-block">
                          Este profissional ainda não configurou horários.
                        </small>
                      )}
                      {selectedService &&
                        !loadingSlots &&
                        availableSlots.length === 0 && (
                          <small className="text-warning mt-1 d-block">
                            Nenhum horário disponível nesta data.
                          </small>
                        )}
                    </FormGroup>

                    <Button
                      className={styles.btnSubmit}
                      onClick={handleBook}
                      disabled={
                        !selectedProf ||
                        !selectedService ||
                        availableSlots.length === 0
                      }
                    >
                      Confirmar Agendamento
                    </Button>
                  </Form>
                )}
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
      </main>
    </>
  );
}
