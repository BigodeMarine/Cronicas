import styles from "@/styles/Ui.module.css";
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <article className={styles["stat-card"]}>
      <div className={styles["stat-card-header"]}>
        <span className={styles["stat-card-title"]}>{title}</span>
        <span className={styles["stat-card-icon"]}>{icon}</span>
      </div>

      <strong className={styles["stat-card-value"]}>{value}</strong>

      <span className={styles["stat-card-description"]}>{description}</span>
    </article>
  );
}
