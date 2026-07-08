// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getUnreadNotifications, markMessagesAsRead } from '../services/db';

const Navbar = ({ currentUser, activeTab, setActiveTab, onNotificationClick, matchesTrigger, theme, toggleTheme }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for notifications and refresh on matchesTrigger change
  useEffect(() => {
    if (!currentUser) return;
    
    const checkNotifications = () => {
      const unread = getUnreadNotifications(currentUser.id);
      setNotifications(unread);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 1500); // Check every 1.5s

    return () => clearInterval(interval);
  }, [currentUser, matchesTrigger]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNotificationItemClick = (notif) => {
    markMessagesAsRead(notif.matchId, currentUser.id);
    setShowNotifications(false);
    
    // Call parent to switch tabs and open chat drawer
    onNotificationClick(notif.matchId);
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const totalUnreadCount = notifications.reduce((acc, curr) => acc + curr.unreadCount, 0);

  return (
    <header className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Logo / Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)',
            fontWeight: '800',
            fontSize: '1.25rem',
            color: 'white'
          }}>
            C
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CONQUER FIXTURE
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500, letterSpacing: '0.05em' }}>
              ROLEPLAY TRAINING HUB
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: activeTab === 'dashboard' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'dashboard' ? 'white' : 'var(--text-secondary)',
              border: activeTab === 'dashboard' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: activeTab === 'dashboard' ? '0 4px 10px var(--primary-glow)' : 'none'
            }}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('fixture')} 
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: activeTab === 'fixture' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'fixture' ? 'white' : 'var(--text-secondary)',
              border: activeTab === 'fixture' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: activeTab === 'fixture' ? '0 4px 10px var(--primary-glow)' : 'none'
            }}
          >
            ⚔️ Cruces / Fixture
          </button>
          {currentUser.isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')} 
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: activeTab === 'admin' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === 'admin' ? 'white' : 'var(--text-secondary)',
                border: activeTab === 'admin' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: activeTab === 'admin' ? '0 4px 10px var(--primary-glow)' : 'none'
              }}
            >
              ⚙️ Panel Admin
            </button>
          )}
          <button 
            onClick={() => setActiveTab('profile')} 
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: activeTab === 'profile' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'profile' ? 'white' : 'var(--text-secondary)',
              border: activeTab === 'profile' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: activeTab === 'profile' ? '0 4px 10px var(--primary-glow)' : 'none'
            }}
          >
            👤 Perfil
          </button>
        </nav>

        {/* Action controls (Theme and Bell) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              padding: 0,
              fontSize: '1.1rem'
            }}
            title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Notification Bell (Only for non-admin team members) */}
          {!currentUser.isAdmin && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-secondary"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  padding: 0,
                  fontSize: '1.1rem',
                  position: 'relative'
                }}
                title="Mensajes Nuevos"
              >
                🔔
                {totalUnreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.65rem',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 0 6px var(--danger-glow)',
                    border: '2px solid var(--bg-dark)'
                  }}>
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '320px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  zIndex: 1100,
                  maxHeight: '360px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ 
                    padding: '0.85rem 1rem', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#fff'
                  }}>
                    <span>🔔 Mensajes Nuevos</span>
                    {notifications.length > 0 && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: 'var(--primary-gradient)', 
                        padding: '2px 8px', 
                        borderRadius: '20px',
                        fontWeight: 600
                      }}>
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        ¡Estás al día! No tienes mensajes nuevos.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.matchId}
                          onClick={() => handleNotificationItemClick(notif)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            transition: 'background var(--transition-fast)',
                            background: 'rgba(255, 255, 255, 0.01)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                              {notif.senderName}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {formatTime(notif.timestamp)}
                            </span>
                          </div>
                          
                          <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 500
                          }}>
                            {notif.text}
                          </p>
                          
                          <span style={{
                            alignSelf: 'flex-start',
                            fontSize: '0.65rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.1rem',
                            fontStyle: 'italic'
                          }}>
                            Haz clic para responder ({notif.unreadCount} nuevo{notif.unreadCount > 1 ? 's' : ''})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Display Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentUser.isAdmin ? '#a78bfa' : (currentUser.active ? 'var(--success)' : 'var(--text-muted)'),
              boxShadow: currentUser.isAdmin ? '0 0 8px #a78bfa' : (currentUser.active ? '0 0 8px var(--success)' : 'none')
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {currentUser.name}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
