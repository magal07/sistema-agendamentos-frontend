import Head from "next/head";
import { Container, Button, Row, Col } from "reactstrap";
import HeaderNoAuth from "../src/components/homeNoAuth/headerNoAuth";
import Footer from "../src/components/common/footer";
import styles from "../styles/homeNoAuth.module.scss"; // force homeNoAuth case sensisitve!
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import Link from "next/link";

const HomeNoAuth = () => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <>
      <Head>
        <title>Espaço Virtuosa - Beleza & Bem-estar</title>

        {/* 1. Ícone da aba do navegador (Usa o favicon.png que você tem) */}
        <link rel="shortcut icon" href="/favicon.png" />

        {/* 2. Configuração para WhatsApp / Facebook (Open Graph) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://espacovirtuosa.com.br/" />
        <meta property="og:title" content="Espaço Virtuosa - Agendamentos" />
        <meta
          property="og:description"
          content="Agende seu horário online com facilidade e exclusividade."
        />

        <meta
          property="og:image"
          content="https://espacovirtuosa.com.br/og-image.jpg"
        />

        {/* 3. Ícone de "App" para iPhone (iOS ignora o manifest, precisa dessa linha) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* 4. Cor da barra de status (Combinando com seu manifest) */}
        <meta name="theme-color" content="#b06075" />

        {/* 5. Arquivo Manifest (Aqui estão os ícones 192 e 512 para Android) */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <main className={styles.main}>
        {/* Seção Hero / Apresentação */}
        <div className={styles.presentationSection}>
          <div className={styles.presentationOverlay}>
            <HeaderNoAuth />
            <Container className={styles.presentationContainer}>
              <h1 className={`display-4 ${styles.title}`} data-aos="fade-up">
                SEU MOMENTO DE{" "}
                <span className={styles.highlightText}>CUIDADO</span>
              </h1>
              <p
                className={styles.subtitle}
                data-aos="fade-up"
                data-aos-delay="200"
              >
                Um refúgio de tranquilidade e beleza. <br />
                Descubra tratamentos exclusivos pensados para você.
              </p>
              <Link href="/login">
                <Button
                  className={styles.ctaButton}
                  data-aos="zoom-in"
                  data-aos-delay="400"
                >
                  AGENDAR VISITA
                </Button>
              </Link>
            </Container>
          </div>
        </div>

        {/* Seção de Serviços */}
        <Container className={styles.servicesSection}>
          <h2 className={styles.servicesTitle}>Menu de Serviços</h2>
          <Row>
            <Col md={4} className="mb-4">
              <div className={styles.serviceCard}>
                <h4 className={styles.cardTitle}>MANICURE E PEDICURE</h4>
                <p className={styles.servicePrice}>A partir de R$ 60,00</p>
                <p className={styles.serviceDescription}>
                  Manicure completa com esfoliação e hidratação especial.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className={styles.serviceCard}>
                <h4 className={styles.cardTitle}>LASH DESIGN</h4>
                <p className={styles.servicePrice}>A partir de R$ 110,00</p>
                <p className={styles.serviceDescription}>
                  Renovação e melhoria dos seus cílios.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className={styles.serviceCard}>
                <h4 className={styles.cardTitle}>SOBRANCELHAS</h4>
                <p className={styles.servicePrice}>A partir de R$ 38,00</p>
                <p className={styles.serviceDescription}>
                  Renove sua sombrancelha e sinta-se linda novamente.
                </p>
              </div>
            </Col>
          </Row>
        </Container>

        <Footer />
      </main>
    </>
  );
};

export default HomeNoAuth;
