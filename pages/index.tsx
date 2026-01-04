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
        <title>Espaço Mulher - Beleza & Bem-estar</title>
        <link rel="shortcut icon" href="/favicon.png" />
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
                <h4 className={styles.cardTitle}>MANICURE OU PEDICURE</h4>
                <p className={styles.servicePrice}>A partir de R$ 39,90</p>
                <p className={styles.serviceDescription}>
                  Manicure completa com esfoliação e hidratação especial.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className={styles.serviceCard}>
                <h4 className={styles.cardTitle}>LASH DESIGN</h4>
                <p className={styles.servicePrice}>A partir de R$ 149,90</p>
                <p className={styles.serviceDescription}>
                  Renovação e melhoria dos seus cílios.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className={styles.serviceCard}>
                <h4 className={styles.cardTitle}>SOBRANCELHAS</h4>
                <p className={styles.servicePrice}>A partir de R$ 35,90</p>
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
