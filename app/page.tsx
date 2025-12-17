"use client";

import { useRef, useState } from "react";
import PixelGrid28x28, {
  type PixelGridHandle,
  getGridVectorFromRef,
} from "./components/PixelGrid28x28";

export default function HomePage() {
  const gridRef = useRef<PixelGridHandle>(null);
  const [preview, setPreview] = useState<string>("Clique em Obter vetor para ver os 10 primeiros valores.");

  const handleShowVector = () => {
    const values = getGridVectorFromRef(gridRef);
    const previewValues = values.slice(0, 10).map((value) => value.toFixed(2));
    setPreview(`Primeiros valores: ${previewValues.join(", ")}. Total: ${values.length}`);
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <header>
        <h1 style={{ margin: "0 0 8px" }}>Bem-vindo ao projeto Next.js</h1>
        <p style={{ margin: 0 }}>Grid 28×28 pronto para desenho com mouse ou toque.</p>
      </header>

      <PixelGrid28x28 ref={gridRef} />

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleShowVector}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "14px",
            fontWeight: 600,
            background: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Obter vetor
        </button>
        <span style={{ fontSize: "14px" }}>{preview}</span>
      </div>
    </main>
  );
}
