import Link from "next/link";
import {
  Container,
  Form,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"; // <--- Adicione Modal e Button
import styles from "./styles.module.scss";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import profileService from "../../../services/profileService";

const HeaderAuth = function () {
  const router = useRouter();
  const [initials, setInitials] = useState("");
  const [searchName, setSearchName] = useState("");

  // --- 1. ESTADO DO MODAL ---
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    profileService.fetchCurrent().then((user) => {
      const firstNameInitial = user.firstName.slice(0, 1);
      const lastNameInitial = user.lastName.slice(0, 1);
      setInitials(firstNameInitial + lastNameInitial);
    });
  }, []);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/search?name=${searchName}`);
    setSearchName("");
  };

  const handleSearchClick = () => {
    router.push(`/search?name=${searchName}`);
    setSearchName("");
  };

  // --- 2. FUNÇÃO QUE ABRE O MODAL ---
  const handleLogoutClick = (e: any) => {
    e.preventDefault();
    setModalOpen(true);
  };

  // --- 3. FUNÇÃO QUE SAI DE VERDADE ---
  const confirmLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <>
      <Container className={styles.nav}>
        <Link href="/home">
          <img
            src="/logoVerboMAX.svg"
            alt="logoEspaçoVirtuosa"
            className={styles.imgLogoNav}
          />
        </Link>
        <div className="d-flex align-items-center">
          <Form onSubmit={handleSearch}>
            <Input
              name="search"
              type="search"
              placeholder="Pesquisar"
              className={styles.input}
              value={searchName}
              onChange={(event) => {
                setSearchName(event.currentTarget.value.toLowerCase());
              }}
            />
          </Form>
          <img
            src="/homeAuth/iconSearch.svg"
            alt="lupaHeader"
            className={styles.searchImg}
            onClick={handleSearchClick}
          />
          <p
            className={styles.userProfile}
            onClick={() => router.push("/profile")}
          >
            {initials}
          </p>

          {/* Botão Sair (ícone ou texto) - Adicionei um link simples aqui caso não tenha */}
          <a
            href="#"
            onClick={handleLogoutClick}
            className={styles.logoutLink}
            title="Sair"
          >
            <img
              src="/profile/iconUserAccount.svg"
              alt="sair"
              style={{ width: 20, marginLeft: 20 }}
            />
          </a>
        </div>
      </Container>

      {/* --- 4. MODAL DE CONFIRMAÇÃO --- */}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="sm"
      >
        <ModalHeader toggle={() => setModalOpen(false)} className="text-danger">
          Sair do Sistema
        </ModalHeader>
        <ModalBody>Tem certeza que deseja sair da sua conta?</ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="danger" onClick={confirmLogout}>
            Sair Agora
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default HeaderAuth;
