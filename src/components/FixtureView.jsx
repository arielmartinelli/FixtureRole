// src/components/FixtureView.jsx
import React, { useState, useEffect } from 'react';
import { getMatches, updateMatch, getObjections, getUsers, addMatchReview, updateUserEmail } from '../services/db';

const FixtureView = ({ currentUser, onOpenChat, matchesTrigger, setMatchesTrigger }) => {
  const [matches, setMatches] = useState([]);
  const [objections, setObjections] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [filterType, setFilterType] = useState('mine'); // 'mine' or 'all'
  
  // Reschedule & Status state
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editObjectionId, setEditObjectionId] = useState('');
  
  const [markingMatchId, setMarkingMatchId] = useState(null);
  const [markStatus, setMarkStatus] = useState('Realizado');
  const [failReason, setFailReason] = useState('');

  // Feedback & Rating states
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Calendar Scheduling states
  const [schedulingMatchId, setSchedulingMatchId] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  // Load data
  useEffect(() => {
    const allMatches = getMatches();
    const allObjections = getObjections();
    const allUsers = getUsers();
    
    setObjections(allObjections);
    setUsers(allUsers);
    
    // Extract unique weeks
    const uniqueWeeks = [...new Set(allMatches.map(m => m.weekId))].sort((a, b) => b.localeCompare(a));
    setWeeks(uniqueWeeks);

    // Default to the most recent week if not set
    if (!selectedWeek && uniqueWeeks.length > 0) {
      setSelectedWeek(uniqueWeeks[0]);
    }

    // Filter matches
    let filtered = allMatches;
    if (selectedWeek) {
      filtered = filtered.filter(m => m.weekId === selectedWeek);
    } else if (uniqueWeeks.length > 0) {
      filtered = filtered.filter(m => m.weekId === uniqueWeeks[0]);
    } else {
      filtered = [];
    }

    setMatches(filtered);
  }, [selectedWeek, matchesTrigger]);

  // Handle switching tabs for normal users
  useEffect(() => {
    if (currentUser.isAdmin) {
      setFilterType('all');
    } else {
      setFilterType('mine');
    }
  }, [currentUser]);

  const handleUpdateMatchInfo = (matchId) => {
    updateMatch(matchId, {
      dateTime: editDateTime,
      objectionId: editObjectionId,
      updatedBy: currentUser.name
    });
    setEditingMatchId(null);
    setMatchesTrigger(prev => prev + 1);
  };

  const handleMarkStatus = (matchId) => {
    if (markStatus === 'No Realizado' && !failReason.trim()) {
      alert('Por favor, indica la razón de la inasistencia.');
      return;
    }

    if (markStatus === 'Realizado') {
      const matchObj = matches.find(m => m.id === matchId);
      const isParticipant = matchObj?.user1Id === currentUser.id || matchObj?.user2Id === currentUser.id;
      if (isParticipant && feedbackComment.trim()) {
        addMatchReview(matchId, currentUser.id, rating, feedbackComment);
      }
    }

    updateMatch(matchId, {
      status: markStatus,
      failReason: markStatus === 'No Realizado' ? failReason : '',
      updatedBy: currentUser.name
    });
    
    setMarkingMatchId(null);
    setFailReason('');
    setFeedbackComment('');
    setRating(5);
    setMatchesTrigger(prev => prev + 1);
  };

  const getUserName = (id) => {
    return users.find(u => u.id === id)?.name || id;
  };

  const startEditing = (match) => {
    setEditingMatchId(match.id);
    setEditDateTime(match.dateTime);
    setEditObjectionId(match.objectionId);
    setMarkingMatchId(null); // Close status marker
  };

  const startMarking = (match) => {
    setMarkingMatchId(match.id);
    setMarkStatus(match.status === 'Pendiente' ? 'Realizado' : match.status);
    setFailReason(match.failReason || '');
    setEditingMatchId(null); // Close reschedule editor
  };

  // Determine which matches to display based on the filter
  const displayedMatches = filterType === 'mine' && !currentUser.isAdmin
    ? matches.filter(m => m.user1Id === currentUser.id || m.user2Id === currentUser.id)
    : matches;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>⚔️ Cruces Semanales</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Visualiza tus compañeros asignados y coordina los horarios.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Week Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Semana:</span>
            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(e.target.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              {weeks.length === 0 ? (
                <option value="">Sin cruces generados</option>
              ) : (
                weeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))
              )}
            </select>
          </div>

          {/* Mine vs All toggler (only visible for team members, admin sees all) */}
          {!currentUser.isAdmin && (
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', padding: '2px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={() => setFilterType('mine')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  background: filterType === 'mine' ? 'var(--primary)' : 'transparent',
                  color: filterType === 'mine' ? 'white' : 'var(--text-secondary)',
                  boxShadow: filterType === 'mine' ? '0 2px 6px var(--primary-glow)' : 'none'
                }}
              >
                Mis Cruces
              </button>
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  background: filterType === 'all' ? 'var(--primary)' : 'transparent',
                  color: filterType === 'all' ? 'white' : 'var(--text-secondary)',
                  boxShadow: filterType === 'all' ? '0 2px 6px var(--primary-glow)' : 'none'
                }}
              >
                Ver Todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid display */}
      {displayedMatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📅</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay cruces generados</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            {currentUser.isAdmin 
              ? 'Ve al Panel de Administrador y genera los cruces para esta semana.' 
              : 'El administrador aún no ha generado los cruces de roleplay para esta semana.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {displayedMatches.map((match) => {
            const isParticipant = match.user1Id === currentUser.id || match.user2Id === currentUser.id;
            const canModify = currentUser.isAdmin || isParticipant;
            const currentObjection = objections.find(o => o.id === match.objectionId)?.label || 'Otro';
            
            // Highlight participant card
            const highlightStyle = (isParticipant && !currentUser.isAdmin) 
              ? { borderLeft: '4px solid var(--primary)', background: 'rgba(99, 102, 241, 0.03)' }
              : {};
              
            return (
              <div 
                key={match.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  ...highlightStyle
                }}
              >
                
                {/* Match Header (Status and Week Info) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {match.weekId}
                  </span>
                  
                  {match.status === 'Pendiente' && <span className="badge badge-pending">⏳ Pendiente</span>}
                  {match.status === 'Realizado' && <span className="badge badge-success">✅ Realizado</span>}
                  {match.status === 'No Realizado' && <span className="badge badge-danger">❌ No Realizado</span>}
                </div>

                {/* Matchups Names */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      margin: '0 auto 0.5rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: match.user1Id === currentUser.id ? 'var(--primary)' : 'inherit',
                      fontSize: '1.1rem'
                    }}>
                      {getUserName(match.user1Id).charAt(0)}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getUserName(match.user1Id)}
                    </div>
                    {match.user1Id === currentUser.id && <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>TÚ</div>}
                  </div>
                  
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 800 }}>VS</div>

                  <div style={{ textAlign: 'center', width: '45%' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      margin: '0 auto 0.5rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: match.user2Id === currentUser.id ? 'var(--primary)' : 'inherit',
                      fontSize: '1.1rem'
                    }}>
                      {getUserName(match.user2Id).charAt(0)}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getUserName(match.user2Id)}
                    </div>
                    {match.user2Id === currentUser.id && <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>TÚ</div>}
                  </div>
                </div>

                {/* Details (Date & Objection) */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.85rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📅 Horario:</span>
                    <span style={{ fontWeight: 600 }}>{match.dateTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🎯 Objeción:</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{currentObjection}</span>
                  </div>
                  {match.status === 'No Realizado' && match.failReason && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      <strong>Motivo:</strong> "{match.failReason}"
                    </div>
                  )}
                </div>

                {/* Editor Forms */}
                {editingMatchId === match.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>📅 Reprogramar Cruce</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Día y Hora:</label>
                      <input 
                        type="text" 
                        value={editDateTime} 
                        onChange={(e) => setEditDateTime(e.target.value)} 
                        placeholder="Ej. Miércoles 19:30 hs"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Objeción a tratar:</label>
                      <select 
                        value={editObjectionId} 
                        onChange={(e) => setEditObjectionId(e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        {objections.map(o => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button 
                        onClick={() => handleUpdateMatchInfo(match.id)} 
                        className="btn-success" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={() => setEditingMatchId(null)} 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {markingMatchId === match.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>📝 Registrar Resultado</h4>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setMarkStatus('Realizado')}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          fontSize: '0.8rem',
                          background: markStatus === 'Realizado' ? 'var(--success)' : 'rgba(255,255,255,0.05)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        ✅ Realizado
                      </button>
                      <button 
                        onClick={() => setMarkStatus('No Realizado')}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          fontSize: '0.8rem',
                          background: markStatus === 'No Realizado' ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        ❌ No Realizado
                      </button>
                    </div>

                    {markStatus === 'No Realizado' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>¿Por qué no se realizó?:</label>
                        <input 
                          type="text" 
                          value={failReason} 
                          onChange={(e) => setFailReason(e.target.value)} 
                          placeholder="Ej. Falta de tiempo, inasistencia de compañero"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    )}

                    {markStatus === 'Realizado' && isParticipant && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>⭐ Calificación al compañero:</label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRating(num)}
                              style={{
                                background: 'transparent',
                                fontSize: '1.25rem',
                                padding: '2px',
                                cursor: 'pointer',
                                opacity: num <= rating ? 1 : 0.25,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>💬 Feedback de retroalimentación:</label>
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Escribe comentarios, qué hizo bien y qué puede mejorar..."
                          style={{
                            width: '100%',
                            height: '60px',
                            fontSize: '0.8rem',
                            padding: '0.4rem 0.6rem',
                            background: 'rgba(0,0,0,0.15)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            resize: 'none'
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button 
                        onClick={() => handleMarkStatus(match.id)} 
                        className="btn-success" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={() => setMarkingMatchId(null)} 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {schedulingMatchId === match.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.8rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📅 Agendar Tarea en Calendario</span>
                      <button onClick={() => setSchedulingMatchId(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: 0 }}>✕</button>
                    </h4>
                    
                    {!currentUser.email ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Ingresa tu correo de la empresa para agendar tareas en Google Calendar:
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="email" 
                            value={emailInput} 
                            onChange={(e) => setEmailInput(e.target.value)} 
                            placeholder="usuario@empresa.com"
                            style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          />
                          <button 
                            onClick={() => {
                              if (emailInput.trim()) {
                                updateUserEmail(currentUser.id, emailInput.trim());
                                currentUser.email = emailInput.trim();
                                setMatchesTrigger(prev => prev + 1);
                              }
                            }} 
                            className="btn-success" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Correo: <strong>{currentUser.email}</strong>
                          </span>
                          <button 
                            onClick={() => {
                              updateUserEmail(currentUser.id, '');
                              currentUser.email = '';
                              setEmailInput('');
                              setMatchesTrigger(prev => prev + 1);
                            }} 
                            style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', padding: 0 }}
                          >
                            Editar
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <a 
                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Tarea: Roleplay con ${getUserName(match.user1Id === currentUser.id ? match.user2Id : match.user1Id)}`)}&details=${encodeURIComponent(`Entrenar la objeción: ${currentObjection}. Coordinar por el chat de Conquer.`)}&add=${encodeURIComponent(currentUser.email)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-primary" 
                            style={{ 
                              flex: 1, 
                              padding: '0.45rem', 
                              fontSize: '0.75rem', 
                              textAlign: 'center', 
                              textDecoration: 'none', 
                              borderRadius: '8px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}
                          >
                            Google Calendar
                          </a>

                          <button 
                            onClick={() => {
                              const partnerName = getUserName(match.user1Id === currentUser.id ? match.user2Id : match.user1Id);
                              const summary = `Tarea: Roleplay con ${partnerName}`;
                              const description = `Entrenar objeción: ${currentObjection}. Coordinar por el chat de Conquer.`;
                              const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                              
                              const icsContent = [
                                'BEGIN:VCALENDAR',
                                'VERSION:2.0',
                                'PRODID:-//Conquer//Fixture App//ES',
                                'BEGIN:VTODO',
                                `UID:${match.id}_task@conquer.fixture`,
                                `DTSTAMP:${dtstamp}`,
                                `SUMMARY:${summary}`,
                                `DESCRIPTION:${description}`,
                                'STATUS:NEEDS-ACTION',
                                'END:VTODO',
                                'END:VCALENDAR'
                              ].join('\r\n');

                              const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `Tarea_Roleplay_${partnerName.replace(/\s+/g, '_')}.ics`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="btn-secondary" 
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', borderRadius: '8px' }}
                          >
                            Reminders / Outlook (.ics)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interaction Row (Chat, Modify, Mark) */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                  {isParticipant && (
                    <button 
                      onClick={() => onOpenChat(match.id)} 
                      className="btn-primary" 
                      style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      💬 Chat
                    </button>
                  )}

                  {isParticipant && match.status === 'Pendiente' && (
                    <button 
                      onClick={() => {
                        setSchedulingMatchId(schedulingMatchId === match.id ? null : match.id);
                        setEmailInput(currentUser.email || '');
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      title="Agendar como tarea en tu calendario corporativo"
                    >
                      📅 Agendar
                    </button>
                  )}
                  
                  {canModify && editingMatchId !== match.id && markingMatchId !== match.id && (
                    <>
                      <button 
                        onClick={() => startEditing(match)} 
                        className="btn-secondary" 
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        title="Reprogramar fecha y objeción"
                      >
                        📅 Editar
                      </button>
                      <button 
                        onClick={() => startMarking(match)} 
                        className="btn-secondary" 
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        title="Marcar asistencia / estado"
                      >
                        ✍️ Registrar
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FixtureView;
