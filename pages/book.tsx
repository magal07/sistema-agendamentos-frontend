import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
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
import ToastComponent from "../src/components/common/toast";

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Estados para o Toast
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Dados Gerais
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Disponibilidade Geral (Para bloquear dias da semana inteiros, ex: Domingo)
  const [availability, setAvailability] = useState<any[]>([]);

  // Disponibilidade Específica (Horários calculados pelo backend)
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Seleções
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState(new Date());

  // 1. Carrega Profissionais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const profsData = await professionalService.getAll();
        setProfessionals(
          Array.isArray(profsData) ? profsData : profsData.rows || []
        );
      } catch (err) {
        showToast("error", "Erro ao carregar profissionais.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Quando mudar Profissional: Filtra Categorias E Busca Disponibilidade Geral (Dias da semana)
  useEffect(() => {
    if (selectedProf) {
      const prof = professionals.find((p) => p.id.toString() === selectedProf);

      // A) Filtra categorias
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

      // B) Busca disponibilidade GERAL (apenas para saber quais dias da semana pintar de cinza)
      availabilityService
        .getByProfessionalId(Number(selectedProf))
        .then((data: any) => {
          setAvailability(data);
        });
    } else {
      setCategories([]);
      setAvailability([]);
    }

    // Reseta campos
    setSelectedCat("");
    setSelectedService("");
    setServices([]);
    setAvailableSlots([]);
  }, [selectedProf, professionals]);

  // 3. Filtra Serviços
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

  // 4. NOVO: Busca SLOTS Disponíveis (Horários exatos)
  // Dispara quando muda a data, o profissional ou o serviço
  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedProf && selectedService && startDate) {
        setLoadingSlots(true);
        try {
          // O backend retorna array de strings: ["2023-10-01 08:00", "2023-10-01 08:30"]
          const slotsStr = await availabilityService.getAvailableSlots(
            Number(selectedProf),
            Number(selectedService),
            startDate
          );

          // Convertemos para objetos Date que o DatePicker entende
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

  // --- REGRAS VISUAIS ---

  // A. Bloqueia dias da semana inteiros (ex: Profissional não trabalha Domingo)
  const isDateAvailable = (date: Date) => {
    if (!selectedProf) return false;
    if (availability.length === 0) return true;

    const dayOfWeek = date.getDay();
    return availability.some((a) => a.dayOfWeek === dayOfWeek);
  };

  // Helper Toast
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

        <div className={styles.heroBook}>
          <Container>
            <h2 className={styles.title}>Agende seu Horário</h2>
            <p className={styles.subtitle}>
              Personalize seu atendimento escolhendo seu profissional favorito.
            </p>
          </Container>
        </div>

        <Container className="d-flex justify-content-center">
          <div className={`col-md-8 col-lg-6 ${styles.containerForm}`}>
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

                {/* 4. DATA E HORA (COM SLOTS INTELIGENTES) */}
                <FormGroup>
                  <Label className={styles.label}>
                    Data e Hora
                    {loadingSlots && (
                      <Spinner size="sm" color="secondary" className="ms-2" />
                    )}
                  </Label>
                  <div className={styles.datePickerWrapper}>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => {
                        if (date) setStartDate(date);
                      }}
                      showTimeSelect
                      // --- AQUI ESTÁ A MUDANÇA PRINCIPAL ---
                      // Em vez de minTime/maxTime, usamos includeTimes
                      // Isso faz o DatePicker mostrar APENAS os horários da lista availableSlots
                      includeTimes={availableSlots}
                      timeCaption={loadingSlots ? "Carregando..." : "Horários"}
                      timeIntervals={30} // Intervalo visual, o includeTimes tem prioridade
                      dateFormat="dd/MM/yyyy - HH:mm"
                      locale="pt-BR"
                      className={styles.input}
                      minDate={new Date()} // Não agendar passado
                      // Mantemos o filtro de dias da semana para visualmente bloquear domingos
                      filterDate={isDateAvailable}
                      // Só libera se tiver serviço (precisamos da duração)
                      disabled={!selectedService}
                      placeholderText={
                        !selectedService
                          ? "Selecione o serviço primeiro"
                          : "Escolha um horário disponível"
                      }
                    />
                  </div>

                  {/* Mensagens de feedback */}
                  {selectedProf && availability.length === 0 && (
                    <small className="text-danger mt-1 d-block">
                      Este profissional ainda não configurou horários.
                    </small>
                  )}
                  {selectedService &&
                    !loadingSlots &&
                    availableSlots.length === 0 && (
                      <small className="text-warning mt-1 d-block">
                        Nenhum horário disponível nesta data. Tente outro dia.
                      </small>
                    )}
                </FormGroup>

                <Button
                  className={styles.btnSubmit}
                  onClick={handleBook}
                  // Botão só ativa se tiver horário e serviço selecionado
                  disabled={
                    !selectedProf ||
                    !selectedService ||
                    availableSlots.length === 0
                  }
                >
                  Confirmar Agendamento
                </Button>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.back();
                  }}
                  className={styles.btnBack}
                >
                  Voltar
                </a>
              </Form>
            )}
          </div>
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
