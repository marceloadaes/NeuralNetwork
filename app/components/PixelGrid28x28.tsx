"use client";

import {
  forwardRef,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const GRID_SIZE = 28;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

export type PixelGridHandle = {
  /** Retorna os valores atuais em ordem linha por linha. */
  getValues: () => number[];
  /** Reseta todos os valores para 0. */
  clear: () => void;
};

type PixelGrid28x28Props = {
  /** Tamanho do lado de cada célula em pixels. */
  cellSize?: number;
};

/**
 * Grid 28×28 desenhável com suporte a mouse e toque (pointer events).
 * Cada célula guarda uma intensidade entre 0 (branco) e 1 (preto).
 */
export const PixelGrid28x28 = forwardRef<PixelGridHandle, PixelGrid28x28Props>(
  function PixelGrid28x28({ cellSize = 14 }, ref) {
    const [grid, setGrid] = useState<number[]>(() => new Array(TOTAL_CELLS).fill(0));
    const gridRef = useRef(grid);
    const isDrawingRef = useRef(false);

    useEffect(() => {
      gridRef.current = grid;
    }, [grid]);

    const stopDrawing = useCallback(() => {
      isDrawingRef.current = false;
    }, []);

    const setCell = useCallback((row: number, col: number, value: number) => {
      const index = row * GRID_SIZE + col;

      setGrid((previous) => {
        if (previous[index] === value) return previous;
        const next = [...previous];
        next[index] = value;
        return next;
      });
    }, []);

    const paintFromEvent = useCallback(
      (event: PointerEvent<HTMLDivElement>, row: number, col: number) => {
        // Usa a pressão do toque se disponível para permitir tons de cinza mais suaves.
        const pressure = event.pressure && event.pressure > 0 ? event.pressure : 1;
        const intensity = Math.min(1, Math.max(0, pressure));
        setCell(row, col, intensity);
      },
      [setCell],
    );

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>, row: number, col: number) => {
        event.preventDefault();
        isDrawingRef.current = true;
        paintFromEvent(event, row, col);
      },
      [paintFromEvent],
    );

    const handlePointerEnter = useCallback(
      (event: PointerEvent<HTMLDivElement>, row: number, col: number) => {
        if (!isDrawingRef.current || event.buttons === 0) return;
        paintFromEvent(event, row, col);
      },
      [paintFromEvent],
    );

    const clear = useCallback(() => {
      setGrid(new Array(TOTAL_CELLS).fill(0));
      stopDrawing();
    }, [stopDrawing]);

    useImperativeHandle(
      ref,
      () => ({
        getValues: () => [...gridRef.current],
        clear,
      }),
      [clear],
    );

    return (
      <section
        style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}
        aria-label="Desenho 28 por 28 pixels"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            border: "1px solid #d1d5db",
            touchAction: "none",
          }}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        >
          {Array.from({ length: GRID_SIZE }).map((_, row) =>
            Array.from({ length: GRID_SIZE }).map((__, col) => {
              const index = row * GRID_SIZE + col;
              const intensity = grid[index];
              const gray = Math.round(255 * (1 - intensity));
              const color = `rgb(${gray}, ${gray}, ${gray})`;

              return (
                <div
                  key={`${row}-${col}`}
                  role="button"
                  aria-label={`Célula linha ${row + 1}, coluna ${col + 1}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: color,
                    touchAction: "none",
                  }}
                  onPointerDown={(event) => handlePointerDown(event, row, col)}
                  onPointerEnter={(event) => handlePointerEnter(event, row, col)}
                />
              );
            }),
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={clear}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: 600,
              background: "#f9fafb",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </section>
    );
  },
);

/**
 * Retorna o vetor de 784 posições a partir de uma ref do componente.
 * Caso a ref ainda não tenha sido preenchida, devolve um vetor zerado.
 */
export function getGridVectorFromRef(ref: RefObject<PixelGridHandle>): number[] {
  return ref.current ? ref.current.getValues() : new Array(TOTAL_CELLS).fill(0);
}

export default PixelGrid28x28;
