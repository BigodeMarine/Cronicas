interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-icon">{icon}</span>
      </div>

      <strong className="stat-card-value">{value}</strong>

      <span className="stat-card-description">{description}</span>
    </article>
  );
}