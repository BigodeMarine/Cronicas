export default function Home() {
  return (
    <div className="dashboard">
      <section className="dashboard-intro">
        <div>
          <h2>Suas Crônicas</h2>
          <p>
            Organize suas campanhas e registre os acontecimentos
            das suas aventuras de RPG.
          </p>
        </div>
      </section>

      <section className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <span className="dashboard-welcome-icon" aria-hidden="true"></span>
          <h2>Suas histórias começam aqui</h2>
          <p>
            Crie uma campanha e comece a registrar os momentos
            importantes da sua jornada.
          </p>

          <a href="/projects" className="dashboard-primary-action">
            Nova campanha
          </a>
        </div>
      </section>
    </div>
  );
}