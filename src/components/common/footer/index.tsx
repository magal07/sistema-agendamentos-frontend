import { Container } from "reactstrap";
import styles from "./style.module.scss";

const Footer = function () {
  return (
    <>
      <Container className={styles.footer}>
        <img
          src="/logoVerboMAX.svg"
          alt="logoFooter"
          className={styles.footerLogo}
        />
        <a
          href="https://teobrac.netlify.app/"
          target={"blank"}
          className={styles.footerLink}
        >
          PARCEIRO: TEOBRAC (OBPC-ITU)
        </a>
      </Container>
    </>
  );
};

export default Footer;
