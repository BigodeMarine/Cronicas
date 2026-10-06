import styles from "@/styles/Ui.module.css";
export default function Home() {
  return (
    <div className={styles['dashboard']}>
      <section className={styles['dashboard-intro']}>
        <div>
          <h2>Suas Crônicas</h2>
          <p>
            Organize suas campanhas e registre os acontecimentos
            das suas aventuras de RPG.
          </p>
        </div>
      </section>

      <section className={styles['dashboard-welcome']}>
        <div className={styles['dashboard-welcome-content']}>
          <span className={styles['dashboard-welcome-icon']} aria-hidden="true"></span>
          <h2>Suas histórias começam aqui</h2>
          <p>
            Crie uma campanha e comece a registrar os momentos
            importantes da sua jornada.
          </p>

          <a href="/projects" className={styles['dashboard-primary-action']}>
            Nova campanha
          </a>
        </div>
      </section>
    </div>
  );
}