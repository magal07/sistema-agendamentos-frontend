import Head from "next/head";
import styles from "../styles/HomeNoAuth.module.scss";
import HeaderNoAuth from "../src/components/homeNoAuth/headerNoAuth";
import PresentationSection from "../src/components/homeNoAuth/presentationSection";
import CardsSection from "../src/components/homeNoAuth/cardsSection";
import Footer from "../src/components/common/footer";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const HomeNoAuth = () => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <>
      <Head>
        <title>Agende seu Horário</title>
        <link rel="shortcut icon" href="/favicon.svg" type="image/x-icon" />
        <meta property="og:title" content="SistemaAgendamentos" key="title" />
        <meta
          name="description"
          content="O melhor estilo para o seu visual. Agende agora!"
        />
      </Head>
      <main>
        <div
          className={styles.sectionBackground}
          data-aos="fade-zoom-in"
          data-aos-duration="1600"
        >
          <HeaderNoAuth />
          <PresentationSection />
        </div>

        {/* Seção de Diferenciais (Antigos Cards) */}
        <div data-aos="fade-right" data-aos-duration="1200">
          <CardsSection />
        </div>

        <Footer />
      </main>
    </>
  );
};

export default HomeNoAuth;
