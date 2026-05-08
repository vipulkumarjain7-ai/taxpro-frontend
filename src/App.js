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
  sidebar:  { width:210, minWidth:210, background:"#161B22", borderRight:"1px solid #21262D", display:"flex", flexDirection:"column", overflowY:"auto" },
  main:     { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:   { padding:"12px 20px", background:"#161B22", borderBottom:"1px solid #21262D", display:"flex", alignItems:"center", justifyContent:"space-between" },
  content:  { flex:1, overflowY:"auto", padding:18, background:"#0D1117" },
  card:     { background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:16, marginBottom:12 },
  kpiGrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 },
  kpi:      { background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:"14px 16px" },
  kpiLabel: { fontSize:10, color:"#8B949E", textTransform:"uppercase", letterSpacing:0.6, marginBottom:6 },
  kpiVal:   { fontSize:26, fontWeight:700, lineHeight:1, color:"#E6EDF3" },
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

const badge = (txt, color) => {
  const map = { green:{bg:"#0d2818",color:"#3fb950",border:"#238636"}, amber:{bg:"#2d1b00",color:"#e3b341",border:"#9e6a03"}, red:{bg:"#2d0e0e",color:"#f85149",border:"#6e1c1c"}, blue:{bg:"#0c1d2e",color:"#58a6ff",border:"#1f4872"}, gray:{bg:"#21262D",color:"#8b949e",border:"#30363D"} };
  const c = map[color]||map.gray;
  return <span style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{txt}</span>;
};
const StatusBadge = ({s}) => { const m={compliant:["Compliant","green"],pending:["Pending","amber"],notice:["Notice","red"],overdue:["Overdue","red"]}; const [l,c]=m[s]||[s,"gray"]; return badge(l,c); };
const ReturnPill = ({s}) => { const m={filed:["Filed","green"],pending:["Pending","amber"],"not-filed":["Not Filed","red"]}; const [l,c]=m[s]||[s,"gray"]; return badge(l,c); };
const PrioBadge = ({p}) => { const m={critical:["Critical","red"],high:["High","amber"],medium:["Medium","blue"],low:["Low","gray"]}; const [l,c]=m[p]||[p,"gray"]; return badge(l,c); };
const Spinner = () => (<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}><div style={{width:28,height:28,border:"3px solid #21262D",borderTop:"3px solid #1F6FEB",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Toast = ({msg,type,onClose}) => (<div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:type==="error"?"#2d0e0e":"#0d2818",border:`1px solid ${type==="error"?"#6e1c1c":"#238636"}`,color:type==="error"?"#f85149":"#3fb950",padding:"12px 18px",borderRadius:10,fontSize:13,maxWidth:320,display:"flex",alignItems:"center",gap:10}}><span>{msg}</span><button onClick={onClose} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16,marginLeft:"auto"}}>x</button></div>);
const Modal = ({title,onClose,children,wide}) => (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#161B22",border:"1px solid #30363D",borderRadius:12,padding:24,width:wide?"min(700px,95vw)":"min(500px,90vw)",maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><span style={{fontSize:15,fontWeight:600,color:"#E6EDF3"}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:20}}>x</button></div>{children}</div></div>);

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
      <div style={{width:"min(420px,90vw)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:28,fontWeight:800,color:"#E6EDF3",letterSpacing:-0.5}}>TaxPro GST</div>
          <div style={{fontSize:13,color:"#8B949E",marginTop:6}}>CA Practice Suite — India's GST Platform</div>
        </div>
        <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:12,padding:28}}>
          <div style={{display:"flex",gap:4,marginBottom:22,background:"#0D1117",borderRadius:8,padding:4}}>
            {["login","register"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:tab===t?"#1F6FEB":"transparent",color:tab===t?"#fff":"#8B949E"}}>{t==="login"?"Login":"Register"}</button>))}
          </div>
          {tab==="register"&&<>
            <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} placeholder="CA Rahul Prakash" value={form.name} onChange={set("name")}/></div>
            <div style={S.fg}><label style={S.label}>Firm Name *</label><input style={S.input} placeholder="Prakash and Associates" value={form.firm_name} onChange={set("firm_name")}/></div>
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
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api("/dashboard","GET",null,token).then(d=>{setData(d.dashboard);setLoading(false);}).catch(()=>setLoading(false)); },[token]);
  if(loading)return<Spinner/>;
  if(!data)return<div style={{color:"#f85149",padding:20}}>Failed to load dashboard.</div>;
  const {clients,notices,upcoming_notices=[],recent_clients=[],returns_summary}=data;
  return(
    <div>
      <div style={S.kpiGrid}>
        {[{label:"Total Clients",val:clients.total,sub:"across all states",color:"#E6EDF3"},{label:"Compliant",val:clients.compliant,sub:`${clients.total?Math.round(clients.compliant/clients.total*100):0}% on time`,color:"#3fb950"},{label:"Open Notices",val:notices.open,sub:"require action",color:"#f85149"},{label:"Due in 30 Days",val:notices.due_in_30_days,sub:"expiring soon",color:"#e3b341"}].map(k=>(
          <div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{...S.kpiVal,color:k.color}}>{k.val}</div><div style={S.kpiSub}>{k.sub}</div></div>
        ))}
      </div>
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Recent Clients</div>
          {recent_clients.length===0?<div style={{color:"#8B949E",fontSize:12}}>No clients yet.</div>:recent_clients.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D"}}>
              <div><div style={{fontWeight:500,color:"#E6EDF3",fontSize:12}}>{c.name}</div><div style={S.mono}>{c.gstin}</div></div>
              <StatusBadge s={c.status}/>
            </div>
          ))}
        </div>
        <div>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Upcoming Notice Due Dates</div>
            {upcoming_notices.length===0?<div style={{color:"#3fb950",fontSize:12}}>No notices due in 30 days</div>:upcoming_notices.map(n=>(
              <div key={n.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D"}}>
                <div><div style={{fontWeight:500,color:"#E6EDF3",fontSize:12}}>{n.type}</div><div style={{fontSize:11,color:"#8B949E"}}>{n.client_name}</div></div>
                {badge(n.due_date,n.status==="overdue"?"red":"amber")}
              </div>
            ))}
          </div>
          {returns_summary&&(
            <div style={S.card}>
              <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Filing Summary — {returns_summary.period}</div>
              <table style={S.tbl}><thead><tr>{["Return","Filed","Pending","Not Filed"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{[["GSTR-1","gstr1"],["GSTR-3B","gstr3b"],["GSTR-9","gstr9"]].map(([lbl,key])=>(
                <tr key={key}><td style={S.td}>{lbl}</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{returns_summary[key].filed}</td><td style={{...S.td,color:"#e3b341",fontWeight:600}}>{returns_summary[key].pending}</td><td style={{...S.tdL,color:"#f85149",fontWeight:600}}>{returns_summary[key].not_filed}</td></tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CLIENTS ────────────────────────────────────────────────────────────────
const STATES=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
const TYPES=["Manufacturer","Trader","Exporter","Importer","Service","Composition"];

function Clients({token,toast}) {
  const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});
  const [saving,setSaving]=useState(false);
  const [importing,setImporting]=useState(false);

  const load=useCallback(()=>{ setLoading(true); api(`/clients${q?`?search=${encodeURIComponent(q)}`:""}`, "GET",null,token).then(d=>{setClients(d.clients);setLoading(false);}).catch(()=>setLoading(false)); },[token,q]);
  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setEditing(null);setForm({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});setShowModal(true);};
  const openEdit=c=>{setEditing(c);setForm({name:c.name,gstin:c.gstin,state:c.state,type:c.type,turnover:c.turnover||"",notes:c.notes||"",status:c.status});setShowModal(true);};

  const save=async()=>{
    setSaving(true);
    try{
      if(editing){await api(`/clients/${editing.id}`,"PUT",form,token);toast("Client updated","success");}
      else{await api("/clients","POST",form,token);toast("Client added","success");}
      setShowModal(false);load();
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };

  const del=async(id)=>{ if(!window.confirm("Delete this client?"))return; try{await api(`/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");} };

  const importExcel=async(e)=>{
    const file=e.target.files[0]; if(!file)return;
    setImporting(true);
    try{
      const formData=new FormData(); formData.append("file",file);
      const res=await fetch(`${API}/import/clients`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:formData});
      const data=await res.json();
      if(data.success){toast(data.message,"success");load();}else toast(data.message,"error");
    }catch(e){toast("Import failed","error");}
    setImporting(false); e.target.value="";
  };

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search by name or GSTIN..." style={{...S.input,width:260}}/>
        <button onClick={load} style={S.btnGhost}>Search</button>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <label style={{...S.btnG,cursor:"pointer",display:"inline-block"}}>{importing?"Importing...":"📥 Import Excel"}<input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} style={{display:"none"}}/></label>
          <button onClick={openAdd} style={S.btn}>+ Add Client</button>
        </div>
      </div>
      <div style={{background:"#8f9e03",border:"1px solid #1f4872",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#58a6ff"}}>
        Excel columns: Name | GSTIN | State | Type | Turnover
      </div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          {clients.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No clients yet. Click Add Client.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Name","GSTIN","State","Type","Status","Notices","Turnover","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{clients.map(c=>(
                <tr key={c.id}>
                  <td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{c.name}</td>
                  <td style={S.td}><span style={S.mono}>{c.gstin}</span></td>
                  <td style={S.td}>{c.state}</td>
                  <td style={S.td}>{badge(c.type,"gray")}</td>
                  <td style={S.td}><StatusBadge s={c.status}/></td>
                  <td style={S.td}>{c.notice_count>0?<span style={{color:"#f85149",fontWeight:700}}>{c.notice_count}</span>:<span style={{color:"#3fb950"}}>0</span>}</td>
                  <td style={S.td}>{c.turnover||"—"}</td>
                  <td style={S.tdL}><div style={{display:"flex",gap:6}}><button onClick={()=>openEdit(c)} style={S.btnGhost}>Edit</button><button onClick={()=>del(c.id)} style={S.btnDanger}>Del</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal&&(
        <Modal title={editing?"Edit Client":"Add Client"} onClose={()=>setShowModal(false)}>
          {[{l:"Client Name *",k:"name",ph:"Sharma Textiles Pvt Ltd"},{l:"GSTIN *",k:"gstin",ph:"09AABCS1429B1Z7"},{l:"Turnover",k:"turnover",ph:"2.4 Cr"}].map(f=>(
            <div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.fg}><label style={S.label}>State *</label><select style={{...S.select,width:"100%"}} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div style={S.fg}><label style={S.label}>Type *</label><select style={{...S.select,width:"100%"}} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          {editing&&<div style={S.fg}><label style={S.label}>Status</label><select style={{...S.select,width:"100%"}} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{["compliant","pending","notice","overdue"].map(s=><option key={s}>{s}</option>)}</select></div>}
          <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button>
            <button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button>
          </div>
        </Modal>
      )}
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

  const load=useCallback(()=>{ setLoading(true); Promise.all([api(`/notices${filter!=="all"?`?status=${filter}`:""}`, "GET",null,token),api("/clients","GET",null,token)]).then(([nd,cd])=>{setNotices(nd.notices);setClients(cd.clients);setLoading(false);}).catch(()=>setLoading(false)); },[token,filter]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{ setSaving(true); try{await api("/notices","POST",{...form,amount:parseFloat(form.amount)||0},token);toast("Notice added","success");setShowModal(false);load();}catch(e){toast(e.message,"error");} setSaving(false); };
  const updateStatus=async(id,status)=>{ try{await api(`/notices/${id}/status`,"PATCH",{status},token);load();}catch(e){toast(e.message,"error");} };
  const del=async(id)=>{ if(!window.confirm("Delete?"))return; try{await api(`/notices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");} };
  const tabs=["all","pending","in-progress","overdue","replied","closed"];

  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {tabs.map(t=>(<button key={t} onClick={()=>setFilter(t)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:filter===t?"#58a6ff":"#30363D",background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":"#8B949E",fontWeight:filter===t?600:400}}>{t==="all"?"All":t==="in-progress"?"In Progress":t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
        <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto",padding:"5px 14px"}}>+ Add Notice</button>
      </div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          {notices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No notices found.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Ref No.","Client","Type","Issued","Due","Amount","Priority","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{notices.map(n=>(
                <tr key={n.id}>
                  <td style={S.td}><span style={S.mono}>{n.ref_no}</span></td>
                  <td style={S.td}><div style={{fontWeight:500,color:"#E6EDF3"}}>{n.client_name}</div><div style={S.mono}>{n.gstin}</div></td>
                  <td style={S.td}>{n.type}</td>
                  <td style={S.td}>{n.issued_date}</td>
                  <td style={{...S.td,color:n.status==="overdue"?"#f85149":"#C9D1D9",fontWeight:n.status==="overdue"?700:400}}>{n.due_date}</td>
                  <td style={{...S.td,fontWeight:600}}>Rs.{Number(n.amount).toLocaleString("en-IN")}</td>
                  <td style={S.td}><PrioBadge p={n.priority}/></td>
                  <td style={S.td}><select value={n.status} onChange={e=>updateStatus(n.id,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>{["pending","in-progress","replied","closed","overdue"].map(s=><option key={s}>{s}</option>)}</select></td>
                  <td style={S.tdL}><button onClick={()=>del(n.id)} style={S.btnDanger}>Del</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal&&(
        <Modal title="Add Notice" onClose={()=>setShowModal(false)}>
          <div style={S.fg}><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          {[{l:"Ref No. *",k:"ref_no",ph:"ZD071125006543C"},{l:"Notice Type *",k:"type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Amount *",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.fg}><label style={S.label}>Issued Date *</label><input style={S.input} type="date" value={form.issued_date} onChange={e=>setForm(p=>({...p,issued_date:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Due Date *</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/></div>
          </div>
          <div style={S.fg}><label style={S.label}>Priority</label><select style={{...S.select,width:"100%"}} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["critical","high","medium","low"].map(p=><option key={p}>{p}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div>
        </Modal>
      )}
    </div>
  );
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

  const load=useCallback(()=>{ setLoading(true); Promise.all([api(`/returns?period=${encodeURIComponent(period)}`,"GET",null,token),api("/clients","GET",null,token)]).then(([rd,cd])=>{setReturns(rd.returns);setClients(cd.clients);setLoading(false);}).catch(()=>setLoading(false)); },[token,period]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{ setSaving(true); try{await api("/returns","POST",form,token);toast("Saved","success");setShowModal(false);load();}catch(e){toast(e.message,"error");} setSaving(false); };
  const updateField=async(id,key,val)=>{ const rec=returns.find(r=>r.id===id); if(!rec)return; try{await api(`/returns/${id}`,"PUT",{...rec,[key]:val},token);load();}catch(e){toast(e.message,"error");} };

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#8B949E"}}>FY:</span>
        <select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select>
        <button onClick={()=>{setForm(f=>({...f,period}));setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Record</button>
      </div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          {returns.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No records for {period}.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Client","GSTIN","GSTR-1","GSTR-3B","GSTR-9","Overall"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{returns.map(r=>{ const all=[r.gstr1_status,r.gstr3b_status,r.gstr9_status]; const ov=all.every(s=>s==="filed")?"compliant":all.some(s=>s==="not-filed")?"overdue":"pending"; return(
                <tr key={r.id}>
                  <td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.client_name}</td>
                  <td style={S.td}><span style={S.mono}>{r.gstin}</span></td>
                  {[["gstr1_status"],["gstr3b_status"],["gstr9_status"]].map(([key])=>(<td key={key} style={S.td}><select value={r[key]} onChange={e=>updateField(r.id,key,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>{["filed","pending","not-filed"].map(s=><option key={s}>{s}</option>)}</select></td>))}
                  <td style={S.tdL}><StatusBadge s={ov}/></td>
                </tr>
              );})}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal&&(
        <Modal title="Add Return Record" onClose={()=>setShowModal(false)}>
          <div style={S.fg}><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Period *</label><select style={{...S.select,width:"100%"}} value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
          {[["gstr1_status","GSTR-1"],["gstr3b_status","GSTR-3B"],["gstr9_status","GSTR-9"]].map(([key,lbl])=>(<div key={key} style={S.fg}><label style={S.label}>{lbl} Status</label><select style={{...S.select,width:"100%"}} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>{["not-filed","pending","filed"].map(s=><option key={s}>{s}</option>)}</select></div>))}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
        </Modal>
      )}
    </div>
  );
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

  useEffect(()=>{ api("/clients","GET",null,token).then(d=>{setClients(d.clients);if(d.clients.length)setClientId(d.clients[0].id);}); },[token]);
  const load=useCallback(()=>{ if(!clientId)return; setLoading(true); api(`/reconciliation?client_id=${clientId}&period=${encodeURIComponent(period)}`,"GET",null,token).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false)); },[token,clientId,period]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{ setSaving(true); try{await api("/reconciliation","POST",{...form,client_id:clientId,period,invoice_count:parseInt(form.invoice_count)||0,gstr2a_amount:parseFloat(form.gstr2a_amount)||0,gstr2b_amount:parseFloat(form.gstr2b_amount)||0,books_amount:parseFloat(form.books_amount)||0},token);toast("Added","success");setShowModal(false);setForm({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:"",remarks:""});load();}catch(e){toast(e.message,"error");} setSaving(false); };
  const del=async(id)=>{ try{await api(`/reconciliation/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");} };
  const fmt=n=>`Rs.${Number(n||0).toLocaleString("en-IN")}`;

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:12,color:"#8B949E"}}>Client:</span>
        <select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <span style={{fontSize:12,color:"#8B949E"}}>Period:</span>
        <select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select>
        <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Entry</button>
      </div>
      {data?.summary&&(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Matched",v:data.summary.matched,c:"#3fb950"},{l:"Mismatched",v:data.summary.mismatch,c:"#e3b341"},{l:"Missing",v:data.summary.missing,c:"#f85149"},{l:"ITC Risk",v:fmt(data.summary.total_itc_risk),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>)}
      {loading?<Spinner/>:(
        <div style={S.card}>
          {!data||data.rows.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No entries yet.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Vendor","GSTIN","Inv","GSTR-2A","GSTR-2B","Books","Diff","Status",""].map((h,i)=><th key={i} style={{...S.th,textAlign:i>=3&&i<=6?"right":"left"}}>{h}</th>)}</tr></thead>
              <tbody>{data.rows.map(r=>(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.vendor_name}</td><td style={S.td}><span style={S.mono}>{r.vendor_gstin}</span></td><td style={S.td}>{r.invoice_count}</td><td style={{...S.td,textAlign:"right"}}>{fmt(r.gstr2a_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmt(r.gstr2b_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmt(r.books_amount)}</td><td style={{...S.td,textAlign:"right",fontWeight:r.difference!==0?700:400,color:r.difference<0?"#f85149":r.difference>0?"#e3b341":"#3fb950"}}>{r.difference===0?"—":fmt(r.difference)}</td><td style={S.td}>{r.status==="matched"?badge("Matched","green"):r.status==="mismatch"?badge("Mismatch","amber"):badge("Missing","red")}</td><td style={S.tdL}><button onClick={()=>del(r.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal&&(<Modal title="Add Entry" onClose={()=>setShowModal(false)}>{[{l:"Vendor Name *",k:"vendor_name",ph:"ABC Suppliers Pvt Ltd"},{l:"Vendor GSTIN *",k:"vendor_gstin",ph:"07AABCA1234B1Z5"},{l:"Invoice Count",k:"invoice_count",ph:"12",t:"number"},{l:"GSTR-2A Amount",k:"gstr2a_amount",ph:"145000",t:"number"},{l:"GSTR-2B Amount",k:"gstr2b_amount",ph:"143000",t:"number"},{l:"Books Amount *",k:"books_amount",ph:"147000",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div></Modal>)}
    </div>
  );
}

// ── GST CALCULATOR ─────────────────────────────────────────────────────────
function GSTCalculator() {
  const [amount,setAmount]=useState("");
  const [rate,setRate]=useState("18");
  const [type,setType]=useState("exclusive");
  const [state,setState]=useState("inter");

  const amt=parseFloat(amount)||0;
  const r=parseFloat(rate)||0;

  let base,gst,total,cgst,sgst,igst;
  if(type==="exclusive"){
    base=amt; gst=amt*r/100; total=amt+gst;
  } else {
    total=amt; base=amt/(1+r/100); gst=total-base;
  }
  if(state==="intra"){ cgst=gst/2; sgst=gst/2; igst=0; }
  else { igst=gst; cgst=0; sgst=0; }

  const fmt=n=>n.toFixed(2);

  return(
    <div style={{maxWidth:600}}>
      <div style={S.card}>
        <div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:16}}>GST Calculator</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={S.label}>Amount (Rs.)</label><input style={S.input} type="number" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div><label style={S.label}>GST Rate</label><select style={{...S.select,width:"100%"}} value={rate} onChange={e=>setRate(e.target.value)}>
            {["0","0.1","0.25","1","1.5","3","5","6","7.5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}
          </select></div>
          <div><label style={S.label}>Calculation Type</label><select style={{...S.select,width:"100%"}} value={type} onChange={e=>setType(e.target.value)}><option value="exclusive">Exclusive (Add GST)</option><option value="inclusive">Inclusive (Remove GST)</option></select></div>
          <div><label style={S.label}>Transaction Type</label><select style={{...S.select,width:"100%"}} value={state} onChange={e=>setState(e.target.value)}><option value="inter">Inter-State (IGST)</option><option value="intra">Intra-State (CGST+SGST)</option></select></div>
        </div>
        {amt>0&&(
          <div style={{background:"#0D1117",borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Calculation Result</div>
            {[
              {l:"Base Amount",v:`Rs. ${fmt(base)}`,c:"#C9D1D9"},
              ...(state==="intra"?[{l:`CGST @ ${r/2}%`,v:`Rs. ${fmt(cgst)}`,c:"#e3b341"},{l:`SGST @ ${r/2}%`,v:`Rs. ${fmt(sgst)}`,c:"#e3b341"}]:[{l:`IGST @ ${r}%`,v:`Rs. ${fmt(igst)}`,c:"#e3b341"}]),
              {l:"Total GST",v:`Rs. ${fmt(gst)}`,c:"#f85149"},
              {l:"Total Amount",v:`Rs. ${fmt(total)}`,c:"#3fb950"},
            ].map(row=>(<div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{row.l}</span><span style={{fontWeight:700,color:row.c}}>{row.v}</span></div>))}
          </div>
        )}
      </div>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Rate Reference</div>
        <table style={S.tbl}>
          <thead><tr>{["Rate","Category","Examples"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[["0%","Exempt","Basic food items, fresh vegetables, milk"],["5%","Essential","Branded food, transport, small restaurants"],["12%","Standard","Processed food, computers, business class travel"],["18%","Standard","Most services, electronics, restaurants"],["28%","Luxury","Cars, tobacco, luxury hotels, aerated drinks"]].map(([r,c,e])=>(
              <tr key={r}><td style={{...S.td,fontWeight:700,color:"#e3b341"}}>{r}</td><td style={S.td}>{c}</td><td style={S.tdL}>{e}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── COMPLIANCE CALENDAR ────────────────────────────────────────────────────
function ComplianceCalendar() {
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now=new Date();
  const [selMonth,setSelMonth]=useState(now.getMonth());
  const [selYear,setSelYear]=useState(now.getFullYear());

  const getDueDates=(month,year)=>{
    const m=String(month+1).padStart(2,"0");
    const prevMonth=month===0?12:month;
    const pm=String(prevMonth).padStart(2,"0");
    const py=month===0?year-1:year;
    return [
      {date:`${year}-${m}-11`,form:"GSTR-1",desc:`Monthly return for outward supplies — ${months[month===0?11:month-1]} ${month===0?year-1:year}`,color:"blue",who:"All regular taxpayers"},
      {date:`${year}-${m}-13`,form:"GSTR-1 (QRMP)",desc:`Quarterly return for QRMP scheme taxpayers`,color:"blue",who:"QRMP scheme taxpayers (quarterly)"},
      {date:`${year}-${m}-20`,form:"GSTR-3B",desc:`Summary return & tax payment — ${months[month===0?11:month-1]} ${month===0?year-1:year}`,color:"amber",who:"All regular taxpayers (turnover > 5 Cr)"},
      {date:`${year}-${m}-22`,form:"GSTR-3B (Cat-1)",desc:`Summary return for Category 1 states`,color:"amber",who:"Chhattisgarh, MP, Gujarat, Daman & Diu, Dadra, Maharashtra, Karnataka, Goa, Lakshadweep, Kerala, Tamil Nadu, Puducherry, Andaman, Telangana, AP"},
      {date:`${year}-${m}-24`,form:"GSTR-3B (Cat-2)",desc:`Summary return for Category 2 states`,color:"amber",who:"Himachal Pradesh, Punjab, Uttarakhand, Haryana, Rajasthan, UP, Bihar, Sikkim, Arunachal, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Assam, West Bengal, Jharkhand, Odisha, J&K, Ladakh, Chandigarh, Delhi"},
      {date:`${year}-${m}-28`,form:"GSTR-11",desc:`Return for UIN holders`,color:"gray",who:"UIN holders (embassies, UN bodies)"},
    ].sort((a,b)=>new Date(a.date)-new Date(b.date));
  };

  const annualDates=[
    {date:"31 Dec",form:"GSTR-9",desc:"Annual return for regular taxpayers"},
    {date:"31 Dec",form:"GSTR-9C",desc:"Reconciliation statement (turnover > 5 Cr)"},
    {date:"30 Nov",form:"GSTR-4",desc:"Annual return for composition dealers"},
  ];

  const dueDates=getDueDates(selMonth,selYear);
  const today=now.toISOString().split("T")[0];

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>Compliance Calendar</span>
        <select style={S.select} value={selMonth} onChange={e=>setSelMonth(parseInt(e.target.value))}>{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
        <select style={S.select} value={selYear} onChange={e=>setSelYear(parseInt(e.target.value))}>{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Monthly Due Dates — {months[selMonth]} {selYear}</div>
        {dueDates.map((d,i)=>{
          const isPast=d.date<today;
          const isToday=d.date===today;
          return(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:"1px solid #21262D",opacity:isPast?0.6:1}}>
              <div style={{minWidth:60,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,color:isToday?"#f85149":isPast?"#8B949E":"#e3b341"}}>{d.date.split("-")[2]}</div>
                <div style={{fontSize:10,color:"#8B949E"}}>{months[selMonth]}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  {badge(d.form,d.color)}
                  {isToday&&badge("TODAY","red")}
                  {isPast&&badge("Past","gray")}
                </div>
                <div style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</div>
                <div style={{fontSize:11,color:"#8B949E",marginTop:3}}>{d.who}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Annual Returns (FY 2024-25)</div>
        {annualDates.map((d,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{minWidth:60,fontSize:13,fontWeight:700,color:"#3fb950"}}>{d.date}</span>{badge(d.form,"green")}<span style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</span></div>))}
      </div>

      <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872"}}>
        <div style={{fontSize:12,color:"#58a6ff",fontWeight:600,marginBottom:8}}>Important Note</div>
        <div style={{fontSize:12,color:"#8B949E",lineHeight:1.8}}>
          • GSTR-1: 11th of every month (previous month data)<br/>
          • GSTR-3B: 20th/22nd/24th based on state and turnover<br/>
          • Late filing attracts Rs.50/day (Rs.20 for nil return)<br/>
          • Interest @18% p.a. on late tax payment<br/>
          • Annual return: 31st December each year
        </div>
      </div>
    </div>
  );
}

// ── NOTICE REPLY GENERATOR ─────────────────────────────────────────────────
function NoticeReplyGenerator({token}) {
  const [clients,setClients]=useState([]);
  const [notices,setNotices]=useState([]);
  const [form,setForm]=useState({client_id:"",notice_id:"",notice_type:"",ref_no:"",amount:"",description:""});
  const [reply,setReply]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ api("/clients","GET",null,token).then(d=>setClients(d.clients)); },[token]);
  useEffect(()=>{ if(form.client_id){ api(`/notices?client_id=${form.client_id}`,"GET",null,token).then(d=>setNotices(d.notices)); } },[form.client_id,token]);

  const selectNotice=(id)=>{
    const n=notices.find(x=>x.id===id);
    if(n) setForm(f=>({...f,notice_id:id,notice_type:n.type,ref_no:n.ref_no,amount:n.amount,description:n.description||""}));
    else setForm(f=>({...f,notice_id:id}));
  };

  const generate=async()=>{
    setLoading(true); setReply("");
    try{
      const client=clients.find(c=>c.id===form.client_id);
      const data=await api("/ai/generate-reply","POST",{
        client_name:client?.name||"",
        gstin:client?.gstin||"",
        notice_type:form.notice_type,
        ref_no:form.ref_no,
        amount:form.amount,
        description:form.description
      },token);
      setReply(data.reply||"");
    }catch(e){setReply("Error generating reply. Please try again.");}
    setLoading(false);
  };

  const copyReply=()=>{ navigator.clipboard.writeText(reply); };

  const printReply=()=>{
    const client=clients.find(c=>c.id===form.client_id);
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>GST Notice Reply</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.8;font-size:14px;}h2{color:#333;}pre{white-space:pre-wrap;font-family:Arial;}</style></head><body><h2>GST Notice Reply</h2><p><strong>Client:</strong> ${client?.name||""}</p><p><strong>GSTIN:</strong> ${client?.gstin||""}</p><p><strong>Notice Ref:</strong> ${form.ref_no}</p><hr/><pre>${reply}</pre></body></html>`);
    w.document.close(); w.print();
  };

  return(
    <div style={S.twoCol}>
      <div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Notice Details</div>
          <div style={S.fg}><label style={S.label}>Select Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          {form.client_id&&<div style={S.fg}><label style={S.label}>Select Notice (or fill manually)</label><select style={{...S.select,width:"100%"}} value={form.notice_id} onChange={e=>selectNotice(e.target.value)}><option value="">Manual entry</option>{notices.map(n=><option key={n.id} value={n.id}>{n.ref_no} — {n.type}</option>)}</select></div>}
          {[{l:"Notice Type *",k:"notice_type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Reference No. *",k:"ref_no",ph:"ZD071125006543C"},{l:"Amount (Rs.)",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
          <div style={S.fg}><label style={S.label}>Description / Context</label><textarea style={{...S.input,resize:"vertical",minHeight:80}} placeholder="Describe the issue or context..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
          <button onClick={generate} disabled={loading||!form.client_id||!form.notice_type} style={{...S.btn,width:"100%",opacity:loading||!form.client_id||!form.notice_type?0.5:1}}>
            {loading?"Generating Reply...":"Generate AI Reply"}
          </button>
        </div>
      </div>
      <div>
        <div style={{...S.card,minHeight:300}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>Generated Reply</div>
            {reply&&(<div style={{display:"flex",gap:8}}><button onClick={copyReply} style={S.btnGhost}>📋 Copy</button><button onClick={printReply} style={S.btnG}>🖨 Print / PDF</button></div>)}
          </div>
          {loading?<div style={{color:"#8B949E",fontSize:13,padding:20,textAlign:"center"}}>AI is generating a professional reply...<br/>This may take 10-20 seconds.</div>:
           reply?<div style={{fontSize:12,color:"#C9D1D9",whiteSpace:"pre-wrap",lineHeight:1.8,background:"#0D1117",padding:14,borderRadius:8}}>{reply}</div>:
           <div style={{color:"#8B949E",fontSize:13,padding:20,textAlign:"center"}}>Fill the notice details and click Generate AI Reply.<br/><br/>The AI will draft a professional reply citing relevant GST sections.</div>}
        </div>
      </div>
    </div>
  );
}

// ── CHALLAN MANAGER ────────────────────────────────────────────────────────
function ChallanManager({token,toast}) {
  const [challans,setChallans]=useState([]);
  const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({client_id:"",challan_no:"",type:"CGST+SGST",amount:"",period:"FY 2024-25",payment_date:"",notes:""});

  const load=useCallback(()=>{ setLoading(true); Promise.all([api("/challans","GET",null,token),api("/clients","GET",null,token)]).then(([cd,cl])=>{setChallans(cd.challans);setClients(cl.clients);setLoading(false);}).catch(()=>setLoading(false)); },[token]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{ setSaving(true); try{await api("/challans","POST",{...form,amount:parseFloat(form.amount)||0},token);toast("Challan added","success");setShowModal(false);load();}catch(e){toast(e.message,"error");} setSaving(false); };
  const del=async(id)=>{ if(!window.confirm("Delete?"))return; try{await api(`/challans/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");} };

  const totalPaid=challans.reduce((a,c)=>a+parseFloat(c.amount||0),0);

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
        <div style={{...S.kpi,flex:1}}><div style={S.kpiLabel}>Total Challans</div><div style={{...S.kpiVal,color:"#E6EDF3"}}>{challans.length}</div></div>
        <div style={{...S.kpi,flex:1}}><div style={S.kpiLabel}>Total Amount Paid</div><div style={{...S.kpiVal,color:"#3fb950",fontSize:18}}>Rs.{totalPaid.toLocaleString("en-IN")}</div></div>
        <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Challan</button>
      </div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          {challans.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No challans yet.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Challan No.","Client","Type","Period","Amount","Payment Date","Notes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{challans.map(c=>(<tr key={c.id}><td style={S.td}><span style={S.mono}>{c.challan_no}</span></td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{c.client_name}</td><td style={S.td}>{badge(c.type,"blue")}</td><td style={S.td}>{c.period}</td><td style={{...S.td,fontWeight:600,color:"#3fb950"}}>Rs.{Number(c.amount).toLocaleString("en-IN")}</td><td style={S.td}>{c.payment_date}</td><td style={S.td}>{c.notes||"—"}</td><td style={S.tdL}><button onClick={()=>del(c.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal&&(
        <Modal title="Add GST Challan" onClose={()=>setShowModal(false)}>
          <div style={S.fg}><label style={S.label}>Client *</label><select style={{...S.select,width:"100%"}} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          {[{l:"Challan No. *",k:"challan_no",ph:"CRN2024030100001234"},{l:"Amount (Rs.) *",k:"amount",ph:"50000",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.fg}><label style={S.label}>Tax Type *</label><select style={{...S.select,width:"100%"}} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{["CGST+SGST","IGST","CGST","SGST","CESS"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div style={S.fg}><label style={S.label}>Period *</label><select style={{...S.select,width:"100%"}} value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select></div>
          </div>
          <div style={S.fg}><label style={S.label}>Payment Date *</label><input style={S.input} type="date" value={form.payment_date} onChange={e=>setForm(p=>({...p,payment_date:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Notes</label><input style={S.input} placeholder="Optional notes" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add Challan"}</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── REPORTS ────────────────────────────────────────────────────────────────
function Reports({token}) {
  const [reportType,setReportType]=useState("compliance");
  const [period,setPeriod]=useState("FY 2024-25");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);

  const load=async()=>{
    setLoading(true); setData(null);
    try{
      let url="";
      if(reportType==="compliance") url=`/reports/compliance?period=${encodeURIComponent(period)}`;
      else if(reportType==="itc") url=`/reports/itc-summary?period=${encodeURIComponent(period)}`;
      else if(reportType==="notices") url=`/reports/notices-summary`;
      else url=`/reports/challan-summary`;
      const d=await api(url,"GET",null,token);
      setData(d);
    }catch(e){setData({error:e.message});}
    setLoading(false);
  };

  const printReport=()=>{
    const w=window.open("","_blank");
    const content=document.getElementById("report-content");
    w.document.write(`<html><head><title>TaxPro GST Report</title><style>body{font-family:Arial;margin:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f0f0f0;}h2{color:#333;}.header{display:flex;justify-content:space-between;margin-bottom:20px;}</style></head><body><div class="header"><h2>TaxPro GST — ${reportType.toUpperCase()} Report</h2><p>Period: ${period} | Generated: ${new Date().toLocaleDateString("en-IN")}</p></div>${content.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <select style={S.select} value={reportType} onChange={e=>setReportType(e.target.value)}>
          <option value="compliance">Compliance Report</option>
          <option value="itc">ITC Summary</option>
          <option value="notices">Notice Summary</option>
          <option value="challan">Challan Summary</option>
        </select>
        {(reportType==="compliance"||reportType==="itc")&&<select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select>}
        <button onClick={load} style={S.btn}>Generate Report</button>
        {data&&!data.error&&<button onClick={printReport} style={S.btnG}>🖨 Print / PDF</button>}
      </div>

      {loading&&<Spinner/>}
      {data?.error&&<div style={{color:"#f85149",padding:20}}>Error: {data.error}</div>}

      {data&&!data.error&&(
        <div style={S.card} id="report-content">
          {reportType==="compliance"&&(
            <table style={S.tbl}>
              <thead><tr>{["Client","GSTIN","Status","Open Notices","GSTR-1","GSTR-3B","GSTR-9"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{data.report?.map((r,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.client.name}</td><td style={S.td}><span style={S.mono}>{r.client.gstin}</span></td><td style={S.td}><StatusBadge s={r.client.status}/></td><td style={{...S.td,color:r.open_notices>0?"#f85149":"#3fb950",fontWeight:600}}>{r.open_notices}</td><td style={S.td}><ReturnPill s={r.returns?.gstr1_status||"not-filed"}/></td><td style={S.td}><ReturnPill s={r.returns?.gstr3b_status||"not-filed"}/></td><td style={S.tdL}><ReturnPill s={r.returns?.gstr9_status||"not-filed"}/></td></tr>))}</tbody>
            </table>
          )}
          {reportType==="itc"&&(
            <table style={S.tbl}>
              <thead><tr>{["Client","GSTIN","GSTR-2B Total","Books Total","Difference","Mismatches","Missing"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{data.summary?.map((r,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td><td style={{...S.td,textAlign:"right"}}>Rs.{Number(r.total_gstr2b||0).toLocaleString("en-IN")}</td><td style={{...S.td,textAlign:"right"}}>Rs.{Number(r.total_books||0).toLocaleString("en-IN")}</td><td style={{...S.td,textAlign:"right",color:r.total_diff<0?"#f85149":r.total_diff>0?"#e3b341":"#3fb950",fontWeight:600}}>Rs.{Number(r.total_diff||0).toLocaleString("en-IN")}</td><td style={{...S.td,color:"#e3b341",fontWeight:600}}>{r.mismatches}</td><td style={{...S.tdL,color:"#f85149",fontWeight:600}}>{r.missing}</td></tr>))}</tbody>
            </table>
          )}
          {reportType==="notices"&&(
            <table style={S.tbl}>
              <thead><tr>{["Client","GSTIN","Total Notices","Total Amount","Pending","Overdue","Closed"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{data.summary?.map((r,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td><td style={{...S.td,fontWeight:600}}>{r.total_notices}</td><td style={{...S.td,fontWeight:600,color:"#e3b341"}}>Rs.{Number(r.total_amount||0).toLocaleString("en-IN")}</td><td style={{...S.td,color:"#e3b341"}}>{r.pending}</td><td style={{...S.td,color:"#f85149",fontWeight:600}}>{r.overdue}</td><td style={{...S.tdL,color:"#3fb950"}}>{r.closed}</td></tr>))}</tbody>
            </table>
          )}
          {reportType==="challan"&&(
            <table style={S.tbl}>
              <thead><tr>{["Client","GSTIN","Period","Total Challans","Total Paid"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{data.summary?.map((r,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td><td style={S.td}>{r.period}</td><td style={S.td}>{r.total_challans}</td><td style={{...S.tdL,fontWeight:600,color:"#3fb950"}}>Rs.{Number(r.total_paid||0).toLocaleString("en-IN")}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── WHATSAPP ALERTS ────────────────────────────────────────────────────────
function WhatsAppAlerts({token,toast}) {
  const [phone,setPhone]=useState("");
  const [sending,setSending]=useState(false);
  const [clients,setClients]=useState([]);
  const [selClient,setSelClient]=useState("");
  const [customMsg,setCustomMsg]=useState("");

  useEffect(()=>{ api("/clients","GET",null,token).then(d=>setClients(d.clients)); },[token]);

  const sendReminders=async()=>{
    if(!phone)return toast("Enter phone number","error");
    setSending(true);
    try{ const d=await api("/whatsapp/send-reminders","POST",{phone:phone.startsWith("+")?phone:"+91"+phone},token); toast(d.message,"success"); }
    catch(e){ toast(e.message,"error"); }
    setSending(false);
  };

  const sendCustom=async()=>{
    if(!phone||!customMsg)return toast("Enter phone and message","error");
    setSending(true);
    try{ await api("/whatsapp/send","POST",{phone:phone.startsWith("+")?phone:"+91"+phone,message:customMsg},token); toast("Message sent!","success"); }
    catch(e){ toast(e.message,"error"); }
    setSending(false);
  };

  const sendFilingReminder=async()=>{
    const client=clients.find(c=>c.id===selClient);
    if(!phone||!client)return toast("Select client and enter phone","error");
    setSending(true);
    try{ await api("/whatsapp/filing-reminder","POST",{phone:phone.startsWith("+")?phone:"+91"+phone,client_name:client.name,returns_pending:"GSTR-1, GSTR-3B (pending)"},token); toast("Filing reminder sent!","success"); }
    catch(e){ toast(e.message,"error"); }
    setSending(false);
  };

  return(
    <div>
      <div style={{background:"#2d1b00",border:"1px solid #9e6a03",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#e3b341"}}>
        ⚠️ WhatsApp alerts require Twilio account setup. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to your Render environment variables.
      </div>

      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Phone Number</div>
          <div style={S.fg}><label style={S.label}>WhatsApp Number (with country code)</label><input style={S.input} placeholder="+919876543210 or 9876543210" value={phone} onChange={e=>setPhone(e.target.value)}/><div style={{fontSize:11,color:"#8B949E",marginTop:4}}>Indian numbers: enter 10 digits (auto-adds +91)</div></div>

          <div style={{borderTop:"1px solid #21262D",paddingTop:14,marginTop:4}}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:10}}>Send Due Date Reminders</div>
            <div style={{fontSize:12,color:"#8B949E",marginBottom:10}}>Automatically sends all notices due in next 7 days to the phone number above.</div>
            <button onClick={sendReminders} disabled={sending} style={{...S.btn,width:"100%",background:"#25D366",opacity:sending?0.6:1}}>📱 Send Notice Reminders</button>
          </div>
        </div>

        <div>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Filing Reminder</div>
            <div style={S.fg}><label style={S.label}>Select Client</label><select style={{...S.select,width:"100%"}} value={selClient} onChange={e=>setSelClient(e.target.value)}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <button onClick={sendFilingReminder} disabled={sending||!selClient} style={{...S.btn,width:"100%",background:"#25D366",opacity:sending||!selClient?0.5:1}}>📱 Send Filing Reminder</button>
          </div>

          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Custom Message</div>
            <div style={S.fg}><textarea style={{...S.input,resize:"vertical",minHeight:80}} placeholder="Type your custom message..." value={customMsg} onChange={e=>setCustomMsg(e.target.value)}/></div>
            <button onClick={sendCustom} disabled={sending||!customMsg} style={{...S.btn,width:"100%",background:"#25D366",opacity:sending||!customMsg?0.5:1}}>📱 Send Custom Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STAFF MANAGER ──────────────────────────────────────────────────────────
function StaffManager({token,toast}) {
  const [staff,setStaff]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:""});

  const load=useCallback(()=>{ setLoading(true); api("/staff","GET",null,token).then(d=>{setStaff(d.staff);setLoading(false);}).catch(()=>setLoading(false)); },[token]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{ setSaving(true); try{await api("/staff","POST",form,token);toast("Staff added","success");setShowModal(false);setForm({name:"",email:"",password:""});load();}catch(e){toast(e.message,"error");} setSaving(false); };
  const del=async(id)=>{ if(!window.confirm("Remove this staff member?"))return; try{await api(`/staff/${id}`,"DELETE",null,token);toast("Staff removed","success");load();}catch(e){toast(e.message,"error");} };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button onClick={()=>setShowModal(true)} style={S.btn}>+ Add Staff</button>
      </div>

      <div style={{background:"#0c1d2e",border:"1px solid #1f4872",borderRadius:8,padding:12,marginBottom:14,fontSize:12,color:"#58a6ff"}}>
        Staff members can login with their email/password and view all clients and data. Only you (CA) can add/remove staff.
      </div>

      {loading?<Spinner/>:(
        <div style={S.card}>
          {staff.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No staff members yet.</div>:(
            <table style={S.tbl}>
              <thead><tr>{["Name","Email","Role","Joined","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{staff.map(s=>(<tr key={s.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{s.name}</td><td style={S.td}>{s.email}</td><td style={S.td}>{badge("Staff","blue")}</td><td style={S.td}>{new Date(s.created_at).toLocaleDateString("en-IN")}</td><td style={S.tdL}><button onClick={()=>del(s.id)} style={S.btnDanger}>Remove</button></td></tr>))}</tbody>
            </table>
          )}
        </div>
      )}

      {showModal&&(
        <Modal title="Add Staff Member" onClose={()=>setShowModal(false)}>
          {[{l:"Full Name *",k:"name",ph:"Staff Member Name"},{l:"Email *",k:"email",ph:"staff@firm.com",t:"email"},{l:"Password *",k:"password",ph:"min 6 characters",t:"password"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
          <div style={{background:"#0c1d2e",border:"1px solid #1f4872",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#58a6ff"}}>Staff will login at the same URL using their email and password.</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Adding...":"Add Staff"}</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── AI ASSISTANT ───────────────────────────────────────────────────────────
function AIAssistant({token}) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Namaste! I am your AI GST Assistant.\n\nAsk me anything about GST — notices, ITC, reconciliation, returns, DRC-01 replies, or any compliance question."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send=async(text)=>{
    const msg=text||input.trim(); if(!msg||loading)return;
    setInput(""); setMsgs(prev=>[...prev,{role:"user",content:msg}]); setLoading(true);
    try{
      const history=msgs.map(m=>({role:m.role,content:m.content}));
      const data=await api("/ai/chat","POST",{messages:[...history,{role:"user",content:msg}]},token);
      setMsgs(prev=>[...prev,{role:"assistant",content:data.reply||"Sorry, could not process."}]);
    }catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"Error. Try again."}]);}
    setLoading(false);
  };

  const chips=["How to respond to DRC-01?","GSTR-2B vs 2A differences","ITC reversal Rule 42","Section 16(4) time limit","GSTR-9 due date FY 2024-25","RCM applicability"];

  return(
    <div style={S.aiWrap}>
      <div style={S.aiMsgs}>
        {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>{m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginRight:8,flexShrink:0,marginTop:2,color:"#fff",fontWeight:700}}>AI</div>}<div style={m.role==="user"?S.bubU:S.bubA}>{m.content}</div></div>))}
        {loading&&<div style={{display:"flex",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>AI</div><div style={{...S.bubA,color:"#8B949E"}}>Thinking...</div></div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px 14px"}}>{chips.map(c=><button key={c} onClick={()=>send(c)} disabled={loading} style={{padding:"4px 10px",borderRadius:20,border:"1px solid #30363D",background:"transparent",color:"#8B949E",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div>
      <div style={{display:"flex",gap:8,padding:"12px 14px",borderTop:"1px solid #21262D"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask your GST query..." disabled={loading} style={{...S.input,flex:1}}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{...S.btn,opacity:loading||!input.trim()?0.5:1}}>Send</button>
      </div>
    </div>
  );
}

// ── NAV & APP SHELL ────────────────────────────────────────────────────────
const NAV=[
  {key:"dashboard",   icon:"📊", label:"Dashboard",         group:"main"},
  {key:"clients",     icon:"🏢", label:"Clients",           group:"main"},
  {key:"notices",     icon:"🔔", label:"Notice Manager",    group:"main"},
  {key:"returns",     icon:"📋", label:"Return Tracker",    group:"main"},
  {key:"reconcile",   icon:"⇄",  label:"Reconciliation",   group:"main"},
  {key:"challans",    icon:"💰", label:"Challan Manager",   group:"tools"},
  {key:"calculator",  icon:"🧮", label:"GST Calculator",    group:"tools"},
  {key:"calendar",    icon:"📅", label:"Compliance Calendar",group:"tools"},
  {key:"reply",       icon:"✍",  label:"Notice Reply AI",   group:"tools"},
  {key:"reports",     icon:"📈", label:"Reports & Export",  group:"tools"},
  {key:"whatsapp",    icon:"📱", label:"WhatsApp Alerts",   group:"tools"},
  {key:"staff",       icon:"👥", label:"Staff Manager",     group:"settings"},
  {key:"ai",          icon:"✦",  label:"AI Assistant",      group:"settings"},
];

const TITLES={dashboard:"Dashboard",clients:"Client Manager",notices:"Notice Manager",returns:"Return Filing Tracker",reconcile:"GST Reconciliation",challans:"Challan Manager",calculator:"GST Calculator",calendar:"Compliance Calendar",reply:"Notice Reply Generator",reports:"Reports & PDF Export",whatsapp:"WhatsApp Alerts",staff:"Staff Manager",ai:"AI GST Assistant"};

export default function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("taxpro_user"));}catch{return null;}});
  const [token,setToken]=useState(()=>localStorage.getItem("taxpro_token")||"");
  const [view,setView]=useState("dashboard");
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const logout=()=>{localStorage.removeItem("taxpro_token");localStorage.removeItem("taxpro_user");setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const groups=[{id:"main",label:"MAIN"},{id:"tools",label:"TOOLS"},{id:"settings",label:"OTHER"}];

  return(
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={{padding:"16px",borderBottom:"1px solid #21262D"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#E6EDF3"}}>TaxPro GST</div>
          <div style={{fontSize:11,color:"#8B949E",marginTop:2}}>CA Practice Suite</div>
        </div>
        <nav style={{flex:1,padding:"8px 0"}}>
          {groups.map(g=>(
            <div key={g.id}>
              <div style={{fontSize:10,color:"#444C56",padding:"10px 16px 4px",letterSpacing:0.8,fontWeight:600}}>{g.label}</div>
              {NAV.filter(n=>n.group===g.id).map(n=>(
                <button key={n.key} onClick={()=>setView(n.key)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 16px",border:"none",background:view===n.key?"#1F6FEB18":"transparent",borderLeft:view===n.key?"2px solid #1F6FEB":"2px solid transparent",color:view===n.key?"#58a6ff":"#8B949E",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:view===n.key?600:400,textAlign:"left"}}>
                  <span style={{fontSize:14}}>{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid #21262D"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#E6EDF3"}}>{user.firm_name||user.name}</div>
          <div style={{fontSize:11,color:"#8B949E",marginTop:2}}>{user.email}</div>
          <button onClick={logout} style={{...S.btnGhost,marginTop:10,width:"100%",fontSize:11,padding:"6px"}}>Logout</button>
        </div>
      </aside>
      <div style={S.main}>
        <div style={S.topbar}>
          <span style={{fontSize:15,fontWeight:600,color:"#E6EDF3"}}>{TITLES[view]}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:"#8B949E"}}>Welcome, {user.name}</span>{badge("Live","green")}</div>
        </div>
        <div style={S.content}>
          {view==="dashboard"  &&<Dashboard      token={token}/>}
          {view==="clients"    &&<Clients        token={token} toast={showToast}/>}
          {view==="notices"    &&<Notices        token={token} toast={showToast}/>}
          {view==="returns"    &&<Returns        token={token} toast={showToast}/>}
          {view==="reconcile"  &&<Reconciliation token={token} toast={showToast}/>}
          {view==="challans"   &&<ChallanManager token={token} toast={showToast}/>}
          {view==="calculator" &&<GSTCalculator/>}
          {view==="calendar"   &&<ComplianceCalendar/>}
          {view==="reply"      &&<NoticeReplyGenerator token={token}/>}
          {view==="reports"    &&<Reports        token={token}/>}
          {view==="whatsapp"   &&<WhatsAppAlerts token={token} toast={showToast}/>}
          {view==="staff"      &&<StaffManager   token={token} toast={showToast}/>}
          {view==="ai"         &&<AIAssistant    token={token}/>}
        </div>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}