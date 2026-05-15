import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profil() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const roleLabel: Record<string, string> = {
    admin: 'Administrateur',
    enseignant: 'Enseignant',
    etudiant: 'Étudiant',
  };

  const roleColor: Record<string, string> = {
    admin: '#f59e0b',
    enseignant: '#6366f1',
    etudiant: '#3b82f6',
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>Mon profil</h1>

      {/* Avatar */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: roleColor[user?.role || 'etudiant'],
          color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 26, fontWeight: 700,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{user?.name}</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
          <span style={{
            display: 'inline-block', marginTop: 6,
            padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: roleColor[user?.role || 'etudiant'] + '20',
            color: roleColor[user?.role || 'etudiant'],
          }}>
            {roleLabel[user?.role || 'etudiant']}
          </span>
        </div>
      </div>

      {/* Infos */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#374151' }}>
          Informations du compte
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Nom complet
            </label>
            <input
              defaultValue={user?.name}
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Adresse email
            </label>
            <input
              defaultValue={user?.email}
              type="email"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Rôle
            </label>
            <input
              value={roleLabel[user?.role || 'etudiant']}
              disabled
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, background: '#f8fafc', color: '#94a3b8',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{
            marginTop: 20, background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}
        >
          {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
