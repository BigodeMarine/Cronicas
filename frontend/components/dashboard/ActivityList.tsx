interface Activity {
  id: number;
  description: string;
  time: string;
}

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Atividade recente</h2>
          <p>Últimas ações realizadas no workspace.</p>
        </div>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <div className="activity-item" key={activity.id}>
            <span className="activity-dot" />

            <div>
              <strong>{activity.description}</strong>
              <span>{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}