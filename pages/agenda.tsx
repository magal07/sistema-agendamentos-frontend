import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HeaderAuth from "../src/components/common/headerAuth";
import AgendaComponent from "../src/components/common/agenda";
import ProfessionalAgenda from "../src/components/dashboard/ProfessionalAgenda";
import {
  Container,
  Button,
  Spinner,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import profileService from "../src/services/profileService";
import { professionalService } from "../src/services/professionalService"; // Importante
import styles from "../styles/agenda.module.scss";
import MenuMobile from "../src/components/common/menuMobile";

interface Props {
  professionalId?: number | null;
}

const AgendaPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Novos estados para gestão de múltiplas profissionais
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const token = sessionStorage.getItem("onebitflix-token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const user = await profileService.fetchCurrent();
        setUserRole(user.role);

        // Se for admin ou dono, busca todas as profissionais da unidade
        if (user.role === "admin" || user.role === "company_admin") {
          const profsData = await professionalService.getAll();
          setProfessionals(profsData);
          // Opcional: Iniciar com a primeira profissional da lista
          if (profsData.length > 0) setSelectedProfId(profsData[0].id);
        }

        setLoading(false);
      } catch (error) {
        router.push("/login");
      }
    };

    checkPermission();
  }, [router]);

  if (loading) {
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
        <title>Minha Agenda | Espaço Virtuosa</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>

      <main className={styles.main}>
        <HeaderAuth />

        <Container className="mt-5 pb-5">
          {showManagement ? (
            // Passamos o ID selecionado para a tabela de gestão também
            <ProfessionalAgenda professionalId={selectedProfId} />
          ) : (
            <>
              <div className={styles.headerSection}>
                <h2 className={styles.title}>Minha Agenda 🌸</h2>

                <div className="d-flex gap-2 flex-wrap justify-content-end">
                  {userRole !== "client" && (
                    <Button
                      color="primary"
                      className={styles.configBtn}
                      onClick={() => setShowManagement(true)}
                    >
                      Gerencie seus Agendamentos 📋
                    </Button>
                  )}

                  {userRole !== "client" && (
                    <Button
                      className={styles.configBtn}
                      outline
                      onClick={() => router.push("/availability")}
                    >
                      Configurar Horários ⚙️
                    </Button>
                  )}
                </div>
              </div>

              {/* SELETOR DE PROFISSIONAL (Aparece apenas para ADMIN/COMPANY_ADMIN) */}
              {(userRole === "admin" || userRole === "company_admin") && (
                <FormGroup
                  className="mb-4"
                  style={{
                    maxWidth: "350px",
                    backgroundColor: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <Label className="fw-bold">Visualizar Agenda de:</Label>
                  <Input
                    type="select"
                    value={selectedProfId || ""}
                    onChange={(e) => setSelectedProfId(Number(e.target.value))}
                  >
                    <option value="">Selecione uma profissional...</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              )}

              <p className={styles.subtitle}>
                Visualize os agendamentos no calendário mensal.
              </p>

              {/* Passamos o ID para o calendário buscar os eventos corretos */}
              <AgendaComponent professionalId={selectedProfId} />
            </>
          )}
        </Container>
        <MenuMobile />
      </main>
    </>
  );
};

export default AgendaPage;
