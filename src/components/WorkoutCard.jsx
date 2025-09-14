

import React, { useState } from 'react';

const defaultHistory = {};
const feedbackOptions = [
  { value: 'strong', label: 'Felt strong' },
  { value: 'normal', label: 'Felt normal' },
  { value: 'weak', label: 'Felt weak' },
  { value: 'plateau', label: 'Plateau' },
];

function getSuggestedWeight(history, idx, feedback) {
  // Get last weight for this exercise
  const logs = history[Object.keys(history)[idx]] || [];
  const lastWeight = logs.length ? Number(logs[logs.length - 1].weight) : 0;
  let increment = 2.5; // Default increment
  if (feedback === 'weak' || feedback === 'plateau') increment = 1;
  if (feedback === 'strong') increment = 5;
  return lastWeight ? Math.round(lastWeight + increment) : '';
}

export default function WorkoutCard({ title, exercises }) {
  const [logs, setLogs] = useState(
    exercises.map(() => ({ sets: '', reps: '', weight: '' }))
  );
  const [history, setHistory] = useState(defaultHistory);
  const [swapIdx, setSwapIdx] = useState(null);
  const [swapName, setSwapName] = useState('');
  const [feedback, setFeedback] = useState(
    exercises.map(() => 'normal')
  );

  const handleChange = (idx, field, value) => {
    const updated = logs.map((log, i) =>
      i === idx ? { ...log, [field]: value } : log
    );
    setLogs(updated);
  };

  const handleFeedback = (idx, value) => {
    setFeedback(fb => fb.map((f, i) => (i === idx ? value : f)));
  };

  const handleLog = idx => {
    const exName = exercises[idx].name;
    setHistory(h => ({
      ...h,
      [exName]: [...(h[exName] || []), { ...logs[idx], feedback: feedback[idx] }]
    }));
    setLogs(logs.map((log, i) => i === idx ? { sets: '', reps: '', weight: '' } : log));
  };

  const handleSwap = idx => {
    if (swapName.trim()) {
      exercises[idx].name = swapName;
      setSwapIdx(null);
      setSwapName('');
    }
  };

  return (
    <div className="workout-card">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Exercise</th>
            <th>Sets</th>
            <th>Reps</th>
            <th>Weight</th>
            <th>Suggested</th>
            <th>Feedback</th>
            <th>Log</th>
            <th>Swap</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, idx) => (
            <tr key={ex.name + idx}>
              <td>{ex.name}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={logs[idx].sets}
                  onChange={e => handleChange(idx, 'sets', e.target.value)}
                  placeholder={ex.sets}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={logs[idx].reps}
                  onChange={e => handleChange(idx, 'reps', e.target.value)}
                  placeholder={ex.reps}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={logs[idx].weight}
                  onChange={e => handleChange(idx, 'weight', e.target.value)}
                  placeholder="kg"
                />
              </td>
              <td>
                <span style={{ color: '#007aff', fontWeight: 600 }}>
                  {getSuggestedWeight(history, idx, feedback[idx])}
                </span>
              </td>
              <td>
                <select
                  value={feedback[idx]}
                  onChange={e => handleFeedback(idx, e.target.value)}
                  style={{ borderRadius: 8, padding: '0.2rem 0.5rem', background: '#232a36', color: '#f2f2f2', border: 'none' }}
                >
                  {feedbackOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => handleLog(idx)}>Log</button>
              </td>
              <td>
                {swapIdx === idx ? (
                  <>
                    <input
                      type="text"
                      value={swapName}
                      onChange={e => setSwapName(e.target.value)}
                      placeholder="New exercise name"
                    />
                    <button onClick={() => handleSwap(idx)}>Save</button>
                    <button onClick={() => setSwapIdx(null)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setSwapIdx(idx)}>Swap</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="progress-history">
        <h3>Progress History</h3>
        {Object.keys(history).length === 0 && <p>No history yet.</p>}
        {Object.entries(history).map(([exName, logs]) => (
          <div key={exName}>
            <strong>{exName}</strong>
            <ul>
              {logs.map((log, i) => (
                <li key={i}>
                  Sets: {log.sets}, Reps: {log.reps}, Weight: {log.weight}kg, Feedback: {log.feedback}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
