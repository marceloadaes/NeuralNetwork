"use client";

import {
  forwardRef,
  type PointerEvent,
  type TouchEvent,
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
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      gridRef.current = grid;
    }, [grid]);

    const stopDrawing = useCallback(() => {
      isDrawingRef.current = false;
      lastPointRef.current = null;
    }, []);

    const setCell = useCallback((row: number, col: number, value: number) => {
      const index = row * GRID_SIZE + col;

      setGrid((previous) => {
        const nextValue = Math.min(1, Math.max(previous[index], value));
        if (previous[index] === nextValue) return previous;
        const next = [...previous];
        next[index] = nextValue;
        return next;
      });
    }, []);

    const getCellFromPosition = useCallback(
      (position: { x: number; y: number }) => {
        const col = Math.floor(position.x / cellSize);
        const row = Math.floor(position.y / cellSize);
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;

        const centerX = (col + 0.5) * cellSize;
        const centerY = (row + 0.5) * cellSize;
        const distance = Math.hypot(position.x - centerX, position.y - centerY);
        const maxDistance = (cellSize / 2) * Math.SQRT2;
        const intensity = Math.max(0, 1 - distance / maxDistance);

        if (intensity <= 0) return null;

        return { row, col, intensity };
      },
      [cellSize],
    );

    const paintAtPosition = useCallback(
      (position: { x: number; y: number }) => {
        const cell = getCellFromPosition(position);
        if (!cell) return;

        setCell(cell.row, cell.col, cell.intensity);
      },
      [getCellFromPosition, setCell],
    );

    const paintLineToPosition = useCallback(
      (position: { x: number; y: number }) => {
        const previous = lastPointRef.current;
        if (!previous) {
          paintAtPosition(position);
          lastPointRef.current = position;
          return;
        }

        const deltaX = position.x - previous.x;
        const deltaY = position.y - previous.y;
        const distance = Math.hypot(deltaX, deltaY);
        const steps = Math.max(1, Math.ceil(distance / (cellSize / 2)));

        for (let step = 1; step <= steps; step++) {
          const t = step / steps;
          paintAtPosition({
            x: previous.x + deltaX * t,
            y: previous.y + deltaY * t,
          });
        }

        lastPointRef.current = position;
      },
      [cellSize, paintAtPosition],
    );

    const getPointerPosition = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (Number.isNaN(x) || Number.isNaN(y)) return null;

      return { x, y };
    }, []);

    const getTouchPosition = useCallback((touch: Touch, rect: DOMRect) => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (Number.isNaN(x) || Number.isNaN(y)) return null;

      return { x, y };
    }, []);

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const position = getPointerPosition(event);
        if (!position) return;

        isDrawingRef.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        paintLineToPosition(position);
      },
      [getPointerPosition, paintLineToPosition],
    );

    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        const position = getPointerPosition(event);
        if (!position) return;

        paintLineToPosition(position);
      },
      [getPointerPosition, paintLineToPosition],
    );

    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        stopDrawing();
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      },
      [stopDrawing],
    );

    const handlePointerCancel = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        stopDrawing();
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      },
      [stopDrawing],
    );

    const handleTouchStart = useCallback(
      (event: TouchEvent<HTMLDivElement>) => {
        event.preventDefault();
        const container = containerRef.current;
        const touch = event.touches[0];
        if (!container || !touch) return;

        const rect = container.getBoundingClientRect();
        const position = getTouchPosition(touch, rect);
        if (!position) return;

        isDrawingRef.current = true;
        lastPointRef.current = null;
        paintLineToPosition(position);
      },
      [getTouchPosition, paintLineToPosition],
    );

    const handleTouchMove = useCallback(
      (event: TouchEvent<HTMLDivElement>) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        const container = containerRef.current;
        const touch = event.touches[0];
        if (!container || !touch) return;

        const rect = container.getBoundingClientRect();
        const position = getTouchPosition(touch, rect);
        if (!position) return;

        paintLineToPosition(position);
      },
      [getTouchPosition, paintLineToPosition],
    );

    const handleTouchEnd = useCallback(
      (event: TouchEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        const touch = event.changedTouches[0];
        if (container && touch) {
          const rect = container.getBoundingClientRect();
          const position = getTouchPosition(touch, rect);
          if (position && isDrawingRef.current) {
            paintLineToPosition(position);
          }
        }

        stopDrawing();
      },
      [getTouchPosition, paintLineToPosition, stopDrawing],
    );

    const handleTouchCancel = useCallback(() => {
      stopDrawing();
    }, [stopDrawing]);

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
          onPointerCancel={handlePointerCancel}
          onPointerLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
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
                    pointerEvents: "none",
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
