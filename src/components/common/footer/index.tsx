import { Container } from "reactstrap";
import styles from "./style.module.scss";

const Footer = function () {
  return (
    <>
      <Container className={styles.footer}>
        <img src="/logo.png" alt="logoFooter" className={styles.footerLogo} />
        Rua Jacarandá Branco, 446 - Campo Bonito - CEP: 13349-048 -
        Indaiatuba/SP
      </Container>
    </>
  );
};

export default Footer;
