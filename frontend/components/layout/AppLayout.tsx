"use client";
import { usePathname } from "next/navigation";
import DiaryBookShell from "@/components/book/DiaryBookShell";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (["/", "/login", "/register"].includes(pathname)) return <>{children}</>;
  return <DiaryBookShell>{children}</DiaryBookShell>;
}
