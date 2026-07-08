// src/components/ChatDrawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getMessages, addMessage, getUsers, markMessagesAsRead } from '../services/db';

const ChatDrawer = ({ matchId, match, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Load users once
  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // Poll for messages in localStorage so that changing the current user simulates a real chat response instantly
  useEffect(() => {
    if (!matchId) return;

    const fetchMessages = () => {
      const msgs = getMessages(matchId);
      setMessages(msgs);
      markMessagesAsRead(matchId, currentUser.id);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [matchId, currentUser.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!match) return null;

  const otherUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
  const otherUserName = users.find(u => u.id === otherUserId)?.name || 'Compañero';

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addMessage(matchId, currentUser.id, inputText.trim());
    setInputText('');
    setMessages(getMessages(matchId));
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '450px',
      maxWidth: '100%',
      height: '100vh',
      background: 'rgba(7, 9, 19, 0.95)',
      backdropFilter: 'blur(16px)',
      boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      
      {/* Drawer Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💬 Coordinar con {otherUserName}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Acuerden día, hora y el enfoque del roleplay.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="btn-secondary"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem'
          }}
        >
          ✕
        </button>
      </div>

      {/* Info bar */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.05)',
        padding: '0.75rem 1.5rem',
        fontSize: '0.8rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--text-secondary)'
      }}>
        <span>📅 Propuesto: <strong>{match.dateTime}</strong></span>
        <span>🎯 Tema: <strong style={{ color: 'var(--warning)' }}>{match.objectionId}</strong></span>
      </div>

      {/* Messages List Area */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: '280px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Historial vacío</h4>
            <p style={{ fontSize: '0.75rem' }}>Comienza a chatear con {otherUserName} para acordar los detalles de su roleplay.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            
            return (
              <div 
                key={msg.id} 
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '0.5rem' }}>
                    {otherUserName}
                  </span>
                )}
                
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: isMe ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isMe ? '0 4px 10px rgba(99, 102, 241, 0.15)' : 'none',
                  color: 'white',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
                
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-muted)', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  marginRight: isMe ? '0.5rem' : 0,
                  marginLeft: !isMe ? '0.5rem' : 0
                }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '0.75rem',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Escribe un mensaje a ${otherUserName}...`}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.85rem'
          }}
        />
        <button 
          type="submit" 
          className="btn-primary"
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px'
          }}
        >
          Enviar
        </button>
      </form>

    </div>
  );
};

export default ChatDrawer;
