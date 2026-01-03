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
import { categoryService } from "../src/services/categoriesService";
import { professionalService } from "../src/services/professionalService";
import ToastComponent from "../src/components/common/toast";

registerLocale("pt-BR", ptBR);

export default function Book() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Estados para o Toast (Padronizado para usar o CSS centralizado)
  const [toastIsOpen, setToastIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Dados das listas
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Selecionados
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const catsData = await categoryService.findAll();
        setCategories(Array.isArray(catsData) ? catsData : catsData.rows || []);

        const profsData = await professionalService.getAll();
        setProfessionals(
          Array.isArray(profsData) ? profsData : profsData.rows || []
        );
      } catch (err) {
        setToastType("error");
        setToastMessage("Erro ao carregar dados iniciais.");
        setToastIsOpen(true);
        setTimeout(() => setToastIsOpen(false), 3000);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      if (!selectedCat) {
        setServices([]);
        return;
      }
      try {
        const categoryDetails = await categoryService.findById(
          Number(selectedCat)
        );
        setServices(
          categoryDetails?.services || categoryDetails?.Services || []
        );
      } catch (err) {
        setServices([]);
      }
    };
    loadServices();
  }, [selectedCat]);

  const handleBook = async () => {
    if (!selectedProf || !selectedService || !startDate) {
      setToastType("error"); // Usando o padrão de erro (vermelho)
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

      // Sucesso: Informa (DarkPrimary) e redireciona
      setToastType("success");
      setToastMessage("Agendamento realizado com sucesso!");
      setToastIsOpen(true);

      setTimeout(() => {
        setToastIsOpen(false);
        router.push("/home");
      }, 2000);
    } catch (err: any) {
      setToastType("error");
      setToastMessage(
        err.response?.data?.message || "Erro ao realizar agendamento."
      );
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
              Escolha o profissional e o serviço ideal para você.
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
                <FormGroup>
                  <Label className={styles.label}>Profissional</Label>
                  <Input
                    type="select"
                    className={styles.select}
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

                <FormGroup>
                  <Label className={styles.label}>Categoria</Label>
                  <Input
                    type="select"
                    className={styles.select}
                    value={selectedCat}
                    onChange={(e) => {
                      setSelectedCat(e.target.value);
                      setSelectedService("");
                    }}
                  >
                    <option value="">Selecione...</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>

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
                        ? "Selecione o serviço..."
                        : "Selecione uma categoria primeiro"}
                    </option>
                    {services?.map((s) => (
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
                  Cancelar e Voltar
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
