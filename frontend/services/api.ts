const API_URL = "http://127.0.0.1:8001";

interface ApiRequestOptions extends RequestInit {
  token?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * Recupera o token JWT armazenado no navegador.
 *
 * O acesso ao localStorage é protegido para evitar problemas, caso a função seja executada fora do ambiente do navegador.
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("forgehub_token");
}

/**
 * Executa requisições HTTP para a API do ForgeHub.
 *
 * Centraliza a URL base, os headers e a autenticação JWT, evitando que cada serviço precise implementar essa lógica.
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  headers.set("Content-Type", "application/json");

  const authToken = token ?? getStoredToken();

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      errorBody || `Erro na API: ${response.status}`,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  name: string;
  role: string;
}

export interface Notification {
  id: number;
  user_id: number;
  task_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Busca as notificações do usuário autenticado.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function getNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications");
}

/**
 * Marca uma notificação como lida.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<Notification> {
  return apiRequest<Notification>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    },
  );
}

/**
 * Autentica o usuário na API e retorna o token JWT.
 */
export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const body = new URLSearchParams();

  body.append("username", username);
  body.append("password", password);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      errorBody || `Erro ao realizar login: ${response.status}`,
    );
  }

  return response.json() as Promise<LoginResponse>;
}

/**
 * Cria um novo usuário na API.
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      errorBody || `Erro ao realizar cadastro: ${response.status}`,
    );
  }
}

/**
 * Busca todos os projetos disponíveis para o usuário autenticado.
 */
export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>("/projects");
}

/**
 * Busca os membros de um projeto.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function getProjectMembers(
  projectId: number,
): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(
    `/projects/${projectId}/members`,
  );
}

/**
 * Cria um novo projeto para o usuário autenticado.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function createProject(
  name: string,
  description: string,
): Promise<Project> {
  return apiRequest<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

/**
 * Atualiza os dados de um projeto existente.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function updateProject(
  projectId: number,
  name: string,
  description: string,
): Promise<Project> {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

/**
 * Exclui um projeto existente.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function deleteProject(
  projectId: number,
): Promise<void> {
  await apiRequest<unknown>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Busca todas as tarefas de um projeto.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function getTasks(
  projectId: number,
): Promise<Task[]> {
  return apiRequest<Task[]>(
    `/projects/${projectId}/tasks`,
  );
}

/**
 * Cria uma nova tarefa dentro de um projeto.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function createTask(
  projectId: number,
  title: string,
  description: string | null,
  status: TaskStatus,
  priority: TaskPriority,
  assigneeId: number | null,
): Promise<Task> {
  return apiRequest<Task>(
    `/projects/${projectId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId,
      }),
    },
  );
}

/**
 * Busca uma tarefa específica dentro de um projeto.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function getTask(
  projectId: number,
  taskId: number,
): Promise<Task> {
  return apiRequest<Task>(
    `/projects/${projectId}/tasks/${taskId}`,
  );
}

/**
 * Atualiza uma tarefa existente.
 *
 * O JWT é adicionado automaticamente pelo apiRequest().
 */
export async function updateTask(
  projectId: number,
  taskId: number,
  title: string,
  description: string | null,
  status: TaskStatus,
  priority: TaskPriority,
  assigneeId: number | null,
): Promise<Task> {
  return apiRequest<Task>(
    `/projects/${projectId}/tasks/${taskId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId,
      }),
    },
  );
}

/**
 * Exclui uma tarefa existente.
 *
 * O backend retorna 204 No Content, tratado pelo apiRequest().
 */
export async function deleteTask(
  projectId: number,
  taskId: number,
): Promise<void> {
  await apiRequest<unknown>(
    `/projects/${projectId}/tasks/${taskId}`,
    {
      method: "DELETE",
    },
  );
}

