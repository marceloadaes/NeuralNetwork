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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      gridRef.current = grid;
    }, [grid]);

    const setCell = useCallback((row: number, col: number, value: number) => {
      const index = row * GRID_SIZE + col;

      setGrid((previous) => {
        const clamped = Math.min(1, Math.max(0, value));
        const nextValue = Math.max(previous[index], clamped);
        if (previous[index] === nextValue) return previous;
        const next = [...previous];
        next[index] = nextValue;
        return next;
      });
    }, []);

    /**
     * Converte a posição do ponteiro relativa ao container em linha/coluna do grid
     * e calcula a intensidade baseada na distância até o centro da célula.
     */
    const getCellFromPointer = useCallback(
      (event: PointerEvent<HTMLDivElement>): { row: number; col: number; intensity: number } | null => {
        const container = containerRef.current;
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Distância do ponteiro até o centro da célula atual.
        const cellCenterX = (col + 0.5) * cellSize;
        const cellCenterY = (row + 0.5) * cellSize;
        const distance = Math.hypot(cellCenterX - x, cellCenterY - y);

        // Pincel suave: intensidade decai linearmente até o raio ser alcançado.
        const maxRadius = cellSize / 2;
        const intensity = Math.max(0, 1 - distance / maxRadius);

        return { row, col, intensity };
      },
      [cellSize],
    );

    const paintFromPointer = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        const cell = getCellFromPointer(event);
        if (!cell) return;
        setCell(cell.row, cell.col, cell.intensity);
      },
      [getCellFromPointer, setCell],
    );

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        isDrawingRef.current = true;
        paintFromPointer(event);
        // Captura o ponteiro para continuar desenhando mesmo se sair do container.
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      [paintFromPointer],
    );

    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (!isDrawingRef.current) return;
        paintFromPointer(event);
      },
      [paintFromPointer],
    );

    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (isDrawingRef.current) {
          paintFromPointer(event);
        }
        stopDrawing(event);
      },
      [paintFromPointer, stopDrawing],
    );

    const stopDrawing = useCallback((event?: PointerEvent<HTMLDivElement>) => {
      if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      isDrawingRef.current = false;
    }, []);

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
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
                  }}
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
