import Link from "next/link";
import { Container, Form, Input } from "reactstrap";
import styles from "./styles.module.scss";
import Modal from "react-modal";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import profileService from "../../../services/profileService";
import InstallButton from "../../common/installButton";

Modal.setAppElement("#__next");

const HeaderAuth = function () {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [initials, setInitials] = useState("");
  const [searchName, setSearchName] = useState("");
  const [userRole, setUserRole] = useState("");

  // 1. NOVO ESTADO PARA A FOTO
  const [avatarUrl, setAvatarUrl] = useState("");

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`search?name=${searchName}`);
    setSearchName("");
  };

  const handleSearchClick = () => {
    router.push(`search?name=${searchName}`);
    setSearchName("");
  };

  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      const role = user.role ? user.role.toLowerCase() : "";
      const firstNameInitial = user.firstName.slice(0, 1);
      const lastNameInitial = user.lastName.slice(0, 1);
      setInitials(firstNameInitial + lastNameInitial);
      setUserRole(role);

      // 2. PEGAR A FOTO DO BACKEND (SE EXISTIR)
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
  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <>
      <Container className={styles.nav}>
        <Link href="/home">
          <img src="/logo.png" alt="logo" className={styles.imgLogoNav} />
        </Link>
        <div className="d-flex align-items-center">
          {/* LINK MINHA AGENDA */}
          {(userRole === "professional" ||
            userRole === "admin" ||
            userRole === "client") && ( // Obs: Corrigi a lógica aqui que tinha uma string "client" solta
            <Link href="/agenda" style={{ textDecoration: "none" }}>
              <div className={styles.agendaLink}>
                <span>MINHA AGENDA</span>
              </div>
            </Link>
          )}

          <InstallButton />

          {/* 3. LÓGICA VISUAL: FOTO OU INICIAIS */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="profile"
              className={styles.userProfile}
              onClick={handleOpenModal}
              // Importante: object-fit cover para a foto não ficar achatada
              style={{ objectFit: "cover" }}
            />
          ) : (
            <p className={styles.userProfile} onClick={handleOpenModal}>
              {initials}
            </p>
          )}
        </div>
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
          <p className={styles.modalLink} onClick={handleLogout}>
            Sair
          </p>
        </Modal>
      </Container>
    </>
  );
};

export default HeaderAuth;
