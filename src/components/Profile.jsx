// src/components/Profile.jsx
import React, { useState } from 'react';
import { changePassword, updateUserEmail } from '../services/db';

const Profile = ({ currentUser, onLogout, setMatchesTrigger }) => {
  const [emailInput, setEmailInput] = useState(currentUser.email || '');
  const [emailMsg, setEmailMsg] = useState('');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    setEmailMsg('');

    try {
      updateUserEmail(currentUser.id, emailInput.trim());
      currentUser.email = emailInput.trim(); // Sync locally
      setEmailMsg('Correo corporativo actualizado.');
      setMatchesTrigger(prev => prev + 1);
      setTimeout(() => setEmailMsg(''), 3000);
    } catch (err) {
      setEmailMsg('Error al actualizar el correo.');
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 4) {
      setPwError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    try {
      changePassword(currentUser.id, currentPassword, newPassword);
      setPwSuccess('¡Contraseña cambiada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMatchesTrigger(prev => prev + 1);
    } catch (err) {
      setPwError(err.message || 'Error al cambiar la contraseña.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      
      {/* Profile Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 4px 10px var(--primary-glow)'
          }}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{currentUser.name}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Rol: <strong>{currentUser.isAdmin ? 'Administrador' : 'Miembro del Equipo'}</strong>
            </p>
          </div>
        </div>

        <button 
          onClick={onLogout} 
          className="btn-danger" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Corporate Email Settings */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📧 Configuración de Correo Corporativo</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Tu dirección de correo comercial para la integración de tareas en Google Calendar.
          </p>
        </div>

        <form onSubmit={handleUpdateEmail} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="email" 
            value={emailInput} 
            onChange={(e) => setEmailInput(e.target.value)} 
            placeholder="ejemplo@conquer.com"
            style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Guardar
          </button>
        </form>

        {emailMsg && (
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            ✓ {emailMsg}
          </div>
        )}
      </div>

      {/* Change Password Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>🔑 Cambiar Contraseña</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Actualiza tus credenciales de acceso para mayor seguridad.
          </p>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Contraseña Actual:</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="Contraseña actual..."
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nueva Contraseña:</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Mínimo 4 caracteres..."
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Confirmar Nueva Contraseña:</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Repite la nueva contraseña..."
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          {pwError && (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--danger)',
              fontWeight: 600,
              padding: '0.4rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              textAlign: 'center'
            }}>
              ⚠️ {pwError}
            </div>
          )}

          {pwSuccess && (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--success)',
              fontWeight: 600,
              padding: '0.4rem',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              textAlign: 'center'
            }}>
              ✓ {pwSuccess}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
          >
            Actualizar Contraseña
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
