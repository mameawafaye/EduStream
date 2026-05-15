import { useEffect, useState } from 'react';
import api from '../../api/axios';
import styles from './DashboardAdmin.module.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('tous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.data || res.data)).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'tous' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    etudiants: users.filter(u => u.role === 'etudiant').length,
    enseignants: users.filter(u => u.role === 'enseignant').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try { await api.delete(`/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)); } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Administration</h1>
          <p className={styles.subtitle}>Gestion globale de la plateforme EduStream</p>
        </div>
        <button className={styles.newBtn}>+ Créer un compte</button>
      </div>

      <div className={styles.stats}>
        {[
          { icon: '👥', val: stats.total, label: 'Utilisateurs total', color: styles.purple },
          { icon: '🎓', val: stats.etudiants, label: 'Étudiants', color: styles.blue },
          { icon: '👨‍🏫', val: stats.enseignants, label: 'Enseignants', color: styles.green },
          { icon: '⚙', val: stats.admins, label: 'Administrateurs', color: styles.orange },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Gestion des utilisateurs</h2>
          <div className={styles.filters}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="🔍 Rechercher un utilisateur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className={styles.roleSelect} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="tous">Tous les rôles</option>
              <option value="etudiant">Étudiant</option>
              <option value="enseignant">Enseignant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={`${styles.avatar} ${styles['role_' + u.role]}`}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{u.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.email}>{u.email}</td>
                  <td>
                    <span className={`${styles.pill} ${styles['pill_' + u.role]}`}>{u.role}</span>
                  </td>
                  <td className={styles.date}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn}>✏️</button>
                      {u.role !== 'admin' && (
                        <button className={styles.delBtn} onClick={() => handleDelete(u.id)}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
