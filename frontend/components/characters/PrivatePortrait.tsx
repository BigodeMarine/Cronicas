"use client";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BookSigil } from '@/components/book/BookEntrance';
import { privateBlob, type Character } from '@/services/characters';
import styles from './Vault.module.css';

export default function PrivatePortrait({ character }: { character: Character }) {
  const [source, setSource] = useState<{ key: number; url: string; version: string } | null>(null);
  const key = character.portrait?.id;
  const version = character.portrait?.created_at + ':' + character.portrait?.size;
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController(); let url: string | undefined;
    privateBlob(`/characters/${character.id}/portrait`, controller.signal)
      .then(blob => { if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setSource({ key, url, version }); } })
      .catch(() => { /* A imagem padrão permanece caso o retrato esteja indisponível. */ });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [character.id, key, version]);
  return <div className={styles.portrait}>{source && source.key === key && source.version === version && key ? <Image src={source.url} unoptimized width={240} height={240} alt={`Retrato de ${character.name}`} /> : <><BookSigil /><span>Retrato do personagem</span></>}</div>;
}
