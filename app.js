// Minimal SPA for Workout Tracker (no build required)
const workouts = {
  chest: [
    'Incline barbell bench',
    'Flat machine press',
    'Flat dumbbell bench press',
    'Hammer strength press',
    'Incline dumbbell fly'
  ],
  back: [
    'Assisted pull up machine',
    'T-bar row',
    'Close grip seated cable row',
    'Close grip lat pulldown',
    'Barbell deadlift'
  ],
  arms: [
    'Triceps pushdown machine',
    'Single-arm machine preacher curl',
    'Single-arm triceps extension with rope',
    'Machine preacher curl',
    'Dumbbell alternating curl'
  ],
  shoulders: [
    'Dumbbell rear delt fly',
    'Barbell upright row',
    'Incline dumbbell front raise',
    'Smith machine overhead press',
    'Reverse pec deck',
    'Machine shrug'
  ],
  legs: [
    'Single leg extension',
    'Leg press',
    'Hack squat',
    'Lying hamstring curl',
    'Leg extension',
    'Seated calf raise',
    'Donkey calf raise'
  ]
};

const dayCycle = ['chest','back','arms','shoulders','legs','rest','rest'];

function getDateKey(d=new Date()){return d.toISOString().slice(0,10)}
function getWeekdayName(dateKey){return new Date(dateKey).toLocaleDateString('en-US',{weekday:'long'})}

const todayKey = getDateKey();
const selected = { day: todayKey };

const STORAGE_KEY = 'workout-tracker-logs-v1'
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{}}catch(e){return {}}}
function save(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}

let db = load();

function init(){
  document.getElementById('todayLabel').textContent = new Date().toLocaleDateString();
  const sel = document.getElementById('previousDays');
  sel.innerHTML='<option value="">View previous day...</option>';
  Object.keys(db).sort((a,b)=>b.localeCompare(a)).forEach(k=>{
    const opt=document.createElement('option');opt.value=k;opt.textContent=new Date(k).toLocaleDateString();sel.appendChild(opt)
  })
  sel.addEventListener('change',(e)=>{
    if(e.target.value) selected.day=e.target.value; render();
  })
  // segmented control events
  const segContainer = document.querySelector('.segmented');
  if(segContainer){
    segContainer.addEventListener('click',(e)=>{
      const btn = e.target.closest('.seg-btn');
      if(!btn) return;
      segContainer.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      if(view==='tracker') renderTracker(); else render();
    })
  }
  render();
}

function getTabForDate(dateKey){
  const dow = new Date(dateKey).getDay(); // 0 Sun..6 Sat
  // Map Sunday(0) to rest, Monday(1)=chest etc.
  return dayCycle[(dow+6)%7];
}

function render(){
  const content=document.getElementById('content');content.innerHTML='';
  const tab=getTabForDate(selected.day);
  if(tab==='rest'){
    const card=document.createElement('div');card.className='card view-enter';card.innerHTML='<h2>Rest Day</h2><p class="small">Take a break and recover</p>'
    content.appendChild(card);return
  }
  const card=document.createElement('div');card.className='card view-enter';
  const dayHdr = document.createElement('h2'); dayHdr.textContent = `${tab.toUpperCase()} - ${getWeekdayName(selected.day)}`; card.appendChild(dayHdr);
  const table=document.createElement('table');table.className='exercise-table';
  const tbody=document.createElement('tbody');
  workouts[tab].forEach((ex,idx)=>{
    const tr=document.createElement('tr');
    const tdName=document.createElement('td');tdName.textContent=ex;tr.appendChild(tdName);
    const tdSets=document.createElement('td');const inSets=document.createElement('input');inSets.className='input';inSets.placeholder='sets';inSets.type='number';tdSets.appendChild(inSets);tr.appendChild(tdSets);
    const tdReps=document.createElement('td');const inReps=document.createElement('input');inReps.className='input';inReps.placeholder='reps';inReps.type='number';tdReps.appendChild(inReps);tr.appendChild(tdReps);
    const tdWeight=document.createElement('td');const inWeight=document.createElement('input');inWeight.className='input';inWeight.placeholder='kg';inWeight.type='number';tdWeight.appendChild(inWeight);tr.appendChild(tdWeight);
    const tdSug=document.createElement('td');tdSug.className='small';tdSug.textContent=getSuggestedFor(ex);tr.appendChild(tdSug);
    const tdFb=document.createElement('td');const fb=document.createElement('select');fb.className='feedback';['strong','normal','weak','plateau'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;o.selected=v==='normal';fb.appendChild(o)});tdFb.appendChild(fb);tr.appendChild(tdFb);
    const tdLog=document.createElement('td');const btn=document.createElement('button');btn.textContent='Log';btn.addEventListener('click',()=>{
      const entry={exercise:ex,sets:inSets.value,reps:inReps.value,weight:inWeight.value,feedback:fb.value,date:selected.day}
      db[selected.day]=db[selected.day]||{};db[selected.day][tab]=db[selected.day][tab]||[];db[selected.day][tab].push(entry);save(db);init();render();
    });tdLog.appendChild(btn);tr.appendChild(tdLog);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);card.appendChild(table);
  // history
  const hist=document.createElement('div');hist.className='card view-enter';hist.innerHTML='<h3>History</h3>';
  const d= db[selected.day]&&db[selected.day][tab] ? db[selected.day][tab] : [];
  if(d.length===0){const p=document.createElement('p');p.className='small';p.textContent='No logs for this day.';hist.appendChild(p)}else{
    d.forEach((l)=>{const p=document.createElement('p');p.className='small';p.textContent=`Sets:${l.sets} Reps:${l.reps} W:${l.weight} Feedback:${l.feedback}`;hist.appendChild(p)})
  }
  content.appendChild(card);content.appendChild(hist);
}

function getSuggestedFor(ex){
  // look back through stored days (newest first) for last matching exercise weight
  const keys = Object.keys(db).sort((a,b)=>b.localeCompare(a));
  for(const k of keys){
    const day = db[k];
    if(!day) continue;
    for(const t in day){
      const arr = day[t];
      if(!Array.isArray(arr)) continue;
      for(let i = arr.length - 1; i >= 0; i--){
        const item = arr[i];
        if(item && item.weight && Number(item.weight) > 0 && item.exercise === ex) {
          return Number(item.weight) + 2.5;
        }
      }
    }
  }
  return ''
}

function renderTracker(){
  const content=document.getElementById('content');content.innerHTML='';
  const card=document.createElement('div');card.className='card view-enter';card.innerHTML='<h2>Tracker</h2>';
  // weekly stats
  const weekKeys=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);weekKeys.push(getDateKey(d))}
  let sets=0,days=0;weekKeys.forEach(k=>{if(db[k]){days++;for(const t in db[k]){db[k][t].forEach(x=>{sets+=Number(x.sets)||0})}}})
  const p=document.createElement('p');p.className='small';p.textContent=`Sets this week: ${sets}`;card.appendChild(p);
  const prog=document.createElement('div');prog.className='progress';const iBar=document.createElement('i');
  requestAnimationFrame(()=>{ iBar.style.width=Math.min(100,Math.round((days/5)*100))+'%'; });
  prog.appendChild(iBar);card.appendChild(prog);
  content.appendChild(card);
}

init();
