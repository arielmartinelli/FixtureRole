// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats, getWeeklyGoal } from '../services/db';

const Dashboard = ({ matchesTrigger }) => {
  const [selectedWeek, setSelectedWeek] = useState('');
  const [stats, setStats] = useState(null);

  const [weeklyGoal, setWeeklyGoal] = useState(2);

  useEffect(() => {
    const data = getDashboardStats(selectedWeek);
    setStats(data);
    setWeeklyGoal(getWeeklyGoal());
  }, [selectedWeek, matchesTrigger]);

  if (!stats) return <div style={{ color: 'var(--text-secondary)' }}>Cargando estadísticas...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header with Week Filter */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>📊 Dashboard de Desempeño</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Métricas de asistencia, completitud y objeciones de roleplay.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filtrar Semana:</span>
          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="">Todas las semanas</option>
            {stats.weeks.map(week => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Matches */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL CRUCES</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roleplays programados</div>
          <div style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '2rem', opacity: 0.15 }}>⚔️</div>
        </div>

        {/* Team Goal Progress */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>META GRUPAL ({weeklyGoal} p/p)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>
            {stats.completed} / {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Completitud: {stats.completionRate}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '0.1rem', overflow: 'hidden' }}>
            <div style={{ width: `${stats.completionRate}%`, height: '100%', background: 'var(--success-gradient)', borderRadius: '3px' }} />
          </div>
          <div style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '2rem', opacity: 0.15 }}>🎯</div>
        </div>

        {/* Realizados */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>REALIZADOS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sesiones entrenadas con éxito</div>
          <div style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '2rem', opacity: 0.15 }}>✅</div>
        </div>

        {/* No Realizados */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NO REALIZADOS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--danger)' }}>{stats.failed}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sesiones canceladas/fallidas</div>
          <div style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '2rem', opacity: 0.15 }}>❌</div>
        </div>
      </div>

      {/* Main Stats Sections Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Objection Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>🎯 Objeciones más Tratadas</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Cantidad de roleplays exitosos según el tema u objeción comercial.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            {stats.objectionStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No hay datos disponibles.</p>
            ) : (
              stats.objectionStats.map((obj, i) => {
                const maxCount = Math.max(...stats.objectionStats.map(o => o.count)) || 1;
                const percentage = Math.round((obj.count / maxCount) * 100);
                
                return (
                  <div key={obj.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>{obj.label}</span>
                      <span style={{ color: 'var(--primary)' }}>{obj.count} {obj.count === 1 ? 'roleplay' : 'roleplays'}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{
                        width: `${obj.count > 0 ? percentage : 0}%`,
                        height: '100%',
                        background: i === 0 ? 'var(--primary-gradient)' : 'linear-gradient(90deg, rgba(99,102,241,0.6) 0%, rgba(99,102,241,0.8) 100%)',
                        borderRadius: '5px'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Leaderboard / Attendance Ranking */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>🏆 Ranking de Asistencia</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Porcentaje de asistencia individual (cruces en estado Realizado).
            </p>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Puesto</th>
                  <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Promedio</th>
                  <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Realizados / Total</th>
                  <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {stats.userStats.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay cruces generados para evaluar asistencia.
                    </td>
                  </tr>
                ) : (
                  stats.userStats.map((user, index) => {
                    const rankMedals = ['🥇', '🥈', '🥉'];
                    const displayRank = index < 3 ? rankMedals[index] : `${index + 1}°`;
                    
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background var(--transition-fast)' }}>
                        <td style={{ padding: '0.6rem 0.25rem', fontWeight: 'bold' }}>{displayRank}</td>
                        <td style={{ padding: '0.6rem', fontWeight: 600 }}>{user.name}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--warning)' }}>
                          {user.avgRating > 0 ? `⭐ ${user.avgRating}` : '—'}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {user.completed} / {user.total}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: user.rate >= 80 ? 'var(--success)' : (user.rate >= 50 ? 'var(--warning)' : 'var(--danger)') }}>
                          {user.rate}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fail reasons log (Bitácora de inasistencias) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>📓 Bitácora de Inasistencias</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Motivos por los cuales los roleplays quedaron en estado "No Realizado".
        </p>
        
        {stats.failedReasons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>💚</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>¡Excelente! No hay inasistencias registradas.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {stats.failedReasons.map((item, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.pair}</span>
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>{item.weekId}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  "{item.reason}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Wall */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>💬 Muro de Feedback Cruzado</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Calificaciones y comentarios compartidos por los compañeros de entrenamiento después del roleplay.
        </p>

        {stats.feedbackWall.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>💬</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Aún no se ha registrado retroalimentación en las sesiones finalizadas.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {stats.feedbackWall.map((item, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.weekId} • <strong style={{ color: 'var(--warning)' }}>{item.objection}</strong>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                    {'⭐'.repeat(item.rating)}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0.25rem 0', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{item.comment}"
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Por: <strong>{item.reviewer}</strong></span>
                  <span>Evaluando a: <strong>{item.target}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
