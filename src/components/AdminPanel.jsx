// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  getUsers, 
  addUser, 
  toggleUserActive, 
  getObjections, 
  addObjection, 
  deleteObjection, 
  generateWeeklyMatches,
  getMatches,
  getWeeklyGoal,
  saveWeeklyGoal
} from '../services/db';

const AdminPanel = ({ setMatchesTrigger }) => {
  const [users, setUsers] = useState([]);
  const [objections, setObjections] = useState([]);
  const [matches, setMatches] = useState([]);
  
  // Form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newObjectionLabel, setNewObjectionLabel] = useState('');
  const [weekInput, setWeekInput] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(2);
  const [generationMsg, setGenerationMsg] = useState({ text: '', type: '' });

  // Load configuration
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = await getUsers();
    const allObjections = await getObjections();
    const allMatches = await getMatches();
    
    setUsers(allUsers);
    setObjections(allObjections);
    setMatches(allMatches);

    // Auto-predict next week ID (e.g., "Semana X")
    const weeks = [...new Set(allMatches.map(m => m.weekId))];
    const nextWeekNumber = weeks.length + 1;
    setWeekInput(`Semana ${nextWeekNumber}`);
    
    const goal = await getWeeklyGoal();
    setWeeklyGoal(goal);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      await addUser(newMemberName.trim(), false);
      setNewMemberName('');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (userId) => {
    await toggleUserActive(userId);
    await loadData();
  };

  const handleAddObjection = async (e) => {
    e.preventDefault();
    if (!newObjectionLabel.trim()) return;

    try {
      await addObjection(newObjectionLabel.trim());
      setNewObjectionLabel('');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteObjection = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta objeción? Los cruces existentes que la contengan mantendrán su nombre, pero ya no estará disponible para nuevos cruces.')) {
      await deleteObjection(id);
      await loadData();
    }
  };

  const handleGenerateMatches = async () => {
    if (!weekInput.trim()) {
      setGenerationMsg({ text: 'Por favor, introduce un nombre para la semana/id.', type: 'danger' });
      return;
    }

    const activeUsers = users.filter(u => u.active && !u.isAdmin);
    if (activeUsers.length < 3) {
      setGenerationMsg({ text: 'Error: Se necesitan al menos 3 miembros activos para generar los cruces.', type: 'danger' });
      return;
    }

    try {
      // Check if matches already exist for this week
      const exists = matches.some(m => m.weekId === weekInput.trim());
      if (exists) {
        const confirmOverwrite = confirm(`Ya existen cruces para la "${weekInput.trim()}". ¿Deseas sobreescribirlos? Se borrará el chat y los resultados de esa semana.`);
        if (!confirmOverwrite) return;
      }

      await generateWeeklyMatches(weekInput.trim());
      setGenerationMsg({ 
        text: `¡Cruces generados con éxito para la "${weekInput.trim()}"! Se crearon ${activeUsers.length} cruces (2 por persona).`, 
        type: 'success' 
      });
      
      setMatchesTrigger(prev => prev + 1);
      await loadData();
      
      // Clear msg after 5s
      setTimeout(() => setGenerationMsg({ text: '', type: '' }), 5000);
    } catch (err) {
      setGenerationMsg({ text: `Error al generar: ${err.message}`, type: 'danger' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>⚙️ Panel de Control Administrador</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Administra miembros del equipo, objeciones y genera los cruces de entrenamiento semanales.
        </p>
      </div>

      {/* Main content grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Section 1: Match Generator */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>⚡ Generador de Cruces</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Genera de forma automática y aleatoria los cruces para la semana.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Identificador de la Semana:</label>
              <input 
                type="text" 
                value={weekInput} 
                onChange={(e) => setWeekInput(e.target.value)} 
                placeholder="Ej. Semana 1"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Meta de Roleplays por Persona/Semana:</label>
              <input 
                type="number" 
                min="1"
                max="10"
                value={weeklyGoal} 
                onChange={async (e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setWeeklyGoal(val);
                  await saveWeeklyGoal(val);
                  setMatchesTrigger(prev => prev + 1);
                }} 
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              💡 El generador tomará a todos los miembros marcados como <strong>Activos</strong> en el panel lateral y creará un ciclo de roleplay donde cada uno entrena con 2 personas diferentes.
            </div>

            <button 
              onClick={handleGenerateMatches}
              className="btn-primary" 
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              🎲 Generar Cruces Aleatorios
            </button>
          </div>

          {generationMsg.text && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: generationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: generationMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${generationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
            }}>
              {generationMsg.text}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Total Miembros Registrados:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{users.filter(u => !u.isAdmin).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <span>Participantes Activos:</span>
              <strong style={{ color: 'var(--success)' }}>{users.filter(u => !u.isAdmin && u.active).length}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Member Management */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>👥 Miembros del Equipo</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Administra los integrantes del equipo y decide quién participa en los cruces.
            </p>
          </div>

          {/* Add member form */}
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={newMemberName} 
              onChange={(e) => setNewMemberName(e.target.value)} 
              placeholder="Nombre del nuevo miembro..."
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Añadir
            </button>
          </form>

          {/* Members list */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem', 
            maxHeight: '260px', 
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}>
            {users.filter(u => !u.isAdmin).map((u) => (
              <div 
                key={u.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.5rem 0.75rem', 
                  background: u.active ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '10px'
                }}
              >
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  color: u.active ? 'var(--text-primary)' : 'var(--text-muted)',
                  textDecoration: u.active ? 'none' : 'line-through'
                }}>
                  {u.name}
                </span>

                <button 
                  onClick={() => handleToggleActive(u.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    background: u.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    color: u.active ? 'var(--success)' : 'var(--text-muted)',
                    border: `1px solid ${u.active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px'
                  }}
                >
                  {u.active ? '🟢 Activo' : '⚪ Inactivo'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Objection Management */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>🎯 Objeciones / Enfoques</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Define los tipos de objeciones que los miembros tratarán durante las sesiones.
            </p>
          </div>

          {/* Add objection form */}
          <form onSubmit={handleAddObjection} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={newObjectionLabel} 
              onChange={(e) => setNewObjectionLabel(e.target.value)} 
              placeholder="Nueva objeción (ej. Dinero, Tiempo)..."
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Añadir
            </button>
          </form>

          {/* Objection list */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem', 
            maxHeight: '260px', 
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}>
            {objections.map((o) => (
              <div 
                key={o.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {o.label}
                </span>

                <button 
                  onClick={() => handleDeleteObjection(o.id)}
                  className="btn-danger"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    padding: 0,
                    fontSize: '0.85rem'
                  }}
                  title="Eliminar objeción"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
