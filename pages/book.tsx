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
import { setHours, setMinutes } from "date-fns"; // Importante para manipular horas

import { appointmentService } from "../src/services/appointmentService";
import { professionalService } from "../src/services/professionalService";
import availabilityService from "../src/services/availabilityService"; // Importe o serviço
import ToastComponent from "../src/components/common/toast";

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Estados para o Toast
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Dados
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // NOVO: Estado para guardar a disponibilidade do profissional selecionado
  const [availability, setAvailability] = useState<any[]>([]);

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

  // 2. Quando mudar Profissional: Filtra Categorias E Busca Disponibilidade
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

      // B) BUSCA DISPONIBILIDADE (NOVO)
      availabilityService
        .getByProfessionalId(Number(selectedProf))
        .then((data) => {
          setAvailability(data);
        });
    } else {
      setCategories([]);
      setAvailability([]); // Limpa se desmarcar
    }

    // Reseta campos
    setSelectedCat("");
    setSelectedService("");
    setServices([]);
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

  // --- LÓGICA DO DATEPICKER ---

  // A. Filtra os dias da semana (Bloqueia Domingo se não trabalhar)
  const isDateAvailable = (date: Date) => {
    if (!selectedProf) return false;
    if (availability.length === 0) return true; // Se não configurou, libera tudo (ou bloqueia tudo, sua escolha)

    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...
    // Verifica se existe disponibilidade configurada para esse dia
    return availability.some((a) => a.dayOfWeek === dayOfWeek);
  };

  // B. Calcula Horário Mínimo e Máximo para o dia selecionado
  const { minTime, maxTime } = useMemo(() => {
    if (!selectedProf || availability.length === 0) {
      // Padrão se não tiver config: 08:00 as 18:00
      return {
        minTime: setHours(setMinutes(new Date(), 0), 8),
        maxTime: setHours(setMinutes(new Date(), 0), 18),
      };
    }

    const dayOfWeek = startDate.getDay();
    const config = availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (!config) {
      // Se o dia não estiver na lista (ex: selecionou no calendário mas mudou config), bloqueia visualmente
      return {
        minTime: setHours(setMinutes(new Date(), 0), 0),
        maxTime: setHours(setMinutes(new Date(), 0), 0),
      };
    }

    const [startHour, startMin] = config.startTime.split(":").map(Number);
    const [endHour, endMin] = config.endTime.split(":").map(Number);

    return {
      minTime: setHours(setMinutes(new Date(), startMin), startHour),
      maxTime: setHours(setMinutes(new Date(), endMin), endHour),
    };
  }, [startDate, availability, selectedProf]);

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

                {/* 4. DATA E HORA (COM REGRAS) */}
                <FormGroup>
                  <Label className={styles.label}>Data e Hora</Label>
                  <div className={styles.datePickerWrapper}>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) =>
                        date && setStartDate(date)
                      }
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30} // 30 min fica melhor pra agendamento
                      dateFormat="dd/MM/yyyy - HH:mm"
                      locale="pt-BR"
                      className={styles.input}
                      minDate={new Date()} // Não agendar passado
                      // --- REGRAS DE DISPONIBILIDADE ---
                      // 1. Desabilita dias que não trabalha (ex: Domingo)
                      filterDate={isDateAvailable}
                      // 2. Define hora mínima (ex: 08:00 do dia selecionado)
                      minTime={minTime}
                      // 3. Define hora máxima (ex: 18:00 do dia selecionado)
                      maxTime={maxTime}
                      // Desabilita se não selecionar Profissional
                      disabled={!selectedProf}
                      placeholderText={
                        !selectedProf
                          ? "Selecione um profissional"
                          : "Escolha a data"
                      }
                    />
                  </div>
                  {/* Dica para o usuário */}
                  {selectedProf && availability.length === 0 && (
                    <small className="text-danger mt-1 d-block">
                      Este profissional ainda não configurou horários.
                    </small>
                  )}
                </FormGroup>

                <Button
                  className={styles.btnSubmit}
                  onClick={handleBook}
                  disabled={!selectedProf}
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
