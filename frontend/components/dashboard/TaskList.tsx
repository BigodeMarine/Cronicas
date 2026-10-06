import styles from "@/styles/Ui.module.css";
import { classNames } from "@/styles/classNames";
interface Task {
  id: number;
  title: string;
  priority: "Baixa" | "Média" | "Alta" | "Urgente";
  status: "A fazer" | "Em andamento" | "Concluída";
}

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <section className={styles['dashboard-panel']}>
      <div className={styles['panel-header']}>
        <div>
          <h2>Tarefas recentes</h2>
          <p>Acompanhe o andamento das tarefas.</p>
        </div>

        <span className={styles['panel-link']}>Ver todas</span>
      </div>

      <div className={styles['task-list']}>
        {tasks.map((task) => (
          <div className={styles['task-item']} key={task.id}>
            <div className={styles['task-info']}>
              <strong>{task.title}</strong>
              <span>{task.status}</span>
            </div>

            <span
              className={classNames(styles, `priority-badge priority-${task.priority
                .toLowerCase()
                .replace("é", "e")}`)}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}