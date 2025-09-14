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
    const tdName=document.createElement('td'); tdName.dataset.label='Exercise';
    const nameWrap=document.createElement('div');nameWrap.innerHTML=`<div>${ex}</div>`;
    // mini history (last two entries for this exercise)
    const mini=document.createElement('div'); mini.className='mini-history'; mini.textContent = getMiniHistory(ex);
    nameWrap.appendChild(mini); tdName.appendChild(nameWrap); tr.appendChild(tdName);
    const tdSets=document.createElement('td'); tdSets.dataset.label='Sets';
    const inSets=document.createElement('input');inSets.className='input';inSets.placeholder='e.g., 3';inSets.type='number';inSets.setAttribute('aria-label','Sets');tdSets.appendChild(inSets);tr.appendChild(tdSets);
    const tdReps=document.createElement('td'); tdReps.dataset.label='Reps';
    const inReps=document.createElement('input');inReps.className='input';inReps.placeholder='e.g., 10';inReps.type='number';inReps.setAttribute('aria-label','Reps');tdReps.appendChild(inReps);tr.appendChild(tdReps);
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
    const sugVal=getSuggestedFor(ex); tdSug.textContent = (sugVal!==''? `${sugVal} kg` : '—'); tr.appendChild(tdSug);
    const tdFb=document.createElement('td'); tdFb.dataset.label='Feedback'; const fb=document.createElement('select');fb.className='feedback';['strong','normal','weak','plateau'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;o.selected=v==='normal';fb.appendChild(o)});tdFb.appendChild(fb);tr.appendChild(tdFb);
    const tdLog=document.createElement('td'); tdLog.dataset.label='Action'; const btn=document.createElement('button');btn.textContent='Log Set';btn.addEventListener('click',()=>{
      const entry={exercise:ex,sets:inSets.value,reps:inReps.value,weight:inWeight.value,feedback:fb.value,date:selected.day}
      db[selected.day]=db[selected.day]||{};db[selected.day][tab]=db[selected.day][tab]||[];db[selected.day][tab].push(entry);save(db);
      // pulse feedback
      btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),300);
      init();render();
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

function getMiniHistory(ex){
  const keys = Object.keys(db).sort((a,b)=>b.localeCompare(a));
  const items=[];
  for(const k of keys){
    const day=db[k]; if(!day) continue; for(const t in day){ const arr=day[t]; if(!Array.isArray(arr)) continue; for(let i=arr.length-1;i>=0;i--){ const it=arr[i]; if(it.exercise===ex){ items.push(`${it.weight||0}kg x ${it.reps||0}`); if(items.length>=2) return items.join(' • '); } } }
  }
  return items[0]||'No history';
}

function updateProgressRing(tab){
  const today = db[selected.day] && db[selected.day][tab] ? db[selected.day][tab] : [];
  const totalExercises = (workouts[tab]||[]).length;
  const completed = Math.min(totalExercises, today.length);
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
