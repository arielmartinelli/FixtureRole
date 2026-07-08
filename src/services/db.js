// src/services/db.js
import { generateFixtures } from './fixtureEngine';

const STORAGE_KEYS = {
  USERS: 'conquer_users',
  OBJECTIONS: 'conquer_objections',
  MATCHES: 'conquer_matches',
  MESSAGES: 'conquer_messages',
};

const DEFAULT_USERS = [
  { id: 'admin', name: 'Administrador', password: 'admin123', active: true, isAdmin: true },
  { id: 'jazmin_merlo', name: 'Jazmin Merlo', password: 'jazmin_merlo123', active: true, isAdmin: false },
  { id: 'jazmin_mercado', name: 'Jazmin Mercado', password: 'jazmin_mercado123', active: true, isAdmin: false },
  { id: 'fabrizio', name: 'Fabrizio', password: 'fabrizio123', active: true, isAdmin: false },
  { id: 'ariel', name: 'Ariel', password: 'ariel123', active: true, isAdmin: false },
  { id: 'cande', name: 'Cande', password: 'cande123', active: true, isAdmin: false },
  { id: 'ariana', name: 'Ariana', password: 'ariana123', active: true, isAdmin: false },
  { id: 'manuel', name: 'Manuel', password: 'manuel123', active: true, isAdmin: false },
  { id: 'julieta', name: 'Julieta', password: 'julieta123', active: true, isAdmin: false },
  { id: 'lucas', name: 'Lucas', password: 'lucas123', active: true, isAdmin: false },
  { id: 'tomas', name: 'Tomas', password: 'tomas123', active: true, isAdmin: false },
  { id: 'cristian', name: 'Cristian', password: 'cristian123', active: true, isAdmin: false },
  { id: 'agostina', name: 'Agostina', password: 'agostina123', active: true, isAdmin: false },
];

const DEFAULT_OBJECTIONS = [
  { id: 'dinero', label: 'Dinero' },
  { id: 'pareja', label: 'Pareja' },
  { id: 'pensarlo', label: 'Pensarlo' },
  { id: 'otras_opciones', label: 'Otras Opciones' },
  { id: 'otro', label: 'Otro' },
];

export const initializeDB = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    // Migration: add password to users if missing
    const currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    let migrated = false;
    const migratedUsers = currentUsers.map(u => {
      if (!u.password) {
        u.password = u.id === 'admin' ? 'admin123' : `${u.id}123`;
        migrated = true;
      }
      return u;
    });
    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
    }
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.OBJECTIONS)) {
    localStorage.setItem(STORAGE_KEYS.OBJECTIONS, JSON.stringify(DEFAULT_OBJECTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify({}));
  }
};

// Users
export const getUsers = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const addUser = (name, isAdmin = false) => {
  const users = getUsers();
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (users.find(u => u.id === id)) {
    throw new Error('El usuario ya existe');
  }

  const newUser = { id, name, password: `${id}123`, active: true, isAdmin };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const deleteUser = (userId) => {
  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  saveUsers(users);
};

export const toggleUserActive = (userId) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.active = !user.active;
    saveUsers(users);
  }
  return users;
};

// Objections
export const getObjections = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.OBJECTIONS)) || [];
};

export const saveObjections = (objections) => {
  localStorage.setItem(STORAGE_KEYS.OBJECTIONS, JSON.stringify(objections));
};

export const addObjection = (label) => {
  const objections = getObjections();
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (objections.find(o => o.id === id)) {
    throw new Error('La objeción ya existe');
  }

  const newObjection = { id, label };
  objections.push(newObjection);
  saveObjections(objections);
  return newObjection;
};

export const deleteObjection = (id) => {
  let objections = getObjections();
  objections = objections.filter(o => o.id !== id);
  saveObjections(objections);
};

// Matches
export const getMatches = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES)) || [];
};

export const saveMatches = (matches) => {
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
};

export const updateMatch = (matchId, updatedData) => {
  const matches = getMatches();
  const index = matches.findIndex(m => m.id === matchId);
  if (index !== -1) {
    matches[index] = { ...matches[index], ...updatedData };
    saveMatches(matches);
    return matches[index];
  }
  return null;
};

export const generateWeeklyMatches = (weekId) => {
  const users = getUsers().filter(u => u.active && !u.isAdmin);
  const objections = getObjections();

  if (users.length < 3) {
    throw new Error('Se necesitan al menos 3 usuarios activos para generar los cruces.');
  }

  const newMatches = generateFixtures(users, objections, weekId);
  
  // Append or overwrite matches for this week
  let currentMatches = getMatches();
  // Filter out any existing matches for the same weekId to avoid duplicates if re-generated
  currentMatches = currentMatches.filter(m => m.weekId !== weekId);
  
  const updatedMatches = [...currentMatches, ...newMatches];
  saveMatches(updatedMatches);
  return newMatches;
};

// Messages
export const getMessages = (matchId) => {
  initializeDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  return allMessages[matchId] || [];
};

export const addMessage = (matchId, senderId, text) => {
  initializeDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  if (!allMessages[matchId]) {
    allMessages[matchId] = [];
  }
  
  const newMessage = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    matchId,
    senderId,
    text,
    timestamp: new Date().toISOString(),
    readBy: [senderId], // Initialized as read by the sender
  };
  
  allMessages[matchId].push(newMessage);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  return newMessage;
};

export const markMessagesAsRead = (matchId, userId) => {
  initializeDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  if (allMessages[matchId]) {
    let updated = false;
    allMessages[matchId] = allMessages[matchId].map(msg => {
      const readByList = msg.readBy || [msg.senderId];
      if (!readByList.includes(userId)) {
        msg.readBy = [...readByList, userId];
        updated = true;
      }
      return msg;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
    }
  }
};

export const getUnreadNotifications = (userId) => {
  if (userId === 'admin') return []; // Admin doesn't have regular matchups to get notifications for
  initializeDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  const matches = getMatches();
  const users = getUsers();
  const notifications = [];

  // Filter matches where userId is a participant
  const userMatches = matches.filter(m => m.user1Id === userId || m.user2Id === userId);

  userMatches.forEach(match => {
    const matchMsgs = allMessages[match.id] || [];
    const unreadMsgs = matchMsgs.filter(msg => {
      const readByList = msg.readBy || [msg.senderId];
      return !readByList.includes(userId);
    });

    if (unreadMsgs.length > 0) {
      // Get the latest unread message
      const latest = unreadMsgs[unreadMsgs.length - 1];
      const sender = users.find(u => u.id === latest.senderId)?.name || 'Compañero';
      notifications.push({
        matchId: match.id,
        match: match,
        unreadCount: unreadMsgs.length,
        senderName: sender,
        text: latest.text,
        timestamp: latest.timestamp
      });
    }
  });

  return notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

// Stats
export const getDashboardStats = (selectedWeekId = '') => {
  const matches = getMatches();
  const users = getUsers();
  const teamUsers = users.filter(u => !u.isAdmin);
  const objections = getObjections();
  
  // Filter matches by week if selectedWeekId is provided, else use all
  const filteredMatches = selectedWeekId 
    ? matches.filter(m => m.weekId === selectedWeekId)
    : matches;
    
  const total = filteredMatches.length;
  const completed = filteredMatches.filter(m => m.status === 'Realizado').length;
  const failed = filteredMatches.filter(m => m.status === 'No Realizado').length;
  const pending = filteredMatches.filter(m => m.status === 'Pendiente').length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Attendance and rating by user
  const userStats = teamUsers.map(user => {
    const userMatches = filteredMatches.filter(m => m.user1Id === user.id || m.user2Id === user.id);
    const userCompleted = userMatches.filter(m => m.status === 'Realizado').length;
    const userFailed = userMatches.filter(m => m.status === 'No Realizado').length;
    const userPending = userMatches.filter(m => m.status === 'Pendiente').length;
    const totalUser = userMatches.length;
    const rate = totalUser > 0 ? Math.round((userCompleted / totalUser) * 100) : 0;
    
    // Average rating received from partners (historical)
    const receivedRatings = [];
    matches.forEach(m => {
      if (m.reviews && m.status === 'Realizado') {
        const isUser1 = m.user1Id === user.id;
        const isUser2 = m.user2Id === user.id;
        if (isUser1 && m.reviews[m.user2Id]) {
          receivedRatings.push(m.reviews[m.user2Id].rating);
        } else if (isUser2 && m.reviews[m.user1Id]) {
          receivedRatings.push(m.reviews[m.user1Id].rating);
        }
      }
    });

    const avgRating = receivedRatings.length > 0
      ? Math.round((receivedRatings.reduce((a, b) => a + b, 0) / receivedRatings.length) * 10) / 10
      : 0;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email || '',
      total: totalUser,
      completed: userCompleted,
      failed: userFailed,
      pending: userPending,
      rate,
      avgRating,
      ratingCount: receivedRatings.length
    };
  }).sort((a, b) => b.rate - a.rate || b.avgRating - a.avgRating);
  
  // Objections distribution
  const objectionStats = objections.map(obj => {
    const count = filteredMatches.filter(m => m.objectionId === obj.id && m.status === 'Realizado').length;
    return {
      id: obj.id,
      label: obj.label,
      count
    };
  }).sort((a, b) => b.count - a.count);
  
  // Failed reasons list
  const failedReasons = filteredMatches
    .filter(m => m.status === 'No Realizado' && m.failReason)
    .map(m => {
      const u1 = users.find(u => u.id === m.user1Id)?.name || 'Desconocido';
      const u2 = users.find(u => u.id === m.user2Id)?.name || 'Desconocido';
      return {
        matchId: m.id,
        pair: `${u1} & ${u2}`,
        reason: m.failReason,
        weekId: m.weekId,
      };
    });

  // Unique weeks list
  const weeks = [...new Set(matches.map(m => m.weekId))].sort((a, b) => b.localeCompare(a));
  
  // Feedback Wall (historical)
  const feedbackWall = [];
  matches.forEach(m => {
    if (m.reviews) {
      Object.keys(m.reviews).forEach(reviewerId => {
        const reviewerName = users.find(u => u.id === reviewerId)?.name || reviewerId;
        const targetId = m.user1Id === reviewerId ? m.user2Id : m.user1Id;
        const targetName = users.find(u => u.id === targetId)?.name || targetId;
        const rev = m.reviews[reviewerId];
        feedbackWall.push({
          matchId: m.id,
          reviewer: reviewerName,
          target: targetName,
          rating: rev.rating,
          comment: rev.comment,
          timestamp: rev.timestamp,
          weekId: m.weekId,
          objection: objections.find(o => o.id === m.objectionId)?.label || 'Otro'
        });
      });
    }
  });
  feedbackWall.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    total,
    completed,
    failed,
    pending,
    completionRate,
    userStats,
    objectionStats,
    failedReasons,
    weeks,
    feedbackWall
  };
};

export const getWeeklyGoal = () => {
  const goal = localStorage.getItem('conquer_weekly_goal');
  return goal ? parseInt(goal, 10) : 2;
};

export const saveWeeklyGoal = (goal) => {
  localStorage.setItem('conquer_weekly_goal', goal.toString());
};

export const addMatchReview = (matchId, reviewerId, rating, comment) => {
  initializeDB();
  const matches = getMatches();
  const index = matches.findIndex(m => m.id === matchId);
  if (index !== -1) {
    const match = matches[index];
    if (!match.reviews) {
      match.reviews = {};
    }
    match.reviews[reviewerId] = {
      rating: parseInt(rating, 10),
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };
    matches[index] = match;
    saveMatches(matches);
    return match;
  }
  return null;
};

export const updateUserEmail = (userId, email) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.email = email.trim();
    saveUsers(users);
  }
  return users;
};

export const loginUser = (usernameId, password) => {
  initializeDB();
  const users = getUsers();
  const user = users.find(u => u.id === usernameId.toLowerCase().trim());
  if (!user) {
    throw new Error('El usuario no existe.');
  }
  if (user.password !== password) {
    throw new Error('Contraseña incorrecta.');
  }
  if (!user.active) {
    throw new Error('Tu cuenta está desactivada.');
  }
  return user;
};

export const changePassword = (userId, currentPassword, newPassword) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('Usuario no encontrado.');
  }
  if (user.password !== currentPassword) {
    throw new Error('La contraseña actual es incorrecta.');
  }
  user.password = newPassword.trim();
  saveUsers(users);
  return user;
};
