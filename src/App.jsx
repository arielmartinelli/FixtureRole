// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeDB, getUsers, getMatches } from './services/db';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FixtureView from './components/FixtureView';
import AdminPanel from './components/AdminPanel';
import ChatDrawer from './components/ChatDrawer';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeChatMatchId, setActiveChatMatchId] = useState(null);
  
  // A trigger state to force refresh other panels when data updates in another component
  const [matchesTrigger, setMatchesTrigger] = useState(0);

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('conquer_theme') || 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('conquer_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Password Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  // Initialize DB and load default users
  useEffect(() => {
    initializeDB();
    const loadedUsers = getUsers();
    setUsers(loadedUsers);
    
    // Default to the first admin if exists, or first user
    const defaultUser = loadedUsers.find(u => u.isAdmin) || loadedUsers[0];
    setCurrentUser(defaultUser);
  }, []);

  // Sync users list if changed in admin panel
  useEffect(() => {
    setUsers(getUsers());
  }, [matchesTrigger]);

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Cargando Conquer Fixture...
      </div>
    );
  }

  // Get current active chat match info if open
  const activeChatMatch = activeChatMatchId 
    ? getMatches().find(m => m.id === activeChatMatchId)
    : null;

  // Handle user switching request (intercept admin with password modal)
  const handleUserChangeRequest = (selectedUser) => {
    if (selectedUser.isAdmin) {
      setPendingUser(selectedUser);
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setCurrentUser(selectedUser);
      // Close chat if active since user changed
      setActiveChatMatchId(null);
      if (activeTab === 'admin') {
        setActiveTab('fixture');
      }
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Admin password: conquer123
    if (passwordInput === 'conquer123') {
      setCurrentUser(pendingUser);
      setShowPasswordModal(false);
      setPendingUser(null);
    } else {
      setPasswordError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingUser(null);
  };

  const handleNotificationClick = (matchId) => {
    setActiveTab('fixture');
    setActiveChatMatchId(matchId);
    setMatchesTrigger(prev => prev + 1); // Trigger instant navbar notification count update
  };

  return (
    <div className="app-container">
      <Navbar 
        users={users}
        currentUser={currentUser}
        onUserChange={handleUserChangeRequest}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNotificationClick={handleNotificationClick}
        matchesTrigger={matchesTrigger}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="main-layout">
        {activeTab === 'dashboard' && (
          <Dashboard matchesTrigger={matchesTrigger} />
        )}
        
        {activeTab === 'fixture' && (
          <FixtureView 
            currentUser={currentUser}
            onOpenChat={(matchId) => setActiveChatMatchId(matchId)}
            matchesTrigger={matchesTrigger}
            setMatchesTrigger={setMatchesTrigger}
          />
        )}
        
        {activeTab === 'admin' && currentUser.isAdmin && (
          <AdminPanel setMatchesTrigger={setMatchesTrigger} />
        )}
      </main>

      {/* Chat coordination drawer */}
      {activeChatMatchId && (
        <ChatDrawer 
          matchId={activeChatMatchId}
          match={activeChatMatch}
          currentUser={currentUser}
          onClose={() => setActiveChatMatchId(null)}
        />
      )}

      {/* Admin Password verification modal (Rendered at root layout level for perfect fixed positioning viewport fit) */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'rgba(13, 17, 39, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2.5rem 2rem',
            width: '385px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '2.5rem', margin: '0 auto' }}>🔐</div>
            
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Acceso Administrador</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
                Introduce la contraseña de acceso.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Contraseña..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px'
                }}
              />
              
              {passwordError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                  ⚠️ {passwordError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.7rem' }}
                >
                  Autorizar
                </button>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.25rem' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
