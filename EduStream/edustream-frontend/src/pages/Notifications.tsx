import styles from './etudiant/DashboardEtudiant.module.css';

export default function Notifications() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.subtitle}>Restez informé de votre activité sur EduStream</p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: 48,
        textAlign: 'center',
        color: '#64748b',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
          Aucune notification pour le moment
        </p>
        <p style={{ fontSize: 14 }}>
          Vous serez notifié ici lors de nouvelles inscriptions, publications de cours ou mises à jour de progression.
        </p>
      </div>
    </div>
  );
}
