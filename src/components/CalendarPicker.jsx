import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePortalData } from '../context/PortalDataContext';
import { TIME_SLOTS_CONFIG } from '../utils/queueCalculator';

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'],
  gu: ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']
};

const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  gu: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ']
};

export const CalendarPicker = ({ selectedDateStr, onSelectDate }) => {
  const { language } = useLanguage();
  const { bookings } = usePortalData();

  // Reference base date (September 2026 or current)
  // Parse incoming date if string like "10 September 2026"
  const parseDateString = (str) => {
    if (!str) return new Date(2026, 8, 10);
    const parts = str.split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthIdx = MONTH_NAMES.en.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(2026, 8, 10) : d;
  };

  const initialDate = parseDateString(selectedDateStr);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  // Today reference
  const today = new Date(2026, 8, 10); // Simulated Sept 10, 2026

  const selectedDateObj = parseDateString(selectedDateStr);

  const formatOutputDate = (year, monthIdx, day) => {
    const monthEn = MONTH_NAMES.en[monthIdx];
    return `${day} ${monthEn} ${year}`;
  };

  const getLocalizedMonth = (monthIdx) => {
    const list = MONTH_NAMES[language] || MONTH_NAMES.en;
    return list[monthIdx];
  };

  const dayHeaders = DAY_NAMES[language] || DAY_NAMES.en;

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Days calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const handleSelectDay = (day) => {
    const formatted = formatOutputDate(viewYear, viewMonth, day);
    onSelectDate(formatted);
  };

  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day) => {
    return (
      selectedDateObj.getDate() === day &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getFullYear() === viewYear
    );
  };

  // Disable dates before today (Sept 10, 2026)
  const isPast = (day) => {
    const checkDate = new Date(viewYear, viewMonth, day);
    checkDate.setHours(0, 0, 0, 0);
    const refToday = new Date(today);
    refToday.setHours(0, 0, 0, 0);
    return checkDate < refToday;
  };

  // Helper to determine slot availability for any date (4 slots, 30 bookings each = 120 max)
  const getSlotsForDate = (year, monthIdx, day) => {
    const formattedDate = formatOutputDate(year, monthIdx, day);
    const dateBookings = (bookings || []).filter(b => b.date === formattedDate);
    const bookedBookings = dateBookings.length;
    const totalBookingsCapacity = 120; // 4 slots * 30 bookings each = 120
    const availableBookings = Math.max(0, totalBookingsCapacity - bookedBookings);

    const totalSlots = 4;
    const availableSlots = TIME_SLOTS_CONFIG.filter(slot => {
      const inSlot = dateBookings.filter(b => b.timeSlot === slot.time);
      return inSlot.length < 30;
    }).length;

    return {
      availableSlots,
      bookedSlots: totalSlots - availableSlots,
      availableBookings,
      bookedBookings,
      totalSlots,
      totalBookingsCapacity
    };
  };

  const currentSelectedSlots = getSlotsForDate(
    selectedDateObj.getFullYear(),
    selectedDateObj.getMonth(),
    selectedDateObj.getDate()
  );

  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      padding: '14px',
      marginBottom: '16px'
    }}>
      {/* Quick Selectors: Today & Tomorrow */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          style={{ flex: 1, fontSize: '13px' }}
          onClick={() => {
            setViewYear(2026);
            setViewMonth(8);
            onSelectDate('10 September 2026');
          }}
        >
          📅 Today (10 Sep) • 118/120 Available
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          style={{ flex: 1, fontSize: '13px' }}
          onClick={() => {
            setViewYear(2026);
            setViewMonth(8);
            onSelectDate('11 September 2026');
          }}
        >
          📅 Tomorrow (11 Sep) • 120/120 Available
        </button>
      </div>

      {/* Month & Year Navigation Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 4px',
        backgroundColor: 'var(--color-secondary-bg)',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <button
          type="button"
          onClick={prevMonth}
          className="icon-btn"
          style={{ color: 'var(--color-primary-dark)' }}
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft size={22} />
        </button>

        <div style={{ fontWeight: '800', fontSize: '17px', color: 'var(--color-primary-dark)' }}>
          {getLocalizedMonth(viewMonth)} {viewYear}
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="icon-btn"
          style={{ color: 'var(--color-primary-dark)' }}
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Day of Week Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '13px',
        color: 'var(--color-text-muted)',
        marginBottom: '8px'
      }}>
        {dayHeaders.map((dh, i) => (
          <div key={i} style={{ padding: '4px 0' }}>{dh}</div>
        ))}
      </div>

      {/* Calendar Days Grid with Slot Count on each day */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}>
        {/* Empty cells before 1st of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} style={{ minHeight: '48px' }} />
        ))}

        {/* Days of the Month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const past = isPast(day);
          const sel = isSelected(day);
          const td = isToday(day);
          const slotInfo = getSlotsForDate(viewYear, viewMonth, day);

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={past}
              onClick={() => handleSelectDay(day)}
              style={{
                minHeight: '48px',
                height: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: sel ? '2.5px solid var(--color-primary-dark)' : td ? '1.5px solid var(--color-accent-wheat)' : '1px solid #E0E0E0',
                borderRadius: '6px',
                backgroundColor: sel ? 'var(--color-primary)' : past ? '#F5F5F5' : '#FFFFFF',
                color: sel ? '#FFFFFF' : past ? '#BDBDBD' : 'var(--color-text-main)',
                fontWeight: sel || td ? '700' : '500',
                cursor: past ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                padding: '2px 0'
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: '1.1' }}>{day}</span>
              {!past && (
                <span style={{
                  fontSize: '9px',
                  color: sel ? '#FFFFFF' : 'var(--color-primary)',
                  fontWeight: '700',
                  lineHeight: '1',
                  marginTop: '2px'
                }}>
                  {slotInfo.availableBookings} available
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Number of Slots Available Below the Date Strip */}
      <div style={{
        marginTop: '14px',
        padding: '12px 14px',
        backgroundColor: 'var(--color-secondary-bg)',
        border: '1.5px solid var(--color-primary)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--color-primary-dark)', fontWeight: '700' }}>
            <CalendarIcon size={18} />
            <span>Selected Date: <strong>{selectedDateStr}</strong></span>
          </div>
          <span className="badge badge-verified" style={{ fontSize: '13px', padding: '4px 10px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-primary)' }}>
            🟢 4 Slots (120 Bookings Available)
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-main)', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '2px', flexWrap: 'wrap', gap: '4px' }}>
          <span><strong>4 Slots of 2-Hours</strong> (30 bookings each)</span>
          <span>Available Capacity: <strong>{currentSelectedSlots.availableBookings} / 120</strong></span>
          <span>Hours: <strong>09:00 AM - 06:00 PM</strong></span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPicker;
