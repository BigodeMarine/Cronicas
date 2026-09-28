"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getProjectMembers,
  getProjects,
  type ProjectMember,
  type Project,
} from "@/services/api";

export function MembersContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) {
      setError("Campanha não informada.");
      setLoading(false);
      return;
    }

    async function loadMembers() {
      try {
        const [membersData, projectsData] = await Promise.all([
          getProjectMembers(Number(projectId)),
          getProjects(),
        ]);

        const currentProject = projectsData.find(
          (project) => project.id === Number(projectId),
        );

        setMembers(membersData);
        setProject(currentProject ?? null);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os participantes.");
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [projectId]);

  if (loading) {
    return <p>Carregando participantes...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <div>
          <h2>
            Participantes {project ? `— ${project.name}` : "da campanha"}
            </h2>
          <p>Veja os participantes que fazem parte desta campanha.</p>
        </div>
      </div>

      <div className="members-summary">
        <strong>{members.length}</strong>
        <span>
          {members.length === 1 ? "participante" : "participantes"}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>

          <h3>Nenhum participante encontrado</h3>

          <p>
            Esta campanha ainda não possui participantes cadastrados.
          </p>
        </div>
      ) : (
        <section className="members-panel">
          <div className="members-panel-header">
            <h3>Participantes da campanha</h3>
            <p>Pessoas que participam desta campanha.</p>
          </div>

          <div className="members-list">
            {members.map((member) => (
              <div className="member-item" key={member.id}>
                <div className="member-info">
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <span className="member-name">
                      {member.name}
                    </span>

                    <span className="member-user-id">
                      Usuário #{member.user_id}
                    </span>
                  </div>
                </div>

                <span className="member-role">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<p>Carregando participantes...</p>}>
      <MembersContent />
    </Suspense>
  );
}