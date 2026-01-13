import { Container } from "reactstrap";
import styles from "./style.module.scss";
import { companyInfo } from "../../../config/company";

const Footer = function () {
  return (
    <>
      <Container className={styles.footer}>
        <img
          src="/logo.png"
          alt={`Logo ${companyInfo.name}`}
          className={styles.footerLogo}
        />

        {/* Puxa o endereço do arquivo de configuração */}
        <p className={styles.footerAddress}>{companyInfo.address}</p>

        {/* Opcional: Adicionar link para contato */}
        {/* <div className={styles.footerContact}>
          <a href={companyInfo.instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div> */}
      </Container>
    </>
  );
};

export default Footer;
