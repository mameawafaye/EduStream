import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardEnseignant.module.css';

interface Module {
  id: number;
  titre: string;
}

interface Etudiant {
  id: number;
  name: string;
  email: string;
  inscrit_le: string;
}

export default function MesEtudiants() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/modules')
      .then(res => {
        const mods = res.data.data || res.data;
        setModules(mods);
        if (mods.length > 0) setSelectedModule(mods[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedModule) return;
    setLoading(true);
    api.get(`/modules/${selectedModule}/etudiants`)
      .then(res => setEtudiants(res.data.data || res.data))
      .catch(() => setEtudiants([]))
      .finally(() => setLoading(false));
  }, [selectedModule]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes étudiants</h1>
          <p className={styles.subtitle}>Étudiants inscrits à vos modules</p>
        </div>
      </div>

      {/* Sélecteur de module */}
      {modules.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginRight: 12 }}>
            Module :
          </label>
          <select
            value={selectedModule || ''}
            onChange={e => setSelectedModule(Number(e.target.value))}
            style={{
              padding: '8px 14px', border: '1px solid #e2e8f0',
              borderRadius: 8, fontSize: 14, outline: 'none',
            }}
          >
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.titre}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
      ) : etudiants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <p>Aucun étudiant inscrit à ce module pour le moment.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Étudiant</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#6366f1', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13,
                      }}>
                        {e.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#64748b' }}>{e.email}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>
                    {new Date(e.inscrit_le).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', fontSize: 13, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
            {etudiants.length} étudiant(s) inscrit(s)
          </div>
        </div>
      )}
    </div>
  );
}
