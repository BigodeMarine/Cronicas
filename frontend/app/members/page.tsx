import { redirect } from "next/navigation";
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  redirect(
    projectId
      ? `/journal?campaignId=${encodeURIComponent(projectId)}&tab=participants`
      : "/journal",
  );
}
