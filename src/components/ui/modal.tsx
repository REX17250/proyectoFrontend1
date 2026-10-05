"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

// Ventana modal con el elemento nativo <dialog>: ya trae foco atrapado y fondo bloqueado
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-(--radius-card) border border-line bg-surface p-0 text-left text-ink shadow-2xl backdrop:bg-ink/50"
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-xl font-extrabold">
              {title}
            </h2>
            <button onClick={onClose} aria-label="Cerrar" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-50 hover:text-ink">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
