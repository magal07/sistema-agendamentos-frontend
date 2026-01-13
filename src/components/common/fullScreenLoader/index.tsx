import { Spinner } from "reactstrap";

export default function FullScreenLoader() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        backgroundColor: "#fff", // Fundo branco para cobrir tudo
        zIndex: 9999, // Fica por cima de qualquer coisa
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner color="dark" style={{ width: "3rem", height: "3rem" }} />
      <p style={{ marginTop: "15px", color: "#666", fontWeight: "500" }}>
        Carregando...
      </p>
    </div>
  );
}
