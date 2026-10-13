"use client";
import { useId, useRef, useState, type RefObject } from 'react';
import styles from './Vault.module.css';

/** Controle de upload com texto em português, independente do idioma do navegador. */
export default function FilePicker({ label, name, accept, disabled = false, inputRef }: { label: string; name?: string; accept: string; disabled?: boolean; inputRef?: RefObject<HTMLInputElement | null> }) {
  const id = useId();
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  const [filename, setFilename] = useState('');
  return <div className={styles.picker}>
    <label htmlFor={id}>{label}</label>
    <input id={id} ref={ref} className={styles.hiddenFile} type="file" name={name} accept={accept} disabled={disabled} tabIndex={-1} aria-label={label} onChange={event => setFilename(event.target.files?.[0]?.name ?? '')} />
    <div className={styles.fileChoice}><button className={styles.secondary} type="button" disabled={disabled} onClick={() => ref.current?.click()}>Selecionar arquivo</button><span>{filename || 'Nenhum arquivo escolhido'}</span></div>
  </div>;
}
