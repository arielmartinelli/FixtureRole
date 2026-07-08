// src/services/fixtureEngine.js

/**
 * Generates roleplay matches for a list of users.
 * Guarantees exactly 2 matches per user by constructing a single cycle graph.
 * 
 * @param {Array} users - Active user list
 * @param {Array} objections - List of objections
 * @param {string} weekId - ID of the week (e.g., "Semana 1")
 * @returns {Array} List of matches
 */
export const generateFixtures = (users, objections, weekId) => {
  if (users.length < 3) {
    throw new Error('Se necesitan al menos 3 miembros activos para generar los cruces.');
  }

  // Shuffle users list (Fisher-Yates)
  const shuffled = [...users];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const matches = [];
  const n = shuffled.length;

  for (let i = 0; i < n; i++) {
    const user1 = shuffled[i];
    // Pair with the next user in the cycle
    const user2 = shuffled[(i + 1) % n];

    // Pick a random objection from the list
    const randomObjIndex = Math.floor(Math.random() * objections.length);
    const objection = objections[randomObjIndex] || { id: 'otro', label: 'Otro' };

    // Format a default day/time (e.g. Wednesday or Thursday at 18:00)
    // We alternate default days to spread them out a bit
    const defaultDays = ['Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const day = defaultDays[i % defaultDays.length];
    const defaultTime = `${day} 18:00 hs`;

    matches.push({
      id: `${weekId}_${user1.id}_${user2.id}_${i}`,
      weekId,
      user1Id: user1.id,
      user2Id: user2.id,
      objectionId: objection.id,
      dateTime: defaultTime,
      status: 'Pendiente',
      failReason: '',
      updatedBy: 'system',
    });
  }

  return matches;
};
