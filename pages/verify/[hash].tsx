import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import { Container, Spinner } from "reactstrap";
import api from "../../src/services/api";
import styles from "../../styles/verify.module.scss";

interface CertificateData {
  valid: boolean;
  studentName: string;
  courseName: string;
  completionDate: string;
}

export default function VerifyCertificate() {
  const router = useRouter();
  const { hash } = router.query;
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hash) return;

    // Removemos o token do header para esta requisição, pois é pública
    // Mas como sua instância 'api' pode ter interceptors injetando token,
    // o backend ignora token nessa rota, então tudo bem mandar se tiver.
    api
      .get(`/certificates/validate/${hash}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [hash]);

  return (
    <>
      <Head>
        <title>Verificação de Certificado | Sistema de Agendamentos</title>
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      </Head>
      <main className={styles.mainContainer}>
        <Container className="d-flex flex-column align-items-center justify-content-center h-100">
          <img src="/logo.png" alt="VerboMAX" className={styles.logo} />

          <div className={styles.card}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spinner color="warning" />
                <p>Verificando autenticidade...</p>
              </div>
            ) : error || !data?.valid ? (
              <div className={styles.invalid}>
                <div className={styles.iconCircleRed}>✖</div>
                <h2>Certificado Não Encontrado</h2>
                <p>
                  O código informado não corresponde a um certificado válido em
                  nossa base de dados.
                </p>
              </div>
            ) : (
              <div className={styles.valid}>
                <img
                  src="/episode/iconCheck.png"
                  alt="Válido"
                  className={styles.checkIcon}
                />
                <h2>Certificado Autêntico</h2>
                <p className={styles.subtitle}>
                  Documento emitido oficialmente pela VerboMAX Education.
                </p>

                <div className={styles.infoGroup}>
                  <label>Aluno(a):</label>
                  <h3>{data.studentName}</h3>
                </div>

                <div className={styles.infoGroup}>
                  <label>Curso Concluído:</label>
                  <h3>{data.courseName}</h3>
                </div>

                <div className={styles.infoGroup}>
                  <label>Data de Emissão:</label>
                  <p>
                    {new Date(data.completionDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className={styles.hashDisplay}>
                  Código de Validação: <strong>{hash}</strong>
                </div>
              </div>
            )}
          </div>

          <p className={styles.footer}>© Sistema de Agendamentos</p>
        </Container>
      </main>
    </>
  );
}
