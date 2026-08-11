
const KEY="raj_health_360_v2";
const defaultDB={
 profile:{name:"",dob:"",sex:"Male",height:"",blood:"",allergy:"",conditions:"",emergency:"",goals:""},
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
function persist(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function showView(id){
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===id));
 window.scrollTo({top:0,behavior:"smooth"})
}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showView(x.dataset.view));
["tdDate","labDate","imgDate","txDate","msDate","slDate","phDate","exStart","pvDue","vlDate","liDate"].forEach(id=>{if($(id))$(id).value=today()});
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("backupBtn").onclick=exportData;


const labPanels = {
 "CBC":{
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
 "LFT":{
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
 "RFT":{
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
 "DIABETES":{
  title:"Diabetes & Glycemic Panel",system:"Metabolic & Diabetes",
  params:[
   {id:"fpg",name:"Fasting Plasma Glucose",unit:"mg/dL",all:[70,99],meaning:"Fasting glycemia; repeated elevation needs diabetes/prediabetes context."},
   {id:"ppbs",name:"2-hour Postprandial Glucose",unit:"mg/dL",all:[70,139],meaning:"Post-meal glucose response; interpretation depends on timing and diagnostic context."},
   {id:"hba1c",name:"HbA1c",unit:"%",all:[4.0,5.6],meaning:"Approximate longer-term glycemic exposure; affected by selected hematologic conditions."}
  ]
 },
 "LIPID":{
  title:"Lipid Profile",system:"Cardiovascular",
  params:[
   {id:"tc",name:"Total Cholesterol",unit:"mg/dL",all:[0,199],meaning:"Overall cholesterol; risk interpretation depends more on LDL/non-HDL and total cardiovascular risk."},
   {id:"ldl",name:"LDL-C",unit:"mg/dL",all:[0,99],meaning:"Primary atherogenic cholesterol target; desired level depends on cardiovascular risk."},
   {id:"hdl",name:"HDL-C",unit:"mg/dL",male:[40,200],female:[50,200],meaning:"Higher HDL is generally associated with lower risk, but should not be interpreted in isolation."},
   {id:"tg",name:"Triglycerides",unit:"mg/dL",all:[0,149],meaning:"Affected by meals, alcohol, metabolic health and genetics."},
   {id:"nonhdl",name:"Non-HDL-C",unit:"mg/dL",all:[0,129],meaning:"Captures cholesterol in atherogenic particles; useful alongside LDL."}
  ]
 },
 "THYROID":{
  title:"Thyroid Function Tests",system:"Thyroid & Endocrine",
  params:[
   {id:"tsh",name:"TSH",unit:"mIU/L",all:[0.4,4.5],meaning:"Primary screening marker in many settings; interpret with free T4 and clinical context."},
   {id:"ft4",name:"Free T4",unit:"ng/dL",all:[0.9,1.7],meaning:"Free thyroxine; helps classify thyroid dysfunction with TSH."},
   {id:"ft3",name:"Free T3",unit:"pg/mL",all:[2.3,4.2],meaning:"Useful in selected thyroid contexts; assay ranges vary."},
   {id:"antiTPO",name:"Anti-TPO Antibody",unit:"IU/mL",all:[0,34],meaning:"Autoimmune thyroid marker; positivity is interpreted with thyroid function and clinical picture."}
  ]
 },
 "BONE":{
  title:"Bone & Mineral Panel",system:"Bone Health",
  params:[
   {id:"calcium",name:"Calcium",unit:"mg/dL",all:[8.6,10.2],meaning:"Interpret with albumin, kidney function, vitamin D and symptoms."},
   {id:"phos",name:"Phosphorus",unit:"mg/dL",all:[2.5,4.5],meaning:"Bone-mineral and renal physiology marker."},
   {id:"vitd",name:"25-OH Vitamin D",unit:"ng/mL",all:[30,100],meaning:"Vitamin D status; thresholds and treatment targets vary by guideline and clinical context."},
   {id:"pth",name:"PTH",unit:"pg/mL",all:[15,65],meaning:"Parathyroid hormone; interpret with calcium, phosphorus, vitamin D and kidney function."}
  ]
 },
 "IRON":{
  title:"Iron / Hematinic Panel",system:"Hematology",
  params:[
   {id:"ferritin",name:"Ferritin",unit:"ng/mL",male:[30,400],female:[13,150],meaning:"Iron storage marker; also rises with inflammation."},
   {id:"iron",name:"Serum Iron",unit:"µg/dL",all:[60,170],meaning:"Variable marker; best interpreted with TIBC/transferrin saturation and ferritin."},
   {id:"tibc",name:"TIBC",unit:"µg/dL",all:[240,450],meaning:"Iron-binding capacity; helps characterize iron deficiency patterns."},
   {id:"b12",name:"Vitamin B12",unit:"pg/mL",all:[200,900],meaning:"Low values may contribute to macrocytosis or neurologic symptoms; borderline values may need context."},
   {id:"folate",name:"Folate",unit:"ng/mL",all:[4,20],meaning:"Folate status; interpret with CBC and clinical context."}
  ]
 },
 "URINE":{
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
};
let currentLabPanel="CBC";

function refRangeFor(p,sex){
 if(p.textNormal)return p.textNormal;
 const r=(sex==="Female"&&p.female)?p.female:(sex==="Male"&&p.male)?p.male:p.all||p.male||p.female;
 return r?`${r[0]}–${r[1]}`:"Lab-specific";
}
function numericRangeFor(p,sex){
 return (sex==="Female"&&p.female)?p.female:(sex==="Male"&&p.male)?p.male:p.all||null;
}
function autoStatus(value,p,sex){
 if(value===null||value===undefined||String(value).trim()==="")return "Not assessed";
 if(p.textNormal){
   const x=String(value).trim().toLowerCase();
   return (x==="negative"||x==="nil"||x==="absent")?"Normal":"Abnormal";
 }
 const num=Number(value); if(Number.isNaN(num))return "Not assessed";
 const r=numericRangeFor(p,sex); if(!r)return "Not assessed";
 const [lo,hi]=r;
 if(num<lo){
   const delta=(lo-num)/(Math.abs(lo)||1);
   return delta<=0.10?"Borderline low":"Low";
 }
 if(num>hi){
   const delta=(num-hi)/(Math.abs(hi)||1);
   return delta<=0.10?"Borderline high":"High";
 }
 return "Normal";
}
function statusClass(s){
 if(s==="Normal")return "status-normal";
 if(s==="High"||s==="Low"||s==="Abnormal")return "status-high";
 if(s.startsWith("Borderline"))return "status-borderline";
 return "status-na";
}
function selectLabPanel(key){
 currentLabPanel=key;
 document.querySelectorAll(".lab-panel-btn").forEach(b=>b.classList.toggle("active",b.dataset.panel===key));
 renderLabParameters();
}
function renderLabPanelButtons(){
 if(!$("labPanelButtons"))return;
 $("labPanelButtons").innerHTML=Object.entries(labPanels).map(([k,p])=>`<button class="lab-panel-btn ${k===currentLabPanel?"active":""}" data-panel="${k}" onclick="selectLabPanel('${k}')">${p.title}</button>`).join("");
}
function renderLabParameters(existing=null){
 if(!$("labParameterTable"))return;
 const panel=labPanels[currentLabPanel],sex=v("liSex")||db.profile.sex||"Male",q=(v("liSearch")||"").toLowerCase();
 $("labPanelTitle").textContent=panel.title;$("labPanelSystem").textContent=panel.system;$("labPanelCount").textContent=`${panel.params.length} parameters`;
 const previous=existing||{};
 let rows=panel.params.filter(p=>(p.name+" "+p.meaning).toLowerCase().includes(q)).map(p=>{
   const old=previous[p.id]||{};
   const ref=old.ref||refRangeFor(p,sex);
   const val=old.value??"";
   const stat=old.status||autoStatus(val,p,sex);
   return `<tr>
    <td><div class="param-name">${p.name}</div><div class="param-meaning">${p.meaning}</div></td>
    <td>${p.unit||""}</td>
    <td><input class="range-input" id="ref_${p.id}" value="${ref}"></td>
    <td><input class="result-input" id="val_${p.id}" value="${val}" oninput="updateParamStatus('${p.id}')"></td>
    <td><select class="status-select ${statusClass(stat)}" id="status_${p.id}" onchange="this.className='status-select '+statusClass(this.value)">
      ${["Not assessed","Normal","Borderline low","Low","Borderline high","High","Abnormal"].map(s=>`<option ${s===stat?"selected":""}>${s}</option>`).join("")}
    </select></td>
    <td><input id="remark_${p.id}" value="${old.remark||""}" placeholder="Remark"></td>
   </tr>`;
 }).join("");
 $("labParameterTable").innerHTML=`<div class="lab-param-table"><table><thead><tr><th>Parameter & meaning</th><th>Unit</th><th>Reference range</th><th>Your value</th><th>Status</th><th>Remark</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
   out[p.id]={name:p.name,unit:p.unit,value:v("val_"+p.id),ref:v("ref_"+p.id),status:v("status_"+p.id),remark:v("remark_"+p.id),meaning:p.meaning};
 });
 return out;
}
function saveLabInterpretation(){
 const obj={panel:currentLabPanel,title:labPanels[currentLabPanel].title,system:labPanels[currentLabPanel].system,date:v("liDate"),sex:v("liSex"),facility:v("liFacility"),context:v("liContext"),remarks:v("liRemarks"),attachment:pendingFiles.li||null,values:collectCurrentPanelValues()};
 const idx=v("liEditIndex");if(idx!=="")db.labInterpretations[+idx]=obj;else db.labInterpretations.unshift(obj);
 resetLabInterpretation();persist()
}
function editLabInterpretation(i){
 const x=db.labInterpretations[i];showView("labcentre");currentLabPanel=x.panel||"CBC";renderLabPanelButtons();
 $("liDate").value=x.date||today();$("liSex").value=x.sex||"Male";$("liFacility").value=x.facility||"";$("liContext").value=x.context||"";$("liRemarks").value=x.remarks||"";$("liEditIndex").value=i;
 renderLabParameters(x.values||{});
}
function deleteLabInterpretation(i){if(confirm("Delete this interpreted panel?")){db.labInterpretations.splice(i,1);persist()}}
function resetLabInterpretation(){
 ["liFacility","liContext","liRemarks","liEditIndex","liSearch"].forEach(id=>{if($(id))$(id).value=""});
 if($("liDate"))$("liDate").value=today();pendingFiles.li=null;if($("liFileName"))$("liFileName").textContent="";renderLabParameters()
}
function generateCurrentPanelSummary(){
 if(!$("currentPanelSummary"))return;
 const vals=collectCurrentPanelValues(),panel=labPanels[currentLabPanel],abn=Object.values(vals).filter(x=>!["Normal","Not assessed"].includes(x.status)),normal=Object.values(vals).filter(x=>x.status==="Normal"),na=Object.values(vals).filter(x=>x.status==="Not assessed");
 let lines=[`${panel.title}: ${abn.length} flagged • ${normal.length} within selected range • ${na.length} not assessed.`];
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
 if((alt!==null&&alt>56)||(ast!==null&&ast>40))out.push("Transaminase-predominant elevation suggests a hepatocellular injury pattern; magnitude, persistence and clinical cause matter.");
 if(alp!==null&&alp>147 && (ggt===null||ggt>61))out.push("ALP/GGT-predominant elevation may suggest a cholestatic/hepatobiliary pattern; correlate with bilirubin and imaging when indicated.");
 if(tb!==null&&tb>1.2)out.push("Bilirubin is elevated; fractionation and clinical jaundice context help characterize the pattern.");
 return out.join("\n");
}
function rftPattern(vs){
 let e=numVal(vs,"egfr"),cr=numVal(vs,"creat"),uacr=numVal(vs,"uacr"),k=numVal(vs,"potassium"),out=[];
 if(e!==null&&e<60)out.push("eGFR below 60 is important if persistent; chronic kidney disease classification also uses duration and albuminuria.");
 if(uacr!==null&&uacr>=30)out.push("Albuminuria is elevated; persistence and eGFR together guide kidney-risk assessment.");
 if(cr!==null&&["High","Borderline high"].includes(vs.creat.status))out.push("Creatinine is above the selected range; review previous baseline, hydration, muscle mass and medicines.");
 if(k!==null&&(k<3.0||k>5.5))out.push("Potassium is substantially abnormal and may require prompt clinical reassessment depending on context.");
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
    <div class="saved-panel-head"><div><b>${x.title}</b><small style="display:block;color:var(--muted)">${x.date||""} • ${x.sex||""} • ${x.facility||""}</small></div>
    <div><span class="pill ${abn.length?"red":"green"}">${abn.length} flagged</span> <button class="action-btn edit-btn" onclick="editLabInterpretation(${i})">Edit</button><button class="action-btn delete-btn" onclick="deleteLabInterpretation(${i})">Delete</button></div></div>
    <div class="saved-panel-body">${chips||'<span class="muted">No numeric results entered.</span>'}${x.attachment?.name?`<p><b>Attachment:</b> ${x.attachment.name}</p>`:""}${x.remarks?`<p><b>Remarks:</b> ${x.remarks}</p>`:""}</div>
   </div>`;
 }).join("");
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
function calcSleepDuration(){
 const s=v("tdSleepStart"),e=v("tdSleepEnd"); if(!s||!e)return;
 let [sh,sm]=s.split(":").map(Number),[eh,em]=e.split(":").map(Number);
 let mins=(eh*60+em)-(sh*60+sm); if(mins<0)mins+=1440;
 $("tdSleep").value=(mins/60).toFixed(1);
}
["tdSleepStart","tdSleepEnd"].forEach(id=>$(id).addEventListener("change",calcSleepDuration));

function fileMetaFromInput(id,key){
 const f=$(id)?.files?.[0]; if(!f)return;
 pendingFiles[key]={name:f.name,type:f.type,size:f.size};
 const label={td:"tdFileName",ayu:"ayuFileName",lab:"labFileName",img:"imgFileName",med:"medFileName",tx:"txFileName",vl:"vlFileName",li:"liFileName"}[key];
 if($(label))$(label).textContent=`Selected: ${f.name} (${Math.round(f.size/1024)} KB)`;
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
function renderAll(){applyAutoRitu();renderForms();renderDashboard();renderRitu();renderInvestigations();renderTables();renderSleep();renderPhysician();renderExperiments();renderPreventive();renderVault();renderLabPanelButtons();renderLabParameters();renderSavedLabPanels();renderTimeline();generateDailySummary();generateAyurvedaSummary();generateInvestigationSummary();generateHabitSummary()}
if($("hbDate"))$("hbDate").value=today(); if($("slDate"))$("slDate").value=today(); if($("phDate"))$("phDate").value=today(); if($("exStart"))$("exStart").value=today(); if($("pvDue"))$("pvDue").value=today(); if($("vlDate"))$("vlDate").value=today(); if($("liDate"))$("liDate").value=today();
renderAll();

if($("liSex"))$("liSex").addEventListener("change",()=>renderLabParameters());
