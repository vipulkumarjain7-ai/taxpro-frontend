import { useState, useRef, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API || "https://taxpro-backend-xi90.onrender.com/api";

const api = async (path, method="GET", body=null, token=null) => {
  const headers = { "Content-Type":"application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message||"Request failed");
  return data;
};

const S = {
  app:      { display:"flex", minHeight:"100vh", fontFamily:"'Inter',sans-serif", fontSize:13, background:"#0D1117", color:"#C9D1D9" },
  sidebar:  { width:220, minWidth:220, background:"#161B22", borderRight:"1px solid #21262D", display:"flex", flexDirection:"column", overflowY:"auto" },
  main:     { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:   { padding:"12px 20px", background:"#161B22", borderBottom:"1px solid #21262D", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 },
  content:  { flex:1, overflowY:"auto", padding:18, background:"#0D1117" },
  card:     { background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:16, marginBottom:12 },
  kpiGrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 },
  kpi:      { background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:"14px 16px" },
  kpiLabel: { fontSize:10, color:"#8B949E", textTransform:"uppercase", letterSpacing:0.6, marginBottom:6 },
  kpiVal:   { fontSize:24, fontWeight:700, lineHeight:1, color:"#E6EDF3" },
  kpiSub:   { fontSize:11, marginTop:4, color:"#8B949E" },
  tbl:      { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:       { textAlign:"left", padding:"8px 10px", color:"#8B949E", borderBottom:"1px solid #21262D", fontWeight:500, fontSize:11 },
  td:       { padding:"8px 10px", borderBottom:"1px solid #21262D", color:"#C9D1D9", verticalAlign:"middle" },
  tdL:      { padding:"8px 10px", color:"#C9D1D9", verticalAlign:"middle" },
  mono:     { fontFamily:"monospace", fontSize:11, color:"#8B949E" },
  twoCol:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  input:    { padding:"9px 12px", borderRadius:8, border:"1px solid #30363D", background:"#0D1117", color:"#C9D1D9", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
  select:   { padding:"7px 10px", borderRadius:8, border:"1px solid #30363D", background:"#161B22", color:"#C9D1D9", fontSize:12, fontFamily:"inherit" },
  btn:      { padding:"9px 18px", borderRadius:8, border:"none", background:"#1F6FEB", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" },
  btnG:     { padding:"9px 18px", borderRadius:8, border:"none", background:"#238636", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" },
  btnGhost: { padding:"7px 14px", borderRadius:8, border:"1px solid #30363D", background:"transparent", color:"#8B949E", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  btnDanger:{ padding:"7px 14px", borderRadius:8, border:"1px solid #6e1c1c", background:"transparent", color:"#f85149", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  label:    { fontSize:12, color:"#8B949E", display:"block", marginBottom:5 },
  fg:       { marginBottom:14 },
  aiWrap:   { display:"flex", flexDirection:"column", height:"calc(100vh - 100px)" },
  aiMsgs:   { flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10 },
  bubU:     { background:"#1F6FEB", color:"#fff", padding:"9px 13px", borderRadius:"16px 16px 4px 16px", maxWidth:"78%", marginLeft:"auto", lineHeight:1.6, whiteSpace:"pre-wrap" },
  bubA:     { background:"#21262D", border:"1px solid #30363D", color:"#C9D1D9", padding:"9px 13px", borderRadius:"16px 16px 16px 4px", maxWidth:"84%", lineHeight:1.6, whiteSpace:"pre-wrap" },
};

const fmtMoney = n => `Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const badge = (txt, color) => {
  const map = { green:{bg:"#0d2818",color:"#3fb950",border:"#238636"}, amber:{bg:"#2d1b00",color:"#e3b341",border:"#9e6a03"}, red:{bg:"#2d0e0e",color:"#f85149",border:"#6e1c1c"}, blue:{bg:"#0c1d2e",color:"#58a6ff",border:"#1f4872"}, gray:{bg:"#21262D",color:"#8b949e",border:"#30363D"}, purple:{bg:"#1a0a2e",color:"#bf91f3",border:"#6e40c9"}, teal:{bg:"#002d2d",color:"#39d0d0",border:"#006666"} };
  const c = map[color]||map.gray;
  return <span style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{txt}</span>;
};

const StatusBadge = ({s}) => { const m={compliant:["Compliant","green"],pending:["Pending","amber"],notice:["Notice","red"],overdue:["Overdue","red"],paid:["Paid","green"],unpaid:["Unpaid","red"],partial:["Partial","amber"]}; const [l,c]=m[s]||[s,"gray"]; return badge(l,c); };
const ReturnPill  = ({s}) => { const m={filed:["Filed","green"],pending:["Pending","amber"],"not-filed":["Not Filed","red"]}; const [l,c]=m[s]||[s,"gray"]; return badge(l,c); };
const PrioBadge   = ({p}) => { const m={critical:["Critical","red"],high:["High","amber"],medium:["Medium","blue"],low:["Low","gray"]}; const [l,c]=m[p]||[p,"gray"]; return badge(l,c); };

const Spinner = () => (<div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:28,height:28,border:"3px solid #21262D",borderTop:"3px solid #1F6FEB",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Toast   = ({msg,type,onClose}) => (<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#2d0e0e":"#0d2818",border:`1px solid ${type==="error"?"#6e1c1c":"#238636"}`,color:type==="error"?"#f85149":"#3fb950",padding:"12px 18px",borderRadius:10,fontSize:13,maxWidth:340,display:"flex",alignItems:"center",gap:10}}><span>{msg}</span><button onClick={onClose} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16,marginLeft:"auto"}}>x</button></div>);
const Modal   = ({title,onClose,children,wide}) => (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:30,overflowY:"auto"}}><div style={{background:"#161B22",border:"1px solid #30363D",borderRadius:12,padding:24,width:wide?"min(820px,96vw)":"min(540px,92vw)",maxHeight:"88vh",overflowY:"auto",margin:"0 auto"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,position:"sticky",top:0,background:"#161B22",zIndex:1,paddingBottom:12,borderBottom:"1px solid #21262D"}}><span style={{fontSize:15,fontWeight:600,color:"#E6EDF3"}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:22}}>x</button></div>{children}</div></div>);

// ── AUTH ───────────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:"",firm_name:"",frn:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    setError("");setLoading(true);
    try{
      const endpoint=tab==="login"?"/auth/login":"/auth/register";
      const body=tab==="login"?{email:form.email,password:form.password}:{name:form.name,email:form.email,password:form.password,firm_name:form.firm_name,frn:form.frn};
      const data=await api(endpoint,"POST",body);
      localStorage.setItem("taxpro_token",data.token);
      localStorage.setItem("taxpro_user",JSON.stringify(data.user));
      onAuth(data.user,data.token);
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"#0D1117",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
      <div style={{width:"min(420px,92vw)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:30,fontWeight:800,color:"#E6EDF3"}}>TaxPro</div>
          <div style={{fontSize:13,color:"#8B949E",marginTop:4}}>Complete Accounting + GST Software</div>
        </div>
        <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:12,padding:28}}>
          <div style={{display:"flex",gap:4,marginBottom:22,background:"#0D1117",borderRadius:8,padding:4}}>
            {["login","register"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:tab===t?"#1F6FEB":"transparent",color:tab===t?"#fff":"#8B949E"}}>{t==="login"?"Login":"Register"}</button>))}
          </div>
          {tab==="register"&&<>
            <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} placeholder="CA Rahul Prakash" value={form.name} onChange={set("name")}/></div>
            <div style={S.fg}><label style={S.label}>Firm Name *</label><input style={S.input} placeholder="Prakash & Associates" value={form.firm_name} onChange={set("firm_name")}/></div>
            <div style={S.fg}><label style={S.label}>FRN (optional)</label><input style={S.input} placeholder="001234N" value={form.frn} onChange={set("frn")}/></div>
          </>}
          <div style={S.fg}><label style={S.label}>Email *</label><input style={S.input} type="email" placeholder="you@firm.com" value={form.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div style={S.fg}><label style={S.label}>Password *</label><input style={S.input} type="password" placeholder="min 6 characters" value={form.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          {error&&<div style={{background:"#2d0e0e",border:"1px solid #6e1c1c",color:"#f85149",padding:"8px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{error}</div>}
          <button onClick={submit} disabled={loading} style={{...S.btn,width:"100%",padding:"11px",opacity:loading?0.6:1}}>{loading?"Please wait...":tab==="login"?"Login":"Create Account"}</button>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({token}) {
  const [gst,setGst]=useState(null);
  const [inv,setInv]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([api("/dashboard","GET",null,token).catch(()=>null),api("/invoices/stats/summary","GET",null,token).catch(()=>null)])
      .then(([g,i])=>{setGst(g?.dashboard);setInv(i?.stats);setLoading(false);});
  },[token]);
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{marginBottom:10}}>{badge("Accounting & GST Dashboard","blue")}</div>
      <div style={S.kpiGrid}>
        {[{label:"Monthly Sales",val:fmtMoney(inv?.monthly_sales||0),color:"#3fb950"},{label:"Monthly Purchases",val:fmtMoney(inv?.monthly_purchases||0),color:"#58a6ff"},{label:"Outstanding",val:fmtMoney(inv?.total_outstanding||0),color:"#e3b341"},{label:"Overdue",val:fmtMoney(inv?.overdue_amount||0),color:"#f85149"}].map(k=>(<div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{...S.kpiVal,fontSize:16,color:k.color}}>{k.val}</div></div>))}
      </div>
      <div style={S.kpiGrid}>
        {[{label:"Total GST Clients",val:gst?.clients?.total||0,color:"#E6EDF3"},{label:"Compliant",val:gst?.clients?.compliant||0,color:"#3fb950"},{label:"Open Notices",val:gst?.notices?.open||0,color:"#f85149"},{label:"Due in 30 Days",val:gst?.notices?.due_in_30_days||0,color:"#e3b341"}].map(k=>(<div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{...S.kpiVal,color:k.color}}>{k.val}</div></div>))}
      </div>
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Upcoming Notice Due Dates</div>
          {!gst?.upcoming_notices?.length?<div style={{color:"#3fb950",fontSize:12}}>No notices due in 30 days</div>:gst.upcoming_notices.map(n=>(<div key={n.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D"}}><div><div style={{fontWeight:500,color:"#E6EDF3",fontSize:12}}>{n.type}</div><div style={{fontSize:11,color:"#8B949E"}}>{n.client_name}</div></div>{badge(n.due_date,"amber")}</div>))}
        </div>
        {gst?.returns_summary&&<div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Filing — {gst.returns_summary.period}</div>
          <table style={S.tbl}><thead><tr>{["Return","Filed","Pending","Not Filed"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{[["GSTR-1","gstr1"],["GSTR-3B","gstr3b"],["GSTR-9","gstr9"]].map(([lbl,key])=>(<tr key={key}><td style={S.td}>{lbl}</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{gst.returns_summary[key].filed}</td><td style={{...S.td,color:"#e3b341",fontWeight:600}}>{gst.returns_summary[key].pending}</td><td style={{...S.tdL,color:"#f85149",fontWeight:600}}>{gst.returns_summary[key].not_filed}</td></tr>))}</tbody></table>
        </div>}
      </div>
    </div>
  );
}

// ── NOTICES ────────────────────────────────────────────────────────────────
function Notices({token,toast}) {
  const [notices,setNotices]=useState([]);
  const [clients,setClients]=useState([]);
  const [filter,setFilter]=useState("all");
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({client_id:"",ref_no:"",type:"",issued_date:"",due_date:"",amount:"",priority:"medium",description:""});
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/notices${filter!=="all"?`?status=${filter}`:""}`, "GET",null,token),api("/clients","GET",null,token)]).then(([nd,cd])=>{setNotices(nd.notices);setClients(cd.clients);setLoading(false);}).catch(()=>setLoading(false));},[token,filter]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/notices","POST",{...form,amount:parseFloat(form.amount)||0},token);toast("Notice added","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateStatus=async(id,status)=>{try{await api(`/notices/${id}/status`,"PATCH",{status},token);load();}catch(e){toast(e.message,"error");}};
  const del=async(id)=>{if(!window.confirm("Delete?"))return;try{await api(`/notices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const tabs=["all","pending","in-progress","overdue","replied","closed"];
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {tabs.map(t=>(<button key={t} onClick={()=>setFilter(t)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:filter===t?"#58a6ff":"#30363D",background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":"#8B949E",fontWeight:filter===t?600:400}}>{t==="all"?"All":t==="in-progress"?"In Progress":t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto",padding:"5px 14px"}}>+ Add Notice</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{notices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No notices found.</div>:(<table style={S.tbl}><thead><tr>{["Ref No.","Client","Type","Issued","Due","Amount","Priority","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{notices.map(n=>(<tr key={n.id}><td style={S.td}><span style={S.mono}>{n.ref_no}</span></td><td style={S.td}><div style={{fontWeight:500,color:"#E6EDF3"}}>{n.client_name}</div><div style={S.mono}>{n.gstin}</div></td><td style={S.td}>{n.type}</td><td style={S.td}>{n.issued_date}</td><td style={{...S.td,color:n.status==="overdue"?"#f85149":"#C9D1D9",fontWeight:n.status==="overdue"?700:400}}>{n.due_date}</td><td style={{...S.td,fontWeight:600}}>Rs.{Number(n.amount).toLocaleString("en-IN")}</td><td style={S.td}><PrioBadge p={n.priority}/></td><td style={S.td}><select value={n.status} onChange={e=>updateStatus(n.id,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>{["pending","in-progress","replied","closed","overdue"].map(s=><option key={s}>{s}</option>)}</select></td><td style={S.tdL}><button onClick={()=>del(n.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Notice" onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {[{l:"Ref No. *",k:"ref_no",ph:"ZD071125006543C"},{l:"Notice Type *",k:"type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Amount *",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={S.fg}><label style={S.label}>Issued Date *</label><input style={S.input} type="date" value={form.issued_date} onChange={e=>setForm(p=>({...p,issued_date:e.target.value}))}/></div><div style={S.fg}><label style={S.label}>Due Date *</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/></div></div>
      <div style={S.fg}><label style={S.label}>Priority</label><select style={{...S.select,width:"100%"}} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["critical","high","medium","low"].map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div>
    </Modal>)}
  </div>);
}

// ── RETURNS ────────────────────────────────────────────────────────────────
function Returns({token,toast}) {
  const [returns,setReturns]=useState([]);
  const [clients,setClients]=useState([]);
  const [period,setPeriod]=useState("FY 2024-25");
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({client_id:"",period:"FY 2024-25",gstr1_status:"not-filed",gstr3b_status:"not-filed",gstr9_status:"not-filed"});
  const PERIODS=["FY 2024-25","FY 2023-24","FY 2022-23","FY 2021-22"];
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/returns?period=${encodeURIComponent(period)}`,"GET",null,token),api("/clients","GET",null,token)]).then(([rd,cd])=>{setReturns(rd.returns);setClients(cd.clients);setLoading(false);}).catch(()=>setLoading(false));},[token,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/returns","POST",form,token);toast("Saved","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateField=async(id,key,val)=>{const rec=returns.find(r=>r.id===id);if(!rec)return;try{await api(`/returns/${id}`,"PUT",{...rec,[key]:val},token);load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
      <span style={{fontSize:12,color:"#8B949E"}}>FY:</span>
      <select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={()=>{setForm(f=>({...f,period}));setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Record</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{returns.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No records for {period}.</div>:(<table style={S.tbl}><thead><tr>{["Client","GSTIN","GSTR-1","GSTR-3B","GSTR-9","Overall"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{returns.map(r=>{const all=[r.gstr1_status,r.gstr3b_status,r.gstr9_status];const ov=all.every(s=>s==="filed")?"compliant":all.some(s=>s==="not-filed")?"overdue":"pending";return(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.client_name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td>{[["gstr1_status"],["gstr3b_status"],["gstr9_status"]].map(([key])=>(<td key={key} style={S.td}><select value={r[key]} onChange={e=>updateField(r.id,key,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>{["filed","pending","not-filed"].map(s=><option key={s}>{s}</option>)}</select></td>))}<td style={S.tdL}><StatusBadge s={ov}/></td></tr>);})}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Return Record" onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Period *</label><select style={{...S.select,width:"100%"}} value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
      {[["gstr1_status","GSTR-1"],["gstr3b_status","GSTR-3B"],["gstr9_status","GSTR-9"]].map(([key,lbl])=>(<div key={key} style={S.fg}><label style={S.label}>{lbl} Status</label><select style={{...S.select,width:"100%"}} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>{["not-filed","pending","filed"].map(s=><option key={s}>{s}</option>)}</select></div>))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
  </div>);
}

// ── RECONCILIATION ─────────────────────────────────────────────────────────
function Reconciliation({token,toast}) {
  const [clients,setClients]=useState([]);
  const [clientId,setClientId]=useState("");
  const [period,setPeriod]=useState("FY 2024-25");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:"",remarks:""});
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients);if(d.clients.length)setClientId(d.clients[0].id);});},[token]);
  const load=useCallback(()=>{if(!clientId)return;setLoading(true);api(`/reconciliation?client_id=${clientId}&period=${encodeURIComponent(period)}`,"GET",null,token).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));},[token,clientId,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/reconciliation","POST",{...form,client_id:clientId,period,invoice_count:parseInt(form.invoice_count)||0,gstr2a_amount:parseFloat(form.gstr2a_amount)||0,gstr2b_amount:parseFloat(form.gstr2b_amount)||0,books_amount:parseFloat(form.books_amount)||0},token);toast("Added","success");setShowModal(false);setForm({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:"",remarks:""});load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async(id)=>{try{await api(`/reconciliation/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const fmtR=n=>`Rs.${Number(n||0).toLocaleString("en-IN")}`;
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:12,color:"#8B949E"}}>Client:</span>
      <select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <span style={{fontSize:12,color:"#8B949E"}}>Period:</span>
      <select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Entry</button>
    </div>
    {data?.summary&&(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Matched",v:data.summary.matched,c:"#3fb950"},{l:"Mismatched",v:data.summary.mismatch,c:"#e3b341"},{l:"Missing",v:data.summary.missing,c:"#f85149"},{l:"ITC Risk",v:fmtR(data.summary.total_itc_risk),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>)}
    {loading?<Spinner/>:(<div style={S.card}>{!data||data.rows.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No entries yet.</div>:(<table style={S.tbl}><thead><tr>{["Vendor","GSTIN","Inv","GSTR-2A","GSTR-2B","Books","Diff","Status",""].map((h,i)=><th key={i} style={{...S.th,textAlign:i>=3&&i<=6?"right":"left"}}>{h}</th>)}</tr></thead><tbody>{data.rows.map(r=>(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.vendor_name}</td><td style={S.td}><span style={S.mono}>{r.vendor_gstin}</span></td><td style={S.td}>{r.invoice_count}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.gstr2a_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.gstr2b_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.books_amount)}</td><td style={{...S.td,textAlign:"right",fontWeight:r.difference!==0?700:400,color:r.difference<0?"#f85149":r.difference>0?"#e3b341":"#3fb950"}}>{r.difference===0?"—":fmtR(r.difference)}</td><td style={S.td}>{r.status==="matched"?badge("Matched","green"):r.status==="mismatch"?badge("Mismatch","amber"):badge("Missing","red")}</td><td style={S.tdL}><button onClick={()=>del(r.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Entry" onClose={()=>setShowModal(false)}>{[{l:"Vendor Name *",k:"vendor_name",ph:"ABC Suppliers Pvt Ltd"},{l:"Vendor GSTIN *",k:"vendor_gstin",ph:"07AABCA1234B1Z5"},{l:"Invoice Count",k:"invoice_count",ph:"12",t:"number"},{l:"GSTR-2A Amount",k:"gstr2a_amount",ph:"145000",t:"number"},{l:"GSTR-2B Amount",k:"gstr2b_amount",ph:"143000",t:"number"},{l:"Books Amount *",k:"books_amount",ph:"147000",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div></Modal>)}
  </div>);
}

// ── GST CALCULATOR ─────────────────────────────────────────────────────────
function GSTCalculator() {
  const [amount,setAmount]=useState("");
  const [rate,setRate]=useState("18");
  const [type,setType]=useState("exclusive");
  const [txnType,setTxnType]=useState("inter");
  const amt=parseFloat(amount)||0, r=parseFloat(rate)||0;
  let base,gst,total,cgst,sgst,igst;
  if(type==="exclusive"){base=amt;gst=amt*r/100;total=amt+gst;}else{total=amt;base=amt/(1+r/100);gst=total-base;}
  if(txnType==="intra"){cgst=gst/2;sgst=gst/2;igst=0;}else{igst=gst;cgst=0;sgst=0;}
  const f=n=>n.toFixed(2);
  return(<div style={{maxWidth:600}}>
    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:16}}>GST Calculator</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div><label style={S.label}>Amount (Rs.)</label><input style={S.input} type="number" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        <div><label style={S.label}>GST Rate</label><select style={{...S.select,width:"100%"}} value={rate} onChange={e=>setRate(e.target.value)}>{["0","0.1","0.25","1","1.5","3","5","6","7.5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
        <div><label style={S.label}>Calculation Type</label><select style={{...S.select,width:"100%"}} value={type} onChange={e=>setType(e.target.value)}><option value="exclusive">Exclusive (Add GST)</option><option value="inclusive">Inclusive (Remove GST)</option></select></div>
        <div><label style={S.label}>Transaction Type</label><select style={{...S.select,width:"100%"}} value={txnType} onChange={e=>setTxnType(e.target.value)}><option value="inter">Inter-State (IGST)</option><option value="intra">Intra-State (CGST+SGST)</option></select></div>
      </div>
      {amt>0&&(<div style={{background:"#0D1117",borderRadius:8,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Result</div>
        {[{l:"Base Amount",v:`Rs. ${f(base)}`,c:"#C9D1D9"},...(txnType==="intra"?[{l:`CGST @ ${r/2}%`,v:`Rs. ${f(cgst)}`,c:"#e3b341"},{l:`SGST @ ${r/2}%`,v:`Rs. ${f(sgst)}`,c:"#e3b341"}]:[{l:`IGST @ ${r}%`,v:`Rs. ${f(igst)}`,c:"#e3b341"}]),{l:"Total GST",v:`Rs. ${f(gst)}`,c:"#f85149"},{l:"Total Amount",v:`Rs. ${f(total)}`,c:"#3fb950"}].map(row=>(<div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{row.l}</span><span style={{fontWeight:700,color:row.c}}>{row.v}</span></div>))}
      </div>)}
    </div>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Rate Reference</div>
      <table style={S.tbl}><thead><tr>{["Rate","Category","Examples"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{[["0%","Exempt","Fresh vegetables, milk, eggs"],["5%","Essential","Branded food, transport"],["12%","Standard","Processed food, computers"],["18%","Standard","Most services, electronics"],["28%","Luxury","Cars, tobacco, aerated drinks"]].map(([r,c,e])=>(<tr key={r}><td style={{...S.td,fontWeight:700,color:"#e3b341"}}>{r}</td><td style={S.td}>{c}</td><td style={S.tdL}>{e}</td></tr>))}</tbody>
      </table>
    </div>
  </div>);
}

// ── COMPLIANCE CALENDAR ────────────────────────────────────────────────────
function ComplianceCalendar() {
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now=new Date();
  const [selMonth,setSelMonth]=useState(now.getMonth());
  const [selYear,setSelYear]=useState(now.getFullYear());
  const getDueDates=(month,year)=>{
    const m=String(month+1).padStart(2,"0");
    return [
      {date:`${year}-${m}-11`,form:"GSTR-1",desc:`Monthly return — ${months[month===0?11:month-1]} ${month===0?year-1:year}`,color:"blue"},
      {date:`${year}-${m}-20`,form:"GSTR-3B",desc:"Summary return & tax payment",color:"amber"},
      {date:`${year}-${m}-22`,form:"GSTR-3B (Cat-1)",desc:"Cat-1 states",color:"amber"},
      {date:`${year}-${m}-24`,form:"GSTR-3B (Cat-2)",desc:"Cat-2 states",color:"amber"},
    ].sort((a,b)=>new Date(a.date)-new Date(b.date));
  };
  const dueDates=getDueDates(selMonth,selYear);
  const today=now.toISOString().split("T")[0];
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
      <select style={S.select} value={selMonth} onChange={e=>setSelMonth(parseInt(e.target.value))}>{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
      <select style={S.select} value={selYear} onChange={e=>setSelYear(parseInt(e.target.value))}>{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
    </div>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Due Dates — {months[selMonth]} {selYear}</div>
      {dueDates.map((d,i)=>{const isPast=d.date<today;const isToday=d.date===today;return(<div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:"1px solid #21262D",opacity:isPast?0.6:1}}>
        <div style={{minWidth:50,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:isToday?"#f85149":isPast?"#8B949E":"#e3b341"}}>{d.date.split("-")[2]}</div><div style={{fontSize:10,color:"#8B949E"}}>{months[selMonth]}</div></div>
        <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>{badge(d.form,d.color)}{isToday&&badge("TODAY","red")}{isPast&&badge("Past","gray")}</div><div style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</div></div>
      </div>);})}
    </div>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Annual Returns</div>
      {[{date:"31 Dec",form:"GSTR-9",desc:"Annual return for regular taxpayers"},{date:"31 Dec",form:"GSTR-9C",desc:"Reconciliation statement (turnover > 5 Cr)"},{date:"30 Nov",form:"GSTR-4",desc:"Annual return for composition dealers"}].map((d,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{minWidth:60,fontSize:13,fontWeight:700,color:"#3fb950"}}>{d.date}</span>{badge(d.form,"green")}<span style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</span></div>))}
    </div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872"}}>
      <div style={{fontSize:12,color:"#58a6ff",fontWeight:600,marginBottom:8}}>Key Points</div>
      <div style={{fontSize:12,color:"#8B949E",lineHeight:1.9}}>• GSTR-1: 11th of every month<br/>• GSTR-3B: 20th/22nd/24th based on state<br/>• Late filing: Rs.50/day penalty<br/>• Interest @18% p.a. on late tax<br/>• Annual return: 31st December</div>
    </div>
  </div>);
}

// ── NOTICE REPLY GENERATOR ─────────────────────────────────────────────────
function NoticeReplyGenerator({token}) {
  const [clients,setClients]=useState([]);
  const [notices,setNotices]=useState([]);
  const [form,setForm]=useState({client_id:"",notice_type:"",ref_no:"",amount:"",description:""});
  const [reply,setReply]=useState("");
  const [loading,setLoading]=useState(false);
  useEffect(()=>{api("/clients","GET",null,token).then(d=>setClients(d.clients));},[token]);
  useEffect(()=>{if(form.client_id){api(`/notices?client_id=${form.client_id}`,"GET",null,token).then(d=>setNotices(d.notices||[]));};},[form.client_id,token]);
  const selectNotice=(id)=>{const n=notices.find(x=>x.id===id);if(n)setForm(f=>({...f,notice_type:n.type,ref_no:n.ref_no,amount:n.amount,description:n.description||""}));};
  const generate=async()=>{
    setLoading(true);setReply("");
    try{
      const client=clients.find(c=>c.id===form.client_id);
      const data=await api("/ai/generate-reply","POST",{client_name:client?.name||"",gstin:client?.gstin||"",notice_type:form.notice_type,ref_no:form.ref_no,amount:form.amount,description:form.description},token);
      setReply(data.reply||"");
    }catch(e){setReply("Error generating reply. Please try again.");}
    setLoading(false);
  };
  const copyReply=()=>navigator.clipboard.writeText(reply);
  const printReply=()=>{const client=clients.find(c=>c.id===form.client_id);const w=window.open("","_blank");w.document.write(`<html><head><title>GST Notice Reply</title><style>body{font-family:Arial;margin:40px;line-height:1.8;font-size:14px;}pre{white-space:pre-wrap;font-family:Arial;}</style></head><body><h2>GST Notice Reply</h2><p><strong>Client:</strong> ${client?.name||""}<br/><strong>GSTIN:</strong> ${client?.gstin||""}<br/><strong>Notice Ref:</strong> ${form.ref_no}</p><hr/><pre>${reply}</pre></body></html>`);w.document.close();w.print();};
  return(<div style={S.twoCol}>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Notice Details</div>
      <div style={S.fg}><label style={S.label}>Select Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {form.client_id&&<div style={S.fg}><label style={S.label}>Select Notice</label><select style={{...S.select,width:"100%"}} onChange={e=>selectNotice(e.target.value)}><option value="">Manual entry</option>{notices.map(n=><option key={n.id} value={n.id}>{n.ref_no} — {n.type}</option>)}</select></div>}
      {[{l:"Notice Type *",k:"notice_type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Reference No. *",k:"ref_no",ph:"ZD071125006543C"},{l:"Amount (Rs.)",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:80}} placeholder="Describe the issue..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <button onClick={generate} disabled={loading||!form.client_id||!form.notice_type} style={{...S.btn,width:"100%",opacity:loading||!form.client_id||!form.notice_type?0.5:1}}>{loading?"Generating...":"Generate AI Reply"}</button>
    </div>
    <div style={{...S.card,minHeight:300}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>Generated Reply</div>
        {reply&&(<div style={{display:"flex",gap:8}}><button onClick={copyReply} style={S.btnGhost}>Copy</button><button onClick={printReply} style={S.btnG}>Print/PDF</button></div>)}
      </div>
      {loading?<div style={{color:"#8B949E",textAlign:"center",padding:20}}>AI is generating reply...<br/>Please wait 10-20 seconds.</div>:reply?<div style={{fontSize:12,color:"#C9D1D9",whiteSpace:"pre-wrap",lineHeight:1.8,background:"#0D1117",padding:14,borderRadius:8}}>{reply}</div>:<div style={{color:"#8B949E",fontSize:13,padding:20,textAlign:"center"}}>Fill notice details and click Generate AI Reply.</div>}
    </div>
  </div>);
}

// ── GSTR-2A IMPORT ─────────────────────────────────────────────────────────
function GSTR2AImport({token,toast}) {
  const [clients,setClients]=useState([]);
  const [clientId,setClientId]=useState("");
  const [period,setPeriod]=useState("FY 2024-25");
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [importing,setImporting]=useState(false);
  const [previewing,setPreviewing]=useState(false);
  const [imported,setImported]=useState(null);
  const [step,setStep]=useState(1);
  const PERIODS=["FY 2024-25","FY 2023-24","FY 2022-23","FY 2021-22"];
  const fmtG=n=>`Rs.${Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients);if(d.clients[0])setClientId(d.clients[0].id);});},[token]);
  const previewFile=async()=>{
    if(!file)return toast("Select a file","error");
    setPreviewing(true);
    try{const formData=new FormData();formData.append("file",file);const res=await fetch(`${API}/gstr2a/preview`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:formData});const data=await res.json();if(data.success){setPreview(data.preview);setStep(2);}else toast(data.message,"error");}catch(e){toast("Preview failed","error");}
    setPreviewing(false);
  };
  const importData=async()=>{
    if(!file||!clientId)return toast("Select client and file","error");
    setImporting(true);
    try{const formData=new FormData();formData.append("file",file);formData.append("client_id",clientId);formData.append("period",period);const res=await fetch(`${API}/gstr2a/import`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:formData});const data=await res.json();if(data.success){setImported(data);setStep(3);toast(data.message,"success");}else toast(data.message,"error");}catch(e){toast("Import failed","error");}
    setImporting(false);
  };
  const reset=()=>{setFile(null);setPreview(null);setImported(null);setStep(1);};
  return(<div>
    <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,label:"Upload"},{n:2,label:"Preview"},{n:3,label:"Done"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.label}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:20}}/>}</div>))}</div>
    {step===1&&(<div>
      <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:10}}>How to download GSTR-2A</div>
        {["Login to gst.gov.in","Go to Services → Returns → Returns Dashboard","Select FY and Period","Find GSTR-2A → Download","Upload the Excel/JSON file below"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"4px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700,minWidth:20}}>{i+1}.</span><span>{s}</span></div>))}
      </div>
      <div style={S.card}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={S.label}>Period *</label><select style={{...S.select,width:"100%"}} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
        </div>
        <div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>
          {file?(<div><div style={{fontSize:24,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:32,marginBottom:8}}>📁</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:12}}>Drop GSTR-2A Excel or JSON file here</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose File<input type="file" accept=".xlsx,.xls,.json,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}
        </div>
        <button onClick={previewFile} disabled={!file||previewing} style={{...S.btn,width:"100%",opacity:!file||previewing?0.5:1}}>{previewing?"Reading file...":"Preview Data →"}</button>
      </div>
    </div>)}
    {step===2&&preview&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>{[{label:"Total Invoices",val:preview.total_invoices,color:"#58a6ff"},{label:"Total Suppliers",val:preview.total_suppliers,color:"#e3b341"},{label:"Total ITC",val:fmtG(preview.total_itc),color:"#3fb950"},{label:"Client",val:clients.find(c=>c.id===clientId)?.name?.split(" ")[0]||"—",color:"#C9D1D9"}].map(k=>(<div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{fontSize:k.label==="Total ITC"?14:22,fontWeight:700,color:k.color}}>{k.val}</div></div>))}</div>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Supplier-wise ITC Preview</div>
        <table style={S.tbl}><thead><tr>{["Supplier","GSTIN","Invoices","IGST","CGST","SGST","Total ITC"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{preview.suppliers.slice(0,30).map((s,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{s.name||"Unknown"}</td><td style={S.td}><span style={S.mono}>{s.gstin}</span></td><td style={S.td}>{s.invoices}</td><td style={S.td}>{fmtG(s.igst)}</td><td style={S.td}>{fmtG(s.cgst)}</td><td style={S.td}>{fmtG(s.sgst)}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fmtG(s.itc)}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={reset} style={{...S.btnGhost,flex:1}}>Back</button><button onClick={importData} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing...":"Import to Reconciliation"}</button></div>
    </div>)}
    {step===3&&imported&&(<div style={{textAlign:"center",padding:30}}>
      <div style={{fontSize:48,marginBottom:12}}>🎉</div>
      <div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>GSTR-2A Imported!</div>
      <div style={{fontSize:13,color:"#8B949E",marginBottom:20}}>{imported.message}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>{[{l:"Invoices",v:imported.summary?.total_invoices},{l:"Suppliers Saved",v:imported.summary?.saved},{l:"Total ITC",v:fmtG(imported.summary?.total_itc)}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:18,fontWeight:700,color:"#3fb950"}}>{k.v}</div></div>))}</div>
      <button onClick={reset} style={{...S.btn,marginRight:10}}>Import Another</button>
    </div>)}
  </div>);
}

// ── BANK STATEMENT IMPORT ──────────────────────────────────────────────────
function BankStatement({token,toast}) {
  const [step,setStep]=useState(1);
  const [file,setFile]=useState(null);
  const [bankName,setBankName]=useState("");
  const [accountNo,setAccountNo]=useState("");
  const [preview,setPreview]=useState(null);
  const [uploading,setUploading]=useState(false);
  const [importing,setImporting]=useState(false);
  const [transactions,setTransactions]=useState([]);
  const [imports,setImports]=useState([]);
  const [filter,setFilter]=useState("all");
  const [viewMode,setViewMode]=useState("upload");

  const CATEGORIES=["Salary","Rent","Tax Payment","Utilities","Fund Transfer","Cash Withdrawal","Loan Payment","Interest","Bank Charges","Insurance","Purchase","Sales Receipt","Investment","Food & Dining","Online Purchase","Fuel","Travel","Medical","Uncategorized"];
  const TYPES=["INCOME","EXPENSE","PURCHASE","TAX","BANK","TRANSFER","UNKNOWN"];
  const TYPE_COLORS={"INCOME":"green","EXPENSE":"red","PURCHASE":"blue","TAX":"amber","BANK":"gray","TRANSFER":"purple","UNKNOWN":"gray"};

  const loadTransactions=useCallback(()=>{
    api(`/bank/transactions${filter!=="all"?`?type=${filter}`:""}`, "GET",null,token)
      .then(d=>setTransactions(d.transactions||[])).catch(()=>{});
  },[token,filter]);

  const loadImports=()=>{api("/bank/imports","GET",null,token).then(d=>setImports(d.imports||[])).catch(()=>{});};

  useEffect(()=>{if(viewMode==="history")loadTransactions();if(viewMode==="imports")loadImports();},[viewMode,loadTransactions]);

  const uploadPDF=async()=>{
    if(!file)return toast("Select PDF file","error");
    setUploading(true);
    try{
      const formData=new FormData();
      formData.append("file",file);
      if(bankName)formData.append("bank_name",bankName);
      if(accountNo)formData.append("account_no",accountNo);
      const res=await fetch(`${API}/bank/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:formData});
      const data=await res.json();
      if(data.success){setPreview(data.preview);setStep(2);}
      else toast(data.message,"error");
    }catch(e){toast("Upload failed: "+e.message,"error");}
    setUploading(false);
  };

  const importToDB=async()=>{
    if(!preview)return;
    setImporting(true);
    try{
      const data=await api("/bank/import","POST",{bank_name:bankName||preview.bank_name,account_no:accountNo||preview.account_no,transactions:preview.transactions},token);
      if(data.success){toast(data.message,"success");setStep(3);}
      else toast(data.message,"error");
    }catch(e){toast(e.message,"error");}
    setImporting(false);
  };

  const updateCategory=async(id,category,type)=>{
    try{await api(`/bank/transactions/${id}`,"PATCH",{category,type},token);loadTransactions();}catch(e){}
  };

  const reset=()=>{setFile(null);setPreview(null);setStep(1);setBankName("");setAccountNo("");};

  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {[{k:"upload",l:"Import Statement"},{k:"history",l:"Transaction History"},{k:"imports",l:"Past Imports"}].map(t=>(<button key={t.k} onClick={()=>setViewMode(t.k)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:viewMode===t.k?"#1F6FEB":"#30363D",background:viewMode===t.k?"#0c1d2e":"transparent",color:viewMode===t.k?"#58a6ff":"#8B949E",fontWeight:viewMode===t.k?600:400}}>{t.l}</button>))}
    </div>

    {viewMode==="upload"&&(<div>
      <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,l:"Upload PDF"},{n:2,l:"Preview & Categorize"},{n:3,l:"Imported!"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.l}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:20}}/>}</div>))}</div>

      {step===1&&(<div>
        <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:10}}>How to download Bank Statement PDF</div>
          {["Login to your bank's net banking","Go to Account Statement / e-Statement","Select date range (monthly or full year)","Download as PDF","Upload below — AI will auto-categorize!"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"4px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700,minWidth:20}}>{i+1}.</span><span>{s}</span></div>))}
          <div style={{marginTop:10,fontSize:11,color:"#8B949E"}}>Supports: SBI, HDFC, ICICI, Axis, Kotak, PNB, Bank of Baroda, and all major Indian banks</div>
        </div>
        <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div><label style={S.label}>Bank Name</label><input style={S.input} placeholder="SBI, HDFC, ICICI..." value={bankName} onChange={e=>setBankName(e.target.value)}/></div>
            <div><label style={S.label}>Account No. (Last 4 digits)</label><input style={S.input} placeholder="XXXX" value={accountNo} onChange={e=>setAccountNo(e.target.value)}/></div>
          </div>
          <div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>
            {file?(<div><div style={{fontSize:24,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><div style={{fontSize:11,color:"#8B949E",marginTop:4}}>{(file.size/1024).toFixed(1)} KB</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:40,marginBottom:8}}>🏦</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:4}}>Drop Bank Statement PDF here</div><div style={{fontSize:11,color:"#8B949E",marginBottom:12}}>AI will automatically read and categorize all transactions</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose PDF File<input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}
          </div>
          <button onClick={uploadPDF} disabled={!file||uploading} style={{...S.btn,width:"100%",opacity:!file||uploading?0.5:1}}>{uploading?"Reading PDF & Categorizing with AI...":"Upload & Analyze →"}</button>
        </div>
      </div>)}

      {step===2&&preview&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
          {[{l:"Transactions",v:preview.total_txns,c:"#58a6ff"},{l:"Total Debit",v:fmtMoney(preview.total_debit),c:"#f85149"},{l:"Total Credit",v:fmtMoney(preview.total_credit),c:"#3fb950"},{l:"Net Flow",v:fmtMoney(preview.total_credit-preview.total_debit),c:preview.total_credit>=preview.total_debit?"#3fb950":"#f85149"}].map(k=>(<div key={k.l} style={S.kpi}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l==="Transactions"?22:14,fontWeight:700,color:k.c}}>{k.v}</div></div>))}
        </div>
        <div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:12}}>
          <div style={{fontSize:12,color:"#3fb950",fontWeight:600}}>✅ AI has automatically categorized {preview.total_txns} transactions into heads like Salary, Rent, Tax, Purchases etc.</div>
          <div style={{fontSize:11,color:"#8B949E",marginTop:4}}>You can review and change categories before importing.</div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Transaction Preview (first 50 shown)</div>
          <table style={S.tbl}>
            <thead><tr>{["Date","Description","Debit","Credit","Category","Type"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{(preview.transactions||[]).slice(0,50).map((t,i)=>(<tr key={i}>
              <td style={S.td}>{t.txn_date}</td>
              <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div></td>
              <td style={{...S.td,color:"#f85149",fontWeight:t.debit>0?600:400}}>{t.debit>0?fmtMoney(t.debit):"—"}</td>
              <td style={{...S.td,color:"#3fb950",fontWeight:t.credit>0?600:400}}>{t.credit>0?fmtMoney(t.credit):"—"}</td>
              <td style={S.td}>{badge(t.category||"Uncategorized","gray")}</td>
              <td style={S.tdL}>{t.type&&badge(t.type,TYPE_COLORS[t.type]||"gray")}</td>
            </tr>))}</tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={reset} style={{...S.btnGhost,flex:1}}>Back</button>
          <button onClick={importToDB} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing to Database...":"Import All Transactions"}</button>
        </div>
      </div>)}

      {step===3&&(<div style={{textAlign:"center",padding:30}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>Bank Statement Imported!</div>
        <div style={{fontSize:13,color:"#8B949E",marginBottom:20}}>All transactions saved with AI categories</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={reset} style={S.btn}>Import Another</button>
          <button onClick={()=>setViewMode("history")} style={S.btnG}>View Transactions →</button>
        </div>
      </div>)}
    </div>)}

    {viewMode==="history"&&(<div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#8B949E"}}>Filter by type:</span>
        {["all",...TYPES].map(t=>(<button key={t} onClick={()=>setFilter(t)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderColor:filter===t?"#58a6ff":"#30363D",background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t}</button>))}
      </div>
      <div style={S.card}>
        {transactions.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No transactions. Import a bank statement first.</div>:(
          <table style={S.tbl}>
            <thead><tr>{["Date","Description","Debit","Credit","Category","Type","Edit"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{transactions.map(t=>(<tr key={t.id}>
              <td style={S.td}>{t.txn_date}</td>
              <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</div></td>
              <td style={{...S.td,color:"#f85149",fontWeight:t.debit>0?600:400}}>{t.debit>0?fmtMoney(t.debit):"—"}</td>
              <td style={{...S.td,color:"#3fb950",fontWeight:t.credit>0?600:400}}>{t.credit>0?fmtMoney(t.credit):"—"}</td>
              <td style={S.td}>
                <select value={t.category} onChange={e=>updateCategory(t.id,e.target.value,t.type)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </td>
              <td style={S.td}>
                <select value={t.type} onChange={e=>updateCategory(t.id,t.category,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>
                  {TYPES.map(tp=><option key={tp}>{tp}</option>)}
                </select>
              </td>
              <td style={S.tdL}>{t.type&&badge(t.type,TYPE_COLORS[t.type]||"gray")}</td>
            </tr>))}</tbody>
          </table>
        )}
      </div>
    </div>)}

    {viewMode==="imports"&&(<div>
      <div style={S.card}>
        {imports.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No imports yet.</div>:(
          <table style={S.tbl}>
            <thead><tr>{["Bank","Account","Period","Transactions","Total Debit","Total Credit","Imported On"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{imports.map(imp=>(<tr key={imp.id}>
              <td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{imp.bank_name}</td>
              <td style={S.td}><span style={S.mono}>{imp.account_no||"—"}</span></td>
              <td style={S.td}>{imp.from_date} to {imp.to_date}</td>
              <td style={{...S.td,color:"#58a6ff",fontWeight:600}}>{imp.total_txns}</td>
              <td style={{...S.td,color:"#f85149"}}>{fmtMoney(imp.total_debit)}</td>
              <td style={{...S.td,color:"#3fb950"}}>{fmtMoney(imp.total_credit)}</td>
              <td style={S.tdL}>{new Date(imp.created_at).toLocaleDateString("en-IN")}</td>
            </tr>))}</tbody>
          </table>
        )}
      </div>
    </div>)}
  </div>);
}

// ── AI ASSISTANT ───────────────────────────────────────────────────────────
function AIAssistant({token}) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Namaste! I am TaxPro AI Assistant.\n\nI can help with:\n• GST queries (DRC-01, ITC, returns, reconciliation)\n• Accounting (invoices, stock, ledger)\n• Bank statement analysis\n• Tax planning\n\nAsk me anything!"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async(text)=>{
    const msg=text||input.trim();if(!msg||loading)return;
    setInput("");setMsgs(prev=>[...prev,{role:"user",content:msg}]);setLoading(true);
    try{
      const history=msgs.map(m=>({role:m.role,content:m.content}));
      const data=await api("/ai/chat","POST",{messages:[...history,{role:"user",content:msg}]},token);
      setMsgs(prev=>[...prev,{role:"assistant",content:data.reply||"Sorry, could not process."}]);
    }catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"Error. Try again."}]);}
    setLoading(false);
  };
  const chips=["How to respond to DRC-01?","GSTR-2B vs 2A difference","ITC reversal Rule 42","Section 16(4) time limit","GST on export invoices","Journal entry for GST payment"];
  return(<div style={S.aiWrap}>
    <div style={S.aiMsgs}>
      {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>{m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,marginRight:8,flexShrink:0,marginTop:2,color:"#fff",fontWeight:700}}>AI</div>}<div style={m.role==="user"?S.bubU:S.bubA}>{m.content}</div></div>))}
      {loading&&<div style={{display:"flex",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>AI</div><div style={{...S.bubA,color:"#8B949E"}}>Thinking...</div></div>}
      <div ref={endRef}/>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px 14px"}}>{chips.map(c=><button key={c} onClick={()=>send(c)} disabled={loading} style={{padding:"4px 10px",borderRadius:20,border:"1px solid #30363D",background:"transparent",color:"#8B949E",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div>
    <div style={{display:"flex",gap:8,padding:"12px 14px",borderTop:"1px solid #21262D"}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything about GST or accounting..." disabled={loading} style={{...S.input,flex:1}}/>
      <button onClick={()=>send()} disabled={loading||!input.trim()} style={{...S.btn,opacity:loading||!input.trim()?0.5:1}}>Send</button>
    </div>
  </div>);
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────
const NAV=[
  {key:"dashboard",   icon:"🏠",label:"Dashboard",         group:"MAIN"},
  {key:"sales",       icon:"📄",label:"Sales Invoices",     group:"ACCOUNTING"},
  {key:"purchases",   icon:"🧾",label:"Purchase Bills",     group:"ACCOUNTING"},
  {key:"parties",     icon:"👥",label:"Parties",            group:"ACCOUNTING"},
  {key:"products",    icon:"📦",label:"Products & Stock",   group:"ACCOUNTING"},
  {key:"bank",        icon:"🏦",label:"Bank Statement",     group:"ACCOUNTING"},
  {key:"reports",     icon:"📈",label:"Reports",            group:"ACCOUNTING"},
  {key:"gst-clients", icon:"🏢",label:"GST Clients",        group:"GST"},
  {key:"notices",     icon:"🔔",label:"Notice Manager",     group:"GST"},
  {key:"returns",     icon:"📋",label:"Return Tracker",     group:"GST"},
  {key:"reconcile",   icon:"⇄", label:"Reconciliation",    group:"GST"},
  {key:"gstr2a",      icon:"📥",label:"GSTR-2A Import",     group:"GST"},
  {key:"calculator",  icon:"🧮",label:"GST Calculator",     group:"TOOLS"},
  {key:"calendar",    icon:"📅",label:"Compliance Calendar",group:"TOOLS"},
  {key:"reply",       icon:"✍", label:"Notice Reply AI",   group:"TOOLS"},
  {key:"ai",          icon:"✦", label:"AI Assistant",      group:"TOOLS"},
];

const TITLES={dashboard:"Dashboard",sales:"Sales Invoices",purchases:"Purchase Bills",parties:"Parties & Customers",products:"Products & Stock",bank:"Bank Statement Import",reports:"Reports & Analytics","gst-clients":"GST Clients",notices:"Notice Manager",returns:"Return Filing Tracker",reconcile:"GST Reconciliation",gstr2a:"GSTR-2A Import",calculator:"GST Calculator",calendar:"Compliance Calendar",reply:"Notice Reply Generator",ai:"AI Assistant"};

// Placeholder for Invoice, Products, Parties, Reports (imported from previous code)
function InvoiceList({token,toast,type}){
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const load=useCallback(()=>{setLoading(true);api(`/invoices?type=${type}${search?`&search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,type,search]);
  useEffect(()=>{load();},[load]);
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search..." style={{...S.input,width:260}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <div style={{marginLeft:"auto",color:"#8B949E",fontSize:12}}>Invoice creation — use the full App from downloads</div>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{invoices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No {type==="SALES"?"sales invoices":"purchase bills"} yet.</div>:(<table style={S.tbl}><thead><tr>{["Invoice No","Party","Date","Amount","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{invoices.map(inv=>(<tr key={inv.id}><td style={{...S.td,color:"#58a6ff"}}>{inv.invoice_no}</td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</td><td style={S.td}>{inv.invoice_date}</td><td style={{...S.td,fontWeight:600}}>{fmtMoney(inv.total_amount)}</td><td style={S.tdL}><StatusBadge s={inv.status}/></td></tr>))}</tbody></table>)}</div>)}
  </div>);
}

function Products({token,toast}){return<div style={{...S.card,textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:12}}>📦</div><div style={{fontSize:15,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>Products & Stock</div><div style={{color:"#8B949E",fontSize:13}}>Download the complete backend package and use full App.js for Products & Stock management.</div></div>;}
function Parties({token,toast}){return<div style={{...S.card,textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:12}}>👥</div><div style={{fontSize:15,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>Party Management</div><div style={{color:"#8B949E",fontSize:13}}>Full party ledger and management available in the complete version.</div></div>;}
function Reports({token}){return<div style={{...S.card,textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:12}}>📈</div><div style={{fontSize:15,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>Reports & Analytics</div><div style={{color:"#8B949E",fontSize:13}}>GST Summary, P&L, Sales Register, Outstanding reports available in complete version.</div></div>;}
function GSTClients({token,toast}){
  const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Himachal Pradesh","Goa","Other"];
  const TYPES=["Manufacturer","Trader","Exporter","Importer","Service","Composition"];
  const load=useCallback(()=>{setLoading(true);api(`/clients${q?`?search=${encodeURIComponent(q)}`:""}`, "GET",null,token).then(d=>{setClients(d.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,q]);
  useEffect(()=>{load();},[load]);
  const openAdd=()=>{setEditing(null);setForm({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});setShowModal(true);};
  const openEdit=c=>{setEditing(c);setForm({name:c.name,gstin:c.gstin||"",state:c.state||"",type:c.type||"Trader",turnover:c.turnover||"",notes:c.notes||"",status:c.status||"compliant"});setShowModal(true);};
  const save=async()=>{setSaving(true);try{if(editing){await api(`/clients/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api("/clients","POST",form,token);toast("Added","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async(id)=>{if(!window.confirm("Delete?"))return;try{await api(`/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search GST clients..." style={{...S.input,width:260}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={openAdd} style={{...S.btn,marginLeft:"auto"}}>+ Add Client</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{clients.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No GST clients yet.</div>:(<table style={S.tbl}><thead><tr>{["Name","GSTIN","State","Type","Status","Notices","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{clients.map(c=>(<tr key={c.id}><td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{c.name}</td><td style={S.td}><span style={S.mono}>{c.gstin}</span></td><td style={S.td}>{c.state}</td><td style={S.td}>{badge(c.type,"gray")}</td><td style={S.td}><StatusBadge s={c.status}/></td><td style={S.td}>{c.notice_count>0?<span style={{color:"#f85149",fontWeight:700}}>{c.notice_count}</span>:<span style={{color:"#3fb950"}}>0</span>}</td><td style={S.tdL}><div style={{display:"flex",gap:4}}><button onClick={()=>openEdit(c)} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button><button onClick={()=>del(c.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button></div></td></tr>))}</tbody></table>)}</div>)}
    {showModal&&(<Modal title={editing?"Edit Client":"Add GST Client"} onClose={()=>setShowModal(false)}>
      {[{l:"Name *",k:"name",ph:"Sharma Textiles Pvt Ltd"},{l:"GSTIN *",k:"gstin",ph:"09AABCS1429B1Z7"},{l:"Turnover",k:"turnover",ph:"2.4 Cr"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={S.fg}><label style={S.label}>State</label><select style={{...S.select,width:"100%"}} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Type</label><select style={{...S.select,width:"100%"}} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      {editing&&<div style={S.fg}><label style={S.label}>Status</label><select style={{...S.select,width:"100%"}} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{["compliant","pending","notice","overdue"].map(s=><option key={s}>{s}</option>)}</select></div>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
  </div>);
}

// ── APP SHELL ──────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]  =useState(()=>{try{return JSON.parse(localStorage.getItem("taxpro_user"));}catch{return null;}});
  const [token,setToken]=useState(()=>localStorage.getItem("taxpro_token")||"");
  const [view,setView]  =useState("dashboard");
  const [toast,setToast]=useState(null);
  const [collapsed,setCollapsed]=useState(false);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4000);};
  const logout=()=>{localStorage.removeItem("taxpro_token");localStorage.removeItem("taxpro_user");setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const groups=["MAIN","ACCOUNTING","GST","TOOLS"];

  return(<div style={S.app}>
    <aside style={{...S.sidebar,width:collapsed?58:220,minWidth:collapsed?58:220,transition:"width 0.2s"}}>
      <div style={{padding:"12px",borderBottom:"1px solid #21262D",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        {!collapsed&&<div><div style={{fontSize:15,fontWeight:800,color:"#E6EDF3"}}>TaxPro</div><div style={{fontSize:10,color:"#8B949E"}}>Complete Suite</div></div>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:16,padding:4,marginLeft:collapsed?"auto":0}}>{collapsed?"▶":"◀"}</button>
      </div>
      <nav style={{flex:1,padding:"4px 0",overflowY:"auto"}}>
        {groups.map(g=>(<div key={g}>
          {!collapsed&&<div style={{fontSize:9,color:"#444C56",padding:"8px 12px 2px",letterSpacing:1,fontWeight:600}}>{g}</div>}
          {NAV.filter(n=>n.group===g).map(n=>(<button key={n.key} onClick={()=>setView(n.key)} title={collapsed?n.label:""} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:collapsed?"8px 0":"7px 12px",border:"none",background:view===n.key?"#1F6FEB18":"transparent",borderLeft:view===n.key?"2px solid #1F6FEB":"2px solid transparent",color:view===n.key?"#58a6ff":"#8B949E",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:view===n.key?600:400,textAlign:"left",justifyContent:collapsed?"center":"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>{n.icon}</span>
            {!collapsed&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</span>}
          </button>))}
        </div>))}
      </nav>
      {!collapsed&&<div style={{padding:"10px 12px",borderTop:"1px solid #21262D"}}>
        <div style={{fontSize:11,fontWeight:600,color:"#E6EDF3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.firm_name||user.name}</div>
        <div style={{fontSize:10,color:"#8B949E",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        <button onClick={logout} style={{...S.btnGhost,marginTop:8,width:"100%",fontSize:11,padding:"5px"}}>Logout</button>
      </div>}
    </aside>

    <div style={S.main}>
      <div style={S.topbar}>
        <span style={{fontSize:14,fontWeight:600,color:"#E6EDF3"}}>{TITLES[view]||view}</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#8B949E"}}>Welcome, {user.name}</span>
          {badge("Live","green")}
        </div>
      </div>
      <div style={S.content}>
        {view==="dashboard"   &&<Dashboard     token={token}/>}
        {view==="sales"       &&<InvoiceList   token={token} toast={showToast} type="SALES"/>}
        {view==="purchases"   &&<InvoiceList   token={token} toast={showToast} type="PURCHASE"/>}
        {view==="parties"     &&<Parties       token={token} toast={showToast}/>}
        {view==="products"    &&<Products      token={token} toast={showToast}/>}
        {view==="bank"        &&<BankStatement token={token} toast={showToast}/>}
        {view==="reports"     &&<Reports       token={token}/>}
        {view==="gst-clients" &&<GSTClients    token={token} toast={showToast}/>}
        {view==="notices"     &&<Notices       token={token} toast={showToast}/>}
        {view==="returns"     &&<Returns       token={token} toast={showToast}/>}
        {view==="reconcile"   &&<Reconciliation token={token} toast={showToast}/>}
        {view==="gstr2a"      &&<GSTR2AImport  token={token} toast={showToast}/>}
        {view==="calculator"  &&<GSTCalculator/>}
        {view==="calendar"    &&<ComplianceCalendar/>}
        {view==="reply"       &&<NoticeReplyGenerator token={token}/>}
        {view==="ai"          &&<AIAssistant   token={token}/>}
      </div>
    </div>
    {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>);
}