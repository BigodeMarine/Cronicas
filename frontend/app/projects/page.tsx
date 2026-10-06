import styles from "@/styles/Ui.module.css";
import ProjectsContent from "@/components/projects/ProjectsContent";

export default function ProjectsPage() {
  return (
    <div className={styles['projects-page']}>
      <div className={styles['page-header']}>
        <div>
          <h2>Campanhas</h2>
          <p>Gerencie suas campanhas e registre suas aventuras.</p>
        </div>
      </div>

      <ProjectsContent />
    </div>
  );
}