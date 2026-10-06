import styles from "@/styles/Ui.module.css";
import { classNames } from "@/styles/classNames";
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
    <section className={styles['dashboard-panel']}>
      <div className={styles['panel-header']}>
        <div>
          <h2>Projetos recentes</h2>
          <p>Projetos atualizados recentemente.</p>
        </div>

        <span className={styles['panel-link']}>Ver todos</span>
      </div>

      <div className={styles['project-list']}>
        {projects.map((project) => (
          <div className={styles['project-item']} key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <span>Projeto #{project.id}</span>
            </div>

            <span
              className={classNames(styles, `status-badge ${
                project.status === "Ativo" ? "status-active" : "status-completed"
              }`)}
            >
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}