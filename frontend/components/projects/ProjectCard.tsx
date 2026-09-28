"use client";

import type { Project } from "@/services/api";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const router = useRouter();
  const createdAt = new Date(project.created_at).toLocaleDateString(
    "pt-BR",
  );

  return (
    <article className="project-card">
      <div className="project-card-icon">⚒</div>

      <div className="project-card-content">
        <h3>{project.name}</h3>

        <p>{project.description}</p>

        <span>Criado em {createdAt}</span>
      </div>

      <div className="project-card-actions">
        <button
          className="project-action-button"
          onClick={() => onEdit(project)}
        >
          Editar
        </button>

        <button
          className="project-action-button"
          onClick={() => router.push(`/members?projectId=${project.id}`)}
        >
          Participantes
        </button>

        <button
          className="project-action-button project-delete-button"
          onClick={() => onDelete(project)}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}