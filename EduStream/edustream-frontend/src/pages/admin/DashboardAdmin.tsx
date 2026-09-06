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

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('tous');
  const [loading, setLoading] = useState(true);

  // Modal création
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UserForm>({ name: '', email: '', password: '', role: 'etudiant' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal édition
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [editSaving, setEditSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users')
      .then(res => setUsers(res.data.data || res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  /* ── Créer un compte ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/users', form);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'etudiant' });
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Modifier un utilisateur ── */
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    try {
      await api.put(`/users/${editUser.id}`, editForm);
      setEditUser(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Supprimer ── */
  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Administration</h1>
          <p className={styles.subtitle}>Gestion globale de la plateforme EduStream</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowCreate(true)}>+ Créer un compte</button>
      </div>

      {/* Stats */}
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

      {/* ── Modal création ── */}
      {showCreate && (
        <div style={overlayStyle} onClick={() => setShowCreate(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Créer un compte</h3>
              <button style={closeBtnStyle} onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={formStyle}>
              <label style={labelStyle}>Nom complet *</label>
              <input style={inputStyle} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" />
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
              <label style={labelStyle}>Mot de passe *</label>
              <input style={inputStyle} required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 caractères" minLength={8} />
              <label style={labelStyle}>Rôle *</label>
              <select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="etudiant">Étudiant</option>
                <option value="enseignant">Enseignant</option>
                <option value="admin">Administrateur</option>
              </select>
              {formError && <div style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" style={cancelBtnStyle} onClick={() => setShowCreate(false)}>Annuler</button>
                <button type="submit" style={saveBtnStyle} disabled={saving}>{saving ? 'Création...' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal édition ── */}
      {editUser && (
        <div style={overlayStyle} onClick={() => setEditUser(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Modifier l'utilisateur</h3>
              <button style={closeBtnStyle} onClick={() => setEditUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit} style={formStyle}>
              <label style={labelStyle}>Nom complet</label>
              <input style={inputStyle} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              <label style={labelStyle}>Rôle</label>
              <select style={inputStyle} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="etudiant">Étudiant</option>
                <option value="enseignant">Enseignant</option>
                <option value="admin">Administrateur</option>
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" style={cancelBtnStyle} onClick={() => setEditUser(null)}>Annuler</button>
                <button type="submit" style={saveBtnStyle} disabled={editSaving}>{editSaving ? 'Enregistrement...' : 'Modifier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Gestion des utilisateurs</h2>
          <div className={styles.filters}>
            <input className={styles.searchInput} type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <th>Inscription</th>
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
                      <div className={styles.userName}>{u.name}</div>
                    </div>
                  </td>
                  <td className={styles.email}>{u.email}</td>
                  <td>
                    <span className={`${styles.pill} ${styles['pill_' + u.role]}`}>{u.role}</span>
                  </td>
                  <td className={styles.date}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(u)} title="Modifier">✏️</button>
                      {u.role !== 'admin' && (
                        <button className={styles.delBtn} onClick={() => handleDelete(u.id)} title="Supprimer">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Aucun utilisateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Styles inline pour les modals ── */
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
  boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden',
};
const modalHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8',
};
const formStyle: React.CSSProperties = {
  padding: 22, display: 'flex', flexDirection: 'column', gap: 12,
};
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: -6,
};
const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 18px', background: '#f1f5f9', border: 'none',
  borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
};
const saveBtnStyle: React.CSSProperties = {
  padding: '9px 22px', background: '#22c55e', border: 'none',
  borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
};
