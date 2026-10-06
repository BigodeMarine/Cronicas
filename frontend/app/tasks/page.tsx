import styles from "@/styles/Ui.module.css";
import TasksContent from "@/components/tasks/TasksContent";

export default function TasksPage() {
  return (
    <div className={styles['tasks-page']}>
      <div className={styles['page-header']}>
        <div>
          <h2>Acontecimentos</h2>
          <p>
            Registre e acompanhe os acontecimentos das suas campanhas.
          </p>
        </div>
      </div>

      <TasksContent />
    </div>
  );
}