import { Container } from "reactstrap";
import styles from "./styles.module.scss";

const CardsSection = function () {
  return (
    <>
      <p className={styles.sectionTitle}>O QUE OFERECEMOS PARA O SEU ESTILO:</p>
      <Container className="d-flex flex-wrap justify-content-center gap-4 pb-5">
        <div className={styles.card1}>
          <p className={styles.cardTitle}>CORTE DE CABELO</p>
          <p className={styles.cardDescription}>
            Profissionais experientes prontos para realizar desde cortes
            clássicos até as tendências mais modernas, garantindo que você saia
            com o visual perfeito.
          </p>
        </div>
        <div className={styles.card2}>
          <p className={styles.cardTitle}>Espaço Virtuosa</p>
          <p className={styles.cardDescription}>
            Tratamento completo com toalha quente, alinhamento perfeito e
            hidratação.
          </p>
        </div>
        <div className={styles.card3}>
          <p className={styles.cardTitle}>AMBIENTE RELAXANTE</p>
          <p className={styles.cardDescription}>
            Um espaço pensado para você relaxar. Tome uma cerveja ou café
            enquanto aguarda ou durante o seu atendimento.
          </p>
        </div>
        {/* Você pode remover ou adaptar os cards 4, 5 e 6 se não precisar deles */}
      </Container>
    </>
  );
};

export default CardsSection;
