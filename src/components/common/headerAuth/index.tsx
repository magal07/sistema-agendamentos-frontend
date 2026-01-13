import Link from "next/link";
import {
  Container,
  Modal as ConfirmModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import styles from "./styles.module.scss";
import Modal from "react-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import profileService from "../../../services/profileService";
import InstallButton from "../../common/installButton";

Modal.setAppElement("#__next");

const HeaderAuth = function () {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const [initials, setInitials] = useState("");
  const [userRole, setUserRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [dashboardLink, setDashboardLink] = useState("/home");

  useEffect(() => {
    profileService
      .fetchCurrent()
      .then((user) => {
        const role = user.role ? user.role.toLowerCase() : "";
        const firstNameInitial = user.firstName.slice(0, 1);
        const lastNameInitial = user.lastName.slice(0, 1);

        setInitials(firstNameInitial + lastNameInitial);
        setUserRole(role);

        if (user.avatarUrl) {
          setAvatarUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/${user.avatarUrl}`);
        }

        if (role === "client") {
          setDashboardLink("/client/dashboard");
        } else {
          setDashboardLink("/admin/dashboard");
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleLogoutClick = () => {
    setModalOpen(false);
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <>
      <div className={styles.nav}>
        {/* Adicionei position: relative aqui para o absolute funcionar dentro */}
        <Container
          className={styles.navContainer}
          style={{ position: "relative" }}
        >
          {/* 1. ESQUERDA: LOGO */}
          <Link href={dashboardLink}>
            <img src="/logo.png" alt="logo" className={styles.imgLogoNav} />
          </Link>

          {/* 2. CENTRO: NOME DO SISTEMA COM BRILHO (Posicionamento Absoluto) */}
          {(userRole === "professional" ||
            userRole === "admin" ||
            userRole === "client") && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%", // Adicionei top: 50% para centralizar verticalmente também
                // Ajustei o translate. Se quiser jogar pra direita, diminua o -50%. Ex: -40%
                // Mas o correto matemático é -50%. Se parecer torto, é porque os itens da esquerda (logo) e direita (avatar) têm larguras diferentes.
                // Se quiser compensar visualmente para a direita, pode usar 'translateX(-40%)' ou adicionar 'marginLeft: "20px"'
                transform: "translate(-50%, -50%)",
                zIndex: 1,
                width: "max-content", // Garante que a div não quebre linha
              }}
            >
              <Link href={dashboardLink} className={styles.brandTitle}>
                ESPAÇO VIRTUOSA
              </Link>
            </div>
          )}

          {/* 3. DIREITA: BOTÃO APP + AVATAR */}
          <div className="d-flex align-items-center">
            <InstallButton />

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="profile"
                className={styles.userProfile}
                onClick={handleOpenModal}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <p className={styles.userProfile} onClick={handleOpenModal}>
                {initials}
              </p>
            )}
          </div>

          {/* MENUS MODAIS (Sem alterações) */}
          <Modal
            isOpen={modalOpen}
            onRequestClose={handleCloseModal}
            shouldCloseOnEsc={true}
            className={styles.modal}
            overlayClassName={styles.overlayModal}
          >
            <Link href="/profile">
              <p className={styles.modalLink}>Meus Dados</p>
            </Link>

            <Link href={dashboardLink}>
              <p className={styles.modalLink}>
                {userRole === "client" ? "Minha Área" : "Painel de Gestão"}
              </p>
            </Link>

            <p className={styles.modalLink} onClick={handleLogoutClick}>
              Sair
            </p>
          </Modal>
        </Container>
      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        toggle={() => setLogoutModalOpen(false)}
        centered
        size="sm"
      >
        <ModalHeader
          toggle={() => setLogoutModalOpen(false)}
          className="text-danger"
        >
          Sair do Sistema
        </ModalHeader>
        <ModalBody>Tem certeza que deseja sair da sua conta?</ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            outline
            onClick={() => setLogoutModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button color="danger" onClick={confirmLogout}>
            Sair
          </Button>
        </ModalFooter>
      </ConfirmModal>
    </>
  );
};

export default HeaderAuth;
