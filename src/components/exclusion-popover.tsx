"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Ban, X } from "lucide-react";

export function ExclusionPopover({ label, title, children }: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const backdropPressed = useRef(false);
  const [open, setOpen] = useState(false);

  function close() {
    dialogRef.current?.close();
  }

  return <>
    <button ref={triggerRef} type="button" className="icon-button" aria-label={label}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={id}
      onClick={() => { dialogRef.current?.showModal(); setOpen(true); }}>
      <Ban size={17} />
    </button>
    <dialog ref={dialogRef} id={id} className="exclusion-dialog" aria-labelledby={`${id}-title`}
      onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
      onPointerDown={(event) => { backdropPressed.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (backdropPressed.current && event.target === event.currentTarget) close();
        backdropPressed.current = false;
      }}>
      <div className="exclusion-menu">
        <div className="exclusion-menu-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close editor" onClick={close}><X size={19} /></button>
        </div>
        <div className="exclusion-menu-content">{children}</div>
        <div className="exclusion-menu-footer"><button type="button" className="button button-primary button-full" onClick={close}>Done</button></div>
      </div>
    </dialog>
  </>;
}
