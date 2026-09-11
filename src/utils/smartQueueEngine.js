/**
 * Smart Procurement Queue and Centre Management Engine for KisanX
 *
 * Core Rules:
 * - 4 Procurement Centres
 * - 4 Sessions per day (2 hours each)
 * - 8 Slots per session = 32 Slots max per centre per day
 * - 15 Minutes default processing time per farmer
 * - Independent Centre + Date + Session queue & token isolation
 */

export const CENTRES_CONFIG = [
  {
    id: 'apmc-main',
    name: 'APMC Mandi Main Yard',
    shortCode: 'AM',
    prefix: 'AM',
    color: '#2E7D32',
    address: 'APMC Market Yard, National Highway 8, Gate No. 1',
    counters: 1
  },
  {
    id: 'district-hub',
    name: 'District Procurement Hub',
    shortCode: 'DH',
    prefix: 'DH',
    color: '#1565C0',
    address: 'Central Civil Supplies Complex, Sector 4',
    counters: 1
  },
  {
    id: 'kvk',
    name: 'Kisan Vikas Kendra',
    shortCode: 'KV',
    prefix: 'KV',
    color: '#E65100',
    address: 'Agricultural Research & Training Sub-Station',
    counters: 1
  },
  {
    id: 'taluka-mandi',
    name: 'Taluka Mandi Centre',
    shortCode: 'TM',
    prefix: 'TM',
    color: '#6A1B9A',
    address: 'Taluka Agricultural Produce Market Committee',
    counters: 1
  }
];

export const SESSIONS_CONFIG = [
  {
    id: 'session-1',
    sessionNumber: 1,
    label: 'Session 1: 08:00 AM – 10:00 AM',
    time: '08:00 AM - 10:00 AM',
    startHour: 8,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    maxSlots: 8,
    durationHours: 2
  },
  {
    id: 'session-2',
    sessionNumber: 2,
    label: 'Session 2: 10:00 AM – 12:00 PM',
    time: '10:00 AM - 12:00 PM',
    startHour: 10,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    maxSlots: 8,
    durationHours: 2
  },
  {
    id: 'session-3',
    sessionNumber: 3,
    label: 'Session 3: 12:00 PM – 02:00 PM',
    time: '12:00 PM - 02:00 PM',
    startHour: 12,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    maxSlots: 8,
    durationHours: 2
  },
  {
    id: 'session-4',
    sessionNumber: 4,
    label: 'Session 4: 02:00 PM – 04:00 PM',
    time: '02:00 PM - 04:00 PM',
    startHour: 14,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    maxSlots: 8,
    durationHours: 2
  }
];

export const DEFAULT_PROCESSING_TIME = 15; // 15 minutes default per farmer
export const SLOTS_PER_SESSION = 8;
export const DAILY_CAPACITY_PER_CENTRE = 32; // 4 sessions * 8 slots

/**
 * Format total minutes from midnight into 12-hour AM/PM string
 */
export const formatMinutesToTime = (totalMinutes) => {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const hours24 = Math.floor(normalized / 60) % 24;
  const mins = normalized % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const padHours = String(hours12).padStart(2, '0');
  const padMins = String(mins).padStart(2, '0');
  return `${padHours}:${padMins} ${ampm}`;
};

/**
 * Get centre config by id or name
 */
export const getCentreConfig = (centreIdOrName) => {
  if (!centreIdOrName) return CENTRES_CONFIG[0];
  const clean = centreIdOrName.trim().toLowerCase();
  return (
    CENTRES_CONFIG.find(c => c.id === clean || c.name.toLowerCase() === clean || c.name.toLowerCase().includes(clean)) ||
    CENTRES_CONFIG[0]
  );
};

/**
 * Get session config by id or time string
 */
export const getSessionConfig = (sessionIdOrTime) => {
  if (!sessionIdOrTime) return SESSIONS_CONFIG[0];
  const clean = sessionIdOrTime.trim();
  return (
    SESSIONS_CONFIG.find(s => s.id === clean || s.time === clean || clean.includes(s.time)) ||
    SESSIONS_CONFIG[0]
  );
};

/**
 * Unique Queue Key scoped strictly to Centre + Date + Session
 */
export const getQueueKey = (centreId, date, sessionId) => {
  const c = getCentreConfig(centreId);
  const s = getSessionConfig(sessionId);
  return `${c.id}__${date}__${s.id}`;
};

/**
 * Generates centre-specific token (e.g. AM-001, DH-002, KV-003, TM-001)
 */
export const generateCentreToken = (centreId, tokenIndex = 1) => {
  const c = getCentreConfig(centreId);
  const num = String(Math.max(1, tokenIndex)).padStart(3, '0');
  return `${c.prefix}-${num}`;
};

/**
 * Filter bookings belonging strictly to Centre + Date + Session
 */
export const getSessionBookings = (centreIdOrName, date, sessionIdOrTime, bookings = []) => {
  const centre = getCentreConfig(centreIdOrName);
  const session = getSessionConfig(sessionIdOrTime);

  return (bookings || []).filter(b => {
    const matchCentre = (b.centreId === centre.id) || (b.centre && b.centre.toLowerCase().includes(centre.name.toLowerCase()));
    const matchDate = b.date === date;
    const matchSession = (b.sessionId === session.id) || (b.timeSlot && b.timeSlot.includes(session.time));
    const notCancelled = b.status !== 'Cancelled' && b.status !== 'Rescheduled';
    return matchCentre && matchDate && matchSession && notCancelled;
  });
};

/**
 * Calculate dynamic Centre Load Intelligence for a given Centre on a Date
 * Returns: bookedFarmers, capacity (32), availableSlots, capacityPercentage, loadStatus (Low, Moderate, High, Critical)
 */
export const calculateCentreLoad = (centreIdOrName, date, bookings = []) => {
  const centre = getCentreConfig(centreIdOrName);

  const centreDateBookings = (bookings || []).filter(b => {
    const matchCentre = (b.centreId === centre.id) || (b.centre && b.centre.toLowerCase().includes(centre.name.toLowerCase()));
    const matchDate = b.date === date;
    const notCancelled = b.status !== 'Cancelled' && b.status !== 'Rescheduled';
    return matchCentre && matchDate && notCancelled;
  });

  const bookedFarmers = centreDateBookings.length;
  const dailyCapacity = DAILY_CAPACITY_PER_CENTRE;
  const availableSlots = Math.max(0, dailyCapacity - bookedFarmers);
  const capacityPercentage = Math.min(100, Math.round((bookedFarmers / dailyCapacity) * 100));

  let loadStatus = 'LOW LOAD';
  let loadBadgeColor = '#2E7D32'; // Green
  let loadKey = 'low';

  if (capacityPercentage > 90) {
    loadStatus = 'CRITICAL';
    loadBadgeColor = '#C62828'; // Dark Red
    loadKey = 'critical';
  } else if (capacityPercentage >= 76) {
    loadStatus = 'HIGH LOAD';
    loadBadgeColor = '#E65100'; // Orange
    loadKey = 'high';
  } else if (capacityPercentage >= 51) {
    loadStatus = 'MODERATE LOAD';
    loadBadgeColor = '#F57F17'; // Yellow / Amber
    loadKey = 'moderate';
  }

  return {
    centreId: centre.id,
    centreName: centre.name,
    centreShortCode: centre.shortCode,
    prefix: centre.prefix,
    color: centre.color,
    date,
    bookedFarmers,
    dailyCapacity,
    availableSlots,
    capacityPercentage,
    loadStatus,
    loadBadgeColor,
    loadKey
  };
};

/**
 * Calculate dynamic queue status for a specific Centre + Date + Session
 */
export const calculateSessionQueue = (
  centreIdOrName,
  date,
  sessionIdOrTime,
  bookings = [],
  liveServingTokensMap = {}
) => {
  const centre = getCentreConfig(centreIdOrName);
  const session = getSessionConfig(sessionIdOrTime);
  const sessionBookings = getSessionBookings(centre.id, date, session.id, bookings);

  const bookedCount = sessionBookings.length;
  const availableSlots = Math.max(0, SLOTS_PER_SESSION - bookedCount);
  const isFull = bookedCount >= SLOTS_PER_SESSION;

  const queueKey = getQueueKey(centre.id, date, session.id);
  const currentlyServingToken = liveServingTokensMap[queueKey] || 1;

  // Next token number for a new booking
  const nextTokenNumber = Math.min(SLOTS_PER_SESSION, bookedCount + 1);
  const nextTokenStr = generateCentreToken(centre.id, nextTokenNumber);

  // Farmers ahead of the next position relative to currently serving
  const farmersAhead = Math.max(0, bookedCount - (currentlyServingToken - 1));

  // Dynamic wait time based on 15 minutes per farmer ahead
  const estimatedWaitMinutes = farmersAhead * DEFAULT_PROCESSING_TIME;

  // Session start in minutes from midnight
  const sessionStartMinutes = session.startHour * 60 + session.startMinute;
  const sessionEndMinutes = session.endHour * 60 + session.endMinute;

  // Expected Turn Time = Session Start + (tokenNumber - 1) * 15 min
  const turnMinutes = sessionStartMinutes + (nextTokenNumber - 1) * DEFAULT_PROCESSING_TIME;
  const turnTimeStr = formatMinutesToTime(turnMinutes);

  // Recommended Arrival Time: 5 to 10 minutes before estimated turn, not before session start
  const recommendedArrivalMinutes = Math.max(sessionStartMinutes, turnMinutes - 10);
  const recommendedArrivalStr = formatMinutesToTime(recommendedArrivalMinutes);

  // Mandatory 5-minute gate arrival notice
  const reportMinutes = Math.max(sessionStartMinutes, turnMinutes - 5);
  const reportTimeStr = formatMinutesToTime(reportMinutes);

  return {
    centreId: centre.id,
    centreName: centre.name,
    sessionId: session.id,
    sessionLabel: session.label,
    timeSlot: session.time,
    date,
    bookedCount,
    maxSlots: SLOTS_PER_SESSION,
    availableSlots,
    isFull,
    currentlyServingToken,
    nextTokenNumber,
    nextTokenStr,
    farmersAhead,
    estimatedWaitMinutes,
    turnTimeStr,
    turnMinutes,
    recommendedArrivalStr,
    reportTimeStr,
    sessionStartTime: formatMinutesToTime(sessionStartMinutes),
    sessionEndTime: formatMinutesToTime(sessionEndMinutes),
    sessionStartMinutes,
    sessionEndMinutes,
    averageProcessingTime: DEFAULT_PROCESSING_TIME,
    activeCounters: centre.counters || 1,
    bookingsList: sessionBookings
  };
};

/**
 * Calculates estimated wait time for an existing booking or arbitrary queue position
 */
export const calculateEstimatedWaitTime = (
  queuePosition = 1,
  averageProcessingTime = DEFAULT_PROCESSING_TIME,
  activeCounters = 1,
  currentServing = 1
) => {
  const farmersAhead = Math.max(0, queuePosition - currentServing);
  const counters = Math.max(1, activeCounters);
  return Math.round((farmersAhead * averageProcessingTime) / counters);
};

/**
 * Calculates dynamic recommended arrival time based on session start and token position
 */
export const calculateRecommendedArrivalTime = (
  sessionStartInput = '08:00 AM',
  tokenIndex = 1,
  processingTimePerFarmer = DEFAULT_PROCESSING_TIME,
  arrivalBufferMinutes = 10
) => {
  let startMinutes = 8 * 60; // 08:00 AM default
  if (typeof sessionStartInput === 'number') {
    startMinutes = sessionStartInput;
  } else if (sessionStartInput && typeof sessionStartInput === 'object') {
    if (sessionStartInput.startHour !== undefined) {
      startMinutes = sessionStartInput.startHour * 60 + (sessionStartInput.startMinute || 0);
    } else if (sessionStartInput.hour !== undefined) {
      startMinutes = sessionStartInput.hour * 60 + (sessionStartInput.minute || 0);
    }
  } else if (typeof sessionStartInput === 'string') {
    const match = sessionStartInput.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      startMinutes = h * 60 + m;
    }
  }

  const turnMinutes = startMinutes + Math.max(0, tokenIndex - 1) * processingTimePerFarmer;
  const turnTime = formatMinutesToTime(turnMinutes);
  const arrivalMinutes = Math.max(0, turnMinutes - arrivalBufferMinutes);
  const recommendedArrival = formatMinutesToTime(arrivalMinutes);
  const reportTime = formatMinutesToTime(Math.max(0, turnMinutes - 5));

  return {
    turnTime,
    turnMinutes,
    recommendedArrival,
    arrivalMinutes,
    reportTime,
    bufferMinutes: arrivalBufferMinutes,
    toString: () => recommendedArrival
  };
};

/**
 * SMART SLOT & CENTRE RECOMMENDATION ALGORITHM
 *
 * Analyzes all 4 procurement centres and their 4 sessions for a preferred date.
 * Transparent rule-based scoring:
 * - Lower waiting time (highest weight)
 * - Lower queue length
 * - Lower centre capacity percentage
 * - Higher available slots
 * - Session availability (never recommends a FULL session)
 *
 * Returns: { recommendedOption, allOptions, centreHealthList, preferredDate }
 */
export const getSmartSlotRecommendation = ({
  crop,
  quantity,
  preferredDate,
  bookings = [],
  preferredCentreId = null
}) => {
  const targetDate = preferredDate || '10 September 2026';
  const allOptions = [];
  const centreHealthList = [];

  // 1. Calculate health & load for all 4 centres
  CENTRES_CONFIG.forEach(centre => {
    const load = calculateCentreLoad(centre.id, targetDate, bookings);
    centreHealthList.push(load);

    // 2. Calculate queue for each of the 4 sessions in this centre
    SESSIONS_CONFIG.forEach(session => {
      const queueInfo = calculateSessionQueue(centre.id, targetDate, session.id, bookings);

      // Rule-based score (lower score is better):
      // Waiting time (weight 5) + Queue ahead (weight 10) + Centre capacity percentage (weight 0.5)
      // If full, heavily penalize so it is never recommended
      let score = 0;
      if (queueInfo.isFull) {
        score = 999999;
      } else {
        score = (queueInfo.estimatedWaitMinutes * 5) +
                (queueInfo.farmersAhead * 10) +
                (load.capacityPercentage * 0.5);

        // Small tie-breaker preference if user had preferred centre
        if (preferredCentreId && centre.id === preferredCentreId) {
          score -= 5;
        }
      }

      allOptions.push({
        centreId: centre.id,
        centreName: centre.name,
        shortCode: centre.shortCode,
        centreColor: centre.color,
        address: centre.address,
        sessionId: session.id,
        sessionLabel: session.label,
        timeSlot: session.time,
        date: targetDate,
        bookedCount: queueInfo.bookedCount,
        maxSlots: queueInfo.maxSlots,
        availableSlots: queueInfo.availableSlots,
        isFull: queueInfo.isFull,
        farmersAhead: queueInfo.farmersAhead,
        estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
        turnTimeStr: queueInfo.turnTimeStr,
        recommendedArrivalStr: queueInfo.recommendedArrivalStr,
        sessionStartTime: queueInfo.sessionStartTime,
        sessionEndTime: queueInfo.sessionEndTime,
        centreLoad: load,
        score
      });
    });
  });

  // Filter available options (not full) and sort by score ascending
  const availableOptions = allOptions.filter(opt => !opt.isFull).sort((a, b) => a.score - b.score);

  let recommendedOption = null;
  if (availableOptions.length > 0) {
    recommendedOption = { ...availableOptions[0] };

    // Generate dynamic, transparent reasoning
    let reasons = [];
    if (recommendedOption.estimatedWaitMinutes === 0) {
      reasons.push('Immediate zero-wait turn (1st in session queue)');
    } else if (recommendedOption.estimatedWaitMinutes <= 15) {
      reasons.push(`Shortest estimated wait time (~${recommendedOption.estimatedWaitMinutes} mins)`);
    } else {
      reasons.push(`Lowest queue (${recommendedOption.farmersAhead} farmers ahead)`);
    }

    if (recommendedOption.centreLoad.capacityPercentage <= 50) {
      reasons.push(`Least congested centre (${recommendedOption.centreLoad.loadStatus})`);
    }

    if (recommendedOption.availableSlots >= 4) {
      reasons.push(`${recommendedOption.availableSlots} slots available in session`);
    }

    const reasoningText = reasons.join(' • ');
    recommendedOption.recommendationReason = reasoningText;
    recommendedOption.reasoning = reasoningText;
    recommendedOption.bookedInSession = recommendedOption.bookedCount;
    recommendedOption.sessionTime = recommendedOption.timeSlot;
    recommendedOption.recommendedArrival = recommendedOption.recommendedArrivalStr;
    recommendedOption.turnTime = recommendedOption.turnTimeStr;
  } else {
    // If all sessions are somehow full, fallback to earliest session with notice
    recommendedOption = allOptions[0] ? {
      ...allOptions[0],
      recommendationReason: 'All sessions operating at high demand. Selected earliest available schedule.',
      reasoning: 'All sessions operating at high demand. Selected earliest available schedule.',
      bookedInSession: allOptions[0].bookedCount,
      sessionTime: allOptions[0].timeSlot,
      recommendedArrival: allOptions[0].recommendedArrivalStr,
      turnTime: allOptions[0].turnTimeStr
    } : null;
  }

  return {
    recommendedOption,
    allOptions,
    centreHealthList,
    preferredDate: targetDate
  };
};

/**
 * MISSED SLOT RECOVERY ALGORITHM
 * Finds:
 * 1. Option 1: Next available session at SAME CENTRE
 * 2. Option 2: Alternative nearby CENTRE with lowest queue and shortest wait
 */
export const findMissedSlotRecoveryOptions = (bookingOrObj, maybeBookings = []) => {
  let currentBooking = bookingOrObj;
  let bookings = maybeBookings;
  if (bookingOrObj && bookingOrObj.currentBooking) {
    currentBooking = bookingOrObj.currentBooking;
    bookings = bookingOrObj.bookings || [];
  }
  if (!currentBooking) return { option1SameCentre: null, option2AltCentre: null, optionSameCentre: null, optionAlternativeCentre: null };

  const centre = getCentreConfig(currentBooking.centreId || currentBooking.centre);
  const targetDate = currentBooking.date || '10 September 2026';

  // Option 1: Same centre, next available session
  const sameCentreOptions = SESSIONS_CONFIG
    .map(session => {
      const q = calculateSessionQueue(centre.id, targetDate, session.id, bookings);
      return {
        centreId: centre.id,
        centreName: centre.name,
        sessionId: session.id,
        sessionLabel: session.label,
        timeSlot: session.time,
        date: targetDate,
        queue: q.farmersAhead,
        bookedInSession: q.bookedCount,
        availableSlots: q.availableSlots,
        estimatedWait: q.estimatedWaitMinutes,
        estimatedWaitMinutes: q.estimatedWaitMinutes,
        turnTime: q.turnTimeStr,
        recommendedArrival: q.recommendedArrivalStr,
        isFull: q.isFull,
        sessionStartTime: q.sessionStartTime,
        sessionEndTime: q.sessionEndTime
      };
    })
    .filter(opt => !opt.isFull && opt.timeSlot !== currentBooking.timeSlot);

  const optionSameCentre = sameCentreOptions.length > 0 ? sameCentreOptions[0] : null;

  // Option 2: Other 3 centres with lowest wait time
  const otherCentreOptions = [];
  CENTRES_CONFIG
    .filter(c => c.id !== centre.id)
    .forEach(otherCentre => {
      const load = calculateCentreLoad(otherCentre.id, targetDate, bookings);

      SESSIONS_CONFIG.forEach(session => {
        const q = calculateSessionQueue(otherCentre.id, targetDate, session.id, bookings);
        if (!q.isFull) {
          otherCentreOptions.push({
            centreId: otherCentre.id,
            centreName: otherCentre.name,
            shortCode: otherCentre.shortCode,
            sessionId: session.id,
            sessionLabel: session.label,
            timeSlot: session.time,
            date: targetDate,
            queue: q.farmersAhead,
            bookedInSession: q.bookedCount,
            availableSlots: q.availableSlots,
            estimatedWait: q.estimatedWaitMinutes,
            estimatedWaitMinutes: q.estimatedWaitMinutes,
            turnTime: q.turnTimeStr,
            recommendedArrival: q.recommendedArrivalStr,
            capacityPercentage: load.capacityPercentage,
            loadStatus: load.loadStatus,
            sessionStartTime: q.sessionStartTime,
            sessionEndTime: q.sessionEndTime,
            score: q.estimatedWaitMinutes * 5 + q.farmersAhead * 10
          });
        }
      });
    });

  otherCentreOptions.sort((a, b) => a.score - b.score);
  const optionAlternativeCentre = otherCentreOptions.length > 0 ? otherCentreOptions[0] : null;

  return {
    option1SameCentre: optionSameCentre,
    option2AltCentre: optionAlternativeCentre,
    optionSameCentre,
    optionAlternativeCentre
  };
};
