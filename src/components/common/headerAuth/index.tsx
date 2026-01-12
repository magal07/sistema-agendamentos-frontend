import Link from "next/link";
import {
  Container,
  Modal as ConfirmModal, // Renomeamos o Modal do Reactstrap para não conflitar
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import styles from "./styles.module.scss";
import Modal from "react-modal"; // Modal do dropdown (mantido)
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import profileService from "../../../services/profileService";
import InstallButton from "../../common/installButton";

Modal.setAppElement("#__next");

const HeaderAuth = function () {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false); // Estado do Dropdown
  const [logoutModalOpen, setLogoutModalOpen] = useState(false); // Estado do Modal de Confirmação

  const [initials, setInitials] = useState("");
  const [userRole, setUserRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      const role = user.role ? user.role.toLowerCase() : "";
      const firstNameInitial = user.firstName.slice(0, 1);
      const lastNameInitial = user.lastName.slice(0, 1);
      setInitials(firstNameInitial + lastNameInitial);
      setUserRole(role);

      if (user.avatarUrl) {
        setAvatarUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/${user.avatarUrl}`);
      }
    });
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // 1. Ao clicar em Sair no dropdown, fecha o dropdown e abre a confirmação
  const handleLogoutClick = () => {
    setModalOpen(false);
    setLogoutModalOpen(true);
  };

  // 2. Executa o logout de fato
  const confirmLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <>
      <div className={styles.nav}>
        <Container className={styles.navContainer}>
          <Link href="/home">
            <img src="/logo.png" alt="logo" className={styles.imgLogoNav} />
          </Link>

          <div className="d-flex align-items-center">
            {(userRole === "professional" ||
              userRole === "admin" ||
              userRole === "client") && (
              <Link href="/agenda" style={{ textDecoration: "none" }}>
                <div className={styles.agendaLink}>
                  <span>MINHA AGENDA</span>
                </div>
              </Link>
            )}

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

          {/* DROPDOWN MENU (MANTIDO IGUAL) */}
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

            {/* Alterado para chamar a confirmação */}
            <p className={styles.modalLink} onClick={handleLogoutClick}>
              Sair
            </p>
          </Modal>
        </Container>
      </div>

      {/* NOVO: MODAL DE CONFIRMAÇÃO (BOOTSTRAP) */}
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
