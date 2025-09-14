import React from 'react';

export default function DaySelector({ selectedDay, setSelectedDay, useDateKey, logsByDay }) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Dropdown for previous days
  const previousDays = Object.keys(logsByDay)
    .filter(key => key !== todayKey)
    .sort((a, b) => b.localeCompare(a));

  return (
    <div className="day-selector" style={{ justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
      <button className="active" style={{ fontWeight: 600, fontSize: '1.1rem' }} disabled>{label}</button>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <select
          style={{ borderRadius: 16, padding: '0.4rem 0.9rem', background: '#232a36', color: '#f2f2f2', fontSize: '0.95rem', border: 'none', minWidth: 180 }}
          onChange={e => setSelectedDay(e.target.value)}
          value={selectedDay !== todayKey ? selectedDay : ''}
        >
          <option value="">Select previous day...</option>
          {previousDays.map(key => (
            <option key={key} value={key}>
              {new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
