const APP_VERSION="V7.2";
const APP_BUILD_DATE="2026-08-12";

const KEY="raj_health_360_v2";
const defaultDB={
 profile:{name:"",dob:"",sex:"Male",height:"",blood:"",allergy:"",conditions:"",emergency:"",goals:""},
 reportArchiveIndex:[],
 daily:[],labs:[],imaging:[],medicines:[],therapies:[],mind:[],habits:[],sleep:[],physician:[],experiments:[],preventive:[],vault:[],labInterpretations:[],
 ayurveda:{prakriti:"Vata-Pitta",vikriti:"",agni:"Sama",koshta:"Madhyama",ama:"Absent",bala:"Madhyama",ashtavidha:{},dashavidha:{},dosha:{vata:5,pitta:5,kapha:5,note:""}},
 ritu:{auto:true,ritu:"Varsha",desha:"Sadharana"}, shatkriya:{stage:"Sanchaya",note:""}
};
let db=Object.assign({},defaultDB,JSON.parse(localStorage.getItem(KEY)||"{}"));
for(const k of Object.keys(defaultDB)) if(db[k]===undefined) db[k]=defaultDB[k];
const $=id=>document.getElementById(id);
const v=id=>$(id)?.value??"";
const n=id=>Number(v(id))||0;
const today=()=>new Date().toISOString().slice(0,10);
function persist(){localStorage.setItem(KEY,JSON.stringify(db));renderAll();scheduleCloudSync()}
function showView(id){
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===id));
 window.scrollTo({top:0,behavior:"smooth"})
}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showView(x.dataset.view));
["tdDate","labDate","imgDate","txDate","msDate","slDate","phDate","exStart","pvDue","vlDate","liDate"].forEach(id=>{if($(id))$(id).value=today()});
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("backupBtn").onclick=exportData;



const CLOUD_CONFIG_KEY="raj_health_360_firebase_config_v1";
const CLOUD_PREF_KEY="raj_health_360_cloud_prefs_v1";
let cloudApp=null,cloudAuth=null,cloudStore=null,cloudStorage=null,cloudUser=null,cloudUnsubscribe=null,cloudApplyingRemote=false,cloudSyncTimer=null;

function cloudPrefs(){try{return Object.assign({autoSync:true,realtime:true,uploadFiles:true},JSON.parse(localStorage.getItem(CLOUD_PREF_KEY)||"{}"))}catch(e){return {autoSync:true,realtime:true,uploadFiles:true}}}
function saveCloudPreferences(){
 const p={autoSync:!!$("cloudAutoSync")?.checked,realtime:!!$("cloudRealtime")?.checked,uploadFiles:!!$("cloudUploadFiles")?.checked};
 localStorage.setItem(CLOUD_PREF_KEY,JSON.stringify(p));
 p.realtime?startCloudRealtimeListener():stopCloudRealtimeListener();
}
function loadCloudPreferencesUI(){const p=cloudPrefs();if($("cloudAutoSync"))$("cloudAutoSync").checked=p.autoSync;if($("cloudRealtime"))$("cloudRealtime").checked=p.realtime;if($("cloudUploadFiles"))$("cloudUploadFiles").checked=p.uploadFiles}
function setCloudHeader(state,text){const el=$("cloudHeaderStatus");if(!el)return;el.className="cloud-pill"+(state?" "+state:"");el.textContent=text}
function cloudStatus(msg,error=false){if($("cloudSyncStatus"))$("cloudSyncStatus").textContent=msg;if(error)setCloudHeader("error","☁ Sync error")}
function firebaseConfigSaved(){try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||"null")}catch(e){return null}}
async function saveFirebaseConfig(){
 try{
  const cfg=JSON.parse(v("firebaseConfigJson"));["apiKey","authDomain","projectId","appId"].forEach(k=>{if(!cfg[k])throw new Error("Missing "+k)});
  localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(cfg));await initializeCloud(true);
  if($("firebaseConfigStatus"))$("firebaseConfigStatus").textContent="✓ Firebase configuration saved on this device.";
 }catch(e){if($("firebaseConfigStatus"))$("firebaseConfigStatus").textContent="Configuration error: "+e.message}
}
function clearFirebaseConfig(){if(!confirm("Remove cloud configuration from this device? Local data will remain safe."))return;stopCloudRealtimeListener();localStorage.removeItem(CLOUD_CONFIG_KEY);location.reload()}
async function initializeCloud(){
 const cfg=firebaseConfigSaved();loadCloudPreferencesUI();
 if($("firebaseConfigJson")&&cfg)$("firebaseConfigJson").value=JSON.stringify(cfg,null,2);
 if(!cfg){setCloudHeader("","☁ Local only");return false}
 if(!window.firebase){cloudStatus("Firebase SDK unavailable. Internet is required for cloud sync.",true);return false}
 try{
  if(!cloudApp){
   cloudApp=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);
   cloudAuth=firebase.auth();cloudStore=firebase.firestore();cloudStorage=firebase.storage();
   try{await cloudStore.enablePersistence({synchronizeTabs:true})}catch(e){console.warn("Firestore persistence",e)}
   cloudAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
   cloudAuth.onAuthStateChanged(user=>{cloudUser=user||null;renderCloudAuthState();if(user){setCloudHeader("online","☁ Cloud ready");if(cloudPrefs().realtime)startCloudRealtimeListener()}else{stopCloudRealtimeListener();setCloudHeader("","☁ Sign in")}});
  }
  if($("cloudDataHealth"))$("cloudDataHealth").textContent="Ready";if($("cloudFileHealth"))$("cloudFileHealth").textContent="Ready";
  return true;
 }catch(e){cloudStatus("Cloud initialization failed: "+e.message,true);return false}
}
function renderCloudAuthState(){if(cloudUser){if($("cloudAuthHealth"))$("cloudAuthHealth").textContent=cloudUser.email||cloudUser.uid;if($("cloudAuthStatus"))$("cloudAuthStatus").textContent="✓ Signed in: "+(cloudUser.email||cloudUser.uid)}else{if($("cloudAuthHealth"))$("cloudAuthHealth").textContent="Not signed in";if($("cloudAuthStatus"))$("cloudAuthStatus").textContent="Not signed in."}}
async function cloudSignIn(){if(!await initializeCloud())return;try{await cloudAuth.signInWithEmailAndPassword(v("cloudEmail").trim(),v("cloudPassword"));cloudStatus("Signed in. Ready to synchronize.")}catch(e){cloudStatus("Sign in failed: "+e.message,true)}}
async function cloudCreateAccount(){if(!await initializeCloud())return;try{await cloudAuth.createUserWithEmailAndPassword(v("cloudEmail").trim(),v("cloudPassword"));cloudStatus("Account created and signed in.")}catch(e){cloudStatus("Account creation failed: "+e.message,true)}}
async function cloudForgotPassword(){if(!await initializeCloud())return;const email=v("cloudEmail").trim();if(!email){alert("Enter your email first.");return}try{await cloudAuth.sendPasswordResetEmail(email);alert("Password reset email sent.")}catch(e){alert("Could not send reset email: "+e.message)}}
async function cloudSignOut(){try{await cloudAuth?.signOut();cloudStatus("Signed out. Local data remains available.")}catch(e){cloudStatus("Sign out failed: "+e.message,true)}}
async function testCloudConnection(){
 if(!await initializeCloud())return;if(!cloudUser){cloudStatus("Firebase configured. Sign in to test private cloud data.");return}
 try{const ref=cloudStore.collection("users").doc(cloudUser.uid).collection("health").doc("_test");await ref.set({t:firebase.firestore.FieldValue.serverTimestamp()});await ref.get();await ref.delete();if($("cloudDataHealth"))$("cloudDataHealth").textContent="Connected";cloudStatus("✓ Cloud connection test passed.")}catch(e){cloudStatus("Cloud test failed: "+e.message,true)}
}
function getCloudDeviceId(){let id=localStorage.getItem("raj_health_360_device_id");if(!id){id="dev_"+Date.now()+"_"+Math.random().toString(36).slice(2,8);localStorage.setItem("raj_health_360_device_id",id)}return id}
function cloudStatePayload(){const clone=JSON.parse(JSON.stringify(db));clone.labInterpretations=(clone.labInterpretations||[]).slice(0,30);return {schema:1,appVersion:APP_VERSION,updatedAt:Date.now(),deviceId:getCloudDeviceId(),data:clone}}

function isMeaningfulCloudValue(v){
 if(v===null||v===undefined)return false;
 if(typeof v==="string")return v.trim()!=="";
 if(Array.isArray(v))return v.length>0;
 return true;
}
function safeMergeObject(localObj,remoteObj){
 const out=Object.assign({},localObj||{});
 const remoteClears=remoteObj?.__clearedFields||{};
 for(const [k,v] of Object.entries(remoteObj||{})){
   if(k==="__clearedFields"){out[k]=Object.assign({},out[k]||{},v||{});continue}
   if(remoteClears[k]){
     const localClear=out.__clearedFields?.[k]||0;
     if(remoteClears[k]>=localClear){out[k]="";continue}
   }
   if(v&&typeof v==="object"&&!Array.isArray(v)){
     out[k]=safeMergeObject(out[k]||{},v);
   }else if(isMeaningfulCloudValue(v)){
     out[k]=v;
   }else if(out[k]===undefined){
     out[k]=v;
   }
 }
 return out;
}

function mergeCloudDB(remote){
 if(!remote||typeof remote!=="object")return;
 const out=Object.assign({},db);
 for(const [k,val] of Object.entries(remote)){
  if(Array.isArray(val)){
   const local=Array.isArray(out[k])?out[k]:[];
   const m=new Map();
   // Preserve local-only records first.
   local.forEach(item=>{
    const key=item?.id||item?.archiveId||[item?.date,item?.name,item?.title,item?.panel,JSON.stringify(item).slice(0,60)].join("|");
    m.set(key,item);
   });
   // Latest cloud snapshot wins for matching records.
   val.forEach(item=>{
    const key=item?.id||item?.archiveId||[item?.date,item?.name,item?.title,item?.panel,JSON.stringify(item).slice(0,60)].join("|");
    m.set(key,item);
   });
   out[k]=Array.from(m.values());
  }else if(val&&typeof val==="object"){
   // Local first, remote second => latest cloud fields win.
   out[k]=safeMergeObject(out[k]||{},val);
  }else{
   out[k]=val;
  }
 }
 db=out;
 try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){console.warn("Remote merge local cache",e)}
 renderAll();
}
async function pushCoreState(){await cloudStore.collection("users").doc(cloudUser.uid).collection("health").doc("core").set(cloudStatePayload(),{merge:true})}
async function pullCoreState(){const snap=await cloudStore.collection("users").doc(cloudUser.uid).collection("health").doc("core").get();if(snap.exists&&snap.data()?.data){cloudApplyingRemote=true;mergeCloudDB(snap.data().data);cloudApplyingRemote=false;return true}return false}
async function uploadAttachmentToCloud(att){
 if(!att?.id||!cloudPrefs().uploadFiles)return att;
 try{
  const rec=await getLocalAttachment(att.id);if(!rec?.blob)return att;
  const safe=(rec.name||"report").replace(/[^a-zA-Z0-9._-]+/g,"_"),path=`users/${cloudUser.uid}/attachments/${att.id}/${safe}`;
  await cloudStorage.ref().child(path).put(rec.blob,{contentType:rec.type||"application/octet-stream"});
  return Object.assign({},att,{cloudPath:path,cloudSynced:true});
 }catch(e){return Object.assign({},att,{cloudSynced:false,cloudError:e.message})}
}
async function syncArchivedReportsToCloud(){
 const records=await getAllReportRecords();let count=0;
 for(const rec0 of records){if(rec0.type==="test")continue;const rec=JSON.parse(JSON.stringify(rec0));if(rec.attachment?.id)rec.attachment=await uploadAttachmentToCloud(rec.attachment);await cloudStore.collection("users").doc(cloudUser.uid).collection("reports").doc(rec.id).set(Object.assign({},rec,{cloudUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()}),{merge:true});count++}
 return count
}
async function pullArchivedReportsFromCloud(){const snap=await cloudStore.collection("users").doc(cloudUser.uid).collection("reports").get();let count=0;for(const d of snap.docs){const r=d.data();if(r?.id){await putReportRecord(r);updateLocalReportIndex(r);count++}}try{await renderReportArchive()}catch(e){}return count}
async function syncAllToCloud(){
 if(!await initializeCloud())return;if(!cloudUser){cloudStatus("Please sign in first.",true);return}
 setCloudHeader("syncing","☁ Syncing…");try{await pushCoreState();const n=await syncArchivedReportsToCloud();const s=new Date().toLocaleString();localStorage.setItem("raj_health_360_last_cloud_sync",s);if($("cloudLastSync"))$("cloudLastSync").textContent=s;setCloudHeader("online","☁ Synced");cloudStatus(`✓ Uploaded core health data + ${n} archived report(s).`)}catch(e){cloudStatus("Cloud upload failed: "+e.message,true)}
}
async function pullAllFromCloud(){
 if(!await initializeCloud())return;if(!cloudUser){cloudStatus("Please sign in first.",true);return}
 setCloudHeader("syncing","☁ Pulling…");try{const core=await pullCoreState(),n=await pullArchivedReportsFromCloud();const s=new Date().toLocaleString();localStorage.setItem("raj_health_360_last_cloud_sync",s);if($("cloudLastSync"))$("cloudLastSync").textContent=s;setCloudHeader("online","☁ Synced");cloudStatus(`✓ Download complete. ${core?"Core merged. ":""}${n} archived report(s) available.`)}catch(e){cloudStatus("Cloud download failed: "+e.message,true)}
}
async function cloudBidirectionalSync(){await pullAllFromCloud();if(cloudUser)await syncAllToCloud()}

async function verifyRealtimeProfileSync(){
 if(!cloudUser){cloudStatus("Sign in first.",true);return}
 try{
  const snap=await cloudStore.collection("users").doc(cloudUser.uid).collection("health").doc("core").get();
  if(!snap.exists||!snap.data()?.data){cloudStatus("No cloud core record found yet.",true);return}
  const remoteProfile=snap.data().data.profile||{};
  const localProfile=db.profile||{};
  if(JSON.stringify(remoteProfile)===JSON.stringify(localProfile)){
   cloudStatus("✓ Realtime profile verification PASS — this device matches the latest cloud profile.");
   setCloudHeader("online","☁ Verified");
  }else{
   cloudStatus("Profile differs from cloud. Applying latest cloud profile now…");
   cloudApplyingRemote=true;
   mergeCloudDB(snap.data().data);
   cloudApplyingRemote=false;
   cloudStatus("✓ Latest safe cloud profile applied. Blank remote fields were prevented from erasing populated local values.");
   setCloudHeader("online","☁ Updated");
  }
 }catch(e){cloudStatus("Realtime verification failed: "+e.message,true)}
}

function scheduleCloudSync(){if(cloudApplyingRemote||!cloudPrefs().autoSync||!cloudUser)return;clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(()=>syncAllToCloud(),1800)}
function stopCloudRealtimeListener(){if(cloudUnsubscribe){try{cloudUnsubscribe()}catch(e){}cloudUnsubscribe=null}}
function startCloudRealtimeListener(){
 stopCloudRealtimeListener();if(!cloudUser||!cloudStore||!cloudPrefs().realtime)return;
 cloudUnsubscribe=cloudStore.collection("users").doc(cloudUser.uid).collection("health").doc("core").onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites)return;const p=s.data();if(p?.deviceId===getCloudDeviceId())return;if(p?.data){cloudApplyingRemote=true;mergeCloudDB(p.data);cloudApplyingRemote=false;setCloudHeader("online","☁ Updated");cloudStatus("✓ Latest changes received and applied from another device.")}},e=>cloudStatus("Realtime sync error: "+e.message,true))
}

const labPanels = {
 "CBC":{group:"Core",
  title:"Complete Blood Count (CBC)",system:"Hematology",
  params:[
   {id:"hb",name:"Hemoglobin",unit:"g/dL",male:[13,18],female:[12,16],meaning:"Oxygen-carrying protein; low values may indicate anemia, while high values require context such as hydration, altitude or erythrocytosis."},
   {id:"rbc",name:"RBC count",unit:"million/µL",male:[4.5,5.9],female:[4.1,5.1],meaning:"Red-cell number; interpret with Hb, hematocrit and red-cell indices."},
   {id:"hct",name:"Hematocrit / PCV",unit:"%",male:[41,53],female:[36,46],meaning:"Percentage of blood volume occupied by red cells; affected by anemia and hydration."},
   {id:"mcv",name:"MCV",unit:"fL",all:[80,100],meaning:"Average RBC size; low suggests microcytosis, high suggests macrocytosis."},
   {id:"mch",name:"MCH",unit:"pg",all:[27,33],meaning:"Average hemoglobin amount per red cell."},
   {id:"mchc",name:"MCHC",unit:"g/dL",all:[32,36],meaning:"Hemoglobin concentration within red cells."},
   {id:"rdw",name:"RDW",unit:"%",all:[11.5,14.5],meaning:"Variation in RBC size; elevated RDW can support mixed or evolving anemia patterns."},
   {id:"wbc",name:"Total WBC",unit:"/µL",all:[4000,11000],meaning:"Total leukocyte count; interpret with symptoms and differential."},
   {id:"neut",name:"Neutrophils",unit:"%",all:[40,70],meaning:"Often rise with acute inflammation/infection or stress; absolute count can be more informative."},
   {id:"lymph",name:"Lymphocytes",unit:"%",all:[20,40],meaning:"Lymphocyte proportion; interpret with total WBC and absolute lymphocyte count."},
   {id:"eos",name:"Eosinophils",unit:"%",all:[0,6],meaning:"Can rise in allergy, parasites and selected inflammatory conditions."},
   {id:"mono",name:"Monocytes",unit:"%",all:[2,8],meaning:"Part of WBC differential; persistent abnormalities need clinical context."},
   {id:"plt",name:"Platelets",unit:"/µL",all:[150000,450000],meaning:"Primary hemostasis; low or high values require clinical and trend review."}
  ]
 },
 "LFT":{group:"Core",
  title:"Liver Function / Liver Blood Tests",system:"Liver & Gallbladder",
  params:[
   {id:"tbili",name:"Total Bilirubin",unit:"mg/dL",all:[0.2,1.2],meaning:"Bilirubin handling/excretion; fractionation helps when elevated."},
   {id:"dbili",name:"Direct Bilirubin",unit:"mg/dL",all:[0,0.3],meaning:"Conjugated bilirubin; helps characterize jaundice patterns."},
   {id:"ast",name:"AST (SGOT)",unit:"U/L",all:[10,40],meaning:"Enzyme found in liver and other tissues; interpret with ALT and clinical context."},
   {id:"alt",name:"ALT (SGPT)",unit:"U/L",all:[7,56],meaning:"More liver-focused transaminase; elevation suggests hepatocellular injury pattern."},
   {id:"alp",name:"ALP",unit:"U/L",all:[44,147],meaning:"Can reflect cholestasis or bone turnover; interpret with GGT and context."},
   {id:"ggt",name:"GGT",unit:"U/L",male:[8,61],female:[5,36],meaning:"Supports hepatobiliary/cholestatic interpretation; affected by alcohol and medications."},
   {id:"albumin",name:"Albumin",unit:"g/dL",all:[3.5,5.0],meaning:"Synthetic/nutritional marker; low values have hepatic and non-hepatic causes."},
   {id:"protein",name:"Total Protein",unit:"g/dL",all:[6.0,8.3],meaning:"Albumin plus globulins; interpret alongside albumin and clinical state."}
  ]
 },
 "RFT":{group:"Core",
  title:"Renal / Kidney Function (RFT-KFT)",system:"Kidney & Uric Acid",
  params:[
   {id:"creat",name:"Serum Creatinine",unit:"mg/dL",male:[0.74,1.35],female:[0.59,1.04],meaning:"Filtration-related marker affected by muscle mass, hydration and medications; eGFR adds context."},
   {id:"egfr",name:"eGFR",unit:"mL/min/1.73m²",all:[90,200],meaning:"Estimated kidney filtration; persistent reduction and albuminuria determine CKD significance."},
   {id:"urea",name:"Urea",unit:"mg/dL",all:[15,40],meaning:"Affected by kidney function, protein intake, hydration and catabolic state."},
   {id:"bun",name:"BUN",unit:"mg/dL",all:[7,20],meaning:"Blood urea nitrogen; interpret with creatinine and hydration."},
   {id:"uric",name:"Uric Acid",unit:"mg/dL",male:[3.4,7.0],female:[2.4,6.0],meaning:"Purine metabolism marker; interpretation depends on gout, kidney function, medicines and trend."},
   {id:"sodium",name:"Sodium",unit:"mmol/L",all:[135,145],meaning:"Major extracellular electrolyte; abnormalities require volume and medication context."},
   {id:"potassium",name:"Potassium",unit:"mmol/L",all:[3.5,5.0],meaning:"Important for cardiac and neuromuscular function; significant abnormalities may require urgent review."},
   {id:"uacr",name:"Urine Albumin/Creatinine Ratio",unit:"mg/g",all:[0,30],meaning:"Albuminuria marker; persistent elevation is important for kidney and cardiovascular risk."}
  ]
 },
 "DIABETES":{group:"Core",
  title:"Diabetes & Glycemic Panel",system:"Metabolic & Diabetes",
  params:[
   {id:"fpg",name:"Fasting Plasma Glucose",unit:"mg/dL",all:[70,99],meaning:"Fasting glycemia; repeated elevation needs diabetes/prediabetes context."},
   {id:"ppbs",name:"2-hour Postprandial Glucose",unit:"mg/dL",all:[70,139],meaning:"Post-meal glucose response; interpretation depends on timing and diagnostic context."},
   {id:"hba1c",name:"HbA1c",unit:"%",all:[4.0,5.6],meaning:"Approximate longer-term glycemic exposure; affected by selected hematologic conditions."}
  ]
 },
 "LIPID":{group:"Core",
  title:"Lipid Profile",system:"Cardiovascular",
  params:[
   {id:"tc",name:"Total Cholesterol",unit:"mg/dL",all:[0,199],meaning:"Overall cholesterol; risk interpretation depends more on LDL/non-HDL and total cardiovascular risk."},
   {id:"ldl",name:"LDL-C",unit:"mg/dL",all:[0,99],meaning:"Primary atherogenic cholesterol target; desired level depends on cardiovascular risk."},
   {id:"hdl",name:"HDL-C",unit:"mg/dL",male:[40,200],female:[50,200],meaning:"Higher HDL is generally associated with lower risk, but should not be interpreted in isolation."},
   {id:"tg",name:"Triglycerides",unit:"mg/dL",all:[0,149],meaning:"Affected by meals, alcohol, metabolic health and genetics."},
   {id:"nonhdl",name:"Non-HDL-C",unit:"mg/dL",all:[0,129],meaning:"Captures cholesterol in atherogenic particles; useful alongside LDL."}
  ]
 },
 "THYROID":{group:"Hormonal",
  title:"Thyroid Function Tests",system:"Thyroid & Endocrine",
  params:[
   {id:"tsh",name:"TSH",unit:"mIU/L",all:[0.4,4.5],meaning:"Primary screening marker in many settings; interpret with free T4 and clinical context."},
   {id:"ft4",name:"Free T4",unit:"ng/dL",all:[0.9,1.7],meaning:"Free thyroxine; helps classify thyroid dysfunction with TSH."},
   {id:"ft3",name:"Free T3",unit:"pg/mL",all:[2.3,4.2],meaning:"Useful in selected thyroid contexts; assay ranges vary."},
   {id:"antiTPO",name:"Anti-TPO Antibody",unit:"IU/mL",all:[0,34],meaning:"Autoimmune thyroid marker; positivity is interpreted with thyroid function and clinical picture."}
  ]
 },

 "INFLAMMATION":{
  title:"Inflammation / Infection Markers",system:"General / Inflammation",
  params:[
   {id:"esr",name:"ESR",unit:"mm/hr",male:[0,15],female:[0,20],meaning:"Nonspecific inflammation marker; age, anemia and other factors affect ESR."},
   {id:"crp",name:"C-Reactive Protein (CRP)",unit:"mg/L",all:[0,5],meaning:"Acute-phase inflammatory marker; assay and clinical context matter."},
   {id:"hscrp",name:"hs-CRP",unit:"mg/L",all:[0,3],meaning:"High-sensitivity CRP may be used for selected cardiovascular-risk contexts; acute inflammation can invalidate risk interpretation."},
   {id:"procalc",name:"Procalcitonin",unit:"ng/mL",all:[0,0.1],meaning:"Used in selected bacterial-infection/sepsis contexts; thresholds are assay and scenario specific."}
  ]
 },
 "ELECTROLYTES":{
  title:"Electrolytes & Metabolic Panel",system:"Metabolic / Renal",
  params:[
   {id:"sodium",name:"Sodium",unit:"mmol/L",all:[135,145],meaning:"Major extracellular electrolyte; interpret with volume status and medicines."},
   {id:"potassium",name:"Potassium",unit:"mmol/L",all:[3.5,5.0],meaning:"Important for cardiac and neuromuscular function."},
   {id:"chloride",name:"Chloride",unit:"mmol/L",all:[98,107],meaning:"Electrolyte interpreted with sodium and acid-base status."},
   {id:"bicarb",name:"Bicarbonate / Total CO2",unit:"mmol/L",all:[22,29],meaning:"Helps assess acid-base balance."},
   {id:"magnesium",name:"Magnesium",unit:"mg/dL",all:[1.7,2.2],meaning:"Relevant to neuromuscular and cardiac function; ranges vary."}
  ]
 },
 "COAG":{
  title:"Coagulation Profile",system:"Hematology / Coagulation",
  params:[
   {id:"pt",name:"Prothrombin Time (PT)",unit:"sec",all:[11,13.5],meaning:"Extrinsic/common coagulation pathway; lab reagent affects range."},
   {id:"inr",name:"INR",unit:"",all:[0.8,1.2],meaning:"Standardized PT ratio; therapeutic targets differ when anticoagulation is prescribed."},
   {id:"aptt",name:"aPTT",unit:"sec",all:[25,35],meaning:"Intrinsic/common pathway; reagent and anticoagulant use affect interpretation."},
   {id:"fibrinogen",name:"Fibrinogen",unit:"mg/dL",all:[200,400],meaning:"Coagulation and acute-phase protein."},
   {id:"ddimer",name:"D-dimer",unit:"",meaning:"Assay-specific marker used in selected thromboembolism pathways; enter the laboratory range manually."}
  ]
 },
 "CARDIAC":{
  title:"Cardiac Biomarkers",system:"Cardiovascular",
  params:[
   {id:"troponin",name:"High-sensitivity Troponin",unit:"",meaning:"Cardiac injury biomarker with assay-specific 99th-percentile cutoffs; enter the printed lab range."},
   {id:"ckmb",name:"CK-MB",unit:"ng/mL",all:[0,5],meaning:"Cardiac/muscle injury marker; troponin is generally more cardiac-specific."},
   {id:"bnp",name:"BNP",unit:"pg/mL",all:[0,100],meaning:"Natriuretic peptide used in heart-failure evaluation; age, kidney function and obesity affect values."},
   {id:"ntprobnp",name:"NT-proBNP",unit:"pg/mL",meaning:"Natriuretic peptide with age/context-specific interpretation; enter the lab range."}
  ]
 },
 "PANCREAS":{
  title:"Pancreatic Enzymes",system:"Gastrointestinal / Pancreas",
  params:[
   {id:"amylase",name:"Amylase",unit:"U/L",all:[30,110],meaning:"Pancreatic/salivary enzyme; interpretation depends on symptoms and timing."},
   {id:"lipase",name:"Lipase",unit:"U/L",all:[0,60],meaning:"More pancreas-focused enzyme; diagnostic significance depends on magnitude and clinical presentation."}
  ]
 },
 "BONE":{group:"Nutrition",
  title:"Bone & Mineral Panel",system:"Bone Health",
  params:[
   {id:"calcium",name:"Calcium",unit:"mg/dL",all:[8.6,10.2],meaning:"Interpret with albumin, kidney function, vitamin D and symptoms."},
   {id:"phos",name:"Phosphorus",unit:"mg/dL",all:[2.5,4.5],meaning:"Bone-mineral and renal physiology marker."},
   {id:"vitd",name:"25-OH Vitamin D",unit:"ng/mL",all:[30,100],meaning:"Vitamin D status; thresholds and treatment targets vary by guideline and clinical context."},
   {id:"pth",name:"PTH",unit:"pg/mL",all:[15,65],meaning:"Parathyroid hormone; interpret with calcium, phosphorus, vitamin D and kidney function."}
  ]
 },
 "IRON":{group:"Nutrition",
  title:"Iron / Hematinic Panel",system:"Hematology",
  params:[
   {id:"ferritin",name:"Ferritin",unit:"ng/mL",male:[30,400],female:[13,150],meaning:"Iron storage marker; also rises with inflammation."},
   {id:"iron",name:"Serum Iron",unit:"µg/dL",all:[60,170],meaning:"Variable marker; best interpreted with TIBC/transferrin saturation and ferritin."},
   {id:"tibc",name:"TIBC",unit:"µg/dL",all:[240,450],meaning:"Iron-binding capacity; helps characterize iron deficiency patterns."},
   {id:"b12",name:"Vitamin B12",unit:"pg/mL",all:[200,900],meaning:"Low values may contribute to macrocytosis or neurologic symptoms; borderline values may need context."},
   {id:"folate",name:"Folate",unit:"ng/mL",all:[4,20],meaning:"Folate status; interpret with CBC and clinical context."}
  ]
 },
 "URINE":{group:"Core",
  title:"Urine Routine / Urinalysis",system:"Kidney & Urinary",
  params:[
   {id:"sg",name:"Specific Gravity",unit:"",all:[1.005,1.030],meaning:"Urine concentration; reflects hydration and concentrating ability."},
   {id:"ph",name:"Urine pH",unit:"",all:[4.5,8.0],meaning:"Affected by diet, infection and metabolic factors."},
   {id:"protein",name:"Protein",unit:"semiquant",textNormal:"Negative",meaning:"Proteinuria needs confirmation/quantification when present."},
   {id:"glucose",name:"Glucose",unit:"semiquant",textNormal:"Negative",meaning:"Urine glucose can occur with hyperglycemia or altered renal threshold."},
   {id:"ketone",name:"Ketones",unit:"semiquant",textNormal:"Negative",meaning:"May occur with fasting, low-carbohydrate states, vomiting or diabetic ketoacidosis."},
   {id:"rbc",name:"RBC / HPF",unit:"/HPF",all:[0,2],meaning:"Microscopic hematuria requires context and confirmation."},
   {id:"pus",name:"Pus cells / WBC",unit:"/HPF",all:[0,5],meaning:"Can suggest urinary inflammation/infection when elevated."}
  ]
 }
,
 "ARTHRITIS":{
  title:"Arthritis / Autoimmune Profile",system:"Musculoskeletal & Autoimmune",group:"Autoimmune",
  params:[
   {id:"esr",name:"ESR",unit:"mm/hr",male:[0,15],female:[0,20],meaning:"Nonspecific inflammation marker; rises with many inflammatory, infectious and hematologic states."},
   {id:"crp",name:"CRP",unit:"mg/L",all:[0,5],meaning:"Acute-phase inflammation marker; trend and clinical context matter."},
   {id:"rf",name:"Rheumatoid Factor",unit:"IU/mL",all:[0,14],meaning:"May support rheumatoid arthritis in context but is not specific."},
   {id:"antiCCP",name:"Anti-CCP Antibody",unit:"U/mL",all:[0,20],meaning:"More specific autoimmune marker for rheumatoid arthritis; lab cut-offs vary."},
   {id:"ana",name:"ANA Screen",unit:"qualitative",textNormal:"Negative",meaning:"Screening autoantibody test; positive results require pattern/titer and clinical correlation."},
   {id:"hlaB27",name:"HLA-B27",unit:"qualitative",textNormal:"Negative",meaning:"Genetic marker associated with spondyloarthritis; positivity alone does not establish disease."},
   {id:"uric",name:"Uric Acid",unit:"mg/dL",male:[3.4,7.0],female:[2.4,6.0],meaning:"Useful in gout context but a normal value does not exclude an acute attack."},
   {id:"c3",name:"Complement C3",unit:"mg/dL",all:[90,180],meaning:"Complement component; low values may be seen in selected immune-complex disorders."},
   {id:"c4",name:"Complement C4",unit:"mg/dL",all:[10,40],meaning:"Complement component interpreted with C3 and autoimmune context."}
  ]
 },
 "FEVER":{
  title:"Fever / Infectious Work-up",system:"Infectious Disease",group:"Infectious",
  params:[
   {id:"crp",name:"CRP",unit:"mg/L",all:[0,5],meaning:"Inflammatory marker; not organism-specific."},
   {id:"esr",name:"ESR",unit:"mm/hr",male:[0,15],female:[0,20],meaning:"Nonspecific inflammation marker."},
   {id:"pct",name:"Procalcitonin",unit:"ng/mL",all:[0,0.1],meaning:"Can support bacterial-infection assessment in selected settings; interpretation is clinical."},
   {id:"malariaAg",name:"Malaria Rapid Antigen",unit:"qualitative",textNormal:"Negative",meaning:"Rapid malaria test; species/timing and smear confirmation may matter."},
   {id:"malariaSmear",name:"Peripheral Smear for Malaria",unit:"qualitative",textNormal:"Negative",meaning:"Microscopy can identify parasites and species when performed appropriately."},
   {id:"dengueNS1",name:"Dengue NS1 Antigen",unit:"qualitative",textNormal:"Negative",meaning:"Useful early in dengue illness; a negative test does not fully exclude dengue."},
   {id:"dengueIgM",name:"Dengue IgM",unit:"qualitative",textNormal:"Negative",meaning:"Serologic evidence depends on timing from symptom onset."},
   {id:"dengueIgG",name:"Dengue IgG",unit:"qualitative",textNormal:"Negative",meaning:"May reflect past or current exposure depending on context and paired testing."},
   {id:"bloodCulture",name:"Blood Culture",unit:"qualitative",textNormal:"No growth",meaning:"Important for suspected bacteremia; collect before antibiotics when clinically appropriate."},
   {id:"urineCulture",name:"Urine Culture",unit:"qualitative",textNormal:"No significant growth",meaning:"Useful when urinary infection is suspected; colony count and symptoms matter."},
   {id:"ferritin",name:"Ferritin",unit:"ng/mL",male:[30,400],female:[13,150],meaning:"Iron-storage and acute-phase marker; can be markedly elevated in inflammatory syndromes."}
  ]
 },
 "HORMONE_F":{
  title:"Female Hormonal / Reproductive Profile",system:"Endocrine & Reproductive",group:"Hormonal",
  params:[
   {id:"fsh",name:"FSH",unit:"mIU/mL",all:[2,20],meaning:"Interpret by menstrual-cycle phase, age and ovarian function; lab-specific ranges are preferred."},
   {id:"lh",name:"LH",unit:"mIU/mL",all:[2,20],meaning:"Cycle-phase dependent; surge timing changes interpretation."},
   {id:"estradiol",name:"Estradiol (E2)",unit:"pg/mL",all:[20,350],meaning:"Highly cycle-phase dependent; use lab and cycle-day ranges."},
   {id:"prog",name:"Progesterone",unit:"ng/mL",all:[0.1,25],meaning:"Timing is crucial; luteal-phase testing is used to assess ovulation in context."},
   {id:"prolactin",name:"Prolactin",unit:"ng/mL",female:[4.8,23.3],male:[4.0,15.2],meaning:"Affected by stress, sleep, pregnancy and medications."},
   {id:"amh",name:"AMH",unit:"ng/mL",all:[0.5,6.0],meaning:"Ovarian-reserve marker; age and assay matter and it should not be used as a general fertility-screening test in women without infertility."},
   {id:"testosterone",name:"Total Testosterone",unit:"ng/dL",female:[15,70],male:[300,1000],meaning:"In women, elevated levels may support hyperandrogenism evaluation."},
   {id:"dheas",name:"DHEA-S",unit:"µg/dL",female:[35,430],male:[80,560],meaning:"Adrenal androgen marker; age-specific ranges vary."},
   {id:"shbg",name:"SHBG",unit:"nmol/L",female:[18,144],male:[10,57],meaning:"Binding protein affecting free sex-hormone availability."},
   {id:"tsh",name:"TSH",unit:"mIU/L",all:[0.4,4.5],meaning:"Thyroid dysfunction can affect menstrual and fertility health."}
  ]
 },
 "HORMONE_M":{
  title:"Male Hormonal / Androgen Profile",system:"Endocrine & Reproductive",group:"Hormonal",
  params:[
   {id:"testosterone",name:"Total Testosterone",unit:"ng/dL",male:[300,1000],female:[15,70],meaning:"Interpret preferably with morning sampling and symptoms; assay/lab ranges vary."},
   {id:"freeT",name:"Free Testosterone",unit:"pg/mL",male:[47,244],female:[0.3,3.8],meaning:"Method-dependent; SHBG and albumin affect interpretation."},
   {id:"lh",name:"LH",unit:"mIU/mL",male:[1.7,8.6],female:[2,20],meaning:"Helps distinguish primary vs central hypogonadal patterns with testosterone."},
   {id:"fsh",name:"FSH",unit:"mIU/mL",male:[1.5,12.4],female:[2,20],meaning:"Useful in spermatogenic/testicular function context."},
   {id:"prolactin",name:"Prolactin",unit:"ng/mL",male:[4.0,15.2],female:[4.8,23.3],meaning:"Elevated prolactin can suppress gonadal function."},
   {id:"estradiol",name:"Estradiol (E2)",unit:"pg/mL",male:[10,40],female:[20,350],meaning:"Useful in selected gynecomastia/androgen-balance contexts."},
   {id:"shbg",name:"SHBG",unit:"nmol/L",male:[10,57],female:[18,144],meaning:"Influences calculated free testosterone."},
   {id:"dheas",name:"DHEA-S",unit:"µg/dL",male:[80,560],female:[35,430],meaning:"Adrenal androgen marker; age-specific ranges vary."}
  ]
 },
 "FERTILITY_F":{
  title:"Female Infertility Evaluation Profile",system:"Reproductive",group:"Fertility",
  params:[
   {id:"amh",name:"AMH",unit:"ng/mL",all:[0.5,6.0],meaning:"Ovarian-reserve marker; age and assay matter."},
   {id:"fsh",name:"FSH",unit:"mIU/mL",all:[2,20],meaning:"Interpret with cycle day and estradiol."},
   {id:"lh",name:"LH",unit:"mIU/mL",all:[2,20],meaning:"Cycle-phase dependent and useful in ovulation/PCOS context."},
   {id:"estradiol",name:"Estradiol",unit:"pg/mL",all:[20,350],meaning:"Cycle-day dependent."},
   {id:"prog",name:"Progesterone",unit:"ng/mL",all:[0.1,25],meaning:"Timed luteal measurement may help document ovulation."},
   {id:"prolactin",name:"Prolactin",unit:"ng/mL",female:[4.8,23.3],male:[4.0,15.2],meaning:"Hyperprolactinemia can disturb ovulation."},
   {id:"tsh",name:"TSH",unit:"mIU/L",all:[0.4,4.5],meaning:"Thyroid disorders can affect fertility and pregnancy."},
   {id:"hba1c",name:"HbA1c",unit:"%",all:[4.0,5.6],meaning:"Metabolic context, especially in PCOS/obesity."},
   {id:"betaHCG",name:"β-hCG",unit:"mIU/mL",all:[0,5],meaning:"Pregnancy marker; interpretation depends on timing and serial change."}
  ]
 },
 "FERTILITY_M":{
  title:"Male Fertility / Semen Profile",system:"Reproductive",group:"Fertility",
  params:[
   {id:"volume",name:"Semen Volume",unit:"mL",all:[1.4,10],meaning:"Use the reporting laboratory/WHO manual reference because thresholds depend on current standard."},
   {id:"concentration",name:"Sperm Concentration",unit:"million/mL",all:[15,300],meaning:"Concentration is one component; total count, motility and morphology also matter."},
   {id:"totalCount",name:"Total Sperm Count",unit:"million/ejaculate",all:[39,1000],meaning:"Interpret with volume and concentration."},
   {id:"progMot",name:"Progressive Motility",unit:"%",all:[30,100],meaning:"Use current lab/WHO criteria and abstinence/sample-quality context."},
   {id:"totalMot",name:"Total Motility",unit:"%",all:[40,100],meaning:"Progressive + non-progressive motility."},
   {id:"morph",name:"Normal Morphology",unit:"%",all:[4,100],meaning:"Strict morphology is method-dependent."},
   {id:"vitality",name:"Vitality",unit:"%",all:[54,100],meaning:"Useful when motility is low."},
   {id:"ph",name:"Semen pH",unit:"",all:[7.2,8.0],meaning:"Abnormal pH can provide accessory-gland clues."}
  ]
 },
 "ADRENAL":{
  title:"Adrenal / Stress Hormone Profile",system:"Endocrine",group:"Hormonal",
  params:[
   {id:"cortisolAM",name:"Morning Cortisol",unit:"µg/dL",all:[5,25],meaning:"Strong diurnal variation; timing is essential."},
   {id:"acth",name:"ACTH",unit:"pg/mL",all:[7.2,63.3],meaning:"Interpret with cortisol and sampling conditions."},
   {id:"dheas",name:"DHEA-S",unit:"µg/dL",male:[80,560],female:[35,430],meaning:"Adrenal androgen marker with age-specific ranges."},
   {id:"aldosterone",name:"Aldosterone",unit:"ng/dL",all:[1,30],meaning:"Posture, sodium intake and medications substantially affect interpretation."},
   {id:"renin",name:"Renin",unit:"lab-specific",meaning:"Used with aldosterone ratio in selected hypertension/endocrine evaluations."}
  ]
 },
 "CARDIAC":{
  title:"Cardiac Biomarkers",system:"Cardiovascular",group:"Cardiac",
  params:[
   {id:"troponin",name:"High-sensitivity Troponin",unit:"ng/L",all:[0,14],meaning:"Assay-specific 99th percentile is critical; serial change and symptoms drive acute coronary syndrome interpretation."},
   {id:"ckmb",name:"CK-MB",unit:"ng/mL",all:[0,5],meaning:"Less specific than troponin; interpret with clinical context."},
   {id:"bnp",name:"BNP",unit:"pg/mL",all:[0,100],meaning:"Supports heart-failure evaluation; age, renal function and rhythm affect values."},
   {id:"ntprobnp",name:"NT-proBNP",unit:"pg/mL",all:[0,125],meaning:"Age and renal-function dependent; use clinical cut-offs."},
   {id:"hscrp",name:"hs-CRP",unit:"mg/L",all:[0,3],meaning:"Inflammation marker sometimes used in cardiovascular risk refinement."}
  ]
 },
 "COAG":{
  title:"Coagulation / Thrombosis Profile",system:"Hematology",group:"Coagulation",
  params:[
   {id:"pt",name:"PT",unit:"sec",all:[11,13.5],meaning:"Extrinsic/common coagulation pathway; reagent-dependent."},
   {id:"inr",name:"INR",unit:"",all:[0.8,1.2],meaning:"Standardized PT; therapeutic targets differ if on warfarin."},
   {id:"aptt",name:"aPTT",unit:"sec",all:[25,35],meaning:"Intrinsic/common coagulation pathway; lab-specific."},
   {id:"ddimer",name:"D-dimer",unit:"ng/mL FEU",all:[0,500],meaning:"High sensitivity but low specificity; age-adjusted/clinical pathways may be used."},
   {id:"fibrinogen",name:"Fibrinogen",unit:"mg/dL",all:[200,400],meaning:"Acute-phase and coagulation protein."}
  ]
 },
 "PANCREAS":{
  title:"Pancreatic Enzymes",system:"Gastrointestinal",group:"Core",
  params:[
   {id:"amylase",name:"Amylase",unit:"U/L",all:[30,110],meaning:"Can rise in pancreatitis and non-pancreatic conditions."},
   {id:"lipase",name:"Lipase",unit:"U/L",all:[0,60],meaning:"More pancreas-focused; significant elevation with compatible symptoms supports acute pancreatitis."}
  ]
 },
 "MICRONUTRIENT":{
  title:"Vitamin / Micronutrient Profile",system:"Nutrition",group:"Nutrition",
  params:[
   {id:"vitd",name:"25-OH Vitamin D",unit:"ng/mL",all:[30,100],meaning:"Interpret treatment targets by guideline and clinical risk."},
   {id:"b12",name:"Vitamin B12",unit:"pg/mL",all:[200,900],meaning:"Borderline values may need MMA/homocysteine context."},
   {id:"folate",name:"Folate",unit:"ng/mL",all:[4,20],meaning:"Interpret with CBC and dietary context."},
   {id:"ferritin",name:"Ferritin",unit:"ng/mL",male:[30,400],female:[13,150],meaning:"Iron storage plus acute-phase marker."},
   {id:"magnesium",name:"Magnesium",unit:"mg/dL",all:[1.7,2.2],meaning:"Serum magnesium reflects only a fraction of body stores."},
   {id:"zinc",name:"Zinc",unit:"µg/dL",all:[60,120],meaning:"Affected by fasting, inflammation and assay conditions."}
  ]
 },
 "TUMOR":{
  title:"Tumor Marker Tracking (Not General Screening)",system:"Oncology",group:"Oncology Tracking",
  params:[
   {id:"psa",name:"PSA",unit:"ng/mL",male:[0,4],meaning:"Prostate marker; age, prostate size, inflammation and shared decision-making matter."},
   {id:"afp",name:"AFP",unit:"ng/mL",all:[0,10],meaning:"Used in selected liver/germ-cell tumor contexts; not diagnostic alone."},
   {id:"cea",name:"CEA",unit:"ng/mL",all:[0,5],meaning:"Mainly useful for follow-up in selected cancers, not broad screening."},
   {id:"ca125",name:"CA-125",unit:"U/mL",all:[0,35],meaning:"Can rise in benign and malignant conditions; not a stand-alone screening test."},
   {id:"ca199",name:"CA 19-9",unit:"U/mL",all:[0,37],meaning:"Used in selected pancreatic/biliary cancer monitoring; not diagnostic alone."},
   {id:"ca153",name:"CA 15-3",unit:"U/mL",all:[0,30],meaning:"Used in selected breast-cancer monitoring contexts."}
  ]
 },
 "HEPATITIS":{
  title:"Viral / Blood-borne Infection Screen",system:"Infectious Disease",group:"Infectious",
  params:[
   {id:"hbsag",name:"HBsAg",unit:"qualitative",textNormal:"Negative",meaning:"Marker of current hepatitis B infection; full HBV serology may be needed."},
   {id:"antihcv",name:"Anti-HCV",unit:"qualitative",textNormal:"Negative",meaning:"Screening antibody; positive results need confirmatory HCV RNA."},
   {id:"hiv",name:"HIV Ag/Ab",unit:"qualitative",textNormal:"Negative",meaning:"Fourth-generation screening test; reactive results require confirmatory algorithm."}
  ]
 }

};
// --- Omega Diagnostics sample-derived lab template (uploaded 14-page report, Aug 2026) ---
const omegaLabTemplate = {
 CBC:{hb:{female:[11.0,16.0],unit:"gm%"},wbc:{all:[4.0,11.0],unit:"10^3/mm^3"},neut:{all:[40,80]},lymph:{all:[20,40]},eos:{all:[1,6]},mono:{all:[2,10]},baso:{all:[0,1]},absNeut:{all:[1.5,7.5],unit:"10^3/mm^3"},absLymph:{all:[1.25,4.0],unit:"10^3/mm^3"},absEos:{all:[0.2,0.5],unit:"10^3/mm^3"},absMono:{all:[0.2,0.8],unit:"10^3/mm^3"},absBaso:{all:[0,0.1],unit:"10^3/mm^3"},rbc:{female:[3.8,4.8],unit:"Million/cumm"},hct:{female:[36,46]},mcv:{all:[81,101]},mch:{all:[26,33]},mchc:{all:[32,36]},rdw:{all:[12,18]},rdwsd:{text:"Printed sample: 37.0–36.0 fL — verify Omega master range",unit:"fL",verify:true},plt:{all:[150,450],unit:"10^3/mm^3"},pct:{all:[0.150,0.400],unit:"%"},mpv:{all:[7.5,11.5],unit:"fL"},pdw:{all:[11,20],unit:"fL"},plcr:{all:[11,45],unit:"%"},plcc:{all:[44,140],unit:"10^3/uL"}},
 INFLAMMATION:{esr:{female:[1,20],unit:"mm/1st hr"}},
 DIABETES:{hba1c:{all:[4.0,6.0],unit:"%"},eag:{all:[90,120],unit:"mg/dL"}},
 LFT:{tbili:{all:[0.1,1.2]},dbili:{all:[0,0.4]},ibili:{all:[0.1,1.0]},alt:{all:[7,55],unit:"IU/L"},ast:{all:[8,48],unit:"IU/L"},astalt:{text:"Printed sample: 0–46 ratio — verify Omega master range",unit:"ratio",verify:true},alp:{male:[80,306],female:[64,306]},ggt:{all:[0,55]},protein:{all:[6.2,8.0],unit:"gm/dL"},albumin:{all:[3.5,5.5],unit:"gm/dL"},globulin:{all:[2.3,3.5],unit:"gm/dL"},agratio:{all:[1.0,2.0],unit:"ratio"}},
 IRON:{iron:{all:[40,160],unit:"mcg/dL"},tibc:{all:[220,440],unit:"mcg/dL"},uibc:{all:[111,343],unit:"mcg/dL"},tsat:{all:[20,50],unit:"%"},b12:{all:[180,914],unit:"pg/ml"}},
 BONE:{calcium:{all:[8.6,10.0],unit:"mg/dL"},vitd:{all:[30,100],unit:"ng/ml"}},
 RFT:{urea:{all:[15,45]},creat:{all:[0.6,1.3]},bun:{all:[7,20]},buncr:{all:[10,20],unit:"ratio"},ureacr:{all:[10,40],unit:"ratio"},uric:{all:[3.4,7.0]},sodium:{all:[135,145]},potassium:{all:[3.5,5.1]},chloride:{all:[96,106]},egfr:{min:90,text:">90 = Normal",unit:"mL/min/1.73m²"}},
 LIPID:{tc:{all:[0,200]},tg:{all:[0,170]},hdl:{all:[40,70]},ldl:{all:[0,100]},vldl:{all:[6,38]},cholhdl:{all:[3.5,5.0],clinicalNote:"Below this printed interval may still be favorable for cardiovascular risk."},ldlhdl:{all:[2.5,3.5],clinicalNote:"Below this printed interval may still be favorable for cardiovascular risk."}},
 URINE:{sg:{all:[1.010,1.030],unit:"g/mL"},ph:{all:[4.5,8.0]},protein:{textNormal:"Absent"},glucose:{textNormal:"Absent"},blood:{textNormal:"Absent"},bilirubin:{textNormal:"Absent"},pus:{all:[0,5],unit:"/HPF"},epi:{all:[0,4],unit:"/HPF"},urineRbc:{all:[0,5],unit:"/HPF"},cast:{textNormal:"Absent"},crystal:{textNormal:"Absent"},bacteria:{textNormal:"Absent"}},
 THYROID:{t3total:{all:[0.800,2.000],unit:"ng/ml"},t4total:{all:[5.100,14.100],unit:"ug/dl"},tsh:{all:[0.270,4.200],unit:"uIU/ml"}}
};
function addOmegaDerivedParameters(){
 const add=(panel,arr)=>{const ids=new Set(labPanels[panel].params.map(x=>x.id));arr.forEach(x=>{if(!ids.has(x.id))labPanels[panel].params.push(x)})};
 add("CBC",[{id:"baso",name:"Basophils",unit:"%",all:[0,1],meaning:"Basophil proportion; interpret with total WBC and absolute count."},{id:"absNeut",name:"Absolute Neutrophils",unit:"10^3/mm^3",all:[1.5,7.5],meaning:"Absolute neutrophil count is often more useful than percentage alone."},{id:"absLymph",name:"Absolute Lymphocytes",unit:"10^3/mm^3",all:[1.25,4],meaning:"Absolute lymphocyte count."},{id:"absEos",name:"Absolute Eosinophils",unit:"10^3/mm^3",all:[0.2,0.5],meaning:"Absolute eosinophil count."},{id:"absMono",name:"Absolute Monocytes",unit:"10^3/mm^3",all:[0.2,0.8],meaning:"Absolute monocyte count."},{id:"absBaso",name:"Absolute Basophils",unit:"10^3/mm^3",all:[0,0.1],meaning:"Absolute basophil count."},{id:"rdwsd",name:"RDW-SD",unit:"fL",meaning:"Absolute red-cell size-distribution width; verify laboratory range."},{id:"pct",name:"Plateletcrit (PCT)",unit:"%",all:[0.15,0.4],meaning:"Fraction of blood volume occupied by platelets."},{id:"mpv",name:"MPV",unit:"fL",all:[7.5,11.5],meaning:"Mean platelet volume."},{id:"pdw",name:"PDW",unit:"fL",all:[11,20],meaning:"Variation in platelet size."},{id:"plcr",name:"P-LCR",unit:"%",all:[11,45],meaning:"Proportion of larger platelets."},{id:"plcc",name:"P-LCC",unit:"10^3/uL",all:[44,140],meaning:"Absolute large platelet count."}]);
 add("DIABETES",[{id:"eag",name:"Estimated Average Glucose",unit:"mg/dL",all:[90,120],meaning:"Calculated estimate derived from HbA1c."}]);
 add("LFT",[{id:"ibili",name:"Indirect Bilirubin",unit:"mg/dL",all:[0.1,1.0],meaning:"Unconjugated bilirubin fraction."},{id:"astalt",name:"SGOT/SGPT Ratio",unit:"ratio",meaning:"AST/ALT relationship; do not interpret in isolation."},{id:"globulin",name:"Globulin",unit:"gm/dL",all:[2.3,3.5],meaning:"Protein fraction affected by immune/inflammatory and hepatic states."},{id:"agratio",name:"A:G Ratio",unit:"ratio",all:[1,2],meaning:"Albumin-to-globulin relationship."}]);
 add("IRON",[{id:"uibc",name:"Unsaturated Iron Binding Capacity",unit:"mcg/dL",all:[111,343],meaning:"Unused transferrin iron-binding capacity."},{id:"tsat",name:"Transferrin Saturation",unit:"%",all:[20,50],meaning:"Percentage of transferrin binding sites occupied by iron."}]);
 add("RFT",[{id:"buncr",name:"BUN/Creatinine Ratio",unit:"ratio",all:[10,20],meaning:"Supportive renal/hydration ratio."},{id:"ureacr",name:"Urea/Creatinine Ratio",unit:"ratio",all:[10,40],meaning:"Supportive ratio; interpret with individual values."},{id:"chloride",name:"Chloride",unit:"mmol/L",all:[96,106],meaning:"Electrolyte interpreted with sodium, potassium and acid-base status."}]);
 add("LIPID",[{id:"vldl",name:"VLDL-C",unit:"mg/dL",all:[6,38],meaning:"VLDL cholesterol estimate."},{id:"cholhdl",name:"Cholesterol/HDL Ratio",unit:"ratio",meaning:"Risk ratio; lower is generally favorable clinically."},{id:"ldlhdl",name:"LDL/HDL Ratio",unit:"ratio",meaning:"Risk ratio; lower is generally favorable clinically."}]);
 add("URINE",[{id:"color",name:"Color",unit:"",textNormal:"Pale Yellow",meaning:"Urine color."},{id:"appearance",name:"Appearance",unit:"",textNormal:"Clear",meaning:"Urine clarity."},{id:"blood",name:"Blood",unit:"semiquant",textNormal:"Absent",meaning:"Positive dipstick blood requires correlation."},{id:"bilirubin",name:"Bilirubin",unit:"semiquant",textNormal:"Absent",meaning:"Urine bilirubin may reflect conjugated hyperbilirubinemia."},{id:"epi",name:"Epithelial Cells",unit:"/HPF",all:[0,4],meaning:"May reflect contamination or epithelial shedding."},{id:"urineRbc",name:"Urine RBC",unit:"/HPF",all:[0,5],meaning:"Microscopic hematuria needs context."},{id:"cast",name:"Casts",unit:"",textNormal:"Absent",meaning:"Cast type can provide renal localization clues."},{id:"crystal",name:"Crystals",unit:"",textNormal:"Absent",meaning:"Crystals relate to urine chemistry and stone risk."},{id:"bacteria",name:"Bacteria",unit:"",textNormal:"Absent",meaning:"Interpret with microscopy, symptoms and culture."}]);
 add("THYROID",[{id:"t3total",name:"Total T3",unit:"ng/ml",all:[0.8,2.0],meaning:"Total triiodothyronine; binding proteins influence values."},{id:"t4total",name:"Total T4",unit:"ug/dl",all:[5.1,14.1],meaning:"Total thyroxine; binding proteins influence values."}]);
}
addOmegaDerivedParameters();
function omegaRefFor(panelKey,p,sex){
 if((v("liLabTemplate")||"omega")!=="omega")return null;
 const t=omegaLabTemplate[panelKey]?.[p.id]; if(!t)return null;
 if(t.textNormal)return {text:t.textNormal,range:null,unit:t.unit||p.unit,verify:!!t.verify,note:t.clinicalNote||""};
 if(t.text)return {text:t.text,range:t.min!==undefined?{min:t.min}:null,unit:t.unit||p.unit,verify:!!t.verify,note:t.clinicalNote||""};
 const r=(sex==="Female"&&t.female)?t.female:(sex==="Male"&&t.male)?t.male:t.all||null;
 if(r)return {text:`${r[0]}–${r[1]}`,range:r,unit:t.unit||p.unit,verify:!!t.verify,note:t.clinicalNote||""};
 if(t.min!==undefined)return {text:`≥${t.min}`,range:{min:t.min},unit:t.unit||p.unit,verify:!!t.verify,note:t.clinicalNote||""};
 return null;
}

let currentLabPanel="CBC";

function refRangeFor(p,sex){
 const omega=omegaRefFor(currentLabPanel,p,sex); if(omega)return omega.text;
 if(p.textNormal)return p.textNormal;
 const r=(sex==="Female"&&p.female)?p.female:(sex==="Male"&&p.male)?p.male:p.all||p.male||p.female;
 return r?`${r[0]}–${r[1]}`:"Lab-specific";
}
function numericRangeFor(p,sex){
 const omega=omegaRefFor(currentLabPanel,p,sex); if(omega)return omega.range;
 return (sex==="Female"&&p.female)?p.female:(sex==="Male"&&p.male)?p.male:p.all||null;
}
function autoStatus(value,p,sex){
 if(value===null||value===undefined||String(value).trim()==="")return "Not assessed";
 const omega=omegaRefFor(currentLabPanel,p,sex);
 const normalText=(omega&&omega.range===null&&omega.text&&!omega.verify)?omega.text:(p.textNormal||null);
 if(normalText && !/\d/.test(normalText)){
   const x=String(value).trim().toLowerCase(),norm=String(normalText).trim().toLowerCase();
   if(["absent","negative","no growth","no significant growth"].includes(norm))return ["negative","nil","absent","no growth","no significant growth"].includes(x)?"Normal":"Abnormal";
   return x===norm?"Normal":"Abnormal";
 }
 const num=Number(value);if(Number.isNaN(num))return "Not assessed";
 const r=numericRangeFor(p,sex);if(!r)return "Not assessed";
 if(!Array.isArray(r)&&r.min!==undefined)return num>=r.min?"Normal":"Low";
 const [lo,hi]=r;if(num<lo){const d=(lo-num)/(Math.abs(lo)||1);return d<=.10?"Borderline low":"Low";}if(num>hi){const d=(num-hi)/(Math.abs(hi)||1);return d<=.10?"Borderline high":"High";}return "Normal";
}
function statusClass(s){
 if(s==="Normal")return "status-normal";
 if(s==="High"||s==="Low"||s==="Abnormal")return "status-high";
 if(s.startsWith("Borderline"))return "status-borderline";
 return "status-na";
}

function getImportedDraftForPanel(panelKey){
 const date=v("liDate")||activeImportedDate||today();
 const attachmentName=pendingFiles.li?.name||activeImportedAttachmentName||"";
 let candidates=db.labInterpretations.filter(x=>x.smartImported===true && x.panel===panelKey);
 if(attachmentName) candidates=candidates.filter(x=>x.attachment?.name===attachmentName);
 if(date){
   const dated=candidates.filter(x=>x.date===date);
   if(dated.length)candidates=dated;
 }
 return candidates[0]||null;
}

function countFilledValues(values){
 return Object.values(values||{}).filter(x=>x.value!==""&&x.value!==null&&x.value!==undefined).length;
}

function selectLabPanel(key){
 if(!labPanels[key]){console.error("Unknown lab panel",key);return}
 currentLabPanel=key;
 if($("liSearch"))$("liSearch").value="";
 document.querySelectorAll(".lab-panel-btn").forEach(b=>b.classList.toggle("active",b.dataset.panel===key));
 document.querySelectorAll("#labPanelStaticGrid button").forEach(b=>b.classList.toggle("active",b.getAttribute("onclick")?.includes(`'${key}'`)));

 const draft=getImportedDraftForPanel(key);
 if(draft){
   if($("liDate"))$("liDate").value=draft.date||today();
   if($("liSex"))$("liSex").value=draft.sex||$("liSex").value;
   if($("liFacility"))$("liFacility").value=draft.facility||$("liFacility").value;
   if($("liContext"))$("liContext").value=draft.context||"Smart imported full report — VERIFY";
   if($("liRemarks"))$("liRemarks").value=draft.remarks||"";
   if($("liLabTemplate") && draft.referenceTemplate)$("liLabTemplate").value=draft.referenceTemplate;
   renderLabParameters(draft.values||{});
   generateCurrentPanelSummary();
   renderImportAudit();
   const filled=countFilledValues(draft.values);
   if($("labCentreStatus"))$("labCentreStatus").textContent=`${labPanels[key].title} loaded from imported report — ${filled} value(s) auto-filled. VERIFY with original report.`;
 } else {
   renderLabParameters();
   generateCurrentPanelSummary();
   renderImportAudit();
   if($("labCentreStatus"))$("labCentreStatus").textContent=`${labPanels[key].title} loaded — no smart-imported values found for this report.`;
 }
}
function renderLabPanelButtons(){
 if(!$("labPanelButtons"))return;
 const group=v("profileGroupFilter")||"All";
 const entries=Object.entries(labPanels).filter(([k,p])=>group==="All"||(p.group||"Core")===group);
 $("labPanelButtons").innerHTML=entries.map(([k,p])=>{
   const draft=getImportedDraftForPanel(k);
   const filled=draft?countFilledValues(draft.values):0;
   return `<button class="lab-panel-btn ${k===currentLabPanel?"active":""}" data-panel="${k}" onclick="selectLabPanel('${k}')">${p.title}<span class="panel-group-label">${p.group||"Core"} • ${p.params.length} tests${filled?` • ${filled} imported`:""}</span></button>`;
 }).join("");
}
function renderLabParameters(existing=null){
 if(!$("labParameterTable"))return;
 const panel=labPanels[currentLabPanel]||labPanels.CBC;
 if(!panel||!Array.isArray(panel.params)){if($("labCentreStatus"))$("labCentreStatus").textContent="Panel configuration error.";return}
 const sex=v("liSex")||db.profile?.sex||"Male";
 let q=(v("liSearch")||"").trim().toLowerCase();
 const panelAliases=[currentLabPanel.toLowerCase(),panel.title.toLowerCase(),panel.title.toLowerCase().replace(/\([^)]*\)/g,"").trim()];
 if(panelAliases.includes(q))q="";
 if($("labPanelTitle"))$("labPanelTitle").textContent=panel.title;
 if($("labPanelSystem"))$("labPanelSystem").textContent=panel.system;
 if($("labPanelCount"))$("labPanelCount").textContent=`${panel.params.length} parameters`;
 const previous=existing||{};
 const visible=panel.params.filter(p=>(p.name+" "+p.meaning).toLowerCase().includes(q));
 const rows=visible.map(p=>{
   const old=previous[p.id]||{};
   const omega=omegaRefFor(currentLabPanel,p,sex);
   const displayUnit=omega?.unit||p.unit||"";
   const ref=old.ref||refRangeFor(p,sex);
   const val=old.value??"";
   const stat=old.status||autoStatus(val,p,sex);
   return `<tr>
     <td><div class="param-name">${p.name}</div><div class="param-meaning">${p.meaning}</div></td>
     <td>${displayUnit}<div class="ref-source">${omega?"Omega template":"Generic"}${omega?.verify?" • VERIFY RANGE":""}</div></td>
     <td><input class="range-input" id="ref_${p.id}" value="${ref}"></td>
     <td><input class="result-input" id="val_${p.id}" value="${val}" oninput="updateParamStatus('${p.id}');generateCurrentPanelSummary()"></td>
     <td><select class="status-select ${statusClass(stat)}" id="status_${p.id}" onchange="this.className='status-select '+statusClass(this.value);generateCurrentPanelSummary()">
       ${["Not assessed","Normal","Borderline low","Low","Borderline high","High","Abnormal"].map(s=>`<option ${s===stat?"selected":""}>${s}</option>`).join("")}
     </select></td>
     <td><input id="remark_${p.id}" value="${old.remark||""}" placeholder="Remark"></td>
     <td><select class="verify-select" id="verify_${p.id}">
       ${["Unverified","Verified with PDF","Corrected manually"].map(s=>`<option ${s===(old.verification||"Unverified")?"selected":""}>${s}</option>`).join("")}
     </select></td>
   </tr>`;
 }).join("");
 $("labParameterTable").innerHTML=`<div class="lab-param-table"><table><thead><tr><th>Parameter & meaning</th><th>Unit</th><th>Reference range</th><th>Your value</th><th>Status</th><th>Remark</th><th>Verification</th></tr></thead><tbody>${rows||`<tr><td colspan="7">No parameter matches search. Clear the search box to show all ${panel.params.length} parameters.</td></tr>`}</tbody></table></div>`;
}
function updateParamStatus(id){
 const p=labPanels[currentLabPanel].params.find(x=>x.id===id);if(!p)return;
 const sel=$("status_"+id),value=v("val_"+id),sex=v("liSex")||"Male";
 sel.value=autoStatus(value,p,sex);sel.className="status-select "+statusClass(sel.value);
}
function markAllNotAssessed(){
 labPanels[currentLabPanel].params.forEach(p=>{const s=$("status_"+p.id);if(s&&!v("val_"+p.id)){s.value="Not assessed";s.className="status-select status-na"}});
}
function collectCurrentPanelValues(){
 const out={};
 labPanels[currentLabPanel].params.forEach(p=>{
   if(!$("status_"+p.id))return;
   const draft=getImportedDraftForPanel(currentLabPanel);
   const old=draft?.values?.[p.id]||{};
   const om=omegaRefFor(currentLabPanel,p,v("liSex")||"Male");
   out[p.id]={
     name:p.name,unit:om?.unit||p.unit,value:v("val_"+p.id),ref:v("ref_"+p.id),
     status:v("status_"+p.id),remark:v("remark_"+p.id),meaning:p.meaning,
     referenceSource:old.referenceSource||((v("liLabTemplate")||"omega")==="omega"?"Omega Diagnostics sample-derived":"Generic adult example"),
     imported:old.imported||false,parser:old.parser||"",confidence:old.confidence||null,
     sourceRow:old.sourceRow||"",sourcePage:old.sourcePage||null,
     verification:v("verify_"+p.id)||old.verification||"Unverified"
   };
 });
 return out;
}
async function saveLabInterpretation(){
 const status=$("liSaveStatus");
 try{
   const vals=collectCurrentPanelValues();
   if(!Object.keys(vals).length){alert("No parameters are loaded. Please select a test panel first.");return}
   const patient=validatePatientForArchive(); if(!patient)return;
   const existingIdx=v("liEditIndex");
   let existingLocal=existingIdx!=="" ? db.labInterpretations[+existingIdx] : null;
   const id=existingLocal?.archiveId||makeReportId("panel");
   const obj={
     id,archiveId:id,type:"panel",
     panel:currentLabPanel,title:labPanels[currentLabPanel].title,system:labPanels[currentLabPanel].system,
     date:v("liDate")||today(),sex:v("liSex")||"Male",facility:v("liFacility"),context:v("liContext"),
     remarks:v("liRemarks"),attachment:pendingFiles.li||existingLocal?.attachment||null,values:vals,
     patient,patientKey:patient.key,referenceTemplate:v("liLabTemplate")||existingLocal?.referenceTemplate||"omega",
     smartImported:Object.values(vals).some(x=>x.imported),
     created:existingLocal?.created||new Date().toISOString(),updated:new Date().toISOString()
   };
   await putReportRecord(obj);

   // Local in-app cache stays for immediate navigation, but durable source is IndexedDB.
   const cacheObj={...obj};
   if(existingIdx!=="")db.labInterpretations[+existingIdx]=cacheObj;else db.labInterpretations.unshift(cacheObj);
   updateLocalReportIndex(obj);

   if(status){status.textContent=`✓ Saved permanently on this device: ${obj.title} • ${obj.date} • ${patient.name||"Patient"}`;status.className="file-name save-ok"}
   if($("archiveSaveStatus")){$("archiveSaveStatus").textContent="Panel archived successfully";$("archiveSaveStatus").className="archive-status-ok"}
   renderSavedLabPanels();await renderReportArchive();safeGenerateFullBodySummary();renderTimeline();generateCurrentPanelSummary();
   if($("liEditIndex"))$("liEditIndex").value="";
   alert("Interpreted panel saved successfully to Patient Report Archive.");
 }catch(e){
   console.error("Panel save failed",e);
   if(status){status.textContent="Save failed: "+(e?.message||e);status.className="file-name save-error"}
   if($("archiveSaveStatus")){$("archiveSaveStatus").textContent="Save failed: "+(e?.message||e);$("archiveSaveStatus").className="archive-status-error"}
   try{emergencySaveCurrentReport("panel-save-failed")}catch(_){}
   alert("Panel archive save failed, but an Emergency JSON backup has been downloaded so your work is not lost. Close duplicate RAJ HEALTH 360 tabs, reopen this page, and retry.");
 }
}
function editLabInterpretation(i){
 const x=db.labInterpretations[i]; if(x.patient){if($("liPatientName"))$("liPatientName").value=x.patient.name||"";if($("liPatientId"))$("liPatientId").value=x.patient.patientId||"";if($("liPatientMobile"))$("liPatientMobile").value=x.patient.mobile||"";if($("liPatientAge"))$("liPatientAge").value=x.patient.age||"";} activeImportedAttachmentName=x.attachment?.name||activeImportedAttachmentName; activeImportedDate=x.date||activeImportedDate;showView("labcentre");currentLabPanel=x.panel||"CBC";renderLabPanelButtons();
 $("liDate").value=x.date||today();$("liSex").value=x.sex||"Male";if($("liLabTemplate"))$("liLabTemplate").value=x.referenceTemplate||"omega";$("liFacility").value=x.facility||"";$("liContext").value=x.context||"";$("liRemarks").value=x.remarks||"";$("liEditIndex").value=i;
 renderLabParameters(x.values||{});
}
function deleteLabInterpretation(i){if(confirm("Delete this interpreted panel?")){db.labInterpretations.splice(i,1);persist()}}
function resetLabInterpretation(){
 ["liFacility","liContext","liRemarks","liEditIndex","liSearch"].forEach(id=>{if($(id))$(id).value=""});
 if($("liDate"))$("liDate").value=today();pendingFiles.li=null;if($("liFileName"))$("liFileName").textContent="";renderLabParameters()
}

async function saveFullBodyReportArchive(){
 const status=$("archiveSaveStatus");
 if(status){status.textContent="Saving full-body report…";status.className=""}
 try{
   const patient=validatePatientForArchive(); if(!patient)return;
   const date=v("liDate")||today();
   const attachmentName=pendingFiles.li?.name||activeImportedAttachmentName||"";
   const panels={};

   // 1) Use imported in-memory panel drafts first
   (db.labInterpretations||[]).forEach(x=>{
     const sameDate=x.date===date;
     const sameAttachment=attachmentName ? x.attachment?.name===attachmentName : true;
     if(sameDate&&sameAttachment&&x.panel)panels[x.panel]=x;
   });

   // 2) Always capture the currently visible/edited panel
   panels[currentLabPanel]={
     panel:currentLabPanel,title:labPanels[currentLabPanel].title,system:labPanels[currentLabPanel].system,
     date,sex:v("liSex")||"Male",facility:v("liFacility"),context:v("liContext"),
     remarks:v("liRemarks"),attachment:pendingFiles.li||panels[currentLabPanel]?.attachment||null,
     values:collectCurrentPanelValues(),patient,patientKey:patient.key,
     referenceTemplate:v("liLabTemplate")||"omega",smartImported:true,
     updated:new Date().toISOString()
   };

   if(!Object.keys(panels).length)throw new Error("No interpreted panel data is available to archive.");
   const id=makeReportId("fullbody");
   const record={
     id,type:"fullbody",title:"Full Body Laboratory Report",date,
     patient,patientKey:patient.key,facility:v("liFacility"),context:v("liContext"),
     attachment:pendingFiles.li||Object.values(panels).find(x=>x.attachment)?.attachment||null,
     panels,remarks:v("liRemarks"),created:new Date().toISOString(),updated:new Date().toISOString()
   };
   await putReportRecord(record);
   updateLocalReportIndex(record);
   if(status){status.textContent=`✓ SAVED: Full-body report • ${Object.keys(panels).length} panel(s) • ${date}`;status.className="archive-status-ok"}
   await renderReportArchive();
   alert(`Full-body report saved successfully with ${Object.keys(panels).length} panel(s).`);
 }catch(e){
   console.error("Full-body save failed",e);
   if(status){status.textContent="Full-body save failed: "+e.message;status.className="archive-status-error"}
   try{if(typeof emergencySaveCurrentReport==="function")emergencySaveCurrentReport("fullbody-save-failed")}catch(_){}
   alert("Full-body archive save failed, but an Emergency JSON backup was downloaded so the interpreted report is not lost. Close duplicate RAJ HEALTH 360 tabs, reload, and retry.");
 }
}
function summarizePanelRecord(x){
 const vals=Object.values(x?.values||{}).filter(v=>v.value!==""&&v.value!=null);
 const flagged=vals.filter(v=>!["Normal","Not assessed"].includes(v.status));
 return {count:vals.length,flagged,txt:flagged.slice(0,6).map(v=>`${v.name}: ${v.value} ${v.unit||""} (${v.status})`).join("; ")};
}

function safeGenerateFullBodySummary(){
 try{ if(typeof generateFullBodySummary==="function") generateFullBodySummary(); }
 catch(e){ console.warn("Full body summary skipped",e); }
}
function generateFullBodySummary(){
 const el=$("fullBodySummary"); if(!el)return;
 try{
   const attachmentName=pendingFiles.li?.name||activeImportedAttachmentName||"";
   const date=v("liDate")||activeImportedDate||"";
   let records=(db.labInterpretations||[]).filter(x=>x && x.panel);
   if(attachmentName){const f=records.filter(x=>x.attachment?.name===attachmentName); if(f.length)records=f}
   if(date){const d=records.filter(x=>x.date===date); if(d.length)records=d}
   const map=new Map(); records.forEach(r=>{if(!map.has(r.panel))map.set(r.panel,r)}); records=[...map.values()];
   if(!records.length){el.textContent="No imported full-body panel records available yet.";return}
   let total=0,flagged=0,unverified=0; const lines=[];
   for(const r of records){
     const vals=Object.values(r.values||{}).filter(x=>x && x.value!=="" && x.value!=null);
     const bad=vals.filter(x=>!["Normal","Not assessed"].includes(x.status));
     const uv=vals.filter(x=>(x.verification||"Unverified")==="Unverified");
     total+=vals.length; flagged+=bad.length; unverified+=uv.length;
     lines.push(`${r.title||r.panel}: ${vals.length} imported • ${bad.length} flagged`+(bad.length?`\n  ↳ ${bad.slice(0,6).map(x=>`${x.name}: ${x.value} ${x.unit||""} (${x.status})`).join("; ")}`:""));
   }
   el.textContent=`Report: ${attachmentName||"Current report"}\nDate: ${date||"-"}\nPanels: ${records.length}\nMapped results: ${total}\nFlagged: ${flagged}\nUnverified: ${unverified}\n\n${lines.join("\n\n")}\n\nVerify smart-imported values against the original report before clinical use.`;
 }catch(e){console.error('Full body summary failed',e);el.textContent='Full-body summary unavailable: '+e.message}
}

async function renderReportArchive(patientOnly=false){
 if(!$("reportArchiveList"))return;
 try{
   let rows=await getAllReportRecords();
   const q=(v("reportArchiveSearch")||"").toLowerCase();
   if(patientOnly){
     const pk=currentPatientInfo().key;
     rows=rows.filter(r=>r.patientKey===pk);
   }
   if(q)rows=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));
   rows.sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created||"").localeCompare(a.created||""));
   if(!rows.length){$("reportArchiveList").innerHTML='<p class="muted">No archived reports found.</p>';return}
   $("reportArchiveList").innerHTML=rows.map(r=>{
     const panelEntries=r.type==="fullbody"?Object.values(r.panels||{}):[r];
     const chips=panelEntries.map(p=>{const s=summarizePanelRecord(p);return `<span class="archive-panel-chip ${s.flagged.length?"flagged":"ok"}">${p.title||p.panel}: ${s.count} tests • ${s.flagged.length} flagged</span>`}).join("");
     return `<div class="archive-item">
       <div class="archive-head">
         <div><b>${r.patient?.name||r.patientName||"Patient"} — ${r.title||"Laboratory Report"}</b>
           <small>${r.date||""} • ID ${r.patient?.patientId||"-"} • ${r.facility||""}${r.type==="fullbody"?" • Full body archive":""}</small>
         </div>
         <div class="archive-actions">
           <button class="action-btn edit-btn" onclick="openArchivedReport('${r.id}')">Open</button>
           <button class="action-btn" onclick="printArchivedReport('${r.id}')">Print</button>
           <button class="action-btn" onclick="downloadArchivedReportPDF('${r.id}')">PDF</button>
           <button class="action-btn" onclick="shareArchivedReport('${r.id}')">Share</button>
           <button class="action-btn" onclick="whatsAppArchivedReport('${r.id}')">WhatsApp</button>
           <button class="action-btn delete-btn" onclick="removeArchivedReport('${r.id}')">Delete</button>
         </div>
       </div><div class="archive-body">${chips}${r.attachment?.name?`<p><b>Original report:</b> ${r.attachment.name} ${r.attachment.id?`<button class="local-file-action" onclick="openLocalAttachment('${r.attachment.id}')">Open original</button> <button class="local-file-action" onclick="downloadLocalAttachment('${r.attachment.id}')">Download original</button>`:""}</p>`:""}</div>
     </div>`;
   }).join("");
 }catch(e){console.error(e);$("reportArchiveList").innerHTML=`<p class="save-error">Archive could not be loaded: ${e.message}</p>`}
}
function filterArchiveByPatient(){renderReportArchive(true)}
async function openArchivedReport(id){
 const r=await getReportRecord(id);if(!r){alert("Archived report not found.");return}
 const p=r.patient||{}; if($("liPatientName"))$("liPatientName").value=p.name||"";if($("liPatientId"))$("liPatientId").value=p.patientId||"";if($("liPatientMobile"))$("liPatientMobile").value=p.mobile||"";if($("liPatientAge"))$("liPatientAge").value=p.age||"";
 if($("liDate"))$("liDate").value=r.date||today();if($("liFacility"))$("liFacility").value=r.facility||"";if($("liContext"))$("liContext").value=r.context||"";
 const panel=r.type==="fullbody"?Object.values(r.panels||{})[0]:r;
 if(panel){currentLabPanel=panel.panel||"CBC";pendingFiles.li=r.attachment||panel.attachment||null;activeImportedAttachmentName=pendingFiles.li?.name||"";activeImportedDate=r.date||"";renderLabPanelButtons();renderLabParameters(panel.values||{});generateCurrentPanelSummary()}
 showView("labcentre");
}
async function removeArchivedReport(id){
 if(!confirm("Delete this archived report record? Original attachment is not automatically deleted."))return;
 await deleteReportRecord(id);db.reportArchiveIndex=(db.reportArchiveIndex||[]).filter(x=>x.id!==id);try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){};await renderReportArchive()
}
function reportToPlainText(r){
 const p=r.patient||{},head=`RAJ HEALTH 360 ${APP_VERSION}\\nPatient: ${p.name||"-"} | ID: ${p.patientId||"-"} | Date: ${r.date||"-"}\\nFacility: ${r.facility||"-"}\\n`;
 const panels=r.type==="fullbody"?Object.values(r.panels||{}):[r];
 const body=panels.map(panel=>{
   const vals=Object.values(panel.values||{}).filter(v=>v.value!==""&&v.value!=null);
   return `\\n${panel.title||panel.panel}\\n`+vals.map(v=>`${v.name}: ${v.value} ${v.unit||""} | Ref ${v.ref||"-"} | ${v.status||""}${v.verification?` | ${v.verification}`:""}`).join("\\n");
 }).join("\\n");
 return head+body+"\\n\\nSmart-imported values must be verified with the original laboratory report.";
}
function reportToHTML(r){
 const p=r.patient||{};const panels=r.type==="fullbody"?Object.values(r.panels||{}):[r];
 return `<!doctype html><html><head><meta charset="utf-8"><title>${r.title||"Health Report"}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#122}h1{font-size:22px}h2{font-size:17px;margin-top:22px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ccc;padding:6px;text-align:left}.high,.low{color:#b91c1c;font-weight:bold}.normal{color:#15803d;font-weight:bold}.meta{background:#f3f8f6;padding:12px;border-radius:8px}.foot{font-size:10px;color:#666;margin-top:20px}</style></head><body>
 <h1>RAJ HEALTH 360 — Laboratory Report</h1><div class="meta"><b>Patient:</b> ${p.name||"-"} &nbsp; <b>ID:</b> ${p.patientId||"-"} &nbsp; <b>Age/Sex:</b> ${p.age||"-"}/${p.sex||"-"}<br><b>Date:</b> ${r.date||"-"} &nbsp; <b>Facility:</b> ${r.facility||"-"}</div>
 ${panels.map(panel=>`<h2>${panel.title||panel.panel}</h2><table><thead><tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference</th><th>Status</th><th>Verification</th></tr></thead><tbody>${Object.values(panel.values||{}).filter(v=>v.value!==""&&v.value!=null).map(v=>`<tr><td>${v.name}</td><td>${v.value}</td><td>${v.unit||""}</td><td>${v.ref||""}</td><td class="${String(v.status||"").toLowerCase()}">${v.status||""}</td><td>${v.verification||"Unverified"}</td></tr>`).join("")}</tbody></table>`).join("")}
 <div class="foot">Generated by RAJ HEALTH 360 ${APP_VERSION}. Smart-imported results require verification with the original laboratory report before clinical use.</div></body></html>`;
}
async function printArchivedReport(id){const r=await getReportRecord(id);if(!r)return;const w=window.open("","_blank");w.document.write(reportToHTML(r));w.document.close();setTimeout(()=>w.print(),300)}
async function printCurrentPanel(){
 const r={type:"panel",title:labPanels[currentLabPanel].title,date:v("liDate"),facility:v("liFacility"),patient:currentPatientInfo(),values:collectCurrentPanelValues()};
 const w=window.open("","_blank");w.document.write(reportToHTML(r));w.document.close();setTimeout(()=>w.print(),300)
}
async function makePDFBlob(r){
 if(!window.jspdf?.jsPDF)throw new Error("PDF library did not load.");
 const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:"mm",format:"a4"});const p=r.patient||{};
 let y=14;doc.setFontSize(16);doc.text("RAJ HEALTH 360 - Laboratory Report",14,y);y+=8;doc.setFontSize(9);doc.text(`Patient: ${p.name||"-"}  ID: ${p.patientId||"-"}  Date: ${r.date||"-"}`,14,y);y+=5;doc.text(`Facility: ${r.facility||"-"}`,14,y);y+=7;
 const panels=r.type==="fullbody"?Object.values(r.panels||{}):[r];
 for(const panel of panels){
   if(y>270){doc.addPage();y=14}
   doc.setFontSize(11);doc.text(panel.title||panel.panel||"Panel",14,y);y+=5;doc.setFontSize(8);
   for(const val of Object.values(panel.values||{}).filter(v=>v.value!==""&&v.value!=null)){
     const line=`${val.name}: ${val.value} ${val.unit||""} | Ref ${val.ref||"-"} | ${val.status||""}`;
     const lines=doc.splitTextToSize(line,180);if(y+lines.length*4>282){doc.addPage();y=14}doc.text(lines,14,y);y+=lines.length*4;
   }y+=3;
 }
 doc.setFontSize(7);doc.text("Smart-imported values must be verified with the original laboratory report.",14,290);
 return doc.output("blob");
}
async function downloadArchivedReportPDF(id){try{const r=await getReportRecord(id);const blob=await makePDFBlob(r);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`RAJ_HEALTH_${(r.patient?.name||"PATIENT").replace(/\\s+/g,"_")}_${r.date||today()}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}catch(e){alert("PDF could not be created: "+e.message)}}
async function downloadCurrentPanelPDF(){const r={type:"panel",title:labPanels[currentLabPanel].title,date:v("liDate"),facility:v("liFacility"),patient:currentPatientInfo(),values:collectCurrentPanelValues()};try{const blob=await makePDFBlob(r);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${currentLabPanel}_${r.date||today()}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}catch(e){alert("PDF could not be created: "+e.message)}}
async function shareArchivedReport(id){const r=await getReportRecord(id);if(!r)return;try{const blob=await makePDFBlob(r);const file=new File([blob],`RAJ_HEALTH_${r.date||today()}.pdf`,{type:"application/pdf"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"RAJ HEALTH 360 Report",text:`${r.patient?.name||"Patient"} laboratory report`,files:[file]})}else if(navigator.share){await navigator.share({title:"RAJ HEALTH 360 Report",text:reportToPlainText(r)})}else{await navigator.clipboard.writeText(reportToPlainText(r));alert("Report summary copied. PDF sharing is supported best on mobile/native share.")}}catch(e){if(e.name!=="AbortError")alert("Share failed: "+e.message)}}
async function shareCurrentPanel(){const r={type:"panel",title:labPanels[currentLabPanel].title,date:v("liDate"),facility:v("liFacility"),patient:currentPatientInfo(),values:collectCurrentPanelValues()};try{const blob=await makePDFBlob(r);const file=new File([blob],`${currentLabPanel}_${r.date||today()}.pdf`,{type:"application/pdf"});if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({title:r.title,files:[file],text:"RAJ HEALTH 360 laboratory report"});else if(navigator.share)await navigator.share({title:r.title,text:reportToPlainText(r)});else{await navigator.clipboard.writeText(reportToPlainText(r));alert("Summary copied. Use Create PDF to download the file.")}}catch(e){if(e.name!=="AbortError")alert("Share failed: "+e.message)}}
function normalizeIndianMobile(m){const d=String(m||"").replace(/\\D/g,"");if(d.length===10)return "91"+d;if(d.startsWith("91")&&d.length===12)return d;return ""}
async function whatsAppArchivedReport(id){const r=await getReportRecord(id);if(!r)return;const mob=normalizeIndianMobile(r.patient?.mobile);const txt=encodeURIComponent(reportToPlainText(r));window.open(`https://wa.me/${mob}?text=${txt}`,"_blank")}
function whatsAppCurrentPanel(){const r={type:"panel",title:labPanels[currentLabPanel].title,date:v("liDate"),facility:v("liFacility"),patient:currentPatientInfo(),values:collectCurrentPanelValues()};const mob=normalizeIndianMobile(r.patient.mobile);window.open(`https://wa.me/${mob}?text=${encodeURIComponent(reportToPlainText(r))}`,"_blank")}

function generateCurrentPanelSummary(){
 if(!$("currentPanelSummary"))return;
 const vals=collectCurrentPanelValues(),panel=labPanels[currentLabPanel],abn=Object.values(vals).filter(x=>!["Normal","Not assessed"].includes(x.status)),normal=Object.values(vals).filter(x=>x.status==="Normal"),na=Object.values(vals).filter(x=>x.status==="Not assessed");
 let lines=[`${panel.title}: ${abn.length} flagged • ${normal.length} within selected range • ${na.length} not assessed.`, `Reference template: ${(v("liLabTemplate")||"omega")==="omega"?"Omega Diagnostics sample-derived":"Generic adult examples"}.`];
 if(abn.length)lines.push("Flagged parameters:\n• "+abn.map(x=>`${x.name}: ${x.value||"-"} ${x.unit||""} — ${x.status}`).join("\n• "));
 if(currentLabPanel==="CBC")lines.push(cbcPattern(vals));
 if(currentLabPanel==="LFT")lines.push(lftPattern(vals));
 if(currentLabPanel==="RFT")lines.push(rftPattern(vals));
 if(currentLabPanel==="THYROID")lines.push(thyroidPattern(vals));
 if(currentLabPanel==="DIABETES")lines.push(diabetesPattern(vals));
 if(currentLabPanel==="LIPID")lines.push(lipidPattern(vals));
 lines.push("Interpretation is a decision-support summary. Confirm with the report’s own reference intervals, symptoms, medicines and trends.");
 $("currentPanelSummary").textContent=lines.filter(Boolean).join("\n\n");
}
function numVal(vals,id){const x=Number(vals[id]?.value);return Number.isFinite(x)?x:null}
function cbcPattern(vs){
 let out=[],hb=numVal(vs,"hb"),mcv=numVal(vs,"mcv"),wbc=numVal(vs,"wbc"),plt=numVal(vs,"plt");
 if(hb!==null && ["Low","Borderline low"].includes(vs.hb.status)){
   if(mcv!==null&&mcv<80)out.push("CBC pattern: low Hb with microcytosis — consider an iron-deficiency/thalassemia-pattern differential in appropriate context.");
   else if(mcv!==null&&mcv>100)out.push("CBC pattern: low Hb with macrocytosis — B12/folate, medicines, liver/thyroid and other causes may need correlation.");
   else out.push("CBC pattern: low Hb with normocytic indices — correlate with renal, inflammatory, bleeding and other causes.");
 }
 if(wbc!==null&&vs.wbc.status==="High")out.push("Leukocytosis pattern: review differential count, symptoms, infection/inflammation, stress and medicines.");
 if(plt!==null&&vs.plt.status==="Low")out.push("Thrombocytopenia flag: confirm count/trend and review bleeding risk and causes.");
 return out.join("\n");
}
function lftPattern(vs){
 let alt=numVal(vs,"alt"),ast=numVal(vs,"ast"),alp=numVal(vs,"alp"),ggt=numVal(vs,"ggt"),tb=numVal(vs,"tbili"),out=[];
 if(vs.alt?.status==="High"||vs.ast?.status==="High")out.push("Transaminase elevation is present. Interpret magnitude, AST/ALT relationship, symptoms, alcohol/medicine exposure and serial trend; AST is not liver-specific.");
 if((vs.alp?.status==="High") && (vs.ggt?.status==="High"))out.push("ALP and GGT are both elevated, which can support a hepatobiliary/cholestatic pattern in the appropriate clinical context.");
 if(vs.alp?.status==="High" && !(vs.ggt?.status==="High"))out.push("Isolated ALP elevation is not automatically hepatic; bone and other sources should be considered.");
 if(vs.tbili?.status==="High")out.push("Total bilirubin is elevated; direct/indirect fractions help characterize the pattern.");
 if(!out.length)out.push("No major abnormal liver-panel pattern detected from the verified/imported values currently shown.");
 return out.join("\n");
}
function rftPattern(vs){
 let out=[];
 if(vs.egfr?.status==="Low")out.push("eGFR is reduced. CKD interpretation requires persistence over time and kidney-damage markers such as albuminuria, not a single eGFR alone.");
 if(vs.creat?.status==="High"||vs.creat?.status==="Borderline high")out.push("Creatinine is above the selected reference range; compare with prior baseline, eGFR, hydration, muscle mass and medicines.");
 if(vs.uacr?.status==="High"||vs.uacr?.status==="Borderline high")out.push("Urine albumin/creatinine ratio is elevated; persistence matters for kidney-risk classification.");
 if(vs.potassium?.status==="High"||vs.potassium?.status==="Low")out.push("Potassium is outside the selected range; significance depends on degree, symptoms, renal function and medicines.");
 if(!out.length)out.push("No major abnormal renal-panel pattern detected from the verified/imported values currently shown.");
 return out.join("\n");
}
function thyroidPattern(vs){
 let tsh=numVal(vs,"tsh"),ft4=numVal(vs,"ft4"),out=[];
 if(tsh!==null&&ft4!==null){
   if(tsh>4.5&&ft4>=0.9&&ft4<=1.7)out.push("TSH high with free T4 in range can fit a subclinical hypothyroid biochemical pattern; repeat/persistence and clinical context matter.");
   if(tsh>4.5&&ft4<0.9)out.push("High TSH with low free T4 supports a primary hypothyroid biochemical pattern.");
   if(tsh<0.4&&ft4>1.7)out.push("Low TSH with high free T4 supports a thyrotoxic biochemical pattern.");
 }
 return out.join("\n");
}
function diabetesPattern(vs){
 let f=numVal(vs,"fpg"),a=numVal(vs,"hba1c"),out=[];
 if(f!==null&&f>=126)out.push("Fasting glucose is in a diabetes-range value if truly fasting; diagnosis generally requires appropriate confirmation unless clinical circumstances establish it.");
 else if(f!==null&&f>=100)out.push("Fasting glucose is above the typical normal range and falls in an impaired-fasting-glycemia range.");
 if(a!==null&&a>=6.5)out.push("HbA1c is in a diabetes-range value; correlate with confirmation and conditions that may alter HbA1c accuracy.");
 else if(a!==null&&a>=5.7)out.push("HbA1c is in a prediabetes-range value.");
 return out.join("\n");
}
function lipidPattern(vs){
 let l=numVal(vs,"ldl"),tg=numVal(vs,"tg"),out=[];
 if(l!==null&&l>=190)out.push("LDL-C is markedly elevated; cardiovascular risk assessment and secondary-cause review are important.");
 else if(l!==null&&l>=130)out.push("LDL-C is elevated; treatment target depends on overall cardiovascular risk, not this value alone.");
 if(tg!==null&&tg>=500)out.push("Triglycerides are very high; pancreatitis risk becomes clinically relevant.");
 return out.join("\n");
}
function renderSavedLabPanels(){
 if(!$("savedLabPanels"))return;
 const q=(v("savedLabSearch")||"").toLowerCase();
 const rows=db.labInterpretations.map((x,i)=>({x,i})).filter(({x})=>JSON.stringify(x).toLowerCase().includes(q));
 if(!rows.length){$("savedLabPanels").innerHTML='<p class="muted">No interpreted panels saved yet.</p>';return}
 $("savedLabPanels").innerHTML=rows.map(({x,i})=>{
   const vals=Object.values(x.values||{}),abn=vals.filter(v=>!["Normal","Not assessed"].includes(v.status));
   const chips=vals.filter(v=>v.value!==""&&v.value!=null).slice(0,18).map(v=>`<span class="param-chip ${["Normal"].includes(v.status)?"ok":"abn"}">${v.name}: ${v.value} ${v.unit||""} (${v.status})</span>`).join("");
   return `<div class="saved-panel">
    <div class="saved-panel-head"><div><b>${x.title}</b>${x.smartImported?'<span class="imported-badge">Smart-imported • VERIFY ORIGINAL</span>':''}<small style="display:block;color:var(--muted)">${x.date||""} • ${x.sex||""} • ${x.facility||""} • ${x.referenceTemplate==="omega"?"Omega template":"Generic"}</small></div>
    <div><span class="pill ${abn.length?"red":"green"}">${abn.length} flagged</span> <button class="action-btn edit-btn" onclick="editLabInterpretation(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteLabInterpretation(${i})">Delete</button></div></div>
    <div class="saved-panel-body">${chips||'<span class="muted">No numeric results entered.</span>'}${x.attachment?.name?`<p><b>Attachment:</b> ${x.attachment.name} ${x.attachment.id?`<button class="local-file-action" onclick="openLocalAttachment('${x.attachment.id}')">Open</button><button class="local-file-action" onclick="downloadLocalAttachment('${x.attachment.id}')">Download</button>`:""}</p>`:""}${x.remarks?`<p><b>Remarks:</b> ${x.remarks}</p>`:""}</div>
   </div>`;
 }).join("");
}



const omegaExactRowMap = [
 {panel:"CBC",id:"hb",canonical:"Hemoglobin",labels:["HAEMOGLOBIN","HEMOGLOBIN"]},
 {panel:"CBC",id:"wbc",canonical:"Total WBC",labels:["TOTAL LEUCOCYTE COUNT","TOTAL LEUKOCYTE COUNT"]},
 {panel:"CBC",id:"neut",canonical:"Neutrophils",labels:["NEUTROPHILS"]},
 {panel:"CBC",id:"lymph",canonical:"Lymphocytes",labels:["LYMPHOCYTES"]},
 {panel:"CBC",id:"eos",canonical:"Eosinophils",labels:["EOSINOPHILS"]},
 {panel:"CBC",id:"mono",canonical:"Monocytes",labels:["MONOCYTES"]},
 {panel:"CBC",id:"baso",canonical:"Basophils",labels:["BASOPHILS"]},
 {panel:"CBC",id:"absNeut",canonical:"Absolute Neutrophils",labels:["ABSOLUTE NEUTROPHILS"]},
 {panel:"CBC",id:"absLymph",canonical:"Absolute Lymphocytes",labels:["ABSOLUTE LYMPHOCYTES"]},
 {panel:"CBC",id:"absEos",canonical:"Absolute Eosinophils",labels:["ABSOLUTE EOSINOPHILS"]},
 {panel:"CBC",id:"absMono",canonical:"Absolute Monocytes",labels:["ABSOLUTE MONOCYTES"]},
 {panel:"CBC",id:"absBaso",canonical:"Absolute Basophils",labels:["ABSOLUTE BASOPHILS"]},
 {panel:"CBC",id:"rbc",canonical:"RBC count",labels:["RBC COUNT"]},
 {panel:"CBC",id:"hct",canonical:"Hematocrit / PCV",labels:["HCT","HEMATOCRIT","PCV"]},
 {panel:"CBC",id:"mcv",canonical:"MCV",labels:["MCV"]},
 {panel:"CBC",id:"mch",canonical:"MCH",labels:["MCH"]},
 {panel:"CBC",id:"mchc",canonical:"MCHC",labels:["MCHC"]},
 {panel:"CBC",id:"rdw",canonical:"RDW",labels:["RDW-CV","RDW CV"]},
 {panel:"CBC",id:"rdwsd",canonical:"RDW-SD",labels:["RDW-SD","RDW SD"]},
 {panel:"CBC",id:"plt",canonical:"Platelets",labels:["PLATELET COUNT"]},
 {panel:"CBC",id:"pct",canonical:"Plateletcrit (PCT)",labels:["PCT"]},
 {panel:"CBC",id:"mpv",canonical:"MPV",labels:["MPV"]},
 {panel:"CBC",id:"pdw",canonical:"PDW",labels:["PDW"]},
 {panel:"CBC",id:"plcr",canonical:"P-LCR",labels:["P-LCR","PLCR"]},

 {panel:"LFT",id:"tbili",canonical:"Total Bilirubin",labels:["BILIRUBIN TOTAL","TOTAL BILIRUBIN"]},
 {panel:"LFT",id:"dbili",canonical:"Direct Bilirubin",labels:["BILIRUBIN DIRECT","DIRECT BILIRUBIN"]},
 {panel:"LFT",id:"ibili",canonical:"Indirect Bilirubin",labels:["BILIRUBIN INDIRECT","INDIRECT BILIRUBIN"]},
 {panel:"LFT",id:"alt",canonical:"ALT (SGPT)",labels:["SGPT","ALT"]},
 {panel:"LFT",id:"ast",canonical:"AST (SGOT)",labels:["SGOT","AST"]},
 {panel:"LFT",id:"astalt",canonical:"SGOT/SGPT Ratio",labels:["SGOT/SGPT RATIO","AST/ALT RATIO"]},
 {panel:"LFT",id:"alp",canonical:"ALP",labels:["ALKALINE PHOSPHATASE","ALP"]},
 {panel:"LFT",id:"ggt",canonical:"GGT",labels:["GAMMA GLUTAMYL TRANSFERASE (GGT)","GAMMA GLUTAMYL TRANSFERASE","GGT"]},
 {panel:"LFT",id:"protein",canonical:"Total Protein",labels:["TOTAL PROTEINS","TOTAL PROTEIN"]},
 {panel:"LFT",id:"albumin",canonical:"Albumin",labels:["ALBUMIN"]},
 {panel:"LFT",id:"globulin",canonical:"Globulin",labels:["GLOBULIN"]},
 {panel:"LFT",id:"agratio",canonical:"A:G Ratio",labels:["A : G RATIO","A:G RATIO","A/G RATIO"]},

 {panel:"RFT",id:"urea",canonical:"Urea",labels:["UREA SERUM","SERUM UREA","UREA"]},
 {panel:"RFT",id:"creat",canonical:"Serum Creatinine",labels:["CREATININE SERUM","SERUM CREATININE"]},
 {panel:"RFT",id:"bun",canonical:"BUN",labels:["UREA NITROGEN (BUN)","BLOOD UREA NITROGEN","BUN"]},
 {panel:"RFT",id:"buncr",canonical:"BUN/Creatinine Ratio",labels:["BUN/CREATININE RATIO"]},
 {panel:"RFT",id:"ureacr",canonical:"Urea/Creatinine Ratio",labels:["UREA / CREATININE","UREA/CREATININE"]},
 {panel:"RFT",id:"uric",canonical:"Uric Acid",labels:["SERUM URIC ACID","URIC ACID"]},
 {panel:"RFT",id:"sodium",canonical:"Sodium",labels:["SERUM SODIUM (NA+)","SERUM SODIUM","SODIUM"]},
 {panel:"RFT",id:"potassium",canonical:"Potassium",labels:["SERUM POTASSIUM (K+)","SERUM POTASSIUM","POTASSIUM"]},
 {panel:"RFT",id:"chloride",canonical:"Chloride",labels:["SERUM CHLORIDE (CL-)","SERUM CHLORIDE","CHLORIDE"]},
 {panel:"RFT",id:"egfr",canonical:"eGFR",labels:["ESTIMATED GFR (EGFR)","ESTIMATED GFR","EGFR"]},

 {panel:"DIABETES",id:"hba1c",canonical:"HbA1c",labels:["HBA1C","GLYCATED HEMOGLOBIN"]},
 {panel:"DIABETES",id:"eag",canonical:"Estimated Average Glucose",labels:["ESTIMATED AVERAGE GLUCOSE","EAG"]},

 {panel:"IRON",id:"iron",canonical:"Serum Iron",labels:["SERUM IRON"]},
 {panel:"IRON",id:"tibc",canonical:"Total Iron Binding Capacity",labels:["TOTAL IRON BINDING CAPACITY"]},
 {panel:"IRON",id:"uibc",canonical:"Unsaturated Iron Binding Capacity",labels:["UNSATURATED IRON BINDING CAPACITY"]},
 {panel:"IRON",id:"tsat",canonical:"Transferrin Saturation",labels:["TRANSFERRIN SATURATION"]},

 {panel:"THYROID",id:"t3total",canonical:"Total T3",labels:["T3"]},
 {panel:"THYROID",id:"t4total",canonical:"Total T4",labels:["T4"]},
 {panel:"THYROID",id:"tsh",canonical:"TSH",labels:["TSH(SERUM)","TSH"]},

 {panel:"MICRONUTRIENT",id:"vitd",canonical:"25-OH Vitamin D",labels:["SERUM VITAMIN D3","VITAMIN D3"]},
 {panel:"MICRONUTRIENT",id:"b12",canonical:"Vitamin B12",labels:["VITAMIN B12"]},
 {panel:"BONE",id:"vitd",canonical:"25-OH Vitamin D",labels:["SERUM VITAMIN D3","VITAMIN D3"]},
 {panel:"IRON",id:"b12",canonical:"Vitamin B12",labels:["VITAMIN B12"]}
];

function normRowText(s){
 return String(s||"").replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
}
function normLabel(s){
 return normRowText(s).toUpperCase().replace(/\s*:\s*/g," ").trim();
}

function getExactRuleForRow(rowText){
 const row=normLabel(rowText);
 let candidates=[];
 omegaExactRowMap.forEach(rule=>{
   rule.labels.forEach(label=>{
     const L=normLabel(label);
     if(row===L || row.startsWith(L+" ") || row.startsWith(L+"\t")) candidates.push({rule,label:L});
   });
 });
 candidates.sort((a,b)=>b.label.length-a.label.length);
 return candidates[0]?.rule||null;
}

function parseFirstResultAfterLabel(rowText,rule){
 const raw=normRowText(rowText);
 const upper=raw.toUpperCase();
 let bestLabel="";
 for(const lbl of rule.labels){
   const L=normLabel(lbl);
   if(upper.startsWith(L) && L.length>bestLabel.length)bestLabel=L;
 }
 if(!bestLabel)return null;
 let rest=raw.slice(bestLabel.length).trim();

 // Remove a standalone flag only after a numeric result, not before.
 const valueMatch=rest.match(/^([<>]?\s*-?\d+(?:\.\d+)?|ABSENT|NEGATIVE|NILL|NIL|CLEAR|PALE YELLOW|NO GROWTH)\b/i);
 if(!valueMatch)return null;
 const value=valueMatch[1].replace(/\s/g,"");
 rest=rest.slice(valueMatch[0].length).trim();

 let flag="";
 const flagMatch=rest.match(/^(H|L|HIGH|LOW)\b/i);
 if(flagMatch){flag=flagMatch[1].toUpperCase();rest=rest.slice(flagMatch[0].length).trim()}

 // Extract a simple range only if it occurs immediately after the result/flag.
 let refText="";
 const rangeMatch=rest.match(/^([<>]=?\s*-?\d+(?:\.\d+)?|>?\s*-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
 if(rangeMatch){
   refText=`${rangeMatch[1].replace(/\s/g,"")}-${rangeMatch[2]}`;
 } else {
   const minMatch=rest.match(/^>\s*(\d+(?:\.\d+)?)/);
   if(minMatch)refText=`>${minMatch[1]}`;
 }

 return {value,flag,refText,rest};
}

async function extractPdfRows(file){
 if(!window.pdfjsLib)throw new Error("PDF reader library did not load.");
 pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
 const buf=await file.arrayBuffer();
 const pdf=await pdfjsLib.getDocument({data:buf}).promise;
 const all=[];
 for(let pno=1;pno<=pdf.numPages;pno++){
   const page=await pdf.getPage(pno);
   const content=await page.getTextContent();
   const items=content.items.map(it=>({
     text:it.str||"",
     x:it.transform?.[4]||0,
     y:it.transform?.[5]||0,
     w:it.width||0
   })).filter(x=>x.text.trim());
   items.sort((a,b)=>Math.abs(b.y-a.y)>2?b.y-a.y:a.x-b.x);
   const rows=[];
   for(const item of items){
     let row=rows.find(r=>Math.abs(r.y-item.y)<=2.2);
     if(!row){row={y:item.y,items:[]};rows.push(row)}
     row.items.push(item);
   }
   rows.sort((a,b)=>b.y-a.y);
   rows.forEach(r=>{
     r.items.sort((a,b)=>a.x-b.x);
     const text=r.items.map(x=>x.text.trim()).filter(Boolean).join(" ");
     all.push({page:pno,y:r.y,text:normRowText(text),items:r.items});
   });
 }
 return all;
}

function parseOmegaExactRows(rows,sex){
 const results=[];
 for(const row of rows){
   const rule=getExactRuleForRow(row.text);
   if(!rule)continue;
   const parsed=parseFirstResultAfterLabel(row.text,rule);
   if(!parsed)continue;

   // Reject obvious impossible row collisions.
   const numeric=Number(parsed.value);
   if(Number.isFinite(numeric)){
     if(rule.id==="hb" && (numeric<3 || numeric>25))continue;
     if(rule.id==="creat" && (numeric<0.1 || numeric>25))continue;
     if(rule.id==="ast" && numeric>5000)continue;
     if(rule.id==="alt" && numeric>5000)continue;
   }

   const p=labPanels[rule.panel]?.params.find(x=>x.id===rule.id);
   if(!p)continue;
   const oldPanel=currentLabPanel;currentLabPanel=rule.panel;
   const omega=omegaRefFor(rule.panel,p,sex);
   currentLabPanel=oldPanel;

   // Prefer sex-specific Omega template for known complex ranges; use extracted simple row range otherwise.
   let ref=parsed.refText || omega?.text || "Lab-specific";
   if(rule.id==="alp" && omega?.text)ref=omega.text;
   if(rule.id==="hb" && omega?.text)ref=omega.text;
   if(rule.id==="rbc" && omega?.text)ref=omega.text;
   if(rule.id==="hct" && omega?.text)ref=omega.text;

   results.push({
     panel:rule.panel,id:rule.id,canonical:rule.canonical,
     value:parsed.value,flag:parsed.flag,ref,
     unit:omega?.unit||p.unit||"",
     page:row.page,sourceRow:row.text,
     confidence:0.99,parser:"Omega exact row"
   });
 }
 return results;
}

function resultsToSmartMap(results){
 smartImportMapped={};
 results.forEach(r=>smartImportMapped[r.canonical]=r.value);
 return smartImportMapped;
}

function findPrecisionResult(panelKey,paramId){
 return precisionImportRows.find(r=>r.panel===panelKey&&r.id===paramId)||null;
}

function statusFromExplicitRef(value,ref,p,sex){
 const num=Number(value);
 if(Number.isNaN(num))return autoStatus(value,p,sex);
 const m=String(ref||"").match(/(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)/);
 if(m){
   const lo=Number(m[1]),hi=Number(m[2]);
   if(lo>hi)return "Not assessed";
   if(num<lo){const d=(lo-num)/(Math.abs(lo)||1);return d<=0.10?"Borderline low":"Low"}
   if(num>hi){const d=(num-hi)/(Math.abs(hi)||1);return d<=0.10?"Borderline high":"High"}
   return "Normal";
 }
 const gt=String(ref||"").match(/>\s*(\d+(?:\.\d+)?)/);
 if(gt)return num>Number(gt[1])?"Normal":"Low";
 return autoStatus(value,p,sex);
}

function renderImportAudit(){
 if(!$("importAuditTable"))return;
 const panelRows=precisionImportRows.filter(r=>r.panel===currentLabPanel);
 if(!panelRows.length){
   $("importAuditSummary").textContent="No exact-row import audit available for this panel.";
   $("importAuditTable").innerHTML="";
   return;
 }
 const low=panelRows.filter(r=>r.confidence<0.95).length;
 $("importAuditSummary").textContent=`${panelRows.length} row(s) imported with exact page-row matching. ${low} lower-confidence row(s). Compare the Source PDF Row before marking Verified.`;
 $("importAuditTable").innerHTML=`<div style="overflow:auto"><table><thead><tr><th>Test</th><th>Imported</th><th>Reference</th><th>Page</th><th>Confidence</th><th>Source PDF row</th></tr></thead><tbody>${
   panelRows.map(r=>`<tr><td><b>${r.canonical}</b></td><td>${r.value}</td><td>${r.ref||""}</td><td>${r.page}</td><td class="${r.confidence>=.98?"conf-high":r.confidence>=.9?"conf-medium":"conf-low"}">${Math.round(r.confidence*100)}%</td><td class="audit-row-source">${r.sourceRow}</td></tr>`).join("")
 }</tbody></table></div>`;
}

let smartImportMapped={};
const testAliases={
 "Hemoglobin":["hemoglobin","haemoglobin","hb"],
 "RBC count":["rbc count","total rbc","rbc"],
 "Hematocrit / PCV":["hematocrit","haematocrit","pcv","hct"],
 "MCV":["mcv"],"MCH":["mch"],"MCHC":["mchc"],"RDW":["rdw","rdw-cv"],
 "Total WBC":["total wbc","wbc count","tlc","total leukocyte count","total leucocyte count"],
 "Neutrophils":["neutrophils","neutrophil"],"Lymphocytes":["lymphocytes","lymphocyte"],
 "Eosinophils":["eosinophils","eosinophil"],"Monocytes":["monocytes","monocyte"],
 "Platelets":["platelet count","platelets"],
 "Total Bilirubin":["total bilirubin","bilirubin total"],
 "Direct Bilirubin":["direct bilirubin","bilirubin direct"],
 "AST (SGOT)":["ast","sgot"],"ALT (SGPT)":["alt","sgpt"],"ALP":["alkaline phosphatase","alp"],"GGT":["ggt","gamma gt"],
 "Albumin":["albumin"],"Total Protein":["total protein"],
 "Serum Creatinine":["serum creatinine","creatinine"],"eGFR":["egfr","estimated gfr"],
 "Urea":["urea"],"BUN":["bun","blood urea nitrogen"],"Uric Acid":["uric acid"],
 "Sodium":["sodium"],"Potassium":["potassium"],"Urine Albumin/Creatinine Ratio":["uacr","albumin creatinine ratio","acr"],
 "Fasting Plasma Glucose":["fasting plasma glucose","fasting blood sugar","fbs","fasting glucose"],
 "2-hour Postprandial Glucose":["ppbs","postprandial glucose","post prandial blood sugar"],
 "HbA1c":["hba1c","glycated hemoglobin","glycosylated hemoglobin"],
 "Total Cholesterol":["total cholesterol","cholesterol total"],"LDL-C":["ldl","ldl cholesterol"],
 "HDL-C":["hdl","hdl cholesterol"],"Triglycerides":["triglycerides","tg"],"Non-HDL-C":["non hdl","non-hdl"],
 "TSH":["tsh","thyroid stimulating hormone"],"Free T4":["free t4","ft4"],"Free T3":["free t3","ft3"],"Anti-TPO Antibody":["anti tpo","anti-tpo","tpo antibody"],
 "Ferritin":["ferritin"],"Vitamin B12":["vitamin b12","b12"],"Folate":["folate","folic acid"],
 "25-OH Vitamin D":["25-oh vitamin d","vitamin d","25 hydroxy vitamin d"],"Calcium":["calcium"],"Phosphorus":["phosphorus","phosphate"],
 "CRP":["crp","c reactive protein"],"ESR":["esr","erythrocyte sedimentation rate"],
 "Rheumatoid Factor":["rheumatoid factor","ra factor","rf"],"Anti-CCP Antibody":["anti ccp","anti-ccp","ccp antibody"],
 "FSH":["fsh","follicle stimulating hormone"],"LH":["lh","luteinizing hormone"],"Estradiol (E2)":["estradiol","e2"],
 "Progesterone":["progesterone"],"Prolactin":["prolactin"],"AMH":["amh","anti mullerian hormone","anti-mullerian hormone"],
 "Total Testosterone":["total testosterone","testosterone total"],"Free Testosterone":["free testosterone"],
 "DHEA-S":["dheas","dhea-s"],"SHBG":["shbg","sex hormone binding globulin"],
 "Morning Cortisol":["cortisol"],"ACTH":["acth"],
 "High-sensitivity Troponin":["troponin","hs troponin","high sensitivity troponin"],"CK-MB":["ck-mb","ckmb"],
 "BNP":["bnp"],"NT-proBNP":["nt-probnp","nt probnp"],
 "PT":["prothrombin time"," pt "],"INR":["inr"],"aPTT":["aptt","a ptt"],"D-dimer":["d-dimer","d dimer"],"Fibrinogen":["fibrinogen"],
 "Amylase":["amylase"],"Lipase":["lipase"],"PSA":["psa","prostate specific antigen"]
};

Object.assign(testAliases,{
"Serum Iron":["serum iron","iron serum"],
"Total Iron Binding Capacity":["total iron binding capacity","tibc"],
"Basophils":["basophils"],"Absolute Neutrophils":["absolute neutrophils"],"Absolute Lymphocytes":["absolute lymphocytes"],"Absolute Eosinophils":["absolute eosinophils"],"Absolute Monocytes":["absolute monocytes"],"Absolute Basophils":["absolute basophils"],"RDW-SD":["rdw-sd","rdw sd"],"Plateletcrit (PCT)":["plateletcrit","pct"],"MPV":["mpv"],"PDW":["pdw"],"P-LCR":["p-lcr","plcr"],"P-LCC":["p-lcc","plcc"],"Estimated Average Glucose":["estimated average glucose"],"Indirect Bilirubin":["bilirubin indirect","indirect bilirubin"],"SGOT/SGPT Ratio":["sgot/sgpt ratio","ast/alt ratio"],"Globulin":["globulin"],"A:G Ratio":["a : g ratio","a:g ratio","a/g ratio"],"Unsaturated Iron Binding Capacity":["unsaturated iron binding capacity","uibc"],"Transferrin Saturation":["transferrin saturation"],"BUN/Creatinine Ratio":["bun/creatinine ratio","bun/creatnine ratio"],"Urea/Creatinine Ratio":["urea / creatinine","urea/creatinine"],"Chloride":["serum chloride","chloride"],"VLDL-C":["vldl cholesterol","vldl"],"Cholesterol/HDL Ratio":["cholesterol/hdl ratio"],"LDL/HDL Ratio":["ldl/hdl ratio"],"Total T3":["t3"],"Total T4":["t4"],"Urine RBC":["rbc nill","rbc nil","urine rbc"],"Epithelial Cells":["epithelial cell","epithelial cells"],"Casts":["cast"],"Crystals":["crystal"],"Bacteria":["bacteria"]});
function normalizeReportText(t){return (t||"").replace(/\r/g,"\n").replace(/[ \t]+/g," ").replace(/\n{2,}/g,"\n")}
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function mapReportText(text){
 smartImportMapped={};
 const normalized=normalizeReportText(text);
 Object.entries(testAliases).forEach(([canonical,aliases])=>{
   let best=null;
   for(const alias of aliases){
     const patterns=[
       new RegExp(`${escapeRegex(alias)}\\s*[:\\-]?\\s*([<>]?\\s*\\d+(?:\\.\\d+)?)`,"i"),
       new RegExp(`${escapeRegex(alias)}[^\\d\\n]{0,25}([<>]?\\s*\\d+(?:\\.\\d+)?)`,"i")
     ];
     for(const re of patterns){
       const m=normalized.match(re);
       if(m){best=m[1].replace(/\\s/g,"");break}
     }
     if(best!==null)break;
   }
   if(best!==null)smartImportMapped[canonical]=best;
 });
 renderSmartImportMatches();
 return smartImportMapped;
}
function renderSmartImportMatches(){
 if(!$("smartImportMatches"))return;
 const arr=Object.entries(smartImportMapped);
 $("smartImportMatches").innerHTML=arr.length?arr.map(([k,val])=>`<div class="match-row"><b>${k}</b><span>${val}</span><span>Recognized</span><span>Verify</span></div>`).join(""):"No known tests mapped yet.";
}
async function extractPdfText(file){
 if(!window.pdfjsLib)throw new Error("PDF reader library did not load. Check internet and retry.");
 pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
 const buf=await file.arrayBuffer(),pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";
 for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),content=await page.getTextContent();text+=content.items.map(x=>x.str).join(" ")+"\\n";}
 return text;
}
async function extractImageText(file){
 if(!window.Tesseract)throw new Error("OCR library did not load. Check internet and retry.");
 const result=await Tesseract.recognize(file,"eng",{logger:m=>{if($("smartImportProgress")&&m.status)$("smartImportProgress").textContent=`OCR: ${m.status} ${m.progress?Math.round(m.progress*100)+"%":""}`}});
 return result.data.text||"";
}

function buildPanelValuesFromSmart(panelKey){
 const panel=labPanels[panelKey];
 const sex=v("liSex")||db.profile?.sex||"Male";
 const values={};
 let count=0;
 const oldPanel=currentLabPanel;
 currentLabPanel=panelKey;
 panel.params.forEach(p=>{
   const exact=findPrecisionResult(panelKey,p.id);
   const val=exact?.value ?? smartImportMapped[p.name] ?? "";
   if(val!=="")count++;
   const om=omegaRefFor(panelKey,p,sex);
   const ref=exact?.ref || refRangeFor(p,sex);
   const status=val!=="" ? statusFromExplicitRef(val,ref,p,sex) : "Not assessed";
   values[p.id]={
     name:p.name,
     unit:exact?.unit||om?.unit||p.unit||"",
     value:val,
     ref,
     status,
     remark:val!==""?"Smart-imported; verify with original report.":"",
     meaning:p.meaning,
     referenceSource:exact?`Original PDF row • page ${exact.page}`:((v("liLabTemplate")==="generic")?"Generic adult example":"Omega Diagnostics sample-derived"),
     imported:val!=="",
     parser:exact?.parser||"fallback",
     confidence:exact?.confidence||0.60,
     sourceRow:exact?.sourceRow||"",
     sourcePage:exact?.page||null,
     verification:"Unverified"
   };
 });
 currentLabPanel=oldPanel;
 return {values,count};
}
function saveSmartDraftsWithAttachment(){
 const matches=[];
 Object.entries(labPanels).forEach(([panelKey,panel])=>{
   const built=buildPanelValuesFromSmart(panelKey);
   if(built.count>0)matches.push({panelKey,panel,values:built.values,count:built.count});
 });
 if(!matches.length)return [];
 const attachment=pendingFiles.li||null;
 matches.forEach(m=>{
   const patient=currentPatientInfo();
   const record={
     panel:m.panelKey,title:m.panel.title,system:m.panel.system,date:v("liDate")||today(),
     sex:v("liSex")||db.profile?.sex||"Male",
     facility:v("liFacility")||"OMEGA LAB",
     context:"Smart imported full report — VERIFY",
     remarks:"Smart-imported; verify with original report. Verify every value, unit and reference range before clinical use.",
     referenceTemplate:v("liLabTemplate")||"omega",
     smartImported:true,
     attachment,patient,patientKey:patient.key,
     values:m.values
   };
   const duplicate=db.labInterpretations.findIndex(x=>x.smartImported===true && x.date===record.date && x.panel===record.panel && x.attachment?.name===record.attachment?.name);
   if(duplicate>=0)db.labInterpretations[duplicate]=record;
   else db.labInterpretations.unshift(record);
 });
 persist();
 return matches;
}

function autoFillPatientFromReportText(text){
 const t=String(text||"").replace(/\s+/g," ");
 const age=t.match(/Age\/Gender\s*[:\-]\s*(\d{1,3})\s*Year\s*\/\s*(Male|Female)/i);
 const phone=t.match(/Phone No\.?\s*[:\-]\s*(\d{10,12})/i);
 const pid=t.match(/Patient ID\s*[:\-]\s*([A-Za-z0-9_-]+)/i);
 const name=t.match(/Name\s*[:\-]\s*(?:Mrs\.|Mr\.|Ms\.|Dr\.)?\s*([A-Za-z .]+?)(?=\s+Age\/Gender)/i);
 if(name&&$("liPatientName")&&!v("liPatientName"))$("liPatientName").value=name[1].trim();
 if(age){if($("liPatientAge")&&!v("liPatientAge"))$("liPatientAge").value=age[1];if($("liSex"))$("liSex").value=age[2]}
 if(phone&&$("liPatientMobile")&&!v("liPatientMobile"))$("liPatientMobile").value=phone[1];
 if(pid&&$("liPatientId")&&!v("liPatientId"))$("liPatientId").value=pid[1];
}
async function analyzeAttachedLabReport(){
 const status=$("liAnalyzeStatus");
 const file=lastLabUploadFile || $("liFile")?.files?.[0] || $("liCamera")?.files?.[0];
 if(!file){if(status)status.textContent="Please choose a PDF/image first.";return}
 autoSelectOmegaTemplate();
 if($("liSearch"))$("liSearch").value="";
 const mode=v("liImportMode")||"omega-exact";
 if(status)status.textContent=`Reading ${file.name} using ${mode}...`;
 try{
   let text="";
   precisionImportRows=[];
   precisionImportAudit=[];

   if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){
     if(mode==="omega-exact"||mode==="generic-row"){
       const rows=await extractPdfRows(file);
       precisionImportRows=parseOmegaExactRows(rows,v("liSex")||db.profile?.sex||"Male");
       resultsToSmartMap(precisionImportRows);
       text=rows.map(r=>`[p${r.page}] ${r.text}`).join("\n");
     } else {
       text=await extractPdfText(file);
       mapReportText(text);
     }
   } else {
     text=await extractImageText(file);
     // OCR remains lower-confidence; never call it exact.
     mapReportText(text);
   }

   if($("smartImportText"))$("smartImportText").value=normalizeReportText(text);
   autoFillPatientFromReportText(text);
   if(!Object.keys(smartImportMapped).length && mode!=="legacy-fuzzy"){
     // Controlled fallback, clearly lower confidence.
     mapReportText(text);
   }

   activeImportedAttachmentName=pendingFiles.li?.name||file.name||"";
   activeImportedDate=v("liDate")||today();
   const matches=saveSmartDraftsWithAttachment();
   if(!matches.length){
     if(status)status.textContent="Report was read, but no known test rows were mapped. Do not use the result clinically; review the extracted text or tune the lab template.";
     return;
   }
   matches.sort((a,b)=>b.count-a.count);
   const best=matches[0];
   currentLabPanel=best.panelKey;
   renderLabPanelButtons();
   const draft=getImportedDraftForPanel(best.panelKey);
   renderLabParameters(draft?.values||best.values);
   generateCurrentPanelSummary();
   renderImportAudit();
   renderSavedLabPanels();
   safeGenerateFullBodySummary();

   const exactCount=precisionImportRows.length;
   if(status)status.textContent=`✓ ${exactCount||Object.keys(smartImportMapped).length} test row(s) mapped; ${matches.length} panel(s) created. Exact-row parser minimizes cross-row number capture. VERIFY every imported result before diagnosis.`;
   if($("liSaveStatus"))$("liSaveStatus").textContent="Smart-imported; verify with original report.";
 }catch(e){
   console.error(e);
   if(status)status.textContent=`Analysis failed: ${e.message}`;
 }
}
async function runSmartImport(){
 const file=$("smartReportFile")?.files?.[0];
 if(!file){$("smartImportProgress").textContent="Choose a PDF/image first.";return}
 $("smartImportProgress").textContent=`Reading ${file.name}...`;
 try{
   let text="";
   if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf"))text=await extractPdfText(file);
   else text=await extractImageText(file);
   $("smartImportText").value=normalizeReportText(text);
   const mapped=mapReportText(text);
   $("smartImportProgress").textContent=`Finished. ${Object.keys(mapped).length} known test value(s) recognized. Review before applying.`;
 }catch(e){$("smartImportProgress").textContent=`Import failed: ${e.message}. You can paste report text manually and use Map pasted text.`}
}
function mapPastedReportText(){
 const text=v("smartImportText");const mapped=mapReportText(text);
 $("smartImportProgress").textContent=`Mapped ${Object.keys(mapped).length} known test value(s) from text.`;
}
function applySmartImportToPanels(){
 const matches=[];
 Object.entries(labPanels).forEach(([panelKey,panel])=>{
   const found={};
   panel.params.forEach(p=>{
     const val=smartImportMapped[p.name];
     if(val!==undefined)found[p.id]=val;
   });
   if(Object.keys(found).length)matches.push({panelKey,found});
 });
 if(!matches.length){$("smartImportProgress").textContent="No mapped values matched panel slots.";return}
 // Save as draft panel records so all profiles are available without retyping
 matches.forEach(({panelKey,found})=>{
   const panel=labPanels[panelKey],values={};
   panel.params.forEach(p=>{
     const val=found[p.id]??"";
     const oldPanel=currentLabPanel;currentLabPanel=panelKey;const om=omegaRefFor(panelKey,p,v("liSex")||db.profile.sex||"Male");values[p.id]={name:p.name,unit:om?.unit||p.unit,value:val,ref:refRangeFor(p,v("liSex")||db.profile.sex||"Male"),status:autoStatus(val,p,v("liSex")||db.profile.sex||"Male"),remark:val!==""?"Smart-imported; verify with original report.":"",meaning:p.meaning,referenceSource:"Omega Diagnostics sample-derived",imported:val!==""};currentLabPanel=oldPanel;
   });
   db.labInterpretations.unshift({panel:panelKey,title:panel.title,system:panel.system,date:v("liDate")||today(),sex:v("liSex")||db.profile.sex||"Male",facility:v("liFacility")||"",context:"Smart imported full report — VERIFY",remarks:"Smart-imported; verify with original report. Auto-mapped from uploaded/pasted report. Verify every value, unit and reference range before clinical use.",referenceTemplate:"omega",smartImported:true,attachment:null,values});
 });
 persist();
 $("smartImportProgress").textContent=`Applied recognized values into ${matches.length} panel draft(s). Open Saved Diagnostic Panels and verify each entry.`;
}
function clearSmartImport(){
 if($("smartReportFile"))$("smartReportFile").value="";
 if($("smartImportText"))$("smartImportText").value="";
 smartImportMapped={};renderSmartImportMatches();
 if($("smartImportProgress"))$("smartImportProgress").textContent="No report selected.";
}

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
const systemPanelMap={"Cardiovascular":"LIPID","Metabolic & Diabetes":"DIABETES","Kidney & Uric Acid":"RFT","Liver & Gallbladder":"LFT","Bone Health":"BONE","Thyroid & Endocrine":"THYROID"};
$("systemGrid").innerHTML=systems.map(s=>`<article class="card systemcard"><h3>${s[0]}</h3><p>${s[1]}</p><span class="mini">Track via Today • Labs • Imaging • Medicines • Timeline</span>${systemPanelMap[s[0]]?`<button class="ghost" style="margin-top:10px;position:relative;z-index:3" onclick="showView('labcentre');selectLabPanel('${systemPanelMap[s[0]]}')">Open ${systemPanelMap[s[0]]} tests →</button>`:""}</article>`).join("");

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
let pendingFiles={};
let lastLabUploadFile=null;
let activeImportedAttachmentName="";
let activeImportedDate="";
let precisionImportRows=[];
let precisionImportAudit=[];

const FILE_DB_NAME="raj_health_360_files";
const FILE_STORE="attachments";
const ATTACHMENT_DB_NAME="RAJ_HEALTH_360_ATTACHMENT_VAULT_V2";
const REPORT_STORE="lab_reports";
const REPORT_DB_NAME="RAJ_HEALTH_360_REPORT_ARCHIVE_V1";
function openFileDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(ATTACHMENT_DB_NAME,1);
  req.onupgradeneeded=()=>{
   const d=req.result;
   if(!d.objectStoreNames.contains(FILE_STORE))d.createObjectStore(FILE_STORE,{keyPath:"id"});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error("Attachment vault could not open"));
  req.onblocked=()=>reject(new Error("Attachment vault blocked. Close duplicate RAJ HEALTH 360 tabs and retry."));
 });
}
async function saveBlobToLocalVault(file){
 if(!file)throw new Error("No file selected");
 const id=`att_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
 const dbi=await openFileDB();
 try{
  const rec={id,name:file.name,type:file.type||"application/octet-stream",size:file.size,created:new Date().toISOString(),blob:file};
  await new Promise((resolve,reject)=>{
   const tx=dbi.transaction(FILE_STORE,"readwrite");
   tx.objectStore(FILE_STORE).put(rec);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("Attachment write failed"));tx.onabort=()=>reject(tx.error||new Error("Attachment write aborted"));
  });
  const verify=await new Promise((resolve,reject)=>{
   const r=dbi.transaction(FILE_STORE,"readonly").objectStore(FILE_STORE).get(id);
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  if(!verify?.blob)throw new Error("Attachment verification failed");
  return {id,name:rec.name,type:rec.type,size:rec.size,created:rec.created,stored:true};
 }finally{dbi.close()}
}
async function getLocalAttachment(id){const dbi=await openFileDB();const rec=await new Promise((resolve,reject)=>{const r=dbi.transaction(FILE_STORE,"readonly").objectStore(FILE_STORE).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});dbi.close();return rec}

function openReportDB(){
 return new Promise((resolve,reject)=>{
   const req=indexedDB.open(REPORT_DB_NAME,1);
   req.onupgradeneeded=()=>{
     const dbi=req.result;
     if(!dbi.objectStoreNames.contains(REPORT_STORE)){
       const store=dbi.createObjectStore(REPORT_STORE,{keyPath:"id"});
       store.createIndex("patientKey","patientKey",{unique:false});
       store.createIndex("date","date",{unique:false});
       store.createIndex("type","type",{unique:false});
     }
   };
   req.onsuccess=()=>{
     const dbi=req.result;
     if(!dbi.objectStoreNames.contains(REPORT_STORE)){
       dbi.close();reject(new Error("Report store was not created. Please close other tabs and retry."));
       return;
     }
     resolve(dbi);
   };
   req.onerror=()=>reject(req.error||new Error("Report archive database could not open"));
   req.onblocked=()=>reject(new Error("Report archive database is blocked by another open RAJ HEALTH 360 tab. Close duplicate tabs and retry."));
 });
}
async function putReportRecord(record){
 const dbi=await openReportDB();
 try{
   await new Promise((resolve,reject)=>{
     const tx=dbi.transaction(REPORT_STORE,"readwrite");
     const req=tx.objectStore(REPORT_STORE).put(record);
     req.onerror=()=>reject(req.error||new Error("Report record could not be written"));
     tx.oncomplete=()=>resolve();
     tx.onerror=()=>reject(tx.error||new Error("Report save transaction failed"));
     tx.onabort=()=>reject(tx.error||new Error("Report save transaction was aborted"));
   });
   // verify write immediately
   const verify=await new Promise((resolve,reject)=>{
     const tx=dbi.transaction(REPORT_STORE,"readonly");
     const req=tx.objectStore(REPORT_STORE).get(record.id);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   if(!verify)throw new Error("Save verification failed: record was not found after write.");
   return verify;
 } finally {dbi.close()}
}
async function getReportRecord(id){
 const dbi=await openReportDB();
 try{
   return await new Promise((resolve,reject)=>{
     const r=dbi.transaction(REPORT_STORE,"readonly").objectStore(REPORT_STORE).get(id);
     r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
 } finally {dbi.close()}
}
async function getAllReportRecords(){
 const dbi=await openReportDB();
 try{
   return await new Promise((resolve,reject)=>{
     const r=dbi.transaction(REPORT_STORE,"readonly").objectStore(REPORT_STORE).getAll();
     r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
   });
 } finally {dbi.close()}
}
async function deleteReportRecord(id){
 const dbi=await openReportDB();
 try{
   await new Promise((resolve,reject)=>{
     const tx=dbi.transaction(REPORT_STORE,"readwrite");
     tx.objectStore(REPORT_STORE).delete(id);
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });
 } finally {dbi.close()}
}
async function checkAttachmentStorageHealth(){
 const el=$("attachmentStorageHealth");
 try{
  if(el)el.textContent="Testing original-file attachment vault…";
  const f=new File([new Blob(["test"],{type:"text/plain"})],"healthcheck.txt",{type:"text/plain"});
  const meta=await saveBlobToLocalVault(f);
  const rec=await getLocalAttachment(meta.id);
  if(!rec?.blob)throw new Error("Read-back verification failed");
  if(el){el.textContent="✓ Original PDF/Image attachment vault is working.";el.className="summary-box archive-status-ok"}
  return true;
 }catch(e){
  if(el){el.textContent="✕ Attachment vault not available: "+e.message;el.className="summary-box archive-status-error"}
  return false;
 }
}
async function checkReportStorageHealth(){
 const el=$("reportStorageHealth");if(el)el.textContent="Testing report archive…";
 try{
   const test={id:"__healthcheck__",type:"test",date:today(),patientKey:"test",created:new Date().toISOString()};
   await putReportRecord(test);
   await deleteReportRecord(test.id);
   if(el){el.textContent="✓ Report archive storage is working. Interpreted panels and full-body reports can be saved on this device.";el.className="summary-box archive-status-ok"}
   return true;
 }catch(e){
   console.error("Storage health check failed",e);
   if(el){el.textContent="✕ Report archive storage is not available: "+e.message+" Use Emergency Save JSON and close duplicate app tabs before retrying.";el.className="summary-box archive-status-error"}
   return false;
 }
}

function buildCurrentReportSnapshot(){
 const patient=currentPatientInfo();
 const currentValues=collectCurrentPanelValues();
 const panels={};
 (db.labInterpretations||[]).filter(x=>x.date===(v("liDate")||today())).forEach(x=>{if(x.panel)panels[x.panel]=x});
 panels[currentLabPanel]={
   panel:currentLabPanel,title:labPanels[currentLabPanel]?.title||currentLabPanel,
   system:labPanels[currentLabPanel]?.system||"",date:v("liDate")||today(),
   sex:v("liSex"),facility:v("liFacility"),context:v("liContext"),remarks:v("liRemarks"),
   patient,patientKey:patient.key,attachment:pendingFiles.li||null,values:currentValues
 };
 return {
   format:"RAJ_HEALTH_360_EMERGENCY_REPORT_BACKUP",
   appVersion:APP_VERSION,created:new Date().toISOString(),
   patient,date:v("liDate")||today(),facility:v("liFacility"),attachment:pendingFiles.li||null,
   currentPanel:currentLabPanel,panels
 };
}
function emergencySaveCurrentReport(reason="manual"){
 const snapshot=buildCurrentReportSnapshot();snapshot.reason=reason;
 const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:"application/json"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 const safe=(snapshot.patient.name||snapshot.patient.patientId||"PATIENT").replace(/[^a-z0-9_-]+/gi,"_");
 a.download=`RAJ_HEALTH_EMERGENCY_${safe}_${snapshot.date}_${Date.now()}.json`;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
 const s=$("archiveSaveStatus");if(s){s.textContent="✓ Emergency JSON saved. Your interpreted data has a recoverable backup.";s.className="archive-status-ok"}
 return snapshot;
}

async function downloadLocalAttachment(id){
 try{
  const rec=await getLocalAttachment(id);
  if(!rec?.blob){alert("Original report not found in attachment vault.");return}
  const url=URL.createObjectURL(rec.blob);
  const a=document.createElement("a");a.href=url;a.download=rec.name||"original_report";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 }catch(e){alert("Unable to download original report: "+e.message)}
}
function currentPatientInfo(){
 const name=(v("liPatientName")||"").trim();
 const patientId=(v("liPatientId")||"").trim();
 const mobile=(v("liPatientMobile")||"").trim();
 const age=v("liPatientAge")||"";
 const sex=v("liSex")||"";
 const source=patientId||mobile||name||`unassigned_${v("liDate")||today()}`;
 const key=source.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
 return {name,patientId,mobile,age,sex,key};
}
function validatePatientForArchive(){
 const p=currentPatientInfo();
 if(!p.name&&!p.patientId&&!p.mobile){
  if(!confirm("Patient identity is blank. Enter Patient Name, ID/UHID or Mobile for follow-up. Save as Unassigned anyway?"))return null;
 }
 return p;
}
function makeReportId(prefix="rpt"){
 return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}
function lightweightArchiveIndex(record){
 return {id:record.id,type:record.type,date:record.date,patientKey:record.patientKey,patientName:record.patient?.name||"",title:record.title||"",panel:record.panel||"",created:record.created};
}
function updateLocalReportIndex(record){
 db.reportArchiveIndex=db.reportArchiveIndex||[];
 const lite=lightweightArchiveIndex(record);
 const i=db.reportArchiveIndex.findIndex(x=>x.id===lite.id);
 if(i>=0)db.reportArchiveIndex[i]=lite; else db.reportArchiveIndex.unshift(lite);
 // keep only lightweight metadata in localStorage
 try{localStorage.setItem(KEY,JSON.stringify(db))}
 catch(e){
   // As recovery, trim old interpreted panel payloads from localStorage, not IndexedDB.
   console.warn("localStorage full; trimming duplicate labInterpretations cache",e);
   db.labInterpretations=(db.labInterpretations||[]).slice(0,20).map(x=>({
     panel:x.panel,title:x.title,system:x.system,date:x.date,sex:x.sex,facility:x.facility,
     patient:x.patient||null,attachment:x.attachment||null,referenceTemplate:x.referenceTemplate||"omega",
     smartImported:x.smartImported||false,values:x.values||{}
   }));
   try{localStorage.setItem(KEY,JSON.stringify(db))}catch(_){}
 }
}

async function openLocalAttachment(id){try{const rec=await getLocalAttachment(id);if(!rec){alert("Attachment not found on this device.");return}const url=URL.createObjectURL(rec.blob);window.open(url,"_blank");setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){console.error(e);alert("Unable to open attachment.")}}
async function downloadLocalAttachment(id){try{const rec=await getLocalAttachment(id);if(!rec){alert("Attachment not found on this device.");return}const url=URL.createObjectURL(rec.blob),a=document.createElement("a");a.href=url;a.download=rec.name||"attachment";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){console.error(e);alert("Unable to download attachment.")}}

function calcSleepDuration(){
 const s=v("tdSleepStart"),e=v("tdSleepEnd"); if(!s||!e)return;
 let [sh,sm]=s.split(":").map(Number),[eh,em]=e.split(":").map(Number);
 let mins=(eh*60+em)-(sh*60+sm); if(mins<0)mins+=1440;
 $("tdSleep").value=(mins/60).toFixed(1);
}
["tdSleepStart","tdSleepEnd"].forEach(id=>$(id).addEventListener("change",calcSleepDuration));

function autoSelectOmegaTemplate(){
 if(!$("liLabTemplate")||!$("liFacility"))return;
 if((v("liFacility")||"").toLowerCase().includes("omega"))$("liLabTemplate").value="omega";
}
async function fileMetaFromInput(id,key){
 const f=$(id)?.files?.[0]; if(!f)return;
 if(key==="li")lastLabUploadFile=f;
 pendingFiles[key]={name:f.name,type:f.type,size:f.size,id:null,localStored:false};
 const label={td:"tdFileName",ayu:"ayuFileName",lab:"labFileName",img:"imgFileName",med:"medFileName",tx:"txFileName",vl:"vlFileName",li:"liFileName"}[key];
 try{
   if(label&&$(label))$(label).textContent=`Saving ${f.name} locally...`;
   const meta=await saveBlobToLocalVault(f);pendingFiles[key]=meta;
   if(label&&$(label)){$(label).textContent=`Saved locally: ${f.name} (${Math.round(f.size/1024)} KB)`;$(label).classList.add("save-ok")}
 }catch(e){console.error("Attachment save failed",e);pendingFiles[key]={name:f.name,type:f.type,size:f.size};if(label&&$(label)){$(label).textContent=`File selected, but local file storage failed: ${f.name}`;$(label).classList.add("save-error")}}
}
[["tdFile","td"],["tdCamera","td"],["ayuFile","ayu"],["ayuCamera","ayu"],["labFile","lab"],["labCamera","lab"],["imgFile","img"],["imgCamera","img"],["medFile","med"],["medCamera","med"],["txFile","tx"],["txCamera","tx"],["vlFile","vl"],["vlCamera","vl"],["liFile","li"],["liCamera","li"]].forEach(([id,key])=>{if($(id))$(id).addEventListener("change",()=>fileMetaFromInput(id,key))});

function saveToday(){
 const obj={date:v("tdDate"),weight:n("tdWeight"),sbp:n("tdSBP"),dbp:n("tdDBP"),sugar:n("tdSugar"),
 sleepStart:v("tdSleepStart"),sleepEnd:v("tdSleepEnd"),sleep:n("tdSleep"),sleepQuality:n("tdSleepQuality"),
 water:n("tdWater"),exercise:n("tdExercise"),steps:n("tdSteps"),energy:n("tdEnergy"),peace:n("tdPeace"),stress:n("tdStress"),
 digestion:n("tdDigestion"),bowel:v("tdBowel"),pain:n("tdPain"),jap:n("tdJap"),puja:n("tdPuja"),meditation:n("tdMeditation"),
 mauna:n("tdMauna"),study:n("tdStudy"),screen:n("tdScreen"),note:v("tdNote"),attachment:pendingFiles.td||null};
 const idx=v("tdEditIndex");
 if(idx!=="")db.daily[Number(idx)]=obj; else db.daily.unshift(obj);
 resetTodayForm(false);persist();generateDailySummary();
}
function editToday(i){
 const x=db.daily[i]; showView("today");
 const map={tdDate:"date",tdWeight:"weight",tdSBP:"sbp",tdDBP:"dbp",tdSugar:"sugar",tdSleepStart:"sleepStart",tdSleepEnd:"sleepEnd",tdSleep:"sleep",tdSleepQuality:"sleepQuality",tdWater:"water",tdExercise:"exercise",tdSteps:"steps",tdEnergy:"energy",tdPeace:"peace",tdStress:"stress",tdDigestion:"digestion",tdBowel:"bowel",tdPain:"pain",tdJap:"jap",tdPuja:"puja",tdMeditation:"meditation",tdMauna:"mauna",tdStudy:"study",tdScreen:"screen",tdNote:"note"};
 Object.entries(map).forEach(([id,k])=>{if($(id))$(id).value=x[k]??""});$("tdEditIndex").value=i;
}
function deleteToday(i){if(confirm("Delete this daily record?")){db.daily.splice(i,1);persist();generateDailySummary()}}
function resetTodayForm(clearDate=true){["tdWeight","tdSBP","tdDBP","tdSugar","tdSleepStart","tdSleepEnd","tdSleep","tdSleepQuality","tdWater","tdExercise","tdSteps","tdEnergy","tdPeace","tdStress","tdDigestion","tdPain","tdJap","tdPuja","tdMeditation","tdMauna","tdStudy","tdScreen","tdNote","tdEditIndex"].forEach(id=>{if($(id))$(id).value=""});if(clearDate&&$("tdDate"))$("tdDate").value=today();pendingFiles.td=null;if($("tdFileName"))$("tdFileName").textContent=""}

function saveAyurveda(){db.ayurveda.attachment=pendingFiles.ayu||db.ayurveda.attachment||null;db.ayurveda.prakriti=v("prakriti");db.ayurveda.vikriti=v("vikriti");db.ayurveda.agni=v("agni");db.ayurveda.koshta=v("koshta");db.ayurveda.ama=v("ama");db.ayurveda.bala=v("bala");persist()}
function saveDosha(){db.ayurveda.dosha={vata:n("vataScore"),pitta:n("pittaScore"),kapha:n("kaphaScore"),note:v("doshaNote")};persist()}
function saveAshtavidha(){db.ayurveda.attachment=pendingFiles.ayu||db.ayurveda.attachment||null;db.ayurveda.ashtavidha={nadi:v("aNadi"),mutra:v("aMutra"),mala:v("aMala"),jihva:v("aJihva"),shabda:v("aShabda"),sparsha:v("aSparsha"),drik:v("aDrik"),akriti:v("aAkriti")};persist()}
function saveDashavidha(){db.ayurveda.attachment=pendingFiles.ayu||db.ayurveda.attachment||null;db.ayurveda.dashavidha={prakriti:v("dPrakriti"),vikriti:v("dVikriti"),sara:v("dSara"),samhanana:v("dSamhanana"),pramana:v("dPramana"),satmya:v("dSatmya"),satva:v("dSatva"),ahara:v("dAhara"),vyayama:v("dVyayama"),vaya:v("dVaya")};persist()}
function addLab(){
 const obj={date:v("labDate"),test:v("labTest"),value:v("labValue"),unit:v("labUnit"),range:v("labRange"),system:v("labSystem"),note:v("labNote"),attachment:pendingFiles.lab||null};
 const idx=v("labEditIndex"); if(idx!=="")db.labs[Number(idx)]=obj; else db.labs.unshift(obj); resetLabForm(false);persist();generateInvestigationSummary()
}
function editLab(i){const x=db.labs[i];showView("investigations");["date","test","value","unit","range","system","note"].forEach(k=>{let id={date:"labDate",test:"labTest",value:"labValue",unit:"labUnit",range:"labRange",system:"labSystem",note:"labNote"}[k];$(id).value=x[k]??""});$("labEditIndex").value=i}
function deleteLab(i){if(confirm("Delete this lab?")){db.labs.splice(i,1);persist();generateInvestigationSummary()}}
function resetLabForm(dateReset=true){["labTest","labValue","labUnit","labRange","labNote","labEditIndex"].forEach(id=>$(id).value="");if(dateReset)$("labDate").value=today();pendingFiles.lab=null;if($("labFileName"))$("labFileName").textContent=""}

function addImaging(){
 const obj={date:v("imgDate"),type:v("imgType"),body:v("imgBody"),facility:v("imgFacility"),finding:v("imgFinding"),impression:v("imgImpression"),attachment:pendingFiles.img||null};
 const idx=v("imgEditIndex"); if(idx!=="")db.imaging[Number(idx)]=obj; else db.imaging.unshift(obj);resetImagingForm(false);persist();generateInvestigationSummary()
}
function editImaging(i){const x=db.imaging[i];showView("investigations");const map={imgDate:"date",imgType:"type",imgBody:"body",imgFacility:"facility",imgFinding:"finding",imgImpression:"impression"};Object.entries(map).forEach(([id,k])=>$(id).value=x[k]??"");$("imgEditIndex").value=i}
function deleteImaging(i){if(confirm("Delete this report?")){db.imaging.splice(i,1);persist();generateInvestigationSummary()}}
function resetImagingForm(dateReset=true){["imgBody","imgFacility","imgFinding","imgImpression","imgEditIndex"].forEach(id=>$(id).value="");if(dateReset)$("imgDate").value=today();pendingFiles.img=null;if($("imgFileName"))$("imgFileName").textContent=""}

function addMedicine(){
 const obj={name:v("medName"),type:v("medType"),dose:v("medDose"),freq:v("medFreq"),start:v("medStart"),stop:v("medStop"),target:v("medTarget"),purpose:v("medPurpose"),benefit:v("medBenefit"),ae:v("medAE"),attachment:pendingFiles.med||null};
 const idx=v("medEditIndex");if(idx!=="")db.medicines[Number(idx)]=obj;else db.medicines.unshift(obj);resetMedForm();persist()
}
function editMedicine(i){const x=db.medicines[i];showView("medicines");const map={medName:"name",medType:"type",medDose:"dose",medFreq:"freq",medStart:"start",medStop:"stop",medTarget:"target",medPurpose:"purpose",medBenefit:"benefit",medAE:"ae"};Object.entries(map).forEach(([id,k])=>$(id).value=x[k]??"");$("medEditIndex").value=i}
function deleteMedicine(i){if(confirm("Delete this medicine record?")){db.medicines.splice(i,1);persist()}}
function resetMedForm(){["medName","medDose","medFreq","medStart","medStop","medTarget","medPurpose","medAE","medEditIndex"].forEach(id=>$(id).value="");pendingFiles.med=null;if($("medFileName"))$("medFileName").textContent=""}

function addTherapy(){
 const obj={name:v("txName"),date:v("txDate"),reason:v("txReason"),supervision:v("txSupervision"),before:n("txBefore"),after:n("txAfter"),outcome:v("txOutcome"),ae:v("txAE"),note:v("txNote"),attachment:pendingFiles.tx||null};
 const idx=v("txEditIndex");if(idx!=="")db.therapies[Number(idx)]=obj;else db.therapies.unshift(obj);resetTxForm();persist()
}
function editTherapy(i){const x=db.therapies[i];showView("therapies");const map={txName:"name",txDate:"date",txReason:"reason",txSupervision:"supervision",txBefore:"before",txAfter:"after",txOutcome:"outcome",txAE:"ae",txNote:"note"};Object.entries(map).forEach(([id,k])=>$(id).value=x[k]??"");$("txEditIndex").value=i}
function deleteTherapy(i){if(confirm("Delete this intervention?")){db.therapies.splice(i,1);persist()}}
function resetTxForm(){["txReason","txBefore","txAfter","txAE","txNote","txEditIndex"].forEach(id=>$(id).value="");$("txDate").value=today();pendingFiles.tx=null;if($("txFileName"))$("txFileName").textContent=""}

function saveMind(){db.mind.unshift({date:v("msDate"),peace:n("msPeace"),stress:n("msStress"),purpose:n("msPurpose"),social:n("msSocial"),lonely:n("msLonely"),jap:n("msJap"),puja:n("msPuja"),mauna:n("msMauna"),ekant:n("msEkant"),study:n("msStudy"),detox:n("msDetox"),reflection:v("msReflection")});persist()}

function table(rows,cols){
 if(!rows.length)return `<p class="muted">No records yet.</p>`;
 return `<div style="overflow:auto"><table><thead><tr>${cols.map(c=>`<th>${c[0]}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${typeof c[1]==="function"?c[1](r):(r[c[1]]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
}
function renderInvestigations(){
 let q=(v("invSearch")||"").toLowerCase(), rows=[];
 db.labs.forEach((x,i)=>rows.push({date:x.date,kind:"Lab",name:x.test,value:`${x.value} ${x.unit||""}`,detail:x.note||x.range||"",attachment:x.attachment?.name||"",actions:`<button class="action-btn edit-btn" onclick="editLab(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteLab(${i})">Delete</button>`}));
 db.imaging.forEach((x,i)=>rows.push({date:x.date,kind:x.type,name:x.body,value:x.impression||"",detail:x.finding||"",attachment:x.attachment?.name||"",actions:`<button class="action-btn edit-btn" onclick="editImaging(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteImaging(${i})">Delete</button>`}));
 rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 $("invTable").innerHTML=table(rows,[["Date","date"],["Type","kind"],["Test / Body","name"],["Result","value"],["Attachment","attachment"],["Action","actions"]])
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
 return actions.slice(0,3)
}

function saveHabit(){
 let dur=n("hbDuration");
 if(!dur&&v("hbStart")&&v("hbEnd")){
   let [sh,sm]=v("hbStart").split(":").map(Number),[eh,em]=v("hbEnd").split(":").map(Number);dur=(eh*60+em)-(sh*60+sm);if(dur<0)dur+=1440;
 }
 const obj={date:v("hbDate"),habit:v("hbHabit"),start:v("hbStart"),end:v("hbEnd"),duration:dur,target:n("hbTarget"),quality:n("hbQuality"),status:v("hbStatus"),note:v("hbNote")};
 const idx=v("hbEditIndex");if(idx!=="")db.habits[Number(idx)]=obj;else db.habits.unshift(obj);resetHabitForm();persist();generateHabitSummary()
}
function editHabit(i){const x=db.habits[i];showView("lifestyle");const map={hbDate:"date",hbHabit:"habit",hbStart:"start",hbEnd:"end",hbDuration:"duration",hbTarget:"target",hbQuality:"quality",hbStatus:"status",hbNote:"note"};Object.entries(map).forEach(([id,k])=>$(id).value=x[k]??"");$("hbEditIndex").value=i}
function deleteHabit(i){if(confirm("Delete this habit entry?")){db.habits.splice(i,1);persist();generateHabitSummary()}}
function resetHabitForm(){["hbStart","hbEnd","hbDuration","hbTarget","hbQuality","hbNote","hbEditIndex"].forEach(id=>$(id).value="");$("hbDate").value=today()}


function timeDurationHours(start,end){
 if(!start||!end)return 0;
 let [sh,sm]=start.split(":").map(Number),[eh,em]=end.split(":").map(Number);
 let mins=(eh*60+em)-(sh*60+sm); if(mins<0)mins+=1440; return +(mins/60).toFixed(1)
}
["slOnset","slWake"].forEach(id=>{if($(id))$(id).addEventListener("change",()=>{$("slHours").value=timeDurationHours(v("slOnset"),v("slWake"))||""})});

function saveSleep(){
 let obj={date:v("slDate"),bed:v("slBed"),onset:v("slOnset"),wake:v("slWake"),out:v("slOut"),hours:n("slHours")||timeDurationHours(v("slOnset"),v("slWake")),awaken:n("slAwaken"),nap:n("slNap"),quality:n("slQuality"),lateDinner:v("slLateDinner"),caffeine:v("slCaffeine"),screen:v("slScreen"),exercise:n("slExercise"),stress:n("slStress"),sadhana:n("slSadhana"),note:v("slNote")};
 let i=v("slEditIndex"); if(i!=="")db.sleep[+i]=obj;else db.sleep.unshift(obj);resetSleepForm();persist()
}
function editSleep(i){let x=db.sleep[i];showView("sleepcentre");let m={slDate:"date",slBed:"bed",slOnset:"onset",slWake:"wake",slOut:"out",slHours:"hours",slAwaken:"awaken",slNap:"nap",slQuality:"quality",slLateDinner:"lateDinner",slCaffeine:"caffeine",slScreen:"screen",slExercise:"exercise",slStress:"stress",slSadhana:"sadhana",slNote:"note"};Object.entries(m).forEach(([id,k])=>$(id).value=x[k]??"");$("slEditIndex").value=i}
function deleteSleep(i){if(confirm("Delete sleep record?")){db.sleep.splice(i,1);persist()}}
function resetSleepForm(){["slBed","slOnset","slWake","slOut","slHours","slAwaken","slNap","slQuality","slExercise","slStress","slSadhana","slNote","slEditIndex"].forEach(id=>{if($(id))$(id).value=""});if($("slDate"))$("slDate").value=today()}
function renderSleep(){
 if(!$("sleepTable"))return;
 let rows=db.sleep.map((x,i)=>({...x,window:`${x.onset||"-"} → ${x.wake||"-"}`,act:`<button class="action-btn edit-btn" onclick="editSleep(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteSleep(${i})">Delete</button>`}));
 $("sleepTable").innerHTML=table(rows,[["Date","date"],["Sleep window","window"],["Hours","hours"],["Quality",x=>`${x.quality||0}/10`],["Awakenings","awaken"],["Stress",x=>`${x.stress||0}/10`],["Action","act"]]);
 let s=db.sleep.slice(0,7);if(!s.length){$("sleepSummary").textContent="No sleep data yet.";return}
 let avg=k=>(s.reduce((a,x)=>a+(Number(x[k])||0),0)/s.length).toFixed(1);
 let irregular=s.map(x=>x.onset).filter(Boolean);
 $("sleepSummary").textContent=`Last ${s.length} records\nAverage sleep: ${avg("hours")} h\nAverage quality: ${avg("quality")}/10\nAverage awakenings: ${avg("awaken")}\nAverage stress: ${avg("stress")}/10\n\nPattern check: ${s.filter(x=>x.screen==="Yes").length} night(s) had screen use in the last hour; ${s.filter(x=>x.caffeine==="Yes").length} had late caffeine; ${s.filter(x=>x.lateDinner==="Yes").length} had late dinner.\n\nFocus on timing consistency, adequate duration and the factor that most often accompanies poor-quality nights.`;
}

function savePhysician(){
 let o={date:v("phDate"),work:n("phWork"),patients:n("phPatients"),sitting:n("phSitting"),meal:v("phMeal"),water:v("phWater"),pain:n("phPain"),eye:n("phEye"),fatigue:n("phFatigue"),exhaust:n("phExhaust"),social:n("phSocial"),study:n("phStudy"),sadhana:n("phSadhana"),breaks:n("phBreak"),note:v("phNote")};
 let i=v("phEditIndex");if(i!=="")db.physician[+i]=o;else db.physician.unshift(o);resetPhysicianForm();persist()
}
function editPhysician(i){let x=db.physician[i];showView("physician");let m={phDate:"date",phWork:"work",phPatients:"patients",phSitting:"sitting",phMeal:"meal",phWater:"water",phPain:"pain",phEye:"eye",phFatigue:"fatigue",phExhaust:"exhaust",phSocial:"social",phStudy:"study",phSadhana:"sadhana",phBreak:"breaks",phNote:"note"};Object.entries(m).forEach(([id,k])=>$(id).value=x[k]??"");$("phEditIndex").value=i}
function deletePhysician(i){if(confirm("Delete physician wellness record?")){db.physician.splice(i,1);persist()}}
function resetPhysicianForm(){["phWork","phPatients","phSitting","phPain","phEye","phFatigue","phExhaust","phSocial","phStudy","phSadhana","phBreak","phNote","phEditIndex"].forEach(id=>{if($(id))$(id).value=""});if($("phDate"))$("phDate").value=today()}
function renderPhysician(){
 if(!$("physicianTable"))return;let p=db.physician.slice(0,14);
 $("physicianTable").innerHTML=table(db.physician.map((x,i)=>({...x,act:`<button class="action-btn edit-btn" onclick="editPhysician(${i})">Edit</button><button class="action-btn delete-btn" onclick="deletePhysician(${i})">Delete</button>`})),[["Date","date"],["Work h","work"],["Patients","patients"],["Sitting h","sitting"],["Fatigue",x=>`${x.fatigue}/10`],["Exhaustion",x=>`${x.exhaust}/10`],["Action","act"]]);
 if(!p.length){$("physicianSummary").textContent="No physician wellness records yet.";$("physicianActions").textContent="Add a workday round to get protective actions.";return}
 let a=k=>(p.reduce((s,x)=>s+(Number(x[k])||0),0)/p.length).toFixed(1), latest=p[0], acts=[];
 if(latest.sitting>=4)acts.push("Break prolonged sitting with short movement/mobility intervals.");
 if(latest.meal==="Yes")acts.push("Protect a realistic meal window on heavy OPD days.");
 if(latest.water==="Yes")acts.push("Pre-position water and use planned hydration cues.");
 if(latest.fatigue>=7||latest.exhaust>=7)acts.push("Reduce nonessential load and protect sleep/recovery; persistent exhaustion deserves a broader review.");
 if(latest.pain>=6)acts.push("Review workstation, posture, mobility and the clinical cause of persistent neck/back pain.");
 if(!acts.length)acts.push("Current workday pattern has no major rule-based warning; preserve the habits that are working.");
 $("physicianSummary").textContent=`Recent ${p.length} workdays\nAverage work: ${a("work")} h/day\nAverage sitting: ${a("sitting")} h/day\nMental fatigue: ${a("fatigue")}/10\nEmotional exhaustion: ${a("exhaust")}/10\nAverage sadhana: ${a("sadhana")} min/day`;
 $("physicianActions").textContent="• "+acts.join("\n• ");
}

function saveExperiment(){
 let o={name:v("exName"),category:v("exCategory"),start:v("exStart"),end:v("exEnd"),outcome:v("exOutcome"),baseline:v("exBaseline"),latest:v("exLatest"),status:v("exStatus"),protocol:v("exProtocol"),learning:v("exLearning")};
 let i=v("exEditIndex");if(i!=="")db.experiments[+i]=o;else db.experiments.unshift(o);resetExperimentForm();persist()
}
function editExperiment(i){let x=db.experiments[i];showView("experiments");let m={exName:"name",exCategory:"category",exStart:"start",exEnd:"end",exOutcome:"outcome",exBaseline:"baseline",exLatest:"latest",exStatus:"status",exProtocol:"protocol",exLearning:"learning"};Object.entries(m).forEach(([id,k])=>$(id).value=x[k]??"");$("exEditIndex").value=i}
function deleteExperiment(i){if(confirm("Delete experiment?")){db.experiments.splice(i,1);persist()}}
function resetExperimentForm(){["exName","exEnd","exOutcome","exBaseline","exLatest","exProtocol","exLearning","exEditIndex"].forEach(id=>{if($(id))$(id).value=""});if($("exStart"))$("exStart").value=today()}
function renderExperiments(){
 if(!$("experimentTable"))return;
 $("experimentTable").innerHTML=table(db.experiments.map((x,i)=>({...x,act:`<button class="action-btn edit-btn" onclick="editExperiment(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteExperiment(${i})">Delete</button>`})),[["Experiment","name"],["Category","category"],["Start","start"],["Outcome","outcome"],["Baseline","baseline"],["Latest","latest"],["Status","status"],["Action","act"]]);
 let a=db.experiments;if(!a.length){$("experimentSummary").textContent="No health experiments yet.";return}
 let active=a.filter(x=>x.status==="Active"), completed=a.filter(x=>x.status==="Completed");
 $("experimentSummary").textContent=`${active.length} active • ${completed.length} completed.\n\nBest practice: change one major variable at a time, define an outcome before starting, and record confounders such as illness, travel, medication changes, sleep and season.`;
}

function savePreventive(){
 let o={item:v("pvItem"),category:v("pvCategory"),due:v("pvDue"),priority:v("pvPriority"),status:v("pvStatus"),last:v("pvLast"),note:v("pvNote")};
 let i=v("pvEditIndex");if(i!=="")db.preventive[+i]=o;else db.preventive.unshift(o);resetPreventiveForm();persist()
}
function editPreventive(i){let x=db.preventive[i];showView("preventive");let m={pvItem:"item",pvCategory:"category",pvDue:"due",pvPriority:"priority",pvStatus:"status",pvLast:"last",pvNote:"note"};Object.entries(m).forEach(([id,k])=>$(id).value=x[k]??"");$("pvEditIndex").value=i}
function deletePreventive(i){if(confirm("Delete preventive item?")){db.preventive.splice(i,1);persist()}}
function resetPreventiveForm(){["pvItem","pvLast","pvNote","pvEditIndex"].forEach(id=>{if($(id))$(id).value=""});if($("pvDue"))$("pvDue").value=today()}
function classifyPreventiveBuckets(){
 if(!$("pvDueNow"))return;
 const now=new Date(today()+"T00:00:00");
 const addDays=(d,n)=>new Date(d.getTime()+n*86400000);
 const endMonth=new Date(now.getFullYear(),now.getMonth()+1,0);
 let groups={due:[],month:[],m3:[],m6:[],annual:[]};
 db.preventive.filter(x=>x.status!=="Completed"&&x.due).forEach(x=>{
   const dt=new Date(x.due+"T00:00:00");
   if(dt<=now)groups.due.push(x);
   else if(dt<=endMonth)groups.month.push(x);
   else if(dt<=addDays(now,90))groups.m3.push(x);
   else if(dt<=addDays(now,180))groups.m6.push(x);
   else groups.annual.push(x);
 });
 const fmt=a=>a.length?a.slice(0,6).map(x=>`• ${x.item} — ${x.due}`).join("\n"):"No items.";
 $("pvDueNow").textContent=fmt(groups.due);
 $("pvThisMonth").textContent=fmt(groups.month);
 $("pv3Months").textContent=fmt(groups.m3);
 $("pv6Months").textContent=fmt(groups.m6);
 $("pvAnnual").textContent=fmt(groups.annual);
}
function renderPreventive(){
 if(!$("preventiveTable"))return;
 let rows=db.preventive.map((x,i)=>({...x,act:`<button class="action-btn edit-btn" onclick="editPreventive(${i})">Edit</button><button class="action-btn delete-btn" onclick="deletePreventive(${i})">Delete</button>`}));
 $("preventiveTable").innerHTML=table(rows,[["Item","item"],["Category","category"],["Due","due"],["Priority","priority"],["Status","status"],["Last done","last"],["Action","act"]]);
 let now=today(), due=db.preventive.filter(x=>x.status!=="Completed").sort((a,b)=>(a.due||"").localeCompare(b.due||"")).slice(0,6);
 $("preventiveSummary").textContent=due.length?due.map(x=>`${x.due||"No date"} — ${x.item} [${x.priority}]`).join("\n"):"No due preventive items recorded."; classifyPreventiveBuckets();
}

let vaultTypeFilter="All";
function setVaultFilter(type){vaultTypeFilter=type;renderVault()}
function saveVault(){
 let o={date:v("vlDate"),type:v("vlType"),system:v("vlSystem"),title:v("vlTitle"),summary:v("vlSummary"),attachment:pendingFiles.vl||null};
 let i=v("vlEditIndex");if(i!=="")db.vault[+i]=o;else db.vault.unshift(o);resetVaultForm();persist()
}
function editVault(i){let x=db.vault[i];showView("vault");let m={vlDate:"date",vlType:"type",vlSystem:"system",vlTitle:"title",vlSummary:"summary"};Object.entries(m).forEach(([id,k])=>$(id).value=x[k]??"");$("vlEditIndex").value=i}
function deleteVault(i){if(confirm("Delete vault item?")){db.vault.splice(i,1);persist()}}
function resetVaultForm(){["vlSystem","vlTitle","vlSummary","vlEditIndex"].forEach(id=>{if($(id))$(id).value=""});if($("vlDate"))$("vlDate").value=today(); if($("liDate"))$("liDate").value=today();pendingFiles.vl=null;if($("vlFileName"))$("vlFileName").textContent=""}
function renderVault(){
 if(!$("vaultTable"))return;let q=(v("vaultSearch")||"").toLowerCase();
 let rows=db.vault.map((x,i)=>({...x,file:x.attachment?.name||"",act:`<button class="action-btn edit-btn" onclick="editVault(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteVault(${i})">Delete</button>`}))
   .filter(x=>JSON.stringify(x).toLowerCase().includes(q))
   .filter(x=>vaultTypeFilter==="All" || x.type===vaultTypeFilter);
 $("vaultTable").innerHTML=table(rows,[["Date","date"],["Type","type"],["System","system"],["Title","title"],["File","file"],["Summary","summary"],["Action","act"]])
}

function generateDailySummary(){
 const d=db.daily[0]; if(!d||!$("dailyAutoSummary"))return;
 let points=[];
 points.push(`Sleep: ${d.sleep||"-"} h (${d.sleepStart||"-"} → ${d.sleepEnd||"-"}), quality ${d.sleepQuality||"-"}/10.`);
 points.push(`BP ${d.sbp||"-"}/${d.dbp||"-"}, glucose ${d.sugar||"-"}, weight ${d.weight||"-"} kg.`);
 points.push(`Exercise ${d.exercise||0} min, steps ${d.steps||0}, water ${d.water||0} L.`);
 points.push(`Peace ${d.peace||0}/10, stress ${d.stress||0}/10, energy ${d.energy||0}/10.`);
 points.push(`Sadhana: Jap ${d.jap||0} min, Puja ${d.puja||0} min, Dhyana ${d.meditation||0} min, Mauna ${d.mauna||0} min.`);
 let coach=[];
 if(d.sleep&&d.sleep<6)coach.push("Sleep is the main recovery gap today.");
 if(d.exercise<20)coach.push("A small movement session can improve consistency.");
 if(d.stress>=7)coach.push("High stress recorded—protect recovery and simplify nonessential load.");
 if(d.peace>=7)coach.push("Mental peace was strong today; note what supported it.");
 if(d.jap||d.meditation||d.puja)coach.push("Sadhana completed—continue the routine that feels sustainable.");
 $("dailyAutoSummary").textContent=points.join("\n")+"\n\nSelf-coaching:\n• "+(coach.length?coach.join("\n• "):"Balanced day recorded. Focus on consistency rather than adding more tasks.")
}
function generateAyurvedaSummary(){
 if(!$("ayuAutoSummary"))return;
 const a=db.ayurveda,as=a.ashtavidha||{},ds=a.dashavidha||{},dos=a.dosha||{};
 $("ayuAutoSummary").textContent=
 `Prakriti: ${a.prakriti||"-"} | Vikriti: ${a.vikriti||"-"} | Agni: ${a.agni||"-"} | Koshta: ${a.koshta||"-"} | Ama: ${a.ama||"-"} | Bala: ${a.bala||"-"}\n`+
 `Dosha state: Vata ${dos.vata??"-"}/10, Pitta ${dos.pitta??"-"}/10, Kapha ${dos.kapha??"-"}/10.\n`+
 `Ashtavidha: Nadi ${as.nadi||"-"}, Mala ${as.mala||"-"}, Mutra ${as.mutra||"-"}, Jihva ${as.jihva||"-"}, Sparsha ${as.sparsha||"-"}, Drik ${as.drik||"-"}, Shabda ${as.shabda||"-"}, Akriti ${as.akriti||"-"}.\n`+
 `Dashavidha: Sara ${ds.sara||"-"}, Samhanana ${ds.samhanana||"-"}, Satmya ${ds.satmya||"-"}, Satva ${ds.satva||"-"}, Ahara Shakti ${ds.ahara||"-"}, Vyayama Shakti ${ds.vyayama||"-"}.\n\nAI-style lens: interpret these together with symptoms, labs, ritu, desha and modern diagnosis; avoid changing multiple therapies at once without a clear reason.`;
}
function generateInvestigationSummary(){
 if(!$("investigationAutoSummary"))return;
 const labs=db.labs.slice(0,8).map(x=>`${x.test}: ${x.value} ${x.unit||""} (${x.date})`).join("; ");
 const imgs=db.imaging.slice(0,5).map(x=>`${x.type} ${x.body}: ${x.impression||x.finding||"recorded"} (${x.date})`).join("; ");
 $("investigationAutoSummary").textContent=`Recent labs: ${labs||"None entered"}\nRecent imaging/reports: ${imgs||"None entered"}\n\nTrend tip: use the same test name and unit consistently so future AI and charts can compare values correctly.`;
}
function generateHabitSummary(){
 if(!$("habitAutoSummary"))return;
 const h=db.habits.slice(0,14);if(!h.length){$("habitAutoSummary").textContent="No habit data yet.";return}
 const done=h.filter(x=>x.status==="Done").length,partial=h.filter(x=>x.status==="Partial").length,miss=h.filter(x=>x.status==="Missed").length;
 const totalMin=h.reduce((a,x)=>a+(Number(x.duration)||0),0);
 const avgQ=(h.reduce((a,x)=>a+(Number(x.quality)||0),0)/h.length).toFixed(1);
 const common={};h.forEach(x=>common[x.habit]=(common[x.habit]||0)+1);const top=Object.entries(common).sort((a,b)=>b[1]-a[1])[0]?.[0]||"-";
 $("habitAutoSummary").textContent=`Recent ${h.length} habit entries: ${done} done, ${partial} partial, ${miss} missed. Total intentional time: ${totalMin} min. Average quality: ${avgQ}/10. Most frequently tracked: ${top}.\n\nSelf-coaching: choose 2–3 keystone habits first—sleep timing, movement/exercise, and one stable sadhana practice. Build reliability before increasing intensity.`;
}

function renderAttentionToday(){
 if(!$("attentionToday"))return;
 const d=db.daily[0]||{}, items=[];
 let priority="Add today’s BP, glucose, weight and symptoms to activate a clinical priority.";
 if(d.sbp>=140||d.dbp>=90)priority=`Repeat BP today using standardized technique; latest reading is ${d.sbp}/${d.dbp}.`;
 else if(d.sugar>=126)priority=`Review glucose context and trend; latest entered value is ${d.sugar} mg/dL.`;
 else if(d.pain>=7)priority=`Pain is ${d.pain}/10; review cause and red flags rather than only tracking it.`;
 else if(db.preventive.some(x=>x.status!=="Completed" && x.due && x.due<=today()))priority="One or more preventive items are due now; open Preventive Calendar.";

 let recovery="Add sleep data to get a recovery recommendation.";
 if(d.sleep && d.sleep<6) recovery=`You slept ${d.sleep} h; protect recovery and keep today’s training light–moderate.`;
 else if(d.sleep && d.sleep>=7 && d.energy>=7) recovery=`Recovery looks reasonable: ${d.sleep} h sleep and energy ${d.energy}/10.`;
 else if(db.sleep[0] && db.sleep[0].hours<6) recovery=`Latest Sleep Centre record is ${db.sleep[0].hours} h; prioritize recovery today.`;

 let habit="Track one keystone habit today: sleep timing, movement or sadhana.";
 const recent=db.habits.slice(0,7), jap=db.daily.slice(0,7).filter(x=>(x.jap||0)>=20).length;
 if(recent.length){const done=recent.filter(x=>x.status==="Done").length;habit=`Recent habit adherence: ${Math.round(done/recent.length*100)}% done. Improve consistency before increasing intensity.`;}
 else if(db.daily.length>=3) habit=`Mala-jap ≥20 min achieved on ${jap} of last ${Math.min(7,db.daily.length)} tracked days.`;

 $("attentionToday").innerHTML=[
   ["1. Priority",priority],["2. Recovery",recovery],["3. Habit",habit]
 ].map(x=>`<div class="attention-item"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("");
}
function renderDashboard(){
 const d=db.daily[0]||{},p=db.profile||{};

 const pct=x=>Math.max(0,Math.min(100,Math.round(x)));
 let bodyVals=[]; if(d.pain||d.pain===0)bodyVals.push((10-d.pain)*10); if(d.energy||d.energy===0)bodyVals.push(d.energy*10);
 let recoveryVals=[]; if(d.sleep)recoveryVals.push(Math.min(100,d.sleep/8*100)); if(d.exercise||d.exercise===0)recoveryVals.push(Math.min(100,d.exercise/30*100)); if(d.energy||d.energy===0)recoveryVals.push(d.energy*10);
 let metabolicVals=[]; if(d.sbp)metabolicVals.push(d.sbp<130&&d.dbp<80?90:(d.sbp<140&&d.dbp<90?70:45)); if(d.sugar)metabolicVals.push(d.sugar<100?90:(d.sugar<126?70:45)); if(d.weight&&p.height){let bmi=d.weight/((p.height/100)**2);metabolicVals.push(bmi>=18.5&&bmi<25?90:(bmi<30?70:50))}
 let ayuVals=[db.ayurveda.agni==="Sama"?90:65,db.ayurveda.ama==="Absent"?90:(db.ayurveda.ama==="Mild"?70:45)];
 let mindVals=[]; if(d.peace||d.peace===0)mindVals.push(d.peace*10); if(d.stress||d.stress===0)mindVals.push((10-d.stress)*10);
 let purposeVals=[]; if(d.jap||d.puja||d.meditation)purposeVals.push(Math.min(100,(d.jap+d.puja+d.meditation)/45*100)); if(d.study)purposeVals.push(Math.min(100,d.study/60*100));
 const avg=v=>v.length?pct(v.reduce((a,b)=>a+b,0)/v.length):"--";
 if($("domainBody"))$("domainBody").textContent=avg(bodyVals);
 if($("domainRecovery"))$("domainRecovery").textContent=avg(recoveryVals);
 if($("domainMetabolic"))$("domainMetabolic").textContent=avg(metabolicVals);
 if($("domainAyurveda"))$("domainAyurveda").textContent=avg(ayuVals);
 if($("domainMind"))$("domainMind").textContent=avg(mindVals);
 if($("domainPurpose"))$("domainPurpose").textContent=avg(purposeVals);

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
 $("nextActions").innerHTML=nextActions().map(x=>`<li>${x}</li>`).join(""); renderAttentionToday();
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
 db.sleep.forEach(x=>a.push({date:x.date,type:"Sleep",text:`Sleep ${x.hours||"-"} h • quality ${x.quality||"-"}/10 • stress ${x.stress||"-"}/10`}));
 db.physician.forEach(x=>a.push({date:x.date,type:"Physician",text:`Work ${x.work||"-"} h • fatigue ${x.fatigue||"-"}/10 • exhaustion ${x.exhaust||"-"}/10`}));
 db.experiments.forEach(x=>a.push({date:x.start,type:"Experiment",text:`${x.name}: ${x.baseline||"-"} → ${x.latest||"-"} • ${x.status}`}));
 db.labInterpretations.forEach(x=>{let flagged=Object.values(x.values||{}).filter(v=>!["Normal","Not assessed"].includes(v.status)).length;a.push({date:x.date,type:"Lab Panel",text:`${x.title} • ${flagged} flagged parameter(s)`})});
 return a.sort((x,y)=>(y.date||"").localeCompare(x.date||""))
}
function renderTimeline(){
 const f=v("timelineFilter")||"All";let a=getTimeline().filter(x=>f==="All"||x.type===f);
 $("timelineList").innerHTML=a.length?`<div class="card timeline">${a.map(e=>`<div class="event"><small>${e.date} <span class="tag">${e.type}</span></small><b>${e.text}</b></div>`).join("")}</div>`:`<div class="card"><p class="muted">No records.</p></div>`
}
function runCopilotMode(mode){
 if($("aiFocus"))$("aiFocus").value=mode;
 showView("ai");
 setTimeout(()=>generateAI(),50);
}
function generateAI(){
 const d=db.daily[0]||{}, p=db.profile||{}, r=rituData[db.ritu.ritu], focus=v("aiFocus"),q=v("aiQuestion");
 const abnormal=clinicalAlerts(); const meds=db.medicines.filter(x=>!x.stop).slice(0,10).map(x=>`${x.name} (${x.type}) ${x.dose} ${x.freq} for ${x.purpose||x.target}`).join("\n• ");
 const recentLabs=db.labs.slice(0,10).map(x=>`${x.date} — ${x.test}: ${x.value} ${x.unit||""} [${x.range||"range not entered"}]`).join("\n• ");
 const tx=db.therapies.slice(0,5).map(x=>`${x.date} — ${x.name}: ${x.outcome}; adverse effect: ${x.ae||"none recorded"}`).join("\n• ");
 let out=`RAJ HEALTH 360 — INTEGRATED REVIEW\nFocus: ${focus}\nQuestion: ${q||"General review"}\n\n1) SAFETY / CLINICAL ATTENTION\n• ${abnormal.join("\n• ")}\n\n2) CURRENT SNAPSHOT\n• Weight: ${d.weight||"-"} kg | BP: ${d.sbp||"-"}/${d.dbp||"-"} | Glucose: ${d.sugar||"-"}\n• Sleep: ${d.sleep||"-"} h | Exercise: ${d.exercise||"-"} min | Water: ${d.water||"-"} L\n• Energy: ${d.energy||"-"}/10 | Peace: ${d.peace||"-"}/10 | Stress: ${d.stress||"-"}/10\n\n3) AYURVEDA CONTEXT\n• Prakriti: ${db.ayurveda.prakriti} | Vikriti: ${db.ayurveda.vikriti||"-"} | Agni: ${db.ayurveda.agni} | Ama: ${db.ayurveda.ama}\n• Ritu: ${db.ritu.ritu} — ${r.dosha}\n• Shatkriyakala conceptual stage: ${db.shatkriya.stage}\n• Seasonal focus: ${r.focus}\n\n4) NEXT BEST ACTIONS\n• ${nextActions().join("\n• ")}\n\n5) CURRENT MEDICINES\n• ${meds||"None entered"}\n\n6) RECENT LABS\n• ${recentLabs||"None entered"}\n\n7) RECENT INTERVENTIONS / OUTCOMES\n• ${tx||"None entered"}\n\n8) PHYSICIAN / RECOVERY CONTEXT
• Latest sleep: ${db.sleep[0]?`${db.sleep[0].hours} h, quality ${db.sleep[0].quality}/10`:"No Sleep Centre record"}
• Latest physician wellness: ${db.physician[0]?`work ${db.physician[0].work} h, fatigue ${db.physician[0].fatigue}/10, exhaustion ${db.physician[0].exhaust}/10`:"No physician wellness record"}
• Active health experiments: ${db.experiments.filter(x=>x.status==="Active").map(x=>x.name).join(", ")||"None"}

9) DECISION RULE\nChange the fewest variables needed, document the reason, set a measurable outcome, and reassess. Do not start/stop prescription medicines or intensive Panchakarma solely from this prototype.`;
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
 $("medTable").innerHTML=table(db.medicines.map((x,i)=>({...x,att:x.attachment?.name||"",act:`<button class="action-btn edit-btn" onclick="editMedicine(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteMedicine(${i})">Delete</button>`})),[["Medicine","name"],["Type","type"],["Dose","dose"],["Frequency","freq"],["Start","start"],["Stop","stop"],["Target","target"],["Outcome","benefit"],["Attachment","att"],["Action","act"]]);
 $("txTable").innerHTML=table(db.therapies.map((x,i)=>({...x,att:x.attachment?.name||"",act:`<button class="action-btn edit-btn" onclick="editTherapy(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteTherapy(${i})">Delete</button>`})),[["Date","date"],["Intervention","name"],["Reason","reason"],["Supervision","supervision"],["Before→After",x=>`${x.before||"-"} → ${x.after||"-"}`],["Outcome","outcome"],["Attachment","att"],["Action","act"]]);
 if($("dailyTable"))$("dailyTable").innerHTML=table(db.daily.map((x,i)=>({...x,sl:`${x.sleepStart||"-"}→${x.sleepEnd||"-"} (${x.sleep||"-"}h)`,att:x.attachment?.name||"",act:`<button class="action-btn edit-btn" onclick="editToday(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteToday(${i})">Delete</button>`})),[["Date","date"],["Sleep","sl"],["BP",x=>`${x.sbp||"-"}/${x.dbp||"-"}`],["Exercise",x=>`${x.exercise||0} min`],["Peace",x=>`${x.peace||0}/10`],["Attachment","att"],["Action","act"]]);
 if($("habitTable"))$("habitTable").innerHTML=table(db.habits.map((x,i)=>({...x,when:`${x.start||"-"}→${x.end||"-"}`,act:`<button class="action-btn edit-btn" onclick="editHabit(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteHabit(${i})">Delete</button>`})),[["Date","date"],["Habit","habit"],["Time","when"],["Duration",x=>`${x.duration||0} min`],["Status","status"],["Quality",x=>`${x.quality||0}/10`],["Action","act"]]);
}
function safeRun(name,fn){try{fn()}catch(e){console.error(`RAJ HEALTH 360: ${name} failed`,e);if(name.includes("Lab")&&$("labCentreStatus"))$("labCentreStatus").textContent=`Diagnostic module recovered from an error: ${e.message}`}}
function renderAll(){
 safeRun("Ritu auto",applyAutoRitu);safeRun("Forms",renderForms);safeRun("Dashboard",renderDashboard);safeRun("Ritu",renderRitu);safeRun("Investigations",renderInvestigations);safeRun("Tables",renderTables);safeRun("Sleep",renderSleep);safeRun("Physician",renderPhysician);safeRun("Experiments",renderExperiments);safeRun("Preventive",renderPreventive);safeRun("Vault",renderVault);
 safeRun("Lab panel buttons",renderLabPanelButtons);safeRun("Lab parameters",()=>renderLabParameters());safeRun("Saved Lab panels",renderSavedLabPanels);
 safeRun("Timeline",renderTimeline);safeRun("Daily summary",generateDailySummary);safeRun("Ayurveda summary",generateAyurvedaSummary);safeRun("Investigation summary",generateInvestigationSummary);safeRun("Habit summary",generateHabitSummary);
}
if($("hbDate"))$("hbDate").value=today(); if($("slDate"))$("slDate").value=today(); if($("phDate"))$("phDate").value=today(); if($("exStart"))$("exStart").value=today(); if($("pvDue"))$("pvDue").value=today(); if($("vlDate"))$("vlDate").value=today(); if($("liDate"))$("liDate").value=today();
renderAll();
setTimeout(()=>{safeRun("Lab independent buttons",renderLabPanelButtons);safeRun("Lab independent parameters",()=>renderLabParameters());safeRun("Lab independent saved panels",renderSavedLabPanels)},0);

if($("liSex"))$("liSex").addEventListener("change",()=>renderLabParameters());

if($("liFacility"))$("liFacility").addEventListener("input",()=>{autoSelectOmegaTemplate();renderLabParameters()});

setTimeout(()=>{if($("reportStorageHealth"))checkReportStorageHealth();if($("attachmentStorageHealth"))checkAttachmentStorageHealth()},800);

loadCloudPreferencesUI();
if($("cloudLastSync"))$("cloudLastSync").textContent=localStorage.getItem("raj_health_360_last_cloud_sync")||"Never";
setTimeout(()=>initializeCloud(),500);
window.addEventListener("online",()=>{if(cloudUser&&cloudPrefs().autoSync)cloudBidirectionalSync()});
window.addEventListener("offline",()=>setCloudHeader("","☁ Offline • local safe"));

function clearProfileFieldSafely(fieldId){
 const map={pEmergency:"emergency",pAllergy:"allergy",pConditions:"conditions",pGoals:"goals"};
 const key=map[fieldId];
 if(!key||!db.profile)return;
 if(!confirm("Clear this field on this device and synchronize the deletion to cloud?"))return;
 db.profile[key]="";
 const el=$(fieldId);if(el)el.value="";
 // Explicit deletion marker allows intentional clears.
 db.profile.__clearedFields=db.profile.__clearedFields||{};
 db.profile.__clearedFields[key]=Date.now();
 persist();
}
