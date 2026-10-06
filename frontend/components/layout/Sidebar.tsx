"use client";
import styles from "@/styles/Ui.module.css";
import { classNames } from "@/styles/classNames";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Início", href: "/home" },
  { label: "Campanhas", href: "/projects" },
  { label: "Diário da mesa", href: "/journal" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles["sidebar"]}>
      <div className={styles["sidebar-brand"]}>
        <span className={styles["brand-icon"]}>📖</span>
        <span>Crônicas</span>
      </div>

      <nav className={styles["sidebar-nav"]}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                styles,
                `sidebar-link ${isActive ? "active" : ""}`,
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles["sidebar-footer"]}>
        <span className={styles["status-dot"]} />
        <span>Crônicas Online</span>
      </div>
    </aside>
  );
}
