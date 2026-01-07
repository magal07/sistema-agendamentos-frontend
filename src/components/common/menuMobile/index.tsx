import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import profileService from "../../../services/profileService";
import styles from "./styles.module.scss";

// Ícones (Estou usando react-icons/fi - Feather Icons, que são clean)
// Instale: npm install react-icons
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiPieChart,
  FiSearch,
  FiList,
  FiClock,
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

  useEffect(() => {
    // Busca o usuário para saber o cargo
    profileService
      .fetchCurrent()
      .then((user) => {
        setRole(user.role);
        defineMenu(user.role);
      })
      .catch(() => {
        // Se não estiver logado, define menu público ou redireciona
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
        }, // Acesso rápido ao relatório
        { label: "Agenda", icon: <FiCalendar />, path: "/agenda" }, // Ver a agenda geral
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }

    // --- 2. PROFISSIONAL ---
    else if (userRole === "professional") {
      items = [
        { label: "Início", icon: <FiHome />, path: "/home" },
        { label: "Agenda", icon: <FiCalendar />, path: "/agenda" }, // Foco na agenda dele
        { label: "Horários", icon: <FiClock />, path: "/availability" }, // Configurar disponibilidade
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }

    // --- 3. CLIENTE (PADRÃO) ---
    else {
      items = [
        { label: "Explorar", icon: <FiSearch />, path: "/home" }, // Cliente busca serviços
        { label: "Meus Agend.", icon: <FiList />, path: "/appointments/me" }, // Histórico (precisa criar essa rota se não tiver)
        { label: "Perfil", icon: <FiUser />, path: "/profile" },
      ];
    }

    setMenuItems(items);
  };

  // Função para checar se o link está ativo (visual vermelho/rosa)
  const isActive = (path: string) => {
    return router.pathname === path ? styles.active : "";
  };

  if (!role) return null; // Não mostra nada enquanto carrega

  return (
    <div className={styles.mobileNav}>
      {menuItems.map((item, index) => (
        <div
          key={index}
          className={`${styles.navItem} ${isActive(item.path)}`}
          onClick={() => router.push(item.path)}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MenuMobile;
