import { Button, Container } from "reactstrap";
import styles from "./styles.module.scss";
import Link from "next/link";
import InstallButton from "../../common/installButton";

const HeaderNoAuth = function () {
  return (
    <>
      <div className={styles.ctaSection}>
        <img
          src="/homeNoAuth/logoTopo.png"
          alt="logoTopo"
          className={styles.imgCta}
        />
        <Link className={styles.txtHeader} href="/register">
          <p>
            <strong>CADASTRE-SE PARA AGENDAR UM HORÁRIO</strong>
          </p>
        </Link>
        <img
          src="/homeNoAuth/logoTopo.png"
          alt="logoTopo"
          className={styles.imgCta}
        />
      </div>
      <Container className={styles.nav}>
        <Link href="/login">
          <img src="/logo.png" alt="logo" className={styles.imgLogoNav} />
        </Link>
        <div>
          <InstallButton />
          <Link href="/login">
            <Button className={styles.navBtn} outline>
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button className={styles.navBtn} outline>
              Quero fazer parte
            </Button>
          </Link>
        </div>
      </Container>
    </>
  );
};

export default HeaderNoAuth;
