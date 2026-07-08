// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { getUsers, loginUser } from '../services/db';

const Login = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingError, setLoadingError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingError('');
        const allUsers = await getUsers();
        const loadedUsers = allUsers.filter(u => u.active);
        setUsers(loadedUsers);
        if (loadedUsers.length > 0) {
          setSelectedUserId(loadedUsers[0].id);
        }
      } catch (err) {
        console.error(err);
        setLoadingError(err.message || 'Error de conexión con la base de datos de Supabase.');
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (loadingError) {
      setErrorMsg('No se puede iniciar sesión sin conexión a la base de datos.');
      return;
    }

    if (!selectedUserId) {
      setErrorMsg('Por favor, selecciona un usuario.');
      return;
    }

    try {
      const user = await loginUser(selectedUserId, password);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-gradient)'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: 'var(--glass-shadow)',
        background: 'var(--panel-bg)'
      }}>
        
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px var(--primary-glow)',
            fontWeight: '800',
            fontSize: '1.5rem',
            color: 'white'
          }}>
            C
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CONQUER FIXTURE
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0', fontWeight: 600, letterSpacing: '0.05em' }}>
              INICIO DE SESIÓN
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {loadingError ? (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--danger)',
              fontWeight: 600,
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>⚠️ Error de Conexión Supabase</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {loadingError}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Tip: Asegúrate de haber reiniciado tu terminal de desarrollo (npm run dev) para leer el archivo .env, y haber ejecutado el script SQL en tu consola de Supabase.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Selecciona tu Usuario:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: '100%' }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.isAdmin ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce tu contraseña..."
              style={{ width: '100%', textAlign: 'center' }}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              💡 Por defecto: nombre + "123" (ej: ariel123) / Admin: admin123
            </span>
          </div>

          {errorMsg && (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--danger)',
              fontWeight: 600,
              padding: '0.5rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              textAlign: 'center'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            Ingresar al Portal
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
