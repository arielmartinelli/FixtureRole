// src/services/db.js
import { supabase } from './supabaseClient';
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

// Helper to check if Supabase has real config
const isSupabaseActive = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    url &&
    key &&
    url !== 'https://your-supabase-project-url.supabase.co' &&
    key !== 'your-actual-supabase-anonymous-anon-key' &&
    !url.includes('placeholder')
  );
};

// ----------------------------------------------------
// LOCAL STORAGE SYNCHRONOUS FALLBACKS
// ----------------------------------------------------
const initializeLocalDB = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    // Migration: add password if missing
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

export const initializeDB = () => {
  initializeLocalDB();
};

const getLocalUsers = () => {
  initializeLocalDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
};

const saveLocalUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

const getLocalObjections = () => {
  initializeLocalDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.OBJECTIONS)) || [];
};

const saveLocalObjections = (objs) => {
  localStorage.setItem(STORAGE_KEYS.OBJECTIONS, JSON.stringify(objs));
};

const getLocalMatches = () => {
  initializeLocalDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES)) || [];
};

const saveLocalMatches = (matches) => {
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
};

const getLocalMessages = (matchId) => {
  initializeLocalDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  return allMessages[matchId] || [];
};

const saveLocalMessages = (matchId, messages) => {
  initializeLocalDB();
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || {};
  allMessages[matchId] = messages;
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
};

// ----------------------------------------------------
// HYBRID ASYNCHRONOUS DB OPERATIONS
// ----------------------------------------------------

// Users
export const getUsers = async () => {
  if (isSupabaseActive()) {
    const { data, error } = await supabase.from('users').select('*').order('name', { ascending: true });
    if (!error && data) {
      return data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        active: u.active,
        isAdmin: u.is_admin,
      }));
    }
    console.error('Supabase getUsers error, falling back:', error);
  }
  return getLocalUsers();
};

export const addUser = async (name, isAdmin = false) => {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const password = `${id}123`;
  
  if (isSupabaseActive()) {
    const { error } = await supabase.from('users').insert({
      id,
      name,
      password,
      is_admin: isAdmin,
      active: true
    });
    if (error) console.error('Supabase addUser error:', error);
  }
  
  const users = getLocalUsers();
  if (users.find(u => u.id === id)) {
    throw new Error('El usuario ya existe');
  }
  const newUser = { id, name, password, active: true, isAdmin };
  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
};

export const deleteUser = async (userId) => {
  if (isSupabaseActive()) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) console.error('Supabase deleteUser error:', error);
  }
  let users = getLocalUsers();
  users = users.filter(u => u.id !== userId);
  saveLocalUsers(users);
};

export const toggleUserActive = async (userId) => {
  const users = getLocalUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.active = !user.active;
    saveLocalUsers(users);

    if (isSupabaseActive()) {
      const { error } = await supabase.from('users').update({ active: user.active }).eq('id', userId);
      if (error) console.error('Supabase toggleUserActive error:', error);
    }
  }
};

export const updateUserEmail = async (userId, email) => {
  const users = getLocalUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.email = email.trim();
    saveLocalUsers(users);

    if (isSupabaseActive()) {
      const { error } = await supabase.from('users').update({ email: email.trim() }).eq('id', userId);
      if (error) console.error('Supabase updateUserEmail error:', error);
    }
  }
  return getUsers();
};

export const loginUser = async (usernameId, password) => {
  const users = await getUsers();
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

export const changePassword = async (userId, currentPassword, newPassword) => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('Usuario no encontrado.');
  }
  if (user.password !== currentPassword) {
    throw new Error('La contraseña actual es incorrecta.');
  }
  
  if (isSupabaseActive()) {
    const { error } = await supabase.from('users').update({ password: newPassword.trim() }).eq('id', userId);
    if (error) console.error('Supabase changePassword error:', error);
  }

  // Update local
  const localUsers = getLocalUsers();
  const localU = localUsers.find(u => u.id === userId);
  if (localU) {
    localU.password = newPassword.trim();
    saveLocalUsers(localUsers);
  }
  return user;
};

// Objections
export const getObjections = async () => {
  if (isSupabaseActive()) {
    const { data, error } = await supabase.from('objections').select('*').order('label', { ascending: true });
    if (!error && data) {
      return data;
    }
    console.error('Supabase getObjections error, falling back:', error);
  }
  return getLocalObjections();
};

export const addObjection = async (label) => {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (isSupabaseActive()) {
    const { error } = await supabase.from('objections').insert({ id, label });
    if (error) console.error('Supabase addObjection error:', error);
  }

  const objs = getLocalObjections();
  if (objs.find(o => o.id === id)) {
    throw new Error('La objeción ya existe');
  }
  const newObj = { id, label };
  objs.push(newObj);
  saveLocalObjections(objs);
  return newObj;
};

export const deleteObjection = async (objId) => {
  if (isSupabaseActive()) {
    const { error } = await supabase.from('objections').delete().eq('id', objId);
    if (error) console.error('Supabase deleteObjection error:', error);
  }
  let objs = getLocalObjections();
  objs = objs.filter(o => o.id !== objId);
  saveLocalObjections(objs);
};

// Matches / Fixtures
export const getMatches = async () => {
  if (isSupabaseActive()) {
    const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(m => ({
        id: m.id,
        weekId: m.week_id,
        user1Id: m.user1_id,
        user2Id: m.user2_id,
        objectionId: m.objection_id,
        dateTime: m.date_time,
        status: m.status,
        failReason: m.fail_reason,
        updatedBy: m.updated_by,
        reviews: m.reviews || {},
      }));
    }
    console.error('Supabase getMatches error, falling back:', error);
  }
  return getLocalMatches();
};

export const saveMatches = async (newMatches) => {
  if (isSupabaseActive()) {
    const mapped = newMatches.map(m => ({
      id: m.id,
      week_id: m.weekId,
      user1_id: m.user1Id,
      user2_id: m.user2Id,
      objection_id: m.objectionId,
      date_time: m.dateTime,
      status: m.status,
      fail_reason: m.failReason,
      updated_by: m.updatedBy,
      reviews: m.reviews || {},
    }));
    const { error } = await supabase.from('matches').upsert(mapped);
    if (error) console.error('Supabase saveMatches error:', error);
  }
  saveLocalMatches(newMatches);
};

export const updateMatch = async (matchId, updatedFields) => {
  const matches = getLocalMatches();
  const index = matches.findIndex(m => m.id === matchId);
  if (index !== -1) {
    const updatedLocal = { ...matches[index], ...updatedFields };
    matches[index] = updatedLocal;
    saveLocalMatches(matches);

    if (isSupabaseActive()) {
      const mapped = {};
      if (updatedFields.weekId !== undefined) mapped.week_id = updatedFields.weekId;
      if (updatedFields.user1Id !== undefined) mapped.user1_id = updatedFields.user1Id;
      if (updatedFields.user2Id !== undefined) mapped.user2_id = updatedFields.user2Id;
      if (updatedFields.objectionId !== undefined) mapped.objection_id = updatedFields.objectionId;
      if (updatedFields.dateTime !== undefined) mapped.date_time = updatedFields.dateTime;
      if (updatedFields.status !== undefined) mapped.status = updatedFields.status;
      if (updatedFields.failReason !== undefined) mapped.fail_reason = updatedFields.failReason;
      if (updatedFields.updatedBy !== undefined) mapped.updated_by = updatedFields.updatedBy;
      if (updatedFields.reviews !== undefined) mapped.reviews = updatedFields.reviews;

      const { error } = await supabase.from('matches').update(mapped).eq('id', matchId);
      if (error) console.error('Supabase updateMatch error:', error);
    }
    return updatedLocal;
  }
  return null;
};

// Chat Messages
export const getMessages = async (matchId) => {
  if (isSupabaseActive()) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('timestamp', { ascending: true });
    
    if (!error && data) {
      return data.map(msg => ({
        id: msg.id,
        matchId: msg.match_id,
        senderId: msg.sender_id,
        text: msg.text,
        timestamp: msg.timestamp,
        readBy: msg.read_by || [],
      }));
    }
    console.error('Supabase getMessages error, falling back:', error);
  }
  return getLocalMessages(matchId);
};

export const addMessage = async (matchId, senderId, text) => {
  const timestamp = new Date().toISOString();
  
  if (isSupabaseActive()) {
    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: senderId,
      text,
      read_by: [senderId]
    });
    if (error) console.error('Supabase addMessage error:', error);
  }

  // Local sync
  const messages = getLocalMessages(matchId);
  const newMessage = {
    id: Math.random().toString(36).substring(2, 9),
    matchId,
    senderId,
    text,
    timestamp,
    readBy: [senderId]
  };
  messages.push(newMessage);
  saveLocalMessages(matchId, messages);
  return newMessage;
};

export const markMessagesAsRead = async (matchId, userId) => {
  // Local read indicator
  const messages = getLocalMessages(matchId);
  let changed = false;
  const updatedMessages = messages.map(msg => {
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      changed = true;
    }
    return msg;
  });
  if (changed) {
    saveLocalMessages(matchId, updatedMessages);
  }

  // Supabase read indicator
  if (isSupabaseActive()) {
    const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId);
    if (!error && data) {
      for (const msg of data) {
        if (!msg.read_by.includes(userId)) {
          const updated = [...msg.read_by, userId];
          await supabase.from('messages').update({ read_by: updated }).eq('id', msg.id);
        }
      }
    }
  }
};

export const getUnreadNotifications = async (userId) => {
  if (isSupabaseActive()) {
    const { data, error } = await supabase.from('messages').select('*');
    if (!error && data) {
      const matches = await getMatches();
      const myMatches = matches.filter(m => m.user1Id === userId || m.user2Id === userId);
      const myMatchIds = myMatches.map(m => m.id);

      const unreadMsgs = data.filter(msg => 
        myMatchIds.includes(msg.match_id) && 
        msg.sender_id !== userId && 
        !msg.read_by.includes(userId)
      );

      const notificationsMap = {};
      const users = await getUsers();
      
      unreadMsgs.forEach(msg => {
        const match = myMatches.find(m => m.id === msg.match_id);
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const partnerName = users.find(u => u.id === partnerId)?.name || partnerId;
        
        if (!notificationsMap[msg.match_id]) {
          notificationsMap[msg.match_id] = {
            matchId: msg.match_id,
            senderName: partnerName,
            text: msg.text,
            timestamp: msg.timestamp,
            unreadCount: 0
          };
        }
        notificationsMap[msg.match_id].unreadCount += 1;
        if (new Date(msg.timestamp) > new Date(notificationsMap[msg.match_id].timestamp)) {
          notificationsMap[msg.match_id].text = msg.text;
          notificationsMap[msg.match_id].timestamp = msg.timestamp;
        }
      });

      return Object.values(notificationsMap);
    }
  }

  // Local Storage Notifications
  const matches = getLocalMatches();
  const myMatches = matches.filter(m => m.user1Id === userId || m.user2Id === userId);
  const myMatchIds = myMatches.map(m => m.id);
  
  const notificationsMap = {};
  const users = getLocalUsers();

  myMatchIds.forEach(mId => {
    const messages = getLocalMessages(mId);
    const unread = messages.filter(msg => msg.senderId !== userId && !msg.readBy.includes(userId));
    
    if (unread.length > 0) {
      // Sort by newest
      unread.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const matchObj = myMatches.find(m => m.id === mId);
      const partnerId = matchObj.user1Id === userId ? matchObj.user2Id : matchObj.user1Id;
      const partnerName = users.find(u => u.id === partnerId)?.name || partnerId;

      notificationsMap[mId] = {
        matchId: mId,
        senderName: partnerName,
        text: unread[0].text,
        timestamp: unread[0].timestamp,
        unreadCount: unread.length
      };
    }
  });

  return Object.values(notificationsMap);
};

// ----------------------------------------------------
// RATINGS & FEEDBACK
// ----------------------------------------------------
export const addMatchReview = async (matchId, reviewerId, rating, comment) => {
  const matches = await getMatches();
  const match = matches.find(m => m.id === matchId);
  if (match) {
    if (!match.reviews) {
      match.reviews = {};
    }
    match.reviews[reviewerId] = {
      rating: parseInt(rating, 10),
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };
    
    return updateMatch(matchId, { reviews: match.reviews });
  }
  return null;
};

// ----------------------------------------------------
// DASHBOARD & METRICS
// ----------------------------------------------------
export const getDashboardStats = async (selectedWeekId = '') => {
  const matches = await getMatches();
  const users = await getUsers();
  const teamUsers = users.filter(u => !u.isAdmin);
  const objections = await getObjections();
  
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

export const getWeeklyGoal = async () => {
  const goal = localStorage.getItem('conquer_weekly_goal');
  return goal ? parseInt(goal, 10) : 2;
};

export const saveWeeklyGoal = async (goal) => {
  localStorage.setItem('conquer_weekly_goal', goal.toString());
};

export const generateWeeklyMatches = async (weekId) => {
  const users = await getUsers();
  const objections = await getObjections();
  const activeUsers = users.filter(u => u.active && !u.isAdmin);
  
  // Clean matches for this week if any exist
  const existingMatches = await getMatches();
  const cleanedMatches = existingMatches.filter(m => m.weekId !== weekId);
  
  const newMatches = generateFixtures(activeUsers, objections, weekId);
  await saveMatches([...cleanedMatches, ...newMatches]);
  return newMatches;
};
