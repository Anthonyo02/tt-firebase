// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        height:"100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "2rem",
        overflow:"hidden"
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: "bold" }}>404</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
        Oups 😕 la page que vous cherchez n’existe pas.
      </p>

      <Link
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          backgroundColor: "#000",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}
