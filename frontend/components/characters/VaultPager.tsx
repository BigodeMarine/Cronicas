import type { Page } from '@/services/characters';
import styles from './Vault.module.css';
export default function VaultPager({ page, onChange, busy = false }: { page: Omit<Page<unknown>, 'items'>; onChange: (offset: number) => void; busy?: boolean }) {
  if (page.total <= page.limit) return null;
  return <nav className={styles.pager} aria-label="Paginação"><button type="button" className={styles.secondary} disabled={busy || page.offset === 0} onClick={() => onChange(Math.max(0, page.offset - page.limit))}>Anterior</button><span>{page.offset + 1}–{Math.min(page.total, page.offset + page.limit)} de {page.total}</span><button type="button" className={styles.secondary} disabled={busy || page.offset + page.limit >= page.total} onClick={() => onChange(page.offset + page.limit)}>Próxima</button></nav>;
}
