import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // 1. Import do Router
import { Container, Row, Col, Button, Input } from "reactstrap";
import HeaderAuth from "../../src/components/common/headerAuth";
import Footer from "../../src/components/common/footer";
import PageSpinner from "../../src/components/common/spinner"; // 2. Import do Spinner
import styles from "../../styles/reports.module.scss";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { professionalService } from "../../src/services/professionalService";
import profileService from "../../src/services/profileService"; // 3. Import do ProfileService
import reportsService, {
  DashboardData,
} from "../../src/services/reportsService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import MenuMobile from "../../src/components/common/menuMobile";

// Configuração do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

registerLocale("pt-BR", ptBR);

export default function FinancialReport() {
  const router = useRouter(); // Hook de navegação
  const [pageLoading, setPageLoading] = useState(true); // Loading de Segurança (Tela inteira)
  const [loading, setLoading] = useState(false); // Loading do Filtro (Apenas botão/dados)

  // Filtros
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedProf, setSelectedProf] = useState("");
  const [professionals, setProfessionals] = useState<any[]>([]);

  // Dados do Relatório
  const [data, setData] = useState<DashboardData | null>(null);

  // --- EFEITO DE INICIALIZAÇÃO E SEGURANÇA ---
  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Verifica quem é o usuário
        const user = await profileService.fetchCurrent();

        // 2. Trava de Segurança
        if (user.role !== "admin" && user.role !== "company_admin") {
          router.push("/home"); // Redireciona quem não tem permissão
          return;
        }

        // 3. Se passou, carrega os Profissionais
        const profResponse = await professionalService.getAll();
        setProfessionals(
          Array.isArray(profResponse) ? profResponse : profResponse.rows || []
        );

        // 4. Carrega os dados iniciais do relatório (Mês atual)
        setLoading(true);
        const reportResult = await reportsService.getFinancialDashboard({
          startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
          endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
          professionalId: undefined, // Começa vendo todos
        });
        setData(reportResult);
        setLoading(false);

        // 5. Libera a tela
        setPageLoading(false);
      } catch (error) {
        console.error("Erro na inicialização", error);
        router.push("/"); // Se der erro de token, joga pro login
      }
    };

    initPage();
  }, []);

  // --- AÇÃO DO BOTÃO FILTRAR ---
  const handleFilter = async () => {
    setLoading(true);
    try {
      const result = await reportsService.getFinancialDashboard({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        professionalId: selectedProf || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Erro ao filtrar relatório", error);
      alert("Erro ao buscar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Formata moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Dados para o Gráfico
  const chartData = {
    labels: ["Receita Bruta", "Comissões Pagas", "Despesas", "Lucro Líquido"],
    datasets: [
      {
        label: "Valores (R$)",
        data: data
          ? [
              data.summary.totalRevenue,
              data.summary.totalCommission,
              data.summary.totalExpenses,
              data.summary.netProfit,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          "rgba(76, 209, 55, 0.6)", // Verde (Receita)
          "rgba(251, 197, 49, 0.6)", // Amarelo (Comissão)
          "rgba(232, 65, 24, 0.6)", // Vermelho (Despesa)
          "rgba(255, 159, 243, 0.8)", // Rosa (Lucro)
        ],
        borderColor: [
          "rgba(76, 209, 55, 1)",
          "rgba(251, 197, 49, 1)",
          "rgba(232, 65, 24, 1)",
          "rgba(255, 159, 243, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Visão Geral do Período",
      },
    },
  };

  // BLOQUEIO VISUAL ENQUANTO VERIFICA
  if (pageLoading) {
    return <PageSpinner />;
  }

  return (
    <>
      <Head>
        <title>Relatórios Financeiros | Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.main}>
        <HeaderAuth />

        {/* --- HEADER --- */}
        <div className={styles.headerSection}>
          <Container>
            <h1 className={styles.pageTitle}>Relatório Financeiro</h1>
            <p className="text-muted">Acompanhe o desempenho do seu negócio</p>
          </Container>
        </div>

        <Container>
          {/* --- FILTROS --- */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label>Data Início</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => {
                  if (date) setStartDate(date);
                }}
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Data Fim</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => {
                  if (date) setEndDate(date);
                }}
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                className={styles.dateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Profissional</label>
              <Input
                type="select"
                value={selectedProf}
                onChange={(e) => setSelectedProf(e.target.value)}
                className={styles.dateInput}
              >
                <option value="">Todos da Empresa (Incluindo Eu)</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </Input>
            </div>

            <button
              className={styles.btnFilter}
              onClick={handleFilter}
              disabled={loading}
            >
              {loading ? "Carregando..." : "FILTRAR RESULTADOS"}
            </button>
          </div>

          {/* --- KPIs (Cards) --- */}
          {data && (
            <Row className="g-4">
              <Col md={3} sm={6}>
                <div className={`${styles.kpiCard} ${styles.revenue}`}>
                  <span className={styles.kpiLabel}>Faturamento Total</span>
                  <span className={styles.kpiValue}>
                    {formatCurrency(data.summary.totalRevenue)}
                  </span>
                </div>
              </Col>
              <Col md={3} sm={6}>
                <div className={`${styles.kpiCard} ${styles.commission}`}>
                  <span className={styles.kpiLabel}>Comissões Pagas</span>
                  <span className={styles.kpiValue}>
                    {formatCurrency(data.summary.totalCommission)}
                  </span>
                </div>
              </Col>
              <Col md={3} sm={6}>
                <div className={`${styles.kpiCard} ${styles.expenses}`}>
                  <span className={styles.kpiLabel}>Despesas da Loja</span>
                  <span className={styles.kpiValue}>
                    {formatCurrency(data.summary.totalExpenses)}
                  </span>
                </div>
              </Col>
              <Col md={3} sm={6}>
                <div className={`${styles.kpiCard} ${styles.profit}`}>
                  <span className={styles.kpiLabel}>Lucro Líquido</span>
                  <span className={styles.kpiValue}>
                    {formatCurrency(data.summary.netProfit)}
                  </span>
                </div>
              </Col>
            </Row>
          )}

          {/* --- GRÁFICO --- */}
          <div className={styles.chartSection}>
            {data ? (
              <Bar options={chartOptions} data={chartData} />
            ) : (
              <p className="text-center text-muted">
                Carregando dados do gráfico...
              </p>
            )}
          </div>
        </Container>
        <Footer />
        <MenuMobile />
      </main>
    </>
  );
}
