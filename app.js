
const KEY='raj_health_tracker_v1';
const db = JSON.parse(localStorage.getItem(KEY) || '{"profile":{},"vitals":[],"labs":[],"imaging":[],"medicines":[],"ayurveda":{},"lifestyle":[],"mind":[]}');
const save=()=>{localStorage.setItem(KEY,JSON.stringify(db)); renderAll();}
const val=id=>document.getElementById(id)?.value || '';
const today=()=>new Date().toISOString().slice(0,10);
['vDate','labDate','imgDate','lifeDate','mindDate'].forEach(id=>{let e=document.getElementById(id);if(e)e.value=today();});

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
 b.classList.add('active'); document.getElementById(b.dataset.tab).classList.add('active');
});

function saveProfile(){
 db.profile={name:val('name'),dob:val('dob'),bloodGroup:val('bloodGroup'),height:+val('height')||0,allergies:val('allergies'),emergency:val('emergency')}; save();
}
function addVital(){
 db.vitals.unshift({date:val('vDate'),weight:+val('weight')||0,waist:+val('waist')||0,sbp:+val('sbp')||0,dbp:+val('dbp')||0,pulse:+val('pulse')||0,spo2:+val('spo2')||0,temp:+val('temp')||0,sugar:+val('sugar')||0}); save();
}
function addLab(){
 db.labs.unshift({date:val('labDate'),test:val('labTest'),value:val('labValue'),unit:val('labUnit'),range:val('labRange'),system:val('labSystem'),notes:val('labNotes')}); save();
}
function addImaging(){
 db.imaging.unshift({date:val('imgDate'),type:val('imgType'),body:val('bodyPart'),system:val('imgSystem'),findings:val('imgFindings'),impression:val('imgImpression')}); save();
}
function addMedicine(){
 db.medicines.unshift({name:val('medName'),pathy:val('medPathy'),dose:val('medDose'),freq:val('medFreq'),start:val('medStart'),stop:val('medStop'),purpose:val('medPurpose'),effect:val('medEffect')}); save();
}
function saveAyurveda(){
 db.ayurveda={prakriti:val('prakriti'),vikriti:val('vikriti'),agni:val('agni'),koshta:val('koshta'),nadi:val('nadi'),mala:val('mala'),mutra:val('mutra'),jihva:val('jihva'),nidra:val('nidraAy'),bala:val('bala'),dashavidha:val('dashavidha')}; save();
}
function addLifestyle(){
 db.lifestyle.unshift({date:val('lifeDate'),sleep:+val('sleep')||0,water:+val('water')||0,exercise:+val('exercise')||0,steps:+val('steps')||0,study:+val('study')||0,screen:+val('screen')||0,fasting:val('fasting'),food:val('food'),gut:val('gut')}); save();
}
function addMind(){
 db.mind.unshift({date:val('mindDate'),peace:+val('peace')||0,stress:+val('stress')||0,energy:+val('energy')||0,jap:+val('jap')||0,puja:+val('puja')||0,mauna:+val('mauna')||0,ekant:+val('ekant')||0,reflection:val('reflection')}); save();
}
function table(rows, cols){
 if(!rows.length)return '<p>No entries yet.</p>';
 return '<div style="overflow:auto"><table><thead><tr>'+cols.map(c=>'<th>'+c[0]+'</th>').join('')+'</tr></thead><tbody>'+
 rows.slice(0,30).map(r=>'<tr>'+cols.map(c=>'<td>'+((typeof c[1]==='function'?c[1](r):r[c[1]]) ?? '')+'</td>').join('')+'</tr>').join('')+
 '</tbody></table></div>';
}
function renderAll(){
 const p=db.profile;
 ['name','dob','bloodGroup','height','allergies','emergency'].forEach(id=>{let e=document.getElementById(id);if(e && document.activeElement!==e)e.value=p[id]||''});
 const v=db.vitals[0]||{};
 document.getElementById('dWeight').textContent=v.weight||'--';
 const bmi=(p.height&&v.weight)?(v.weight/((p.height/100)**2)).toFixed(1):'--';
 document.getElementById('dBMI').textContent=bmi;
 document.getElementById('dBP').textContent=(v.sbp&&v.dbp)?`${v.sbp}/${v.dbp}`:'--';
 document.getElementById('dSugar').textContent=v.sugar||'--';
 document.getElementById('vitalTable').innerHTML=table(db.vitals,[['Date','date'],['Weight','weight'],['BMI',r=>p.height&&r.weight?(r.weight/((p.height/100)**2)).toFixed(1):''],['BP',r=>r.sbp&&r.dbp?`${r.sbp}/${r.dbp}`:''],['Sugar','sugar'],['SpO₂','spo2']]);
 document.getElementById('labTable').innerHTML=table(db.labs,[['Date','date'],['Test','test'],['Value',r=>`${r.value} ${r.unit||''}`],['Range','range'],['System','system'],['Notes','notes']]);
 document.getElementById('imagingTable').innerHTML=table(db.imaging,[['Date','date'],['Type','type'],['Body Part','body'],['Findings','findings'],['Impression','impression']]);
 document.getElementById('medTable').innerHTML=table(db.medicines,[['Medicine','name'],['Type','pathy'],['Dose','dose'],['Frequency','freq'],['Start','start'],['Stop','stop'],['Purpose','purpose'],['Effect','effect']]);
 const a=db.ayurveda||{}; ['prakriti','vikriti','agni','koshta','nadi','mala','mutra','jihva','nidraAy','bala','dashavidha'].forEach(id=>{let e=document.getElementById(id); if(e){let k=id==='nidraAy'?'nidra':id;e.value=a[k]||''}});
 let score=0,n=0;
 if(v.weight){score+=1;n++} if(v.sbp){score+=1;n++}
 let l=db.lifestyle[0]; if(l){score += (l.sleep>=6&&l.sleep<=9?1:.6); n++; score += (l.exercise>=20?1:.5);n++; score += (l.water>=1.5?1:.5);n++;}
 let m=db.mind[0]; if(m){score += (m.peace/10);n++; score += (1-m.stress/10);n++;}
 document.getElementById('healthScore').textContent=n?Math.round(score/n*100):'--';
 const alerts=[];
 if(v.sbp>=180||v.dbp>=120) alerts.push('Very high BP entry recorded — prompt clinical re-check is appropriate.');
 if(v.sugar>=250) alerts.push('High glucose entry recorded — verify context and consider clinical review.');
 if(v.spo2 && v.spo2<92) alerts.push('Low SpO₂ entry recorded — reassess promptly, especially if symptomatic.');
 document.getElementById('alerts').innerHTML=(alerts.length?alerts:['No automated red-flag pattern from entered vitals.']).map(x=>`<li>${x}</li>`).join('');
 document.getElementById('routineSnap').innerHTML=l?[`Sleep: ${l.sleep||'-'} h`,`Water: ${l.water||'-'} L`,`Exercise: ${l.exercise||'-'} min`,`Study: ${l.study||'-'} min`].map(x=>`<li>${x}</li>`).join(''):'<li>Add lifestyle data.</li>';
 renderTimeline();
}
const systems=[
['Hair & Scalp','Hair fall, scalp, nutrition, thyroid/iron context'],
['Eyes','Vision, dryness, pressure, retinal/diabetes review'],
['ENT','Ear, nose, throat, allergy, sinus'],
['Dental & Oral','Teeth, gums, tongue, oral health'],
['Skin','Rash, pigmentation, allergy, infections'],
['Cardiovascular','BP, pulse, ECG, lipids, symptoms'],
['Respiratory','Breath, allergy, asthma, SpO₂'],
['Gastrointestinal','Agni, appetite, GERD, IBS, bowel, piles'],
['Liver & Gallbladder','LFT, fatty liver, ultrasound'],
['Kidney & Urinary','Creatinine/eGFR, urine, stones, uric acid'],
['Endocrine & Metabolic','Glucose, HbA1c, thyroid, weight, lipids'],
['Neurological','Headache, memory, sleep, neuropathy'],
['Musculoskeletal & Spine','Neck/back/joints, X-ray/MRI, pain/function'],
['Bone Health','Vitamin D, calcium, DEXA, fracture risk'],
['Reproductive & Sexual Health','Reproductive health, hormones, stamina'],
['Immunity & General','Infections, recovery, fatigue, vaccination context'],
['Mental Wellness','Stress, mood, peace, cognition'],
['Ayurveda Whole-Body','Prakriti, Vikriti, Agni, Koshta, Srotas']
];
document.getElementById('systemCards').innerHTML=systems.map(s=>`<div class="card system"><h3>${s[0]}</h3><p>${s[1]}</p><small>Use Labs, Imaging, Medicines and Timeline to track this domain.</small></div>`).join('');

function renderTimeline(){
 let items=[];
 db.vitals.forEach(x=>items.push({date:x.date,text:`Vitals: ${x.weight?'Wt '+x.weight+'kg ':''}${x.sbp?`BP ${x.sbp}/${x.dbp} `:''}${x.sugar?'Sugar '+x.sugar:''}`}));
 db.labs.forEach(x=>items.push({date:x.date,text:`Lab: ${x.test} = ${x.value} ${x.unit||''}`}));
 db.imaging.forEach(x=>items.push({date:x.date,text:`${x.type}: ${x.body} — ${x.impression||x.findings}`}));
 db.medicines.forEach(x=>items.push({date:x.start,text:`Medicine started: ${x.name} ${x.dose||''} ${x.freq||''}`}));
 db.lifestyle.forEach(x=>items.push({date:x.date,text:`Lifestyle: sleep ${x.sleep}h, water ${x.water}L, exercise ${x.exercise}min`}));
 db.mind.forEach(x=>items.push({date:x.date,text:`Mind: peace ${x.peace}/10, stress ${x.stress}/10, jap ${x.jap}min`}));
 items.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 document.getElementById('timelineList').innerHTML=items.length?items.slice(0,100).map(i=>`<div class="card"><strong>${i.date||'No date'}</strong><p>${i.text}</p></div>`).join(''):'<p>No timeline data yet.</p>';
}
function generateSummary(){
 const v=db.vitals[0]||{}, l=db.lifestyle[0]||{}, m=db.mind[0]||{}, a=db.ayurveda||{};
 const recentLabs=db.labs.slice(0,8).map(x=>`${x.test}: ${x.value} ${x.unit||''} (${x.date})`).join('\n');
 const activeMeds=db.medicines.filter(x=>!x.stop).map(x=>`${x.name} [${x.pathy}] ${x.dose||''} ${x.freq||''} — ${x.purpose||''}`).join('\n');
 let txt=`PERSONAL HEALTH SUMMARY\n\n`;
 txt+=`Vitals: Weight ${v.weight||'-'} kg | BP ${v.sbp||'-'}/${v.dbp||'-'} | Sugar ${v.sugar||'-'} | SpO₂ ${v.spo2||'-'}\n`;
 txt+=`Lifestyle: Sleep ${l.sleep||'-'} h | Water ${l.water||'-'} L | Exercise ${l.exercise||'-'} min | Study ${l.study||'-'} min\n`;
 txt+=`Mind/Spiritual: Peace ${m.peace||'-'}/10 | Stress ${m.stress||'-'}/10 | Jap ${m.jap||'-'} min | Puja ${m.puja||'-'} min | Mauna ${m.mauna||'-'} min\n`;
 txt+=`Ayurveda: Prakriti ${a.prakriti||'-'} | Vikriti ${a.vikriti||'-'} | Agni ${a.agni||'-'} | Koshta ${a.koshta||'-'}\n\n`;
 txt+=`Recent labs:\n${recentLabs||'None'}\n\nCurrent medicines:\n${activeMeds||'None'}\n\n`;
 txt+=`AI integration next step: trend analysis, personalized questions, interaction checking, report summarization, follow-up reminders, and clinician-reviewed suggestions.`;
 document.getElementById('aiSummary').textContent=txt;
}
document.getElementById('exportBtn').onclick=()=>{
 const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
 const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Raj_Health_Backup_'+today()+'.json'; a.click(); URL.revokeObjectURL(a.href);
};
renderAll();
