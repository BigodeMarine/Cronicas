import { notFound } from 'next/navigation';
import CharacterDetail from '@/components/characters/CharacterDetail';
export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) notFound();
  return <CharacterDetail id={Number(id)} />;
}
