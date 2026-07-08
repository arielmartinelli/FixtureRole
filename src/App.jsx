// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeDB, getUsers, getMatches } from './services/db';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FixtureView from './components/FixtureView';
import AdminPanel from './components/AdminPanel';
import ChatDrawer from './components/ChatDrawer';
import Login from './components/Login';
import Profile from './components/Profile';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeChatMatchId, setActiveChatMatchId] = useState(null);
  const [matchesTrigger, setMatchesTrigger] = useState(0);

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('conquer_theme') || 'dark';
  });

  // Apply theme to document node
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

  // Initialize DB and load active session on mount
  useEffect(() => {
    initializeDB();
    const sessionId = localStorage.getItem('conquer_session_user_id');
    if (sessionId) {
      const loadedUsers = getUsers();
      const user = loadedUsers.find(u => u.id === sessionId);
      if (user && user.active) {
        setCurrentUser(user);
      } else {
        localStorage.removeItem('conquer_session_user_id');
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('conquer_session_user_id', user.id);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('conquer_session_user_id');
    setCurrentUser(null);
    setActiveChatMatchId(null);
    setActiveTab('dashboard');
  };

  const handleNotificationClick = (matchId) => {
    setActiveTab('fixture');
    setActiveChatMatchId(matchId);
    setMatchesTrigger(prev => prev + 1); // Refresh navbar unread counters immediately
  };

  // Render Login view if unauthenticated
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Get current active chat match info if drawer is open
  const activeChatMatch = activeChatMatchId 
    ? getMatches().find(m => m.id === activeChatMatchId)
    : null;

  return (
    <div className="app-container">
      <Navbar 
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNotificationClick={handleNotificationClick}
        matchesTrigger={matchesTrigger}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="main-layout animate-fade-in">
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

        {activeTab === 'profile' && (
          <Profile 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            setMatchesTrigger={setMatchesTrigger} 
          />
        )}
      </main>

      {/* Chat drawer */}
      {activeChatMatchId && (
        <ChatDrawer 
          matchId={activeChatMatchId}
          match={activeChatMatch}
          currentUser={currentUser}
          onClose={() => setActiveChatMatchId(null)}
        />
      )}
    </div>
  );
}

export default App;
