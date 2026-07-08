// src/services/db.js
import { supabase } from './supabaseClient';
import { generateFixtures } from './fixtureEngine';

export const initializeDB = () => {
  // No-op in 100% production Supabase mode
};

// ----------------------------------------------------
// PRODUCTION 100% CLOUD SUPABASE OPERATIONS
// ----------------------------------------------------

// Users
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Supabase getUsers error:', error);
    throw error;
  }
  
  return data.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    active: u.active,
    isAdmin: u.is_admin,
  }));
};

export const addUser = async (name, isAdmin = false) => {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const password = `${id}123`;
  
  const { error } = await supabase.from('users').insert({
    id,
    name,
    password,
    is_admin: isAdmin,
    active: true
  });
  
  if (error) {
    console.error('Supabase addUser error:', error);
    throw error;
  }
  
  return { id, name, password, active: true, isAdmin };
};

export const deleteUser = async (userId) => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    console.error('Supabase deleteUser error:', error);
    throw error;
  }
};

export const toggleUserActive = async (userId) => {
  // Fetch current state
  const { data, error: fetchError } = await supabase
    .from('users')
    .select('active')
    .eq('id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  
  const newActive = !data.active;
  const { error } = await supabase.from('users').update({ active: newActive }).eq('id', userId);
  if (error) {
    console.error('Supabase toggleUserActive error:', error);
    throw error;
  }
};

export const updateUserEmail = async (userId, email) => {
  const { error } = await supabase.from('users').update({ email: email.trim() }).eq('id', userId);
  if (error) {
    console.error('Supabase updateUserEmail error:', error);
    throw error;
  }
  return getUsers();
};

export const loginUser = async (usernameId, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', usernameId.toLowerCase().trim())
    .single();
    
  if (error || !data) {
    throw new Error('El usuario no existe o las credenciales son incorrectas.');
  }
  if (data.password !== password) {
    throw new Error('Contraseña incorrecta.');
  }
  if (!data.active) {
    throw new Error('Tu cuenta está desactivada por el administrador.');
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    active: data.active,
    isAdmin: data.is_admin,
  };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const { data, error: fetchError } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .single();
    
  if (fetchError || !data) {
    throw new Error('Usuario no encontrado.');
  }
  if (data.password !== currentPassword) {
    throw new Error('La contraseña actual es incorrecta.');
  }
  
  const { error } = await supabase
    .from('users')
    .update({ password: newPassword.trim() })
    .eq('id', userId);
    
  if (error) {
    console.error('Supabase changePassword error:', error);
    throw error;
  }
};

// Objections
export const getObjections = async () => {
  const { data, error } = await supabase
    .from('objections')
    .select('*')
    .order('label', { ascending: true });
    
  if (error) {
    console.error('Supabase getObjections error:', error);
    throw error;
  }
  return data;
};

export const addObjection = async (label) => {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const { error } = await supabase.from('objections').insert({ id, label });
  if (error) {
    console.error('Supabase addObjection error:', error);
    throw error;
  }
  return { id, label };
};

export const deleteObjection = async (objId) => {
  const { error } = await supabase.from('objections').delete().eq('id', objId);
  if (error) {
    console.error('Supabase deleteObjection error:', error);
    throw error;
  }
};

// Matches / Fixtures
export const getMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Supabase getMatches error:', error);
    throw error;
  }
  
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
    confirmations: m.confirmations || {},
  }));
};

export const saveMatches = async (newMatches) => {
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
    confirmations: m.confirmations || {},
  }));
  
  const { error } = await supabase.from('matches').upsert(mapped);
  if (error) {
    console.error('Supabase saveMatches error:', error);
    throw error;
  }
};

export const updateMatch = async (matchId, updatedFields) => {
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
  if (updatedFields.confirmations !== undefined) mapped.confirmations = updatedFields.confirmations;

  // Clear confirmations if dateTime or objectionId is explicitly modified (re-agreement required)
  if (updatedFields.dateTime !== undefined || updatedFields.objectionId !== undefined) {
    mapped.confirmations = {};
  }

  const { error } = await supabase.from('matches').update(mapped).eq('id', matchId);
  if (error) {
    console.error('Supabase updateMatch error:', error);
    throw error;
  }
  return updatedFields;
};

export const toggleMatchConfirmation = async (matchId, userId) => {
  const matches = await getMatches();
  const match = matches.find(m => m.id === matchId);
  if (match) {
    const confirmations = match.confirmations ? { ...match.confirmations } : {};
    confirmations[userId] = !confirmations[userId];
    
    return updateMatch(matchId, { confirmations });
  }
  return null;
};

// Chat Messages
export const getMessages = async (matchId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('timestamp', { ascending: true });
    
  if (error) {
    console.error('Supabase getMessages error:', error);
    throw error;
  }
  
  return data.map(msg => ({
    id: msg.id,
    matchId: msg.match_id,
    senderId: msg.sender_id,
    text: msg.text,
    timestamp: msg.timestamp,
    readBy: msg.read_by || [],
  }));
};

export const addMessage = async (matchId, senderId, text) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      text,
      read_by: [senderId]
    })
    .select()
    .single();
    
  if (error) {
    console.error('Supabase addMessage error:', error);
    throw error;
  }
  
  return {
    id: data.id,
    matchId: data.match_id,
    senderId: data.sender_id,
    text: data.text,
    timestamp: data.timestamp,
    readBy: data.read_by || [],
  };
};

export const markMessagesAsRead = async (matchId, userId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId);
    
  if (error) {
    console.error('Supabase markMessagesAsRead select error:', error);
    throw error;
  }
  
  if (data) {
    for (const msg of data) {
      if (!msg.read_by.includes(userId)) {
        const updated = [...msg.read_by, userId];
        const { error: updateErr } = await supabase
          .from('messages')
          .update({ read_by: updated })
          .eq('id', msg.id);
        if (updateErr) console.error('Supabase update read_by error:', updateErr);
      }
    }
  }
};

export const getUnreadNotifications = async (userId) => {
  const { data, error } = await supabase.from('messages').select('*');
  if (error) {
    console.error('Supabase getUnreadNotifications error:', error);
    throw error;
  }
  
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
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'weekly_goal')
    .single();
    
  if (error || !data) return 2;
  return parseInt(data.value, 10);
};

export const saveWeeklyGoal = async (goal) => {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'weekly_goal', value: goal.toString() });
    
  if (error) {
    console.error('Supabase saveWeeklyGoal error:', error);
    throw error;
  }
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
