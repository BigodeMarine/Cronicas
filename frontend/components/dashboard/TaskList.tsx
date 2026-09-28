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
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Tarefas recentes</h2>
          <p>Acompanhe o andamento das tarefas.</p>
        </div>

        <span className="panel-link">Ver todas</span>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <div className="task-item" key={task.id}>
            <div className="task-info">
              <strong>{task.title}</strong>
              <span>{task.status}</span>
            </div>

            <span
              className={`priority-badge priority-${task.priority
                .toLowerCase()
                .replace("é", "e")}`}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}