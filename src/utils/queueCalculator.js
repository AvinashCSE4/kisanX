/**
 * 2-Hour Duration Slots Configuration and Real-time Queue Calculation
 *
 * Operational Model:
 * - 4 Sessions per day (2 hours each)
 * - 8 Farmer slots per session = 32 farmers max per centre per day
 * - 15 Minutes default processing time per farmer
 * - Report at gate: 5 minutes prior to estimated turn
 */

import {
  SESSIONS_CONFIG,
  DEFAULT_PROCESSING_TIME,
  formatMinutesToTime as formatTimeMinutesEngine
} from './smartQueueEngine';

export const TIME_SLOTS_CONFIG = SESSIONS_CONFIG.map(s => ({
  id: s.id,
  time: s.time,
  label: s.label,
  startHour: s.startHour,
  startMinute: s.startMinute,
  endHour: s.endHour,
  endMinute: s.endMinute,
  maxCapacity: s.maxSlots
}));

export const MINUTES_PER_BOOKING = DEFAULT_PROCESSING_TIME; // 15 minutes default service per farmer
export const REPORT_BEFORE_MINUTES = 5; // Report at gate 5 min prior

export const formatTimeMinutes = formatTimeMinutesEngine;

/**
 * Calculates estimated wait time, turn time, and gate reporting time (5 min prior)
 */
export const calculateQueueTimes = (timeSlotStr, tokenNumber = 1) => {
  const slot = TIME_SLOTS_CONFIG.find(s => s.time === timeSlotStr || timeSlotStr?.includes(s.time)) || TIME_SLOTS_CONFIG[0];
  const slotStartMinutes = slot.startHour * 60 + slot.startMinute;

  const membersAhead = Math.max(0, tokenNumber - 1);
  // Waiting time based on 15 minutes per member ahead in queue
  const estimatedWaitMinutes = membersAhead * MINUTES_PER_BOOKING;

  // Turn time = slot start + (membersAhead * 15 minutes)
  const turnMinutes = slotStartMinutes + estimatedWaitMinutes;
  // Report 5 minutes before turn time
  const reportMinutes = Math.max(slotStartMinutes, turnMinutes - REPORT_BEFORE_MINUTES);

  return {
    membersAhead,
    estimatedWaitMinutes,
    turnTime: formatTimeMinutes(turnMinutes),
    reportTime: formatTimeMinutes(reportMinutes),
    minutesPerBooking: MINUTES_PER_BOOKING,
    reportBeforeMinutes: REPORT_BEFORE_MINUTES,
    slotStartMinutes,
    slotEndMinutes: slot.endHour * 60 + slot.endMinute
  };
};
