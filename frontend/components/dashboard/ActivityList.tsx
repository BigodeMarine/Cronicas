import styles from "@/styles/Ui.module.css";
interface Activity {
  id: number;
  description: string;
  time: string;
}

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  return (
    <section className={styles["dashboard-panel"]}>
      <div className={styles["panel-header"]}>
        <div>
          <h2>Atividade recente</h2>
          <p>Últimas ações realizadas no workspace.</p>
        </div>
      </div>

      <div className={styles["activity-list"]}>
        {activities.map((activity) => (
          <div className={styles["activity-item"]} key={activity.id}>
            <span className={styles["activity-dot"]} />

            <div>
              <strong>{activity.description}</strong>
              <span>{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
