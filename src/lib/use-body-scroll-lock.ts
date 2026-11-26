/**
 * Hook universal para bloquear el desplazamiento del body (fondo)
 * cuando cualquier modal o panel emergente se encuentra abierto.
 * Pío Pío Asadero & Restaurante
 */

import { useEffect } from "react";

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calcular ancho de la barra de scroll para evitar salto visual en escritorio
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow || "unset";
      document.body.style.paddingRight = originalPaddingRight || "unset";
    };
  }, [isLocked]);
}
