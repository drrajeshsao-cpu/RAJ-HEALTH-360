
const KEY="raj_health_360_v2";
const defaultDB={
 profile:{name:"",dob:"",sex:"Male",height:"",blood:"",allergy:"",conditions:"",emergency:"",goals:""},
 daily:[],labs:[],imaging:[],medicines:[],therapies:[],mind:[],
 ayurveda:{prakriti:"Vata-Pitta",vikriti:"",agni:"Sama",koshta:"Madhyama",ama:"Absent",bala:"Madhyama",ashtavidha:{},dashavidha:{},dosha:{vata:5,pitta:5,kapha:5,note:""}},
 ritu:{auto:true,ritu:"Varsha",desha:"Sadharana"}, shatkriya:{stage:"Sanchaya",note:""}
};
let db=Object.assign({},defaultDB,JSON.parse(localStorage.getItem(KEY)||"{}"));
for(const k of Object.keys(defaultDB)) if(db[k]===undefined) db[k]=defaultDB[k];
const $=id=>document.getElementById(id);
const v=id=>$(id)?.value??"";
const n=id=>Number(v(id))||0;
const today=()=>new Date().toISOString().slice(0,10);
function persist(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function showView(id){
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===id));
 window.scrollTo({top:0,behavior:"smooth"})
}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showView(x.dataset.view));
["tdDate","labDate","imgDate","txDate","msDate"].forEach(id=>{if($(id))$(id).value=today()});
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("backupBtn").onclick=exportData;

const systems=[
["Cardiovascular","BP, pulse, lipids, ECG, symptoms, vascular risk"],
["Metabolic & Diabetes","Glucose, HbA1c, waist, weight, insulin resistance context"],
["Kidney & Uric Acid","Creatinine/eGFR, urine, uric acid, stones, hydration"],
["Liver & Gallbladder","LFT, fatty liver risk, ultrasound, alcohol/medication context"],
["GI & Digestion","Appetite, reflux, IBS, bowel, piles, gut symptoms"],
["Respiratory","Breathlessness, allergy/asthma, SpO₂, sleep breathing"],
["Neurology","Headache, memory, neuropathy, dizziness, sleep"],
["Spine & Musculoskeletal","Neck/back/joints, pain, function, X-ray/MRI"],
["Bone Health","Vitamin D, calcium, DEXA, fracture/fall risk"],
["Thyroid & Endocrine","TSH/T3/T4, metabolic/endocrine symptoms"],
["Reproductive & Sexual","Hormonal/reproductive health, libido, stamina"],
["Hair & Scalp","Hair fall, scalp, nutrition/endocrine context"],
["Eyes","Vision, eye strain, dryness, diabetes/retinal context"],
["Dental & Oral","Teeth, gums, oral hygiene, tongue"],
["Skin","Rash, pigmentation, infections, allergy"],
["Immunity & General","Infections, fatigue, recovery, preventive care"],
["Mental Health","Stress, mood, attention, burnout, sleep"],
["Social Health","Connection, support, work-life balance, loneliness"]
];
$("systemGrid").innerHTML=systems.map(s=>`<article class="card systemcard"><h3>${s[0]}</h3><p>${s[1]}</p><span class="mini">Track via Today • Labs • Imaging • Medicines • Timeline</span></article>`).join("");

const habitDefs=[
["Sleep","Target consistency, duration and recovery quality."],
["Hydration","Water intake with climate/activity context."],
["Exercise","Aerobic, strength, mobility and spine-friendly activity."],
["Nutrition","Meal quality, protein/fibre, salt/sugar, timing."],
["Dinacharya","Wake/sleep rhythm, hygiene, meals, work-rest pattern."],
["Ratricharya","Wind-down, dinner timing, light/screen exposure."],
["Brahmacharya","Self-regulation, moderation, vitality and conduct."],
["Study & Learning","Reading, deliberate learning, cognitive growth."],
["Fasting","Record method, tolerance, hydration and metabolic response."],
["Digital Hygiene","Screen load, breaks, eye/neck strain, digital detox."],
["Recovery","Rest, fatigue, pain and readiness after work/training."],
["Preventive Care","Dental/eye checks, vaccination context, screening dates."]
];
$("habitCards").innerHTML=habitDefs.map(h=>`<article class="card systemcard"><h3>${h[0]}</h3><p>${h[1]}</p><span class="mini">Use daily check-in and timeline</span></article>`).join("");

const stageDefs=[
["Sanchaya","Accumulation","Early dosha accumulation / susceptibility context."],
["Prakopa","Aggravation","Dosha aggravation; stronger preventive correction considered."],
["Prasara","Spread","Conceptual spread beyond primary site."],
["Sthanasamshraya","Localization","Dosha-dushya interaction / prodromal stage."],
["Vyakti","Manifestation","Recognizable disease expression; biomedical assessment becomes especially important."],
["Bheda","Complication","Differentiation/complication or chronicity; escalation and specialist evaluation may be needed."]
];
$("stages").innerHTML=stageDefs.map(s=>`<div class="stage" data-stage="${s[0]}" onclick="selectStage('${s[0]}')"><span>${s[1]}</span><h4>${s[0]}</h4><p>${s[2]}</p></div>`).join("");
function selectStage(x){db.shatkriya.stage=x;persist()}
function saveStageNote(){db.shatkriya.note=v("stageNote");persist()}

const rituData={
 Shishira:{months:"Jan–Feb",dosha:"Kapha sanchaya • Vata relative calming",focus:"Warmth, strength, regular nourishing routine",diet:"Warm, freshly prepared, adequate unctuousness according to constitution; avoid excessive cold/dry exposure.",life:"Protect from cold, regular exercise as tolerated, oil massage if suitable."},
 Vasanta:{months:"Mar–Apr",dosha:"Kapha prakopa / liquefaction",focus:"Lightness, activity, Kapha-balancing habits",diet:"Prefer lighter meals and avoid habitual excess heavy/sweet/oily intake when clinically appropriate.",life:"Increase activity gradually; monitor allergy/respiratory symptoms."},
 Grishma:{months:"May–Jun",dosha:"Vata sanchaya tendency",focus:"Heat protection, hydration, conserve strength",diet:"Hydration, lighter cooling food pattern according to tolerance; avoid dehydration.",life:"Reduce excessive heat/exertion; sleep/recovery become important."},
 Varsha:{months:"Jul–Aug",dosha:"Vata prakopa • Pitta sanchaya tendency",focus:"Agni support, safe water/food, Vata control",diet:"Fresh warm digestible meals; avoid contaminated/stale food and individual triggers; hydration without excess.",life:"Protect digestion, avoid excessive exertion when depleted, maintain dryness/hygiene during humid weather."},
 Sharad:{months:"Sep–Oct",dosha:"Pitta prakopa",focus:"Cooling moderation, monitor heat/inflammation tendencies",diet:"Avoid habitual excess very spicy/heating food if it worsens symptoms; maintain balanced hydration.",life:"Avoid unnecessary heat exposure; review skin/acidity/headache patterns."},
 Hemanta:{months:"Nov–Dec",dosha:"Strong agni / Kapha build-up tendency later",focus:"Build strength without metabolic excess",diet:"Adequate nourishing food matched to activity and metabolic goals.",life:"Good season for progressive exercise if medically fit; maintain sleep and routine."}
};
function monthToRitu(m){return m<=2?"Shishira":m<=4?"Vasanta":m<=6?"Grishma":m<=8?"Varsha":m<=10?"Sharad":"Hemanta"}
function applyAutoRitu(){if(db.ritu.auto)db.ritu.ritu=monthToRitu(new Date().getMonth()+1)}
function saveRitu(){db.ritu.auto=$("autoRitu").checked;db.ritu.ritu=v("rituSelect");db.ritu.desha=v("desha");applyAutoRitu();persist()}
$("autoRitu").onchange=()=>{db.ritu.auto=$("autoRitu").checked;applyAutoRitu();persist()};

["vataScore","pittaScore","kaphaScore"].forEach(id=>$(id).oninput=()=>$(id.replace("Score","Out")).textContent=$(id).value);

function saveProfile(){db.profile={name:v("pName"),dob:v("pDob"),sex:v("pSex"),height:n("pHeight"),blood:v("pBlood"),allergy:v("pAllergy"),conditions:v("pConditions"),emergency:v("pEmergency"),goals:v("pGoals")};persist()}
function saveToday(){
 db.daily.unshift({date:v("tdDate"),weight:n("tdWeight"),sbp:n("tdSBP"),dbp:n("tdDBP"),sugar:n("tdSugar"),sleep:n("tdSleep"),water:n("tdWater"),exercise:n("tdExercise"),energy:n("tdEnergy"),peace:n("tdPeace"),stress:n("tdStress"),digestion:n("tdDigestion"),bowel:v("tdBowel"),pain:n("tdPain"),jap:n("tdJap"),study:n("tdStudy"),note:v("tdNote")});persist()
}
function saveAyurveda(){db.ayurveda.prakriti=v("prakriti");db.ayurveda.vikriti=v("vikriti");db.ayurveda.agni=v("agni");db.ayurveda.koshta=v("koshta");db.ayurveda.ama=v("ama");db.ayurveda.bala=v("bala");persist()}
function saveDosha(){db.ayurveda.dosha={vata:n("vataScore"),pitta:n("pittaScore"),kapha:n("kaphaScore"),note:v("doshaNote")};persist()}
function saveAshtavidha(){db.ayurveda.ashtavidha={nadi:v("aNadi"),mutra:v("aMutra"),mala:v("aMala"),jihva:v("aJihva"),shabda:v("aShabda"),sparsha:v("aSparsha"),drik:v("aDrik"),akriti:v("aAkriti")};persist()}
function saveDashavidha(){db.ayurveda.dashavidha={prakriti:v("dPrakriti"),vikriti:v("dVikriti"),sara:v("dSara"),samhanana:v("dSamhanana"),pramana:v("dPramana"),satmya:v("dSatmya"),satva:v("dSatva"),ahara:v("dAhara"),vyayama:v("dVyayama"),vaya:v("dVaya")};persist()}
function addLab(){db.labs.unshift({date:v("labDate"),test:v("labTest"),value:v("labValue"),unit:v("labUnit"),range:v("labRange"),system:v("labSystem"),note:v("labNote")});persist()}
function addImaging(){db.imaging.unshift({date:v("imgDate"),type:v("imgType"),body:v("imgBody"),facility:v("imgFacility"),finding:v("imgFinding"),impression:v("imgImpression")});persist()}
function addMedicine(){db.medicines.unshift({name:v("medName"),type:v("medType"),dose:v("medDose"),freq:v("medFreq"),start:v("medStart"),stop:v("medStop"),target:v("medTarget"),purpose:v("medPurpose"),benefit:v("medBenefit"),ae:v("medAE")});persist()}
function addTherapy(){db.therapies.unshift({name:v("txName"),date:v("txDate"),reason:v("txReason"),supervision:v("txSupervision"),before:n("txBefore"),after:n("txAfter"),outcome:v("txOutcome"),ae:v("txAE"),note:v("txNote")});persist()}
function saveMind(){db.mind.unshift({date:v("msDate"),peace:n("msPeace"),stress:n("msStress"),purpose:n("msPurpose"),social:n("msSocial"),lonely:n("msLonely"),jap:n("msJap"),puja:n("msPuja"),mauna:n("msMauna"),ekant:n("msEkant"),study:n("msStudy"),detox:n("msDetox"),reflection:v("msReflection")});persist()}

function table(rows,cols){
 if(!rows.length)return `<p class="muted">No records yet.</p>`;
 return `<div style="overflow:auto"><table><thead><tr>${cols.map(c=>`<th>${c[0]}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${typeof c[1]==="function"?c[1](r):(r[c[1]]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
}
function renderInvestigations(){
 let q=(v("invSearch")||"").toLowerCase();
 let rows=[];
 db.labs.forEach(x=>rows.push({date:x.date,kind:"Lab",name:x.test,value:`${x.value} ${x.unit||""}`,detail:x.note||x.range||""}));
 db.imaging.forEach(x=>rows.push({date:x.date,kind:x.type,name:x.body,value:x.impression||"",detail:x.finding||""}));
 rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 $("invTable").innerHTML=table(rows,[["Date","date"],["Type","kind"],["Test / Body","name"],["Result","value"],["Detail","detail"]])
}
function clinicalAlerts(){
 const d=db.daily[0]||{},a=[];
 if(d.sbp>=180||d.dbp>=120)a.push("Very high BP entry: repeat correctly and seek prompt medical assessment, especially if symptoms are present.");
 else if(d.sbp>=140||d.dbp>=90)a.push("Elevated BP entry: confirm with repeated standardized measurements and review the trend.");
 if(d.sugar>=250)a.push("Markedly high glucose entry: verify fasting/random context and arrange clinical review.");
 if(d.sleep&&d.sleep<5)a.push("Very short sleep recorded; persistent sleep restriction can impair recovery and cardiometabolic health.");
 if(d.stress>=8)a.push("High stress score recorded; reduce load, prioritize recovery, and assess persistence/functional impact.");
 if(d.pain>=8)a.push("Severe pain score recorded; assess cause and red flags rather than only tracking it.");
 return a.length?a:["No high-priority rule-based alert from the latest entered check-in."]
}
function healthScore(){
 const d=db.daily[0]; if(!d)return "--";
 let scores=[];
 if(d.sleep)scores.push(Math.max(0,100-Math.abs(7.5-d.sleep)*18));
 if(d.water)scores.push(Math.min(100,d.water/2*100));
 if(d.exercise)scores.push(Math.min(100,d.exercise/30*100));
 if(d.peace||d.peace===0)scores.push(d.peace*10);
 if(d.stress||d.stress===0)scores.push((10-d.stress)*10);
 if(d.energy||d.energy===0)scores.push(d.energy*10);
 return Math.round(scores.reduce((a,b)=>a+b,0)/(scores.length||1))
}
function nextActions(){
 const d=db.daily[0]||{}, actions=[];
 if(!db.labs.length) actions.push("Create your baseline laboratory record and add historical reports first; trend quality depends on baseline data.");
 if(d.sleep&&d.sleep<6)actions.push("Prioritize sleep recovery before intensifying exercise or fasting.");
 if(d.water&&d.water<1.5)actions.push("Review hydration in context of climate, activity, kidney/heart status and current medications.");
 if(d.sbp>=140||d.dbp>=90)actions.push("Repeat BP with standardized technique on multiple occasions and review medication/adherence/risk factors if persistently elevated.");
 if(d.sugar>=126)actions.push("Clarify whether glucose was fasting or random; if abnormal/persistent, correlate with HbA1c and clinical context.");
 if(db.ayurveda.agni==="Manda"||db.ayurveda.ama==="Moderate"||db.ayurveda.ama==="Marked")actions.push("Ayurveda lens: emphasize simple digestible routine and nidana review rather than adding multiple interventions at once.");
 const rd=rituData[db.ritu.ritu]; actions.push(`Ritu lens (${db.ritu.ritu}): ${rd.focus}.`);
 const lastTx=db.therapies[0]; if(lastTx&&lastTx.outcome==="Worsened")actions.push(`Review the recent ${lastTx.name} intervention before repeating it because you recorded worsening.`);
 if(actions.length<4)actions.push("Add one measurable health goal for the next 2–4 weeks and track outcome before changing multiple variables.");
 return actions.slice(0,6)
}
function renderDashboard(){
 const d=db.daily[0]||{},p=db.profile||{};
 $("mWeight").textContent=d.weight||"--";
 $("mBMI").textContent=d.weight&&p.height?(d.weight/((p.height/100)**2)).toFixed(1):"--";
 $("mBP").textContent=d.sbp&&d.dbp?`${d.sbp}/${d.dbp}`:"--";
 $("mSugar").textContent=d.sugar||"--";$("mSleep").textContent=d.sleep||"--";$("mPeace").textContent=(d.peace||d.peace===0)?d.peace:"--";
 $("score").textContent=healthScore();
 const al=clinicalAlerts();$("clinicalAlerts").innerHTML=al.map(x=>`<li>${x}</li>`).join("");$("safetyBar").textContent=al[0];
 $("rituBadge").textContent=db.ritu.ritu;
 $("ayuSnapshot").innerHTML=[["Prakriti",db.ayurveda.prakriti||"--"],["Vikriti",db.ayurveda.vikriti||"--"],["Agni",db.ayurveda.agni||"--"],["Ama",db.ayurveda.ama||"--"],["Shatkriyakala",db.shatkriya.stage||"--"]].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
 const bars=[["Sleep",d.sleep?Math.min(100,d.sleep/8*100):0],["Exercise",d.exercise?Math.min(100,d.exercise/30*100):0],["Peace",d.peace?d.peace*10:0],["Energy",d.energy?d.energy*10:0],["Low stress",d.stress||d.stress===0?(10-d.stress)*10:0]];
 $("balanceBars").innerHTML=bars.map(x=>`<div class="bar"><div class="barrow"><span>${x[0]}</span><b>${Math.round(x[1])}%</b></div><div class="track"><div class="fill" style="width:${x[1]}%"></div></div></div>`).join("");
 $("nextActions").innerHTML=nextActions().map(x=>`<li>${x}</li>`).join("");
 const ev=getTimeline().slice(0,5);$("trendWatch").innerHTML=ev.length?ev.map(e=>`<div class="event"><small>${e.date} <span class="tag">${e.type}</span></small><b>${e.text}</b></div>`).join(""):`<p class="muted">No longitudinal events yet.</p>`
}
function renderRitu(){
 $("autoRitu").checked=db.ritu.auto; $("rituSelect").value=db.ritu.ritu;$("rituSelect").disabled=db.ritu.auto;$("desha").value=db.ritu.desha;
 const r=rituData[db.ritu.ritu];
 $("rituCard").innerHTML=`<div class="cardtitle"><h3>${db.ritu.ritu} Ritu</h3><span class="pill amber">${r.months}</span></div><div class="stack"><div><span>Dosha pattern</span><b>${r.dosha}</b></div><div><span>Primary focus</span><b>${r.focus}</b></div><div><span>Desha</span><b>${db.ritu.desha}</b></div></div>`;
 $("rituSuggestions").innerHTML=[
  ["Diet switch",r.diet],["Lifestyle switch",r.life],["Monitoring switch",`Compare digestion, sleep, skin/respiratory symptoms, BP/weight and your recorded dosha state across this ritu. Change one major variable at a time when possible.`]
 ].map(x=>`<article class="card systemcard"><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join("")
}
function getTimeline(){
 let a=[];
 db.daily.forEach(x=>a.push({date:x.date,type:"Daily",text:`Daily round: wt ${x.weight||"-"} kg • BP ${x.sbp||"-"}/${x.dbp||"-"} • sleep ${x.sleep||"-"}h • peace ${x.peace||"-"}/10`}));
 db.labs.forEach(x=>a.push({date:x.date,type:"Lab",text:`${x.test}: ${x.value} ${x.unit||""}`}));
 db.imaging.forEach(x=>a.push({date:x.date,type:"Imaging",text:`${x.type} ${x.body}: ${x.impression||x.finding||""}`}));
 db.medicines.forEach(x=>a.push({date:x.start,type:"Medicine",text:`Started ${x.name} ${x.dose||""} ${x.freq||""} • ${x.benefit||""}`}));
 db.therapies.forEach(x=>a.push({date:x.date,type:"Therapy",text:`${x.name}: ${x.outcome} • before ${x.before||"-"}/10 → after ${x.after||"-"}/10`}));
 db.mind.forEach(x=>a.push({date:x.date,type:"Mind",text:`Peace ${x.peace}/10 • stress ${x.stress}/10 • social ${x.social}/10 • jap ${x.jap} min`}));
 return a.sort((x,y)=>(y.date||"").localeCompare(x.date||""))
}
function renderTimeline(){
 const f=v("timelineFilter")||"All";let a=getTimeline().filter(x=>f==="All"||x.type===f);
 $("timelineList").innerHTML=a.length?`<div class="card timeline">${a.map(e=>`<div class="event"><small>${e.date} <span class="tag">${e.type}</span></small><b>${e.text}</b></div>`).join("")}</div>`:`<div class="card"><p class="muted">No records.</p></div>`
}
function generateAI(){
 const d=db.daily[0]||{}, p=db.profile||{}, r=rituData[db.ritu.ritu], focus=v("aiFocus"),q=v("aiQuestion");
 const abnormal=clinicalAlerts(); const meds=db.medicines.filter(x=>!x.stop).slice(0,10).map(x=>`${x.name} (${x.type}) ${x.dose} ${x.freq} for ${x.purpose||x.target}`).join("\n• ");
 const recentLabs=db.labs.slice(0,10).map(x=>`${x.date} — ${x.test}: ${x.value} ${x.unit||""} [${x.range||"range not entered"}]`).join("\n• ");
 const tx=db.therapies.slice(0,5).map(x=>`${x.date} — ${x.name}: ${x.outcome}; adverse effect: ${x.ae||"none recorded"}`).join("\n• ");
 let out=`RAJ HEALTH 360 — INTEGRATED REVIEW\nFocus: ${focus}\nQuestion: ${q||"General review"}\n\n1) SAFETY / CLINICAL ATTENTION\n• ${abnormal.join("\n• ")}\n\n2) CURRENT SNAPSHOT\n• Weight: ${d.weight||"-"} kg | BP: ${d.sbp||"-"}/${d.dbp||"-"} | Glucose: ${d.sugar||"-"}\n• Sleep: ${d.sleep||"-"} h | Exercise: ${d.exercise||"-"} min | Water: ${d.water||"-"} L\n• Energy: ${d.energy||"-"}/10 | Peace: ${d.peace||"-"}/10 | Stress: ${d.stress||"-"}/10\n\n3) AYURVEDA CONTEXT\n• Prakriti: ${db.ayurveda.prakriti} | Vikriti: ${db.ayurveda.vikriti||"-"} | Agni: ${db.ayurveda.agni} | Ama: ${db.ayurveda.ama}\n• Ritu: ${db.ritu.ritu} — ${r.dosha}\n• Shatkriyakala conceptual stage: ${db.shatkriya.stage}\n• Seasonal focus: ${r.focus}\n\n4) NEXT BEST ACTIONS\n• ${nextActions().join("\n• ")}\n\n5) CURRENT MEDICINES\n• ${meds||"None entered"}\n\n6) RECENT LABS\n• ${recentLabs||"None entered"}\n\n7) RECENT INTERVENTIONS / OUTCOMES\n• ${tx||"None entered"}\n\n8) DECISION RULE\nChange the fewest variables needed, document the reason, set a measurable outcome, and reassess. Do not start/stop prescription medicines or intensive Panchakarma solely from this prototype.`;
 $("aiOutput").textContent=out
}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`RAJ_HEALTH_360_BACKUP_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importData(e){const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{db=JSON.parse(rd.result);persist();alert("Backup imported.")}catch{alert("Invalid JSON backup.")}};rd.readAsText(f)}
function renderForms(){
 const p=db.profile;
 [["pName","name"],["pDob","dob"],["pSex","sex"],["pHeight","height"],["pBlood","blood"],["pAllergy","allergy"],["pConditions","conditions"],["pEmergency","emergency"],["pGoals","goals"]].forEach(([id,k])=>{if($(id)&&document.activeElement!==$(id))$(id).value=p[k]||""});$("miniName").textContent=p.name||"My Health";
 const a=db.ayurveda;
 [["prakriti","prakriti"],["vikriti","vikriti"],["agni","agni"],["koshta","koshta"],["ama","ama"],["bala","bala"]].forEach(([id,k])=>$(id).value=a[k]||"");
 const as=a.ashtavidha||{}; [["aNadi","nadi"],["aMutra","mutra"],["aMala","mala"],["aJihva","jihva"],["aShabda","shabda"],["aSparsha","sparsha"],["aDrik","drik"],["aAkriti","akriti"]].forEach(([id,k])=>$(id).value=as[k]||"");
 const ds=a.dashavidha||{}; [["dPrakriti","prakriti"],["dVikriti","vikriti"],["dSara","sara"],["dSamhanana","samhanana"],["dPramana","pramana"],["dSatmya","satmya"],["dSatva","satva"],["dAhara","ahara"],["dVyayama","vyayama"],["dVaya","vaya"]].forEach(([id,k])=>$(id).value=ds[k]||"");
 const dos=a.dosha||{vata:5,pitta:5,kapha:5,note:""};["vata","pitta","kapha"].forEach(k=>{$(k+"Score").value=dos[k]??5;$(k+"Out").textContent=dos[k]??5});$("doshaNote").value=dos.note||"";
 $("stageNote").value=db.shatkriya.note||"";
 document.querySelectorAll(".stage").forEach(x=>x.classList.toggle("active",x.dataset.stage===db.shatkriya.stage))
}
function renderTables(){
 $("medTable").innerHTML=table(db.medicines,[["Medicine","name"],["Type","type"],["Dose","dose"],["Frequency","freq"],["Start","start"],["Stop","stop"],["Target","target"],["Outcome","benefit"],["Adverse effect","ae"]]);
 $("txTable").innerHTML=table(db.therapies,[["Date","date"],["Intervention","name"],["Reason","reason"],["Supervision","supervision"],["Before→After",x=>`${x.before||"-"} → ${x.after||"-"}`],["Outcome","outcome"],["Adverse effect","ae"]]);
}
function renderAll(){applyAutoRitu();renderForms();renderDashboard();renderRitu();renderInvestigations();renderTables();renderTimeline()}
renderAll();
