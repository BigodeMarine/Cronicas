import { authorizedFetch } from './journal';
export interface Page<T> { items: T[]; total: number; offset: number; limit: number }
export type CharacterStatus = 'active' | 'retired' | 'dead';
export const statusLabels: Record<CharacterStatus, string> = { active: 'Ativo', retired: 'Aposentado', dead: 'Morto' };
export interface VaultFile { id: number; filename: string; media_type: string; size: number; created_at: string }
export interface Character { id: number; name: string; system: string; history: string | null; status: CharacterStatus; created_at: string; updated_at: string; portrait: VaultFile | null; sheet: VaultFile | null }
export interface Participation { id: number; character_id: number; project_id: number; campaign_name: string; external_url: string | null; created_at: string; sheet: VaultFile | null }
export interface CharacterNote { id: number; participation_id: number; title: string; content: string; session_id: number | null; session_date: string | null; created_at: string; updated_at: string }

export function validateFile(file: File, portrait = false) {
  if (file.size > (portrait ? 5 : 10) * 1024 * 1024) throw new Error(`O limite é de ${portrait ? 5 : 10} MB.`);
  if (!file.size) throw new Error('O arquivo está vazio.');
  if (!(portrait ? /\.(png|jpe?g)$/i : /\.(pdf|png|jpe?g)$/i).test(file.name)) throw new Error(portrait ? 'Use um retrato PNG ou JPEG.' : 'Use uma ficha PDF, PNG ou JPEG.');
}
export async function uploadVaultFile(path: string, file: File, portrait = false): Promise<VaultFile> {
  validateFile(file, portrait);
  const form = new FormData(); form.set('file', file);
  return (await authorizedFetch(path, { method: 'POST', body: form })).json();
}
export async function privateBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  return (await authorizedFetch(path, { signal })).blob();
}
/** Downloads usam o JWT, sem links públicos ou tokens na URL. */
export async function downloadVaultFile(path: string, file: VaultFile) {
  const blob = await privateBlob(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
