import React from "react";
import { Navigate } from "react-big-calendar";
import { Button, ButtonGroup } from "reactstrap";
import styles from "./styles.module.scss"; // Vamos adicionar estilos novos aqui

const CustomToolbar = (toolbar: any) => {
  // Função para navegar (Anterior, Hoje, Próximo)
  const goToBack = () => {
    toolbar.onNavigate(Navigate.PREVIOUS);
  };

  const goToNext = () => {
    toolbar.onNavigate(Navigate.NEXT);
  };

  const goToCurrent = () => {
    toolbar.onNavigate(Navigate.TODAY);
  };

  // Função para mudar a view (Mês, Semana, Dia)
  const changeView = (view: any) => {
    toolbar.onView(view);
  };

  // Verifica qual view está ativa para destacar o botão
  const isMonth = toolbar.view === "month";
  const isWeek = toolbar.view === "week";
  const isDay = toolbar.view === "day";

  return (
    <div className={styles.customToolbar}>
      {/* Parte Superior: Navegação e Título */}
      <div className={styles.toolbarTop}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={goToBack}>
            <i className="bi bi-chevron-left"></i> &#8249; {/* Seta Esquerda */}
          </button>

          <span
            className={styles.toolbarLabel}
            onClick={goToCurrent}
            title="Voltar para Hoje"
          >
            {toolbar.label}
          </span>

          <button className={styles.navBtn} onClick={goToNext}>
            &#8250; {/* Seta Direita */} <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Parte Inferior: Seletor de View (Mês, Semana, Dia) */}
      <div className={styles.toolbarBottom}>
        <ButtonGroup size="sm" className={styles.viewSwitcher}>
          <Button
            color="primary"
            outline={!isMonth}
            className={isMonth ? styles.activeViewBtn : styles.viewBtn}
            onClick={() => changeView("month")}
          >
            Mês
          </Button>
          <Button
            color="primary"
            outline={!isWeek}
            className={isWeek ? styles.activeViewBtn : styles.viewBtn}
            onClick={() => changeView("week")}
          >
            Semana
          </Button>
          <Button
            color="primary"
            outline={!isDay}
            className={isDay ? styles.activeViewBtn : styles.viewBtn}
            onClick={() => changeView("day")}
          >
            Dia
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default CustomToolbar;
