import ProjectsContent from "@/components/projects/ProjectsContent";

export default function ProjectsPage() {
  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h2>Campanhas</h2>
          <p>Gerencie suas campanhas e registre suas aventuras.</p>
        </div>
      </div>

      <ProjectsContent />
    </div>
  );
}