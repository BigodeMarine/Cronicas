interface Project {
  id: number;
  name: string;
  status: "Ativo" | "Concluído";
}

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Projetos recentes</h2>
          <p>Projetos atualizados recentemente.</p>
        </div>

        <span className="panel-link">Ver todos</span>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <div className="project-item" key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <span>Projeto #{project.id}</span>
            </div>

            <span
              className={`status-badge ${
                project.status === "Ativo" ? "status-active" : "status-completed"
              }`}
            >
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}