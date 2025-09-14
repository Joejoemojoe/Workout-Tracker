
import React, { useState } from 'react';
import './App.css';
import WorkoutTabs from './components/WorkoutTabs';
import WorkoutCard from './components/WorkoutCard';
import DaySelector from './components/DaySelector';

// Flex Wheeler's actual day cycle (example):
const dayCycle = [
  { day: 'Monday', tab: 'chest' },
  { day: 'Tuesday', tab: 'back' },
  { day: 'Wednesday', tab: 'arms' },
  { day: 'Thursday', tab: 'shoulders' },
  { day: 'Friday', tab: 'legs' },
  { day: 'Saturday', tab: 'rest' },
  { day: 'Sunday', tab: 'rest' },
];

const trackerTab = 'tracker';

const workouts = {
  chest: {
    title: 'Chest Workout',
    exercises: [
      { name: 'Incline barbell bench', sets: 5, reps: '10-12' },
      { name: 'Flat machine press', sets: 5, reps: '10-15' },
      { name: 'Flat dumbbell bench press', sets: 5, reps: '8-12' },
      { name: 'Hammer strength press', sets: 5, reps: '10-15' },
      { name: 'Incline dumbbell fly', sets: 5, reps: '15-20' },
    ],
  },
  back: {
    title: 'Back Workout',
    exercises: [
      { name: 'Assisted pull up machine', sets: 5, reps: '10' },
      { name: 'T-bar row', sets: 5, reps: '10-15' },
      { name: 'Close grip seated cable row', sets: 5, reps: '8-12' },
      { name: 'Close grip lat pulldown', sets: 5, reps: '8-12' },
      { name: 'Barbell deadlift', sets: 5, reps: '8-12' },
    ],
  },
  arms: {
    title: 'Arm Workout',
    exercises: [
      { name: 'Triceps pushdown machine', sets: 4, reps: '10-15' },
      { name: 'Single-arm machine preacher curl', sets: 4, reps: '10-15' },
      { name: 'Single-arm triceps extension with rope', sets: 4, reps: '10-15' },
      { name: 'Machine preacher curl', sets: 4, reps: '10-15' },
      { name: 'Dumbbell alternating curl', sets: 4, reps: '10-15' },
    ],
  },
  shoulders: {
    title: 'Shoulder Workout',
    exercises: [
      { name: 'Dumbbell rear delt fly', sets: 5, reps: '10-15' },
      { name: 'Barbell upright row', sets: 5, reps: '8-12' },
      { name: 'Incline dumbbell front raise', sets: 5, reps: '10-15' },
      { name: 'Smith machine overhead press', sets: 5, reps: '8-12' },
      { name: 'Reverse pec deck', sets: 5, reps: '15-20' },
      { name: 'Machine shrug', sets: 5, reps: '12-15' },
    ],
  },
  legs: {
    title: 'Leg Workout',
    exercises: [
      { name: 'Single leg extension', sets: 4, reps: '15-20' },
      { name: 'Leg press', sets: 4, reps: '15-20' },
      { name: 'Hack squat', sets: 4, reps: '15-20' },
      { name: 'Lying hamstring curl', sets: 4, reps: '15-20' },
      { name: 'Leg extension', sets: 4, reps: '15-20' },
      { name: 'Seated calf raise', sets: 4, reps: '20' },
      { name: 'Donkey calf raise', sets: 4, reps: '20' },
    ],
  },
};


function getDayOfWeek(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

function getDateKey(date) {
  // Format as YYYY-MM-DD
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function getWeekKeys() {
  const today = new Date();
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    week.push(d.toISOString().slice(0, 10));
  }
  return week;
}

function getStats(logsByDay) {
  const weekKeys = getWeekKeys();
  let totalSets = 0, totalReps = 0, totalWeight = 0, daysTrained = 0;
  let allSets = [], allReps = [], allWeight = [];
  weekKeys.forEach(key => {
    const dayLogs = logsByDay[key];
    if (dayLogs) {
      Object.values(dayLogs).forEach(exLogs => {
        if (Array.isArray(exLogs)) {
          daysTrained++;
          exLogs.forEach(log => {
            if (log.sets) {
              totalSets += Number(log.sets);
              allSets.push(Number(log.sets));
            }
            if (log.reps) {
              totalReps += Number(log.reps);
              allReps.push(Number(log.reps));
            }
            if (log.weight) {
              totalWeight += Number(log.weight);
              allWeight.push(Number(log.weight));
            }
          });
        }
      });
    }
  });
  // Calculate averages
  const avgSets = allSets.length ? Math.round(allSets.reduce((a,b)=>a+b,0)/allSets.length) : 0;
  const avgReps = allReps.length ? Math.round(allReps.reduce((a,b)=>a+b,0)/allReps.length) : 0;
  const avgWeight = allWeight.length ? Math.round(allWeight.reduce((a,b)=>a+b,0)/allWeight.length) : 0;
  return { totalSets, totalReps, totalWeight, daysTrained, avgSets, avgReps, avgWeight };
}

function App() {
  const todayKey = getDateKey(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [logsByDay, setLogsByDay] = useState({});
  const [showTracker, setShowTracker] = useState(false);

  // Determine which tab is active for the selected day
  const dayOfWeek = getDayOfWeek(selectedDay);
  const cycle = dayCycle.find(d => d.day === dayOfWeek);
  const activeTab = showTracker ? trackerTab : cycle?.tab;

  const handleLog = (tab, logs) => {
    setLogsByDay(prev => ({
      ...prev,
      [selectedDay]: {
        ...(prev[selectedDay] || {}),
        [tab]: logs
      }
    }));
  };

  // Stats for tracker tab
  const stats = getStats(logsByDay);
  const percentTrained = Math.round((stats.daysTrained / 5) * 100); // 5 training days per week

  return (
    <div className="container">
      <h1>Flex Wheeler Workout Tracker</h1>
      <DaySelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} useDateKey logsByDay={logsByDay} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <button
          className={showTracker ? 'active' : ''}
          style={{ background: showTracker ? '#007aff' : '#232a36', color: '#fff', borderRadius: 20, padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowTracker(true)}
        >
          Tracker
        </button>
        <button
          className={!showTracker ? 'active' : ''}
          style={{ background: !showTracker ? '#007aff' : '#232a36', color: '#fff', borderRadius: 20, padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowTracker(false)}
        >
          Workout
        </button>
      </div>
      {activeTab === trackerTab ? (
        <div className="workout-card">
          <h2>Weekly Training Progress</h2>
          <div style={{ margin: '1.2rem 0' }}>
            <div style={{ background: '#232a36', borderRadius: 12, height: 24, width: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
              <div style={{ background: '#007aff', height: '100%', width: `${percentTrained}%`, borderRadius: 12, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ marginTop: 8, fontSize: '1rem', color: '#f2f2f2' }}>{percentTrained}% of training days completed</div>
          </div>
          <div style={{ marginTop: '1.2rem', fontSize: '1.05rem' }}>
            <div>Total Sets: <strong>{stats.totalSets}</strong> (Avg: {stats.avgSets})</div>
            <div>Total Reps: <strong>{stats.totalReps}</strong> (Avg: {stats.avgReps})</div>
            <div>Total Weight: <strong>{stats.totalWeight} kg</strong> (Avg: {stats.avgWeight} kg)</div>
          </div>
        </div>
      ) : activeTab && activeTab !== 'rest' ? (
        <WorkoutCard
          {...workouts[activeTab]}
          logs={logsByDay[selectedDay]?.[activeTab] || null}
          onLog={logs => handleLog(activeTab, logs)}
        />
      ) : (
        <div className="workout-card">
          <h2>Rest Day</h2>
          <p>Take a break and recover!</p>
        </div>
      )}
    </div>
  );
}

export default App;

