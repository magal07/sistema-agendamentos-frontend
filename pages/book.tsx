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
} from "reactstrap";
import HeaderAuth from "../src/components/common/headerAuth";
import Footer from "../src/components/common/footer";
import styles from "../styles/book.module.scss";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";

import { appointmentService } from "../src/services/appointmentService";
import { professionalService } from "../src/services/professionalService";
import ToastComponent from "../src/components/common/toast";

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Estados para o Toast
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Dados brutos vindos do banco
  const [professionals, setProfessionals] = useState<any[]>([]);

  // Listas filtradas para os Selects
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Itens Selecionados
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState(new Date());

  // 1. Carrega a lista de profissionais (que agora já vem com serviços e categorias do back)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const profsData = await professionalService.getAll();
        setProfessionals(
          Array.isArray(profsData) ? profsData : profsData.rows || []
        );
      } catch (err) {
        setToastType("error");
        setToastMessage("Erro ao carregar profissionais.");
        setToastIsOpen(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. REGRA DE NEGÓCIO: Quando mudar o profissional, filtra as CATEGORIAS dele
  useEffect(() => {
    if (selectedProf) {
      const prof = professionals.find((p) => p.id.toString() === selectedProf);

      if (prof && prof.services) {
        // Extrai categorias únicas dos serviços do profissional selecionado
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
    } else {
      setCategories([]);
    }
    // Reseta os campos seguintes
    setSelectedCat("");
    setSelectedService("");
    setServices([]);
  }, [selectedProf, professionals]);

  // 3. REGRA DE NEGÓCIO: Quando mudar a categoria, filtra os SERVIÇOS desse prof nessa categoria
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

  const handleBook = async () => {
    if (!selectedProf || !selectedService || !startDate) {
      setToastType("error");
      setToastMessage("Por favor, preencha todos os campos.");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
      return;
    }

    try {
      await appointmentService.create(
        Number(selectedProf),
        Number(selectedService),
        startDate
      );

      setToastType("success");
      setToastMessage("Agendamento realizado com sucesso!");
      setToastIsOpen(true);

      setTimeout(() => {
        setToastIsOpen(false);
        router.push("/home");
      }, 2000);
    } catch (err: any) {
      setToastType("error");
      setToastMessage(err.response?.data?.message || "Erro ao agendar.");
      setToastIsOpen(true);
      setTimeout(() => setToastIsOpen(false), 3000);
    }
  };

  return (
    <>
      <Head>
        <title>Novo Agendamento - Espaço Mulher</title>
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
                {/* 1. SELECIONA PROFISSIONAL (JOELMA, NIVIA, ETC) */}
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

                {/* 2. CATEGORIA (FILTRADA POR PROFISSIONAL) */}
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

                {/* 3. SERVIÇO (FILTRADO POR PROFISSONAL + CATEGORIA) */}
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
                      timeIntervals={60}
                      dateFormat="dd/MM/yyyy - HH:mm"
                      locale="pt-BR"
                      className={styles.input}
                      minDate={new Date()}
                    />
                  </div>
                </FormGroup>

                <Button className={styles.btnSubmit} onClick={handleBook}>
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
