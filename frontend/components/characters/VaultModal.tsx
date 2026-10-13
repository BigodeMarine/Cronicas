"use client";
import { useEffect, useId, useRef } from 'react';
import styles from './Vault.module.css';

/** O dialog nativo contém o foco; fechar restaura o foco no botão que o abriu. */
export default function VaultModal({ title, busy = false, close, children }: { title: string; busy?: boolean; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const frame = requestAnimationFrame(() => dialog?.querySelector<HTMLElement>('input, textarea, select, button')?.focus());
    return () => { cancelAnimationFrame(frame); dialog?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  function containFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const dialog = ref.current;
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }
  return <dialog onKeyDown={containFocus} ref={ref} className={styles.modal} aria-labelledby={heading} onCancel={e => { e.preventDefault(); if (!busy) close(); }}>
    <h2 id={heading}>{title}</h2>{children}
    <button type="button" className={styles.secondary} disabled={busy} onClick={close}>Fechar</button>
  </dialog>;
}
