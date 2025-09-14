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
const defaultPrescription = {
  chest:{sets:3,reps:8},back:{sets:3,reps:10},arms:{sets:3,reps:12},shoulders:{sets:3,reps:10},legs:{sets:4,reps:10}
};

function getDateKey(d=new Date()){return d.toISOString().slice(0,10)}
function getWeekdayName(dateKey){return new Date(dateKey).toLocaleDateString('en-US',{weekday:'long'})}

const todayKey = getDateKey();
const selected = { day: todayKey };
let splitMode = (localStorage.getItem('splitMode')||'calendar');

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
  // split mode
  const splitSel = document.getElementById('splitMode');
  if(splitSel){ splitSel.value = splitMode; splitSel.onchange = (e)=>{ splitMode = e.target.value; localStorage.setItem('splitMode', splitMode); render(); } }
  // rest timer
  const timerBtn = document.getElementById('restTimer');
  if(timerBtn){
    let timer=null, remain=120;
    const fmt=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    const tick=()=>{remain--; timerBtn.textContent = `Rest ${fmt(remain)}`; if(remain<=0){clearInterval(timer);timer=null;timerBtn.textContent='Done'; timerBtn.classList.add('pulse'); setTimeout(()=>{timerBtn.textContent='Start 2:00';timerBtn.classList.remove('pulse'); remain=120},800)} };
    timerBtn.onclick=()=>{ if(timer){clearInterval(timer); timer=null; timerBtn.textContent='Start 2:00'; remain=120; } else { timerBtn.textContent=`Rest ${fmt(remain)}`; timer=setInterval(tick,1000);} };
  }
  render();
}

function getTabForDate(dateKey){
  if(splitMode==='calendar'){
    const dow = new Date(dateKey).getDay(); // 0 Sun..6 Sat
    return dayCycle[(dow+6)%7];
  }
  // auto mode: pick the next day in cycle after the last trained (non-rest) day
  const last = getLastTrainedDay();
  if(!last){
    // start at current calendar-based suggestion
    const dow = new Date(dateKey).getDay();
    return dayCycle[(dow+6)%7];
  }
  const lastIdx = dayCycle.findIndex(x=>x===last);
  for(let i=1;i<=7;i++){
    const idx=(lastIdx+i)%dayCycle.length;
    if(dayCycle[idx]!=="rest") return dayCycle[idx];
  }
  return 'rest';
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
    const tdName=document.createElement('td'); tdName.dataset.label='Exercise';
    const nameWrap=document.createElement('div');nameWrap.innerHTML=`<div>${ex}</div>`;
    // mini history (last two entries for this exercise)
    const mini=document.createElement('div'); mini.className='mini-history'; mini.textContent = getMiniHistory(ex);
    nameWrap.appendChild(mini); tdName.appendChild(nameWrap); tr.appendChild(tdName);
  const tdSets=document.createElement('td'); tdSets.dataset.label='Sets';
  const inSets=document.createElement('input');inSets.className='input';inSets.placeholder='e.g., 3';inSets.type='number';inSets.setAttribute('aria-label','Sets');
  inSets.value = defaultPrescription[tab]?.sets ?? 3; tdSets.appendChild(inSets); tr.appendChild(tdSets);
  const tdReps=document.createElement('td'); tdReps.dataset.label='Reps';
  const inReps=document.createElement('input');inReps.className='input';inReps.placeholder='e.g., 10';inReps.type='number';inReps.setAttribute('aria-label','Reps');
  inReps.value = defaultPrescription[tab]?.reps ?? 10; tdReps.appendChild(inReps); tr.appendChild(tdReps);
    const tdWeight=document.createElement('td'); tdWeight.dataset.label='Weight';
    const stepWrap=document.createElement('div'); stepWrap.className='row-controls';
    const inWeight=document.createElement('input');inWeight.className='input';inWeight.placeholder='kg';inWeight.type='number';inWeight.setAttribute('aria-label','Weight in kg');
    const stepper=document.createElement('div'); stepper.className='stepper';
    const dec=document.createElement('button'); dec.textContent='-'; dec.title='-2.5kg'; dec.onclick=()=>{inWeight.value=String((Number(inWeight.value)||0)-2.5)};
    const inc=document.createElement('button'); inc.textContent='+'; inc.title='+2.5kg'; inc.onclick=()=>{inWeight.value=String((Number(inWeight.value)||0)+2.5)};
    stepper.appendChild(dec); stepper.appendChild(inc);
    stepWrap.appendChild(inWeight); stepWrap.appendChild(stepper);
    tdWeight.appendChild(stepWrap); tr.appendChild(tdWeight);
  const tdSug=document.createElement('td'); tdSug.dataset.label='Suggest'; tdSug.className='small';
  const sugg = getSmartSuggestion(ex, tab);
  tdSug.textContent = sugg.weight!==''? `${sugg.weight} kg` : '—'; tr.appendChild(tdSug);
  const tdFb=document.createElement('td'); tdFb.dataset.label='Feedback'; const fb=document.createElement('select');fb.className='feedback';['strong','normal','weak','plateau'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;o.selected=v==='normal';fb.appendChild(o)});tdFb.appendChild(fb);tr.appendChild(tdFb);
  // RIR selector (0-4)
  const tdRir=document.createElement('td'); tdRir.dataset.label='RIR';
  const rir=document.createElement('select'); rir.className='feedback'; rir.setAttribute('aria-label','Reps in Reserve');
  ;[4,3,2,1,0].forEach(v=>{const o=document.createElement('option');o.value=String(v);o.textContent=`RIR ${v}`; o.selected=v===2; rir.appendChild(o)});
  tdRir.appendChild(rir); tr.appendChild(tdRir);
    // Checklist (quick log per set)
    const tdChecklist=document.createElement('td'); tdChecklist.dataset.label='Checklist';
    const checklist=document.createElement('div'); checklist.className='checklist';
  const todaysLogs = getTodayLogsForExercise(tab, ex);
    const defaultSets = 3; const planned=(Number(inSets.value)||defaultSets);
    const totalBoxes = Math.max(planned, todaysLogs.length);
    for(let i=0;i<totalBoxes;i++){
      const box=document.createElement('input'); box.type='checkbox'; box.checked = i < todaysLogs.length; box.title = box.checked? 'Logged' : 'Tap to log set';
      if(!box.checked){
        box.addEventListener('change',()=>{
          if(box.checked){
            const preset = getSmartSuggestion(ex, tab);
            const entry={exercise:ex,sets:1,reps:inReps.value||preset.reps,weight:inWeight.value||preset.weight,feedback:fb.value,rir:rir.value,date:selected.day}
            db[selected.day]=db[selected.day]||{};db[selected.day][tab]=db[selected.day][tab]||[];db[selected.day][tab].push(entry);save(db);
            render();
          }
        })
      } else {
        box.disabled = true;
      }
      checklist.appendChild(box);
    }
    tdChecklist.appendChild(checklist); tr.appendChild(tdChecklist);

    const tdLog=document.createElement('td'); tdLog.dataset.label='Action'; const btn=document.createElement('button');btn.textContent='Log Set';btn.addEventListener('click',()=>{
  const preset = getSmartSuggestion(ex, tab);
  const entry={exercise:ex,sets:inSets.value||preset.sets,reps:inReps.value||preset.reps,weight:inWeight.value||preset.weight,feedback:fb.value,rir:rir.value,date:selected.day}
      db[selected.day]=db[selected.day]||{};db[selected.day][tab]=db[selected.day][tab]||[];db[selected.day][tab].push(entry);save(db);
      // pulse feedback
      btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),300);
      init();render();
    });tdLog.appendChild(btn);tr.appendChild(tdLog);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);card.appendChild(table);
  // history
  const hist=document.createElement('div');hist.className='card view-enter spacer-xl';hist.innerHTML='<h3>History</h3>';
  const d= db[selected.day]&&db[selected.day][tab] ? db[selected.day][tab] : [];
  if(d.length===0){const p=document.createElement('p');p.className='small';p.textContent='No logs for this day.';hist.appendChild(p)}else{
    d.forEach((l)=>{const p=document.createElement('p');p.className='small';
      const rirTxt = (l.rir!==undefined)? ` RIR:${l.rir}`:'';
      p.textContent=`${l.exercise} — ${l.weight}kg x ${l.reps}${rirTxt} (${l.feedback})`;
      hist.appendChild(p)})
  }
  content.appendChild(card);content.appendChild(hist);
  updateProgressRing(tab);
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

function getSmartSuggestion(ex, tab){
  // Start from default prescription
  const pres = defaultPrescription[tab]||{sets:3,reps:10};
  const base = {sets: pres.sets, reps: pres.reps, weight: ''};
  // Latest matching entry
  const keys = Object.keys(db).sort((a,b)=>b.localeCompare(a));
  for(const k of keys){
    const day = db[k]; if(!day) continue; for(const t in day){ const arr=day[t]; if(!Array.isArray(arr)) continue; for(let i=arr.length-1;i>=0;i--){ const item=arr[i]; if(item.exercise===ex && Number(item.weight)>0){
      let inc = 2.5;
      // Heuristics by RIR and feedback
      const rir = item.rir!==undefined? Number(item.rir) : 2;
      const fb = (item.feedback||'normal');
      if(rir>=3 && fb==='strong') inc = 5;
      else if(rir>=2 && fb!=='weak') inc = 2.5;
      else if(rir<=1 || fb==='weak') inc = 0; // hold
      const nextW = Math.max(0, Number(item.weight) + inc);
      return {sets: pres.sets, reps: pres.reps, weight: Number.isFinite(nextW)? Number(nextW.toFixed(1)) : ''};
    }} }
  }
  return base;
}

function getLastTrainedDay(){
  const keys = Object.keys(db).sort((a,b)=>b.localeCompare(a));
  for(const k of keys){
    const day = db[k]; if(!day) continue;
    const muscles = Object.keys(day);
    for(const m of muscles){ if(m!=='rest' && Array.isArray(day[m]) && day[m].length>0) return m; }
  }
  return null;
}

function getTodayLogsForExercise(tab, ex){
  const list = db[selected.day] && db[selected.day][tab] ? db[selected.day][tab] : [];
  return list.filter(item=>item.exercise===ex);
}

function getMiniHistory(ex){
  const keys = Object.keys(db).sort((a,b)=>b.localeCompare(a));
  const items=[];
  for(const k of keys){
    const day=db[k]; if(!day) continue; for(const t in day){ const arr=day[t]; if(!Array.isArray(arr)) continue; for(let i=arr.length-1;i>=0;i--){ const it=arr[i]; if(it.exercise===ex){ const rirTxt = (it.rir!==undefined)? ` @RIR ${it.rir}`:''; items.push(`${it.weight||0}kg x ${it.reps||0}${rirTxt}`); if(items.length>=2) return items.join(' • '); } } }
  }
  return items[0]||'No history';
}

function updateProgressRing(tab){
  const today = db[selected.day] && db[selected.day][tab] ? db[selected.day][tab] : [];
  const totalExercises = (workouts[tab]||[]).length;
  const completedExercises = new Set(today.map(x=>x.exercise)).size;
  const completed = Math.min(totalExercises, completedExercises);
  const pct = totalExercises ? Math.round((completed/totalExercises)*100) : 0;
  const ring = document.getElementById('ringProgress');
  const label = document.getElementById('ringLabel');
  if(!ring || !label) return;
  const circum = 2*Math.PI*26; // r=26
  ring.style.strokeDasharray = String(circum);
  ring.style.strokeDashoffset = String(circum - (pct/100)*circum);
  label.textContent = `${pct}%`;
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
