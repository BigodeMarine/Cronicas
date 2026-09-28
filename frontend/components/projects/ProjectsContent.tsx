"use client";
import { useEffect, useState } from "react";
import ProjectCard from "@/components/projects/ProjectCard";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  type Project,
} from "@/services/api";

export default function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  /**
   * Busca as campanhas do usuário autenticado.
   */
  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProjects();

      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os projetos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Limpa os campos e fecha o formulário de campanha.
   */
  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setName("");
    setDescription("");
    setCreateError(null);
    setEditError(null);
  }

  /**
   * Abre o formulário para criação de uma nova campanha.
   */
  function handleNewProject() {
    setEditingProject(null);
    setName("");
    setDescription("");
    setCreateError(null);
    setEditError(null);
    setShowForm(true);
  }

  /**
  * Abre o formulário preenchido com os dados da campanha selecionada.
   */
  function handleEditProject(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description);
    setCreateError(null);
    setEditError(null);
    setShowForm(true);
  }

  /**
   * Cria uma nova campanha e adiciona o resultado à lista atual.
   */
  async function handleCreateProject(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError(null);

      const project = await createProject(name, description);

      setProjects((currentProjects) => [
        ...currentProjects,
        project,
      ]);

      closeForm();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o projeto.",
      );
    } finally {
      setCreating(false);
    }
  }

  /**
  * Atualiza a campanha selecionada e sincroniza a lista exibida.
   */
  async function handleUpdateProject(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingProject) {
      return;
    }

    try {
      setUpdating(true);
      setEditError(null);

      const updatedProject = await updateProject(
        editingProject.id,
        name,
        description,
      );

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === updatedProject.id
            ? updatedProject
            : project,
        ),
      );

      closeForm();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o projeto.",
      );
    } finally {
      setUpdating(false);
    }
  }

  /**
   * Exclui uma campanha após confirmação do usuário.
   */
  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o projeto "${project.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await deleteProject(project.id);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (currentProject) => currentProject.id !== project.id,
        ),
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o projeto.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="projects-feedback">
        <div className="loading-spinner" />
        <p>Carregando campanhas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-feedback projects-error">
        <h3>Não foi possível carregar as campanhas</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="projects-toolbar">
        <div className="projects-summary">
          <strong>{projects.length}</strong>

          <span>
            {projects.length === 1 ? "campanha" : "campanhas"}
          </span>
        </div>

        <button
          className="primary-button"
          onClick={handleNewProject}
          disabled={deleting}
        >
          + Novo projeto
        </button>
      </div>

      {showForm && (
        <section className="project-form-card">
          <div className="project-form-header">
            <div>
              <h3>
                {editingProject
                  ? "Editar campanha"
                  : "Novo campanha"}
              </h3>

              <p>
                {editingProject
                  ? "Atualize as informações da campanha."
                  : "Crie uma campanha para registrar sua aventura."}
              </p>
            </div>
          </div>

          <form
            className="project-form"
            onSubmit={
              editingProject
                ? handleUpdateProject
                : handleCreateProject
            }
          >
            <div className="form-field">
              <label htmlFor="project-name">
                Nome da campanha
              </label>

              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: As Ruínas de Valdris"
                required
                disabled={creating || updating}
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-description">
                Descrição
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Descreva sua campanha e o cenário da aventura"
                rows={4}
                disabled={creating || updating}
              />
            </div>

            {(createError || editError) && (
              <div className="login-error">
                {createError || editError}
              </div>
            )}

            <div className="project-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
                disabled={creating || updating}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={creating || updating}
              >
                {creating
                  ? "Criando..."
                  : updating
                    ? "Salvando..."
                    : editingProject
                      ? "Salvar alterações"
                      : "Criar campanha"}
              </button>
            </div>
          </form>
        </section>
      )}

      {projects.length === 0 ? (
        <section className="empty-state">
          <div className="empty-state-icon">⚒</div>

          <h3>Nenhuma campanha encontrada</h3>

          <p>
            Crie sua primeira campanha para começar a registrar
            suas aventuras.
          </p>

          <button
            className="primary-button"
            onClick={handleNewProject}
            disabled={deleting}
          >
            Criar primeira campanha
          </button>
        </section>
      ) : (
        <section className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </section>
      )}
    </>
  );
}
