"use client";
import styles from "@/styles/Ui.module.css";
import { classNames } from "@/styles/classNames";

import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getProjects,
  getProjectMembers,
  getTasks,
  updateTask,
  type Project,
  type ProjectMember,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/services/api";

interface ProjectTasks {
  project: Project;
  tasks: Task[];
}

export default function TasksContent() {
  const [projectTasks, setProjectTasks] = useState<ProjectTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectMembers, setProjectMembers] = useState<
    Record<number, ProjectMember[]>
  >({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /**
    * Busca as campanhas do usuário e carrega os acontecimentos de cada campanha.
   */
  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);

      const projects = await getProjects();

      const results = await Promise.all(
        projects.map(async (project) => {
          const [tasks, membersData] = await Promise.all([
            getTasks(project.id),
            getProjectMembers(project.id),
          ]);

          setProjectMembers((current) => ({
            ...current,
            [project.id]: membersData,
          }));

          return {
            project,
            tasks,
          };
        }),
      );

      setProjectTasks(results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os acontecimentos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      return;
    }

    const projectId = selectedProjectId;

    async function loadMembers() {
      try {
        const data = await getProjectMembers(projectId);

        setMembers(data);

        setProjectMembers((current) => ({
          ...current,
          [projectId]: data,
        }));
      } catch (err) {
        console.error(err);
        setMembers([]);
      }
    }

    loadMembers();
  }, [selectedProjectId]);

  /**
   * Abre o formulário para criação de um novo acontecimento.
  */
  function handleNewTask() {
    const firstProject = projectTasks[0]?.project;

    setEditingTask(null);
    setSelectedProjectId(firstProject?.id ?? null);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setAssigneeId(null);
    setCreateError(null);
    setEditError(null);
    setShowForm(true);
  }

  /**
 * Abre o formulário preenchido com os dados do acontecimento selecionado.
 */
  function handleEditTask(task: Task) {
    setEditingTask(task);
    setSelectedProjectId(task.project_id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assignee_id);
    setCreateError(null);
    setEditError(null);
    setShowForm(true);
  }

  /**
   * Fecha o formulário e limpa seus campos.
   */
  function closeForm() {
    setShowForm(false);
    setSelectedProjectId(null);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setAssigneeId(null);
    setCreateError(null);
    setEditingTask(null);
    setEditError(null);
  }

  /**
   * Cria um novo acontecimento na campanha selecionada e atualiza a lista exibida sem recarregar a página.
   */
  async function handleCreateTask(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedProjectId) {
      setCreateError("Selecione uma campanha.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const task = await createTask(
        selectedProjectId,
        title,
        description || null,
        status,
        priority,
        assigneeId,
      );

      setProjectTasks((currentProjects) =>
        currentProjects.map((projectItem) =>
          projectItem.project.id === selectedProjectId
            ? {
              ...projectItem,
              tasks: [...projectItem.tasks, task],
            }
            : projectItem,
        ),
      );

      closeForm();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o acontecimento.",
      );
    } finally {
      setCreating(false);
    }
  }

  /**
   * Atualiza o acontecimento selecionado e sincroniza a lista exibida.
   */
  async function handleUpdateTask(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingTask || !selectedProjectId) {
      return;
    }

    try {
      setUpdating(true);
      setEditError(null);

      const updatedTask = await updateTask(
        editingTask.project_id,
        editingTask.id,
        title,
        description || null,
        status,
        priority,
        assigneeId
      );

      setProjectTasks((currentProjects) =>
        currentProjects.map((projectItem) => ({
          ...projectItem,
          tasks: projectItem.tasks.map((task) =>
            task.id === updatedTask.id
              ? updatedTask
              : task,
          ),
        })),
      );

      closeForm();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o acontecimento.",
      );
    } finally {
      setUpdating(false);
    }
  }

  /**
  * Exclui um acontecimento após confirmação do usuário.
   */
  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a tarefa "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await deleteTask(task.project_id, task.id);

      setProjectTasks((currentProjects) =>
        currentProjects.map((projectItem) => ({
          ...projectItem,
          tasks: projectItem.tasks.filter(
            (currentTask) => currentTask.id !== task.id,
          ),
        })),
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o acontecimento.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles['projects-feedback']}>
        <div className={styles['loading-spinner']} />
        <p>Carregando acontecimentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={[styles['projects-feedback'], styles['projects-error']].join(" ")}>
        <h3>Não foi possível carregar os acontecimentos</h3>
        <p>{error}</p>
      </div>
    );
  }

  const totalTasks = projectTasks.reduce(
    (total, project) => total + project.tasks.length,
    0,
  );

  function getMemberName(
    projectId: number,
    assigneeId: number | null,
  ): string | null {
    if (!assigneeId) {
      return null;
    }

    const member = projectMembers[projectId]?.find(
      (member) => member.user_id === assigneeId,
    );

    return member?.name ?? null;
  }

  return (
    <div className={styles['tasks-content']}>
      <div className={styles['tasks-toolbar']}>
        <div className={styles['tasks-summary']}>
          <strong>{totalTasks}</strong>
          <span>
            {totalTasks === 1 ? "acontecimento" : "acontecimentos"}
          </span>
        </div>

        <button
          className={styles['primary-button']}
          onClick={handleNewTask}
          disabled={projectTasks.length === 0}
        >
          + Novo acontecimento
        </button>
      </div>

      {showForm && (
        <section className={styles['task-form-card']}>
          <div className={styles['project-form-header']}>
            <div>
              <h3>
                {editingTask ? "Editar acontecimento" : "Novo acontecimento"}
              </h3>

              <p>
                {editingTask
                  ? "Atualize as informações do acontecimento."
                  : "Registre um acontecimento importante da sua aventura."}
              </p>
            </div>
          </div>

          <form
            className={styles['project-form']}
            onSubmit={
              editingTask
                ? handleUpdateTask
                : handleCreateTask
            }
          >
            <div className={styles['form-field']}>
              <label htmlFor="task-project">Campanha</label>

              <select
                id="task-project"
                value={selectedProjectId ?? ""}
                onChange={(event) =>
                  setSelectedProjectId(
                    Number(event.target.value),
                  )
                }
                required
                disabled={creating || updating}
              >
                <option value="" disabled>
                  Selecione uma Campanha
                </option>

                {projectTasks.map(({ project }) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles['form-field']}>
              <label htmlFor="task-title">Título</label>

              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: O grupo encontrou as ruínas antigas"
                required
                disabled={creating || updating}
              />
            </div>

            <div className={styles['form-field']}>
              <label htmlFor="task-description">
                Descrição
              </label>

              <textarea
                id="task-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Descreva o que aconteceu durante a aventura"
                rows={4}
                disabled={creating || updating}
              />
            </div>

            <div className={styles['task-form-row']}>
              <div className={styles['form-field']}>
                <label htmlFor="task-status">Status</label>

                <select
                  id="task-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TaskStatus)
                  }
                  disabled={creating || updating}
                >
                  <option value="TODO">A fazer</option>
                  <option value="IN_PROGRESS">
                    Em andamento
                  </option>
                  <option value="DONE">Concluída</option>
                </select>
              </div>

              <div className={styles['form-field']}>
                <label htmlFor="task-priority">
                  Prioridade
                </label>

                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as TaskPriority,
                    )
                  }
                  disabled={creating || updating}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            <div className={styles['form-field']}>
              <label htmlFor="task-assignee">Responsável</label>

              <select
                id="task-assignee"
                value={assigneeId ?? ""}
                onChange={(event) =>
                  setAssigneeId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                disabled={creating || updating}
              >
                <option value="">Sem responsável</option>

                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {(createError || editError) && (
              <div className={styles['login-error']}>
                {createError || editError}
              </div>
            )}
            <div className={styles['project-form-actions']}>
              <button
                type="button"
                className={styles['secondary-button']}
                onClick={closeForm}
                disabled={creating || updating}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={styles['primary-button']}
                disabled={creating || updating}
              >
                {creating
                  ? "Criando..."
                  : updating
                    ? "Salvando..."
                    : editingTask
                      ? "Salvar alterações"
                      : "Registrar acontecimento"}
              </button>
            </div>
          </form>
        </section>
      )}

      {totalTasks === 0 ? (
        <section className={styles['empty-state']}>
          <div className={styles['empty-state-icon']}>✓</div>

          <h3>Nenhum acontecimento encontrado</h3>

          <p>
            Registre o primeiro acontecimento de uma das suas
            campanhas para começar sua crônica.
          </p>

          <button
            className={styles['primary-button']}
            onClick={handleNewTask}
            disabled={projectTasks.length === 0}
          >
            Registrar primeiro acontecimento
          </button>
        </section>
      ) : (
        projectTasks.map(({ project, tasks }) => {
          if (tasks.length === 0) {
            return null;
          }

          return (
            <section
              key={project.id}
              className={styles['tasks-project-section']}
            >
              <div className={styles['tasks-project-header']}>
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                </div>

                <span className={styles['tasks-project-count']}>
                  {tasks.length}
                </span>
              </div>

              <div className={styles['tasks-list']}>
                {tasks.map((task) => {
                  const assigneeName = getMemberName(project.id, task.assignee_id);

                  return (
                    <article
                      key={task.id}
                      className={styles['task-card']}
                    >
                      <div className={styles['task-card-content']}>
                        <h4>{task.title}</h4>

                        {task.description && (
                          <p>{task.description}</p>
                        )}

                        <div className={styles['task-card-meta']}>
                          <span
                            className={classNames(styles, `task-status ${task.status}`)}
                          >
                            {task.status === "TODO"
                              ? "A fazer"
                              : task.status === "IN_PROGRESS"
                                ? "Em andamento"
                                : "Concluído"}
                          </span>

                          <span
                            className={classNames(styles, `task-priority ${task.priority}`)}
                          >
                            {task.priority}
                          </span>

                          {assigneeName && (
                            <span className={styles['task-assignee']}>
                              Responsável: {assigneeName}
                            </span>
                          )}
                        </div>

                        <div className={styles['task-card-actions']}>
                          <button
                            type="button"
                            className={styles['project-action-button']}
                            onClick={() => handleEditTask(task)}
                            disabled={deleting}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={[styles['project-action-button'], styles['project-delete-button']].join(" ")}
                            onClick={() => handleDeleteTask(task)}
                            disabled={deleting}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

