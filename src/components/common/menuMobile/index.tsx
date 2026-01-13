import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import profileService from "../../../services/profileService";
import styles from "./styles.module.scss";

// Ícones (Feather Icons)
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiPieChart,
  FiSearch,
  FiList,
  FiClock,
  FiLogOut,
  FiArrowLeft, // <--- Importe a seta para esquerda
} from "react-icons/fi";

// Definição do tipo do item de menu
interface MenuItem {
  label: string;
  icon: JSX.Element;
  path: string;
}

const MenuMobile = () => {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // --- ESTADO DO MODAL SAIR ---
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    profileService
      .fetchCurrent()
      .then((user) => {
        setRole(user.role);
        defineMenu(user.role);
      })
      .catch(() => {
        setRole("visitor");
      });
  }, []);

  const defineMenu = (userRole: string) => {
    let items: MenuItem[] = [];

    // --- 1. ADMIN / COMPANY ADMIN ---
    if (userRole === "admin" || userRole === "company_admin") {
      items = [
        { label: "Início", icon: <FiHome />, path: "/home" },
        {
          label: "Financeiro",
          icon: <FiPieChart />,
          path: "/reports/financial",
        },
        { label: "Agenda", icon: <FiCalendar />, path: "/agenda" },
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }
    // --- 2. PROFISSIONAL ---
    else if (userRole === "professional") {
      items = [
        { label: "Início", icon: <FiHome />, path: "/home" },
        { label: "Agenda", icon: <FiCalendar />, path: "/agenda" },
        { label: "Horários", icon: <FiClock />, path: "/availability" },
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }
    // --- 3. CLIENTE (PADRÃO) ---
    else {
      items = [
        { label: "Explorar", icon: <FiSearch />, path: "/home" },
        { label: "Meus Agend.", icon: <FiList />, path: "/appointments/me" },
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }

    // --- ADICIONA O BOTÃO SAIR NO FINAL ---
    items.push({ label: "Sair", icon: <FiLogOut />, path: "logout" });

    setMenuItems(items);
  };

  const isActive = (path: string) => {
    if (path === "logout") return "";
    return router.pathname === path ? styles.active : "";
  };

  const handleNavigation = (path: string) => {
    if (path === "logout") {
      setModalOpen(true);
    } else {
      router.push(path);
    }
  };

  const confirmLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  if (!role) return null;

  return (
    <>
      {/* --- BOTÃO FLUTUANTE DE VOLTAR --- */}
      {/* Ele fica fora da .mobileNav para podermos posicionar acima dela */}
      <button
        className={styles.floatingBackBtn}
        onClick={() => router.back()}
        aria-label="Voltar"
      >
        <FiArrowLeft />
        {/* <span>VOLTAR</span> */}
      </button>

      <div className={styles.mobileNav}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`${styles.navItem} ${isActive(item.path)}`}
            onClick={() => handleNavigation(item.path)}
            style={item.path === "logout" ? { color: "#e74c3c" } : {}}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO --- */}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="sm"
        style={{ zIndex: 10000 }}
      >
        <ModalHeader toggle={() => setModalOpen(false)} className="text-danger">
          Deseja sair? 🚪
        </ModalHeader>
        <ModalBody>Você será desconectado do sistema.</ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setModalOpen(false)}>
            Voltar
          </Button>
          <Button color="danger" onClick={confirmLogout}>
            Sim, Sair
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default MenuMobile;
