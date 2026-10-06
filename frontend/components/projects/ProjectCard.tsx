"use client";
import styles from "@/styles/Ui.module.css";


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
    <article className={styles['project-card']}>
      <div className={styles['project-card-icon']}>⚒</div>

      <div className={styles['project-card-content']}>
        <h3>{project.name}</h3>

        <p>{project.description}</p>

        <span>Criado em {createdAt}</span>
      </div>

      <div className={styles['project-card-actions']}>
        <button
          className={styles['project-action-button']}
          onClick={() => onEdit(project)}
        >
          Editar
        </button>

        <button
          className={styles['project-action-button']}
          onClick={() => router.push(`/members?projectId=${project.id}`)}
        >
          Participantes
        </button>

        <button
          className={[styles['project-action-button'], styles['project-delete-button']].join(" ")}
          onClick={() => onDelete(project)}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}