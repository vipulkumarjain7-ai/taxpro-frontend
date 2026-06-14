import{useState,useRef,useEffect,useCallback}from"react";

const API=process.env.REACT_APP_API||"https://taxpro-backend-xi90.onrender.com/api";

const api=async(path,method="GET",body=null,token=null)=>{
  const h={"Content-Type":"application/json"};
  if(token)h["Authorization"]=`Bearer ${token}`;
  const opts={method,headers:h};
  if(body)opts.body=JSON.stringify(body);
  const r=await fetch(`${API}${path}`,opts);
  const d=await r.json();
  if(!r.ok)throw new Error(d.message||"Request failed");
  return d;
};

const fmtM=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const today=()=>new Date().toISOString().split("T")[0];

// ── STYLES ─────────────────────────────────────────────────────────────────
const C={
  bg:"#0D1117",card:"#161B22",border:"#21262D",
  primary:"#1F6FEB",green:"#238636",red:"#da3633",amber:"#d29922",
  text:"#E6EDF3",muted:"#8B949E",sub:"#C9D1D9",
};
const S={
  app:{display:"flex",flexDirection:"column",minHeight:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,color:C.sub},
  topbar:{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 10px",height:50,display:"flex",alignItems:"center",gap:8,flexShrink:0,position:"sticky",top:0,zIndex:100},
  body:{display:"flex",flex:1,overflow:"hidden",position:"relative"},
  sidebar:{width:200,minWidth:200,background:"#0D1117",borderRight:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0},
  main:{flex:1,overflowY:"auto",padding:18,minWidth:0},
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:12},
  kpi:{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14},
  label:{fontSize:11,color:C.muted,display:"block",marginBottom:5,fontWeight:500},
  input:{padding:"8px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#0D1117",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"},
  select:{padding:"7px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:C.card,color:C.sub,fontSize:12,fontFamily:"inherit",width:"100%"},
  btn:{padding:"8px 16px",borderRadius:7,border:"none",background:C.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"},
  btnG:{padding:"8px 16px",borderRadius:7,border:"none",background:C.green,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"},
  btnR:{padding:"7px 14px",borderRadius:7,border:`1px solid ${C.red}`,background:"transparent",color:"#f85149",cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  btnO:{padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  fg:{marginBottom:14},
  tbl:{width:"100%",borderCollapse:"collapse",fontSize:12},
  th:{textAlign:"left",padding:"8px 10px",color:C.muted,borderBottom:`1px solid ${C.border}`,fontWeight:500,fontSize:11},
  td:{padding:"8px 10px",borderBottom:`1px solid ${C.border}`,color:C.sub,verticalAlign:"middle"},
  tdR:{padding:"8px 10px",color:C.sub,verticalAlign:"middle"},
  mono:{fontFamily:"monospace",fontSize:11,color:C.muted},
  col2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14},
  col3:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:14},
};

// ── RESPONSIVE HELPER ───────────────────────────────────────────────────────
function useIsMobile(){
  const[isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<=820);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<=820);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  return isMobile;
}

// Global responsive styles (tables scroll horizontally on small screens)
const GlobalStyles=()=>(
  <style>{`
    * { box-sizing: border-box; }
    @media (max-width: 820px) {
      table { font-size: 11px; display: block; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; border: none !important; }
      table thead, table tbody, table tr { display: table; width: 100%; table-layout: auto; }
      table tfoot { display: block; }
      table tfoot tr { display: table; width: 100%; }
    }
    input, select, textarea { font-size: 13px; }
    @media (max-width: 480px) {
      table { font-size: 10px; }
    }
  `}</style>
);

// Badge
const badge=(t,c="gray")=>{
  const m={green:{bg:"#0d2818",c:"#3fb950",b:"#238636"},amber:{bg:"#2d1b00",c:"#e3b341",b:"#9e6a03"},red:{bg:"#2d0e0e",c:"#f85149",b:"#6e1c1c"},blue:{bg:"#0c1d2e",c:"#58a6ff",b:"#1f4872"},gray:{bg:"#21262D",c:"#8b949e",b:"#30363D"},purple:{bg:"#1a0a2e",c:"#bf91f3",b:"#6e40c9"},teal:{bg:"#002d2d",c:"#39d0d0",b:"#006666"}};
  const x=m[c]||m.gray;
  return<span style={{background:x.bg,color:x.c,border:`1px solid ${x.b}`,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{t}</span>;
};

const Spinner=()=><div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:26,height:26,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.primary}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;

const Toast=({msg,type,onClose})=>(
  <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:type==="error"?"#2d0e0e":"#0d2818",border:`1px solid ${type==="error"?"#6e1c1c":"#238636"}`,color:type==="error"?"#f85149":"#3fb950",padding:"12px 16px",borderRadius:10,maxWidth:380,display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
    <span style={{fontSize:13}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:18,marginLeft:"auto"}}>✕</button>
  </div>
);

const Modal=({title,onClose,children,wide})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:30,overflowY:"auto"}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,width:wide?"min(860px,95vw)":"min(540px,92vw)",maxHeight:"90vh",overflowY:"auto",margin:"0 auto 30px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:22,lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── COMPANY GUARD ───────────────────────────────────────────────────────────
const CompanyCtx=({company,onGo,children})=>{
  if(!company)return(
    <div style={{...S.card,textAlign:"center",padding:60,maxWidth:460,margin:"40px auto"}}>
      <div style={{fontSize:52,marginBottom:14}}>🏢</div>
      <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:8}}>No Active Company</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.7}}>Select or create a company first.<br/>All features are company-specific.</div>
      <button onClick={onGo} style={{...S.btn,padding:"10px 24px"}}>→ Manage Companies</button>
    </div>
  );
  return children;
};

// ── AUTH ────────────────────────────────────────────────────────────────────
function AuthScreen({onAuth}){
  const[tab,setTab]=useState("login");
  const[f,setF]=useState({name:"",email:"",password:"",firm:""});
  const[loading,setLoading]=useState(false);
  const[warming,setWarming]=useState(true);
  const[err,setErr]=useState("");
  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).then(()=>setWarming(false)).catch(()=>setWarming(false));},[]);
  const go=async()=>{
    setErr("");setLoading(true);
    try{
      const d=await api(tab==="login"?"/auth/login":"/auth/register","POST",
        tab==="login"?{email:f.email,password:f.password}:{name:f.name,email:f.email,password:f.password,firm_name:f.firm});
      localStorage.setItem("tp_token",d.token);
      localStorage.setItem("tp_user",JSON.stringify(d.user));
      onAuth(d.user,d.token);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"#0D1117",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(400px,92vw)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>🛡️</div>
          <div style={{fontSize:24,fontWeight:800,color:C.text}}>TaxPro GST</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>Complete Accounting + GST Suite</div>
        </div>
        <div style={S.card}>
          <div style={{display:"flex",gap:4,marginBottom:20,background:"#0D1117",borderRadius:8,padding:4}}>
            {["login","register"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:tab===t?C.primary:"transparent",color:tab===t?"#fff":C.muted}}>{t==="login"?"Sign In":"Register"}</button>)}
          </div>
          {tab==="register"&&<>
            <div style={S.fg}><label style={S.label}>Your Name</label><input style={S.input} placeholder="CA Rajesh Sharma" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Firm Name</label><input style={S.input} placeholder="Sharma & Associates" value={f.firm} onChange={e=>setF(p=>({...p,firm:e.target.value}))}/></div>
          </>}
          <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value})) } onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <div style={S.fg}><label style={S.label}>Password</label><input style={S.input} type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          {err&&<div style={{background:"#2d0e0e",border:"1px solid #6e1c1c",color:"#f85149",padding:"9px 12px",borderRadius:7,fontSize:12,marginBottom:12}}>⚠ {err}</div>}
          <button onClick={go} disabled={loading||warming} style={{...S.btn,width:"100%",padding:"11px",opacity:loading||warming?0.7:1}}>
            {warming?"⏳ Connecting...":loading?"Please wait...":tab==="login"?"Sign In →":"Create Account"}
          </button>
          {warming&&<div style={{fontSize:11,color:C.amber,textAlign:"center",marginTop:8}}>Server waking up (~30s on free plan)</div>}
        </div>
      </div>
    </div>
  );
}

// ── SUITE DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({token,company,setView}){
  const isMobile=useIsMobile();
  const[stats,setStats]=useState(null);
  useEffect(()=>{
    if(!company)return;
    Promise.all([
      api(`/invoices/stats/summary?company_id=${company.id}`,"GET",null,token).catch(()=>null),
      api(`/dashboard?company_id=${company.id}`,"GET",null,token).catch(()=>null),
    ]).then(([inv,gst])=>{setStats({inv:inv?.stats,gst:gst?.dashboard});});
  },[company,token]);
  const SUITES=[
    {icon:"📒",title:"Masters",desc:"Ledgers, Parties, Products, Chart of Accounts",keys:["ledgers"],color:"#1F6FEB"},
    {icon:"✏️",title:"Transactions",desc:"Voucher Entry F4-F9, Sales, Purchase, Bank",keys:["vouchers"],color:"#238636"},
    {icon:"📊",title:"Reports",desc:"Trial Balance, P&L, Balance Sheet, Day Book",keys:["acc-reports"],color:"#9333ea"},
    {icon:"🧾",title:"GST Suite",desc:"GSTR-1, 3B, E-Invoice, E-Way Bill, Reconciliation",keys:["gstr3b"],color:"#0e9182"},
    {icon:"🤖",title:"AI Tools",desc:"Invoice Scanner, Bank Import, Notice Reply",keys:["ai-invoice"],color:"#e11d48"},
    {icon:"🏦",title:"Banking",desc:"Bank Statement Import, Reconciliation",keys:["bank"],color:"#d97706"},
  ];
  return(
    <div>
      {!company&&<div style={{...S.card,background:"#2d1b00",border:`1px solid ${C.amber}`,marginBottom:16,textAlign:"center",padding:20}}>
        <div style={{fontSize:20,marginBottom:6}}>⚠️</div>
        <div style={{fontWeight:700,color:"#e3b341"}}>Select a Company</div>
        <div style={{fontSize:12,color:C.sub,marginTop:4}}>Click "Change Company" in the top bar to start</div>
      </div>}
      {company&&stats?.inv&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:20}}>
          {[{l:"Monthly Sales",v:fmtM(stats.inv.monthly_sales||0),c:"#3fb950",i:"📈"},{l:"Monthly Purchase",v:fmtM(stats.inv.monthly_purchases||0),c:"#58a6ff",i:"📉"},{l:"Outstanding",v:fmtM(stats.inv.total_outstanding||0),c:"#e3b341",i:"⏳"},{l:"Overdue",v:fmtM(stats.inv.overdue_amount||0),c:"#f85149",i:"🔴"}].map(k=>(
            <div key={k.l} style={S.kpi}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</span><span>{k.i}</span></div>
              <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:1,marginBottom:10}}>SELECT A MODULE</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
        {SUITES.map(s=>(
          <div key={s.title} onClick={()=>setView(s.keys[0])} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,cursor:"pointer",transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=s.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:32,marginBottom:10}}>{s.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>{s.title}</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:14}}>{s.desc}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:s.color,color:"#fff",padding:"6px 14px",borderRadius:7,fontSize:11,fontWeight:600}}>Enter →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMPANY MANAGER ────────────────────────────────────────────────────────
function CompanyManager({token,toast,onSelect,current}){
  const[list,setList]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);const[saving,setSaving]=useState(false);
  const[f,setF]=useState({name:"",gstin:"",pan:"",address:"",city:"",state:"",fy_start:"2025-04-01",fy_end:"2026-03-31"});
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Goa","Other"];
  const load=()=>{setLoading(true);api("/accounting/companies","GET",null,token).then(d=>{setList(d.companies||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const save=async()=>{if(!f.name)return toast("Company name required","error");setSaving(true);try{const d=await api("/accounting/companies","POST",f,token);toast("✅ Company created with Chart of Accounts!","success");setModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async(e,id)=>{e.stopPropagation();if(!window.confirm("Delete company and ALL its data?"))return;try{await api(`/accounting/companies/${id}`,"DELETE",null,token);toast("Deleted","success");if(current?.id===id)onSelect(null);load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>Companies</div>
      <button onClick={()=>setModal(true)} style={S.btn}>+ New Company</button>
    </div>
    {loading?<Spinner/>:list.length===0?(
      <div style={{...S.card,textAlign:"center",padding:50}}>
        <div style={{fontSize:48,marginBottom:12}}>🏢</div>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>No Companies Yet</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Create your first company to start accounting</div>
        <button onClick={()=>setModal(true)} style={S.btn}>+ Create Company</button>
      </div>
    ):(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {list.map(c=>(
          <div key={c.id} onClick={()=>onSelect(c)} style={{...S.card,cursor:"pointer",border:`2px solid ${current?.id===c.id?"#1F6FEB":C.border}`,background:current?.id===c.id?"#0c1d2e":C.card,marginBottom:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{c.name}</div>
              {current?.id===c.id&&badge("Active","green")}
            </div>
            {c.gstin&&<div style={{...S.mono,marginBottom:4}}>{c.gstin}</div>}
            <div style={{fontSize:11,color:C.muted,marginBottom:10}}>FY {c.fy_start?.substring(0,4)}–{c.fy_end?.substring(0,4)}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>onSelect(c)} style={{...S.btnG,flex:1,fontSize:11,padding:"6px"}}>Select</button>
              <button onClick={e=>del(e,c.id)} style={{...S.btnR,fontSize:11,padding:"6px 12px"}}>Del</button>
            </div>
          </div>
        ))}
      </div>
    )}
    {modal&&(<Modal title="Create Company" onClose={()=>setModal(false)} wide>
      <div style={S.col2}>
        <div>
          <div style={S.fg}><label style={S.label}>Company Name *</label><input style={S.input} placeholder="My Business Pvt Ltd" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>GSTIN (optional — auto-fills details)</label>
            <GSTINInput value={f.gstin} onChange={v=>setF(p=>({...p,gstin:v}))} token={token} onVerified={info=>setF(p=>({
              ...p,
              gstin:info.gstin,
              name:info.business_name||p.name,
              pan:info.pan?info.pan.toUpperCase():p.pan,
              address:info.address||p.address,
              city:info.city||p.city,
              state:info.state||p.state,
            }))}/>
          </div>
          <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={f.pan} onChange={e=>setF(p=>({...p,pan:e.target.value.toUpperCase()}))}/></div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,minHeight:60,resize:"vertical"}} value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))}/></div>
        </div>
        <div>
          <div style={S.fg}><label style={S.label}>City</label><input style={S.input} value={f.city} onChange={e=>setF(p=>({...p,city:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>FY Start</label><input type="date" style={S.input} value={f.fy_start} onChange={e=>setF(p=>({...p,fy_start:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>FY End</label><input type="date" style={S.input} value={f.fy_end} onChange={e=>setF(p=>({...p,fy_end:e.target.value}))}/></div>
        </div>
      </div>
      <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:12}}>
        <div style={{fontSize:12,color:"#58a6ff"}}>✨ Auto-creates full Chart of Accounts: Capital, Sales, Purchase, Sundry Debtors/Creditors, Cash, Bank, GST ledgers</div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button>
        <button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Creating...":"Create Company"}</button>
      </div>
    </Modal>)}
  </div>);
}

// ── TALLY-STYLE VOUCHER ENTRY ───────────────────────────────────────────────
const VTYPES={
  CONTRA: {key:"CONTRA",f:"F4",label:"Contra",short:"Cash/Bank transfers",color:"#6e40c9"},
  PAYMENT:{key:"PAYMENT",f:"F5",label:"Payment",short:"Expenses, vendor payments",color:"#c0392b"},
  RECEIPT:{key:"RECEIPT",f:"F6",label:"Receipt",short:"Customer receipts, income",color:"#238636"},
  JOURNAL:{key:"JOURNAL",f:"F7",label:"Journal",short:"Adjustments, depreciation",color:"#1F6FEB"},
  SALES:  {key:"SALES",  f:"F8",label:"Sales",  short:"Sales voucher entry",color:"#0e9182"},
  PURCHASE:{key:"PURCHASE",f:"F9",label:"Purchase",short:"Purchase entry",color:"#d97706"},
};

function VoucherEntry({token,toast,company}){
  const isMobile=useIsMobile();
  const[vtype,setVtype]=useState("RECEIPT");
  const[ledgers,setLedgers]=useState([]);
  const[vouchers,setVouchers]=useState([]);
  const[tab,setTab]=useState("new"); // "new" | "list"
  const[date,setDate]=useState(today());
  const[refNo,setRefNo]=useState("");
  const[narration,setNarration]=useState("");
  const[rows,setRows]=useState([{ledger_id:"",amount:"",side:"Dr"},{ledger_id:"",amount:"",side:"Cr"}]);
  const[saving,setSaving]=useState(false);
  const[viewing,setViewing]=useState(null);
  const[filter,setFilter]=useState("ALL");
  const cid=company?.id;

  useEffect(()=>{
    if(!cid)return;
    api(`/accounting/companies/${cid}/ledgers`,"GET",null,token).then(d=>setLedgers(d.ledgers||[])).catch(()=>{});
  },[cid,token]);

  const loadVouchers=useCallback(()=>{
    if(!cid)return;
    api(`/accounting/companies/${cid}/vouchers${filter!=="ALL"?`?type=${filter}`:""}`, "GET",null,token)
      .then(d=>setVouchers(d.vouchers||[])).catch(()=>{});
  },[cid,token,filter]);

  useEffect(()=>{if(tab==="list")loadVouchers();},[tab,loadVouchers]);

  // Keyboard shortcuts F4-F9
  useEffect(()=>{
    if(tab!=="new")return;
    const h=e=>{
      if(e.key==="F4")setVtype("CONTRA");
      else if(e.key==="F5")setVtype("PAYMENT");
      else if(e.key==="F6")setVtype("RECEIPT");
      else if(e.key==="F7")setVtype("JOURNAL");
      else if(e.key==="F8")setVtype("SALES");
      else if(e.key==="F9")setVtype("PURCHASE");
      else if(e.key==="Escape")clearForm();
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[tab]);

  const totalDr=rows.filter(r=>r.side==="Dr").reduce((a,r)=>a+(parseFloat(r.amount)||0),0);
  const totalCr=rows.filter(r=>r.side==="Cr").reduce((a,r)=>a+(parseFloat(r.amount)||0),0);
  const diff=Math.abs(totalDr-totalCr);
  const balanced=diff<0.01&&totalDr>0;

  const setRow=(i,k,v)=>{const n=[...rows];n[i]={...n[i],[k]:v};setRows(n);};
  const addRow=()=>setRows(p=>[...p,{ledger_id:"",amount:"",side:p.length%2===0?"Dr":"Cr"}]);
  const remRow=i=>{if(rows.length<=2)return;setRows(p=>p.filter((_,j)=>j!==i));};

  const clearForm=()=>{setDate(today());setRefNo("");setNarration("");setRows([{ledger_id:"",amount:"",side:"Dr"},{ledger_id:"",amount:"",side:"Cr"}]);};

  const saveVoucher=async()=>{
    if(!cid)return toast("Select company first","error");
    const items=rows.filter(r=>r.ledger_id&&parseFloat(r.amount||0)>0).map(r=>({ledger_id:r.ledger_id,dr_amount:r.side==="Dr"?parseFloat(r.amount):0,cr_amount:r.side==="Cr"?parseFloat(r.amount):0,narration}));
    if(items.length<2)return toast("Minimum 2 entries needed","error");
    if(!balanced)return toast(`Not balanced! Dr:${fmtM(totalDr)} Cr:${fmtM(totalCr)} — Diff:${fmtM(diff)}`,"error");
    setSaving(true);
    try{
      const r=await api(`/accounting/companies/${cid}/vouchers`,"POST",{voucher_type:vtype,date,ref_no:refNo,narration,items},token);
      toast(`✅ ${r.voucher?.voucher_no} saved!`,"success");
      clearForm();
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };

  const vt=VTYPES[vtype];
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  if(!cid)return<CompanyCtx company={null} onGo={()=>{}}/>;

  return(
    <div style={{height:isMobile?"auto":"calc(100vh - 100px)",display:"flex",flexDirection:"column",overflow:isMobile?"visible":"hidden"}}>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        {[{k:"new",l:"📝 New Entry"},{k:"list",l:"📋 Voucher List"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"7px 18px",borderRadius:7,border:`1px solid ${tab===t.k?"#1F6FEB":C.border}`,background:tab===t.k?"#0c1d2e":"transparent",color:tab===t.k?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t.k?600:400}}>{t.l}</button>
        ))}
      </div>

      {tab==="new"&&(
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",flex:1,gap:0,overflow:isMobile?"visible":"hidden",border:`1px solid ${C.border}`,borderRadius:10,background:"#0a0f15"}}>
          {/* MAIN VOUCHER AREA */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:isMobile?"visible":"hidden",minWidth:0}}>
            {/* Top bar - like Tally */}
            <div style={{background:"#111827",borderBottom:`1px solid ${C.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
              <div style={{background:vt.color,color:"#fff",padding:"4px 14px",borderRadius:6,fontSize:13,fontWeight:700,minWidth:80,textAlign:"center"}}>{vt.label}</div>
              <div style={{fontSize:12,color:C.muted}}>No. <span style={{color:C.text,fontWeight:600}}>Auto</span></div>
              <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
                <div style={{fontSize:11,color:C.muted}}>Ref/Cheque:</div>
                <input value={refNo} onChange={e=>setRefNo(e.target.value)} placeholder="Optional" style={{...S.input,width:140,fontSize:11,padding:"4px 8px"}}/>
                <div style={{fontSize:11,color:C.muted}}>Date:</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...S.input,width:130,fontSize:11,padding:"4px 8px"}}/>
              </div>
            </div>

            {/* Company name bar */}
            <div style={{background:"#0c1922",borderBottom:`1px solid ${C.border}`,padding:"4px 14px",fontSize:11,color:"#58a6ff",fontWeight:600}}>
              {company?.name||"No Company"} {company?.gstin?`| ${company.gstin}`:""}
            </div>

            {/* Ledger entries table */}
            <div style={{flex:1,overflowY:"auto",padding:"0 0 4px"}}>
              <table style={{...S.tbl,tableLayout:"fixed"}}>
                <colgroup><col style={{width:30}}/><col/><col style={{width:160}}/><col style={{width:100}}/><col style={{width:80}}/></colgroup>
                <thead>
                  <tr style={{background:"#111827"}}>
                    <th style={{...S.th,textAlign:"center"}}>#</th>
                    <th style={S.th}>Particulars (Ledger Account)</th>
                    <th style={{...S.th,textAlign:"right"}}>Dr Amount</th>
                    <th style={{...S.th,textAlign:"right"}}>Cr Amount</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row,i)=>(
                    <tr key={i} style={{background:row.side==="Dr"?"rgba(35,134,54,0.06)":"rgba(218,54,51,0.06)"}}>
                      <td style={{...S.td,textAlign:"center",color:row.side==="Dr"?"#3fb950":"#f85149",fontWeight:700,fontSize:11}}>{row.side}</td>
                      <td style={S.td}>
                        <select value={row.ledger_id} onChange={e=>setRow(i,"ledger_id",e.target.value)} style={{...S.select,fontSize:12,border:"none",background:"transparent",color:row.ledger_id?C.text:C.muted}}>
                          <option value="">— Select Ledger Account —</option>
                          {["Asset","Liability","Income","Expense"].map(nat=>(
                            <optgroup key={nat} label={`── ${nat.toUpperCase()} ──`}>
                              {ledgers.filter(l=>l.nature===nat).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td style={{...S.td,textAlign:"right"}}>
                        {row.side==="Dr"?<input type="number" value={row.amount} onChange={e=>setRow(i,"amount",e.target.value)} placeholder="0.00" style={{...S.input,textAlign:"right",fontSize:13,fontWeight:700,color:"#3fb950",padding:"4px 8px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`}}/>:<span style={{color:C.muted,fontSize:11}}>—</span>}
                      </td>
                      <td style={{...S.td,textAlign:"right"}}>
                        {row.side==="Cr"?<input type="number" value={row.amount} onChange={e=>setRow(i,"amount",e.target.value)} placeholder="0.00" style={{...S.input,textAlign:"right",fontSize:13,fontWeight:700,color:"#f85149",padding:"4px 8px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`}}/>:<span style={{color:C.muted,fontSize:11}}>—</span>}
                      </td>
                      <td style={S.tdR}>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>setRow(i,"side",row.side==="Dr"?"Cr":"Dr")} title="Toggle Dr/Cr" style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",borderRadius:5,padding:"2px 7px",fontSize:10}}>⇌</button>
                          <button onClick={()=>remRow(i)} disabled={rows.length<=2} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:16,opacity:rows.length<=2?0.3:1}}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:"#111827"}}>
                    <td colSpan={2} style={{...S.td,fontWeight:700,color:C.text,fontSize:12}}>TOTAL</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,color:"#3fb950",fontSize:13}}>{totalDr>0?fR(totalDr):"—"}</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,color:"#f85149",fontSize:13}}>{totalCr>0?fR(totalCr):"—"}</td>
                    <td style={S.tdR}></td>
                  </tr>
                  {!balanced&&totalDr>0&&(
                    <tr>
                      <td colSpan={5} style={{...S.td,textAlign:"center",color:"#e3b341",background:"#2d1b00",fontSize:11}}>
                        ⚠ Not balanced — Difference: {fR(diff)} | Add {fR(diff)} to {totalDr<totalCr?"Dr":"Cr"} side
                      </td>
                    </tr>
                  )}
                  {balanced&&<tr><td colSpan={5} style={{...S.td,textAlign:"center",color:"#3fb950",background:"#0d2818",fontSize:11}}>✅ Balanced</td></tr>}
                </tfoot>
              </table>
            </div>

            {/* Narration */}
            <div style={{borderTop:`1px solid ${C.border}`,padding:"8px 14px",background:"#0a0f15",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:11,color:C.muted,fontWeight:600,minWidth:70}}>Narration:</span>
                <input value={narration} onChange={e=>setNarration(e.target.value)} placeholder="Brief description of transaction..." style={{...S.input,flex:1,fontSize:12,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,borderRadius:0,padding:"4px 0"}}/>
              </div>
            </div>

            {/* Bottom action bar */}
            <div style={{background:"#111827",borderTop:`1px solid ${C.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <button onClick={addRow} style={{...S.btnO,fontSize:11,padding:"5px 12px"}}>+ Add Row</button>
              <button onClick={clearForm} style={{...S.btnO,fontSize:11,padding:"5px 12px"}}>✕ Clear (Esc)</button>
              <div style={{flex:1}}/>
              <div style={{fontSize:11,color:C.muted}}>
                {balanced?<span style={{color:"#3fb950"}}>✅ Ready to save</span>:<span style={{color:"#e3b341"}}>⚠ Diff: {fR(diff)}</span>}
              </div>
              <button onClick={saveVoucher} disabled={saving||!balanced} style={{...S.btnG,padding:"8px 24px",fontSize:13,opacity:saving||!balanced?0.5:1,cursor:!balanced?"not-allowed":"pointer"}}>
                {saving?"Saving...":"A: Accept (Save)"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL — like Tally (horizontal scroll on mobile) */}
          {isMobile?(
            <div style={{borderTop:`1px solid ${C.border}`,padding:"8px 10px",display:"flex",gap:6,overflowX:"auto"}}>
              {Object.values(VTYPES).map(v=>(
                <button key={v.key} onClick={()=>setVtype(v.key)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:`1px solid ${vtype===v.key?v.color:C.border}`,borderRadius:7,background:vtype===v.key?"#1a2744":"transparent",color:vtype===v.key?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:vtype===v.key?700:400,whiteSpace:"nowrap",flexShrink:0}}>
                  <span style={{fontSize:10,color:vtype===v.key?v.color:C.muted,fontWeight:700}}>{v.f}</span>
                  <span>{v.label}</span>
                </button>
              ))}
              <button onClick={()=>setTab("list")} style={{padding:"7px 12px",border:`1px solid ${C.border}`,borderRadius:7,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>📋 List</button>
            </div>
          ):(
            <div style={{width:160,background:"#0a0e15",borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
              <div style={{padding:"8px 6px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.muted,fontWeight:600,textAlign:"center",letterSpacing:1}}>VOUCHER TYPE</div>
              <div style={{flex:1,padding:"6px 0"}}>
                {Object.values(VTYPES).map(v=>(
                  <button key={v.key} onClick={()=>setVtype(v.key)} style={{display:"flex",width:"100%",alignItems:"center",gap:8,padding:"9px 10px",border:"none",background:vtype===v.key?"#1a2744":"transparent",color:vtype===v.key?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:vtype===v.key?700:400,borderLeft:vtype===v.key?`3px solid ${v.color}`:"3px solid transparent",textAlign:"left"}}>
                    <span style={{fontSize:10,color:vtype===v.key?v.color:C.muted,minWidth:20,fontWeight:700}}>{v.f}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,padding:"6px 0"}}>
                {[{l:"E: Autofill",a:null},{l:"H: Change Mode",a:null},{l:"I: More Details",a:null}].map(x=>(
                  <button key={x.l} style={{display:"flex",width:"100%",padding:"7px 10px",border:"none",background:"transparent",color:C.muted,cursor:"default",fontFamily:"inherit",fontSize:10,textAlign:"left"}}>{x.l}</button>
                ))}
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,padding:"6px 0"}}>
                <button style={{display:"flex",width:"100%",padding:"7px 10px",border:"none",background:"transparent",color:C.muted,fontFamily:"inherit",fontSize:10,textAlign:"left",cursor:"pointer"}}
                  onClick={()=>setTab("list")}>Q: Voucher List</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VOUCHER LIST */}
      {tab==="list"&&(
        <div>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            {["ALL",...Object.keys(VTYPES)].map(t=>(
              <button key={t} onClick={()=>setFilter(t)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${filter===t?"#58a6ff":C.border}`,background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{t}</button>
            ))}
            <button onClick={loadVouchers} style={{...S.btnO,marginLeft:"auto",fontSize:11,padding:"4px 12px"}}>🔄 Refresh</button>
          </div>
          <div style={S.card}>
            {vouchers.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No vouchers. Start from Entry tab.</div>:(
              <table style={S.tbl}><thead><tr>{["Voucher No","Date","Type","Narration","Amount"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{vouchers.map(v=>(
                <tr key={v.id} style={{cursor:"pointer"}} onClick={async()=>{try{const d=await api(`/accounting/companies/${cid}/vouchers/${v.id}`,"GET",null,token);setViewing(d.voucher);}catch(e){toast(e.message,"error");}}}>
                  <td style={{...S.td,color:"#58a6ff",fontWeight:600}}>{v.voucher_no}</td>
                  <td style={S.td}>{v.date}</td>
                  <td style={S.td}>{badge(v.voucher_type,v.voucher_type==="RECEIPT"?"green":v.voucher_type==="PAYMENT"?"red":v.voucher_type==="SALES"?"teal":"gray")}</td>
                  <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.narration||"—"}</td>
                  <td style={{...S.tdR,fontWeight:600,color:"#3fb950"}}>{fR(v.total_amount)}</td>
                </tr>
              ))}</tbody></table>
            )}
          </div>
        </div>
      )}

      {viewing&&(
        <Modal title={`${viewing.voucher_no} — ${viewing.voucher_type}`} onClose={()=>setViewing(null)} wide>
          <div style={{display:"flex",gap:8,marginBottom:12}}>{badge(viewing.voucher_type,"blue")}{badge(viewing.date,"gray")}{viewing.narration&&<span style={{fontSize:12,color:C.muted}}>{viewing.narration}</span>}</div>
          <table style={S.tbl}><thead><tr>{["Ledger","Dr Amount","Cr Amount"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{(viewing.items||[]).map((it,i)=>(
            <tr key={i}><td style={{...S.td,fontWeight:600,color:C.text}}>{it.ledger_name}</td><td style={{...S.td,color:"#3fb950",fontWeight:it.dr_amount>0?700:400}}>{it.dr_amount>0?fR(it.dr_amount):"—"}</td><td style={{...S.tdR,color:"#f85149",fontWeight:it.cr_amount>0?700:400}}>{it.cr_amount>0?fR(it.cr_amount):"—"}</td></tr>
          ))}</tbody>
          <tfoot><tr><td style={{...S.td,fontWeight:700}}>Total</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR((viewing.items||[]).reduce((a,i)=>a+parseFloat(i.dr_amount||0),0))}</td><td style={{...S.tdR,color:"#f85149",fontWeight:700}}>{fR((viewing.items||[]).reduce((a,i)=>a+parseFloat(i.cr_amount||0),0))}</td></tr></tfoot>
          </table>
        </Modal>
      )}
    </div>
  );
}

// ── LEDGER MANAGER (Masters) ────────────────────────────────────────────────
function LedgerManager({token,toast,company}){
  const[groups,setGroups]=useState([]);const[ledgers,setLedgers]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[editing,setEditing]=useState(null);
  const[f,setF]=useState({name:"",group_id:"",opening_balance:"0",opening_type:"Dr",gstin:"",address:"",phone:""});
  const[search,setSearch]=useState("");const[viewLedger,setViewLedger]=useState(null);const[stmt,setStmt]=useState(null);
  const cid=company?.id;

  const load=useCallback(()=>{
    if(!cid)return;
    setLoading(true);
    Promise.all([
      api(`/accounting/companies/${cid}/groups`,"GET",null,token),
      api(`/accounting/companies/${cid}/ledgers`,"GET",null,token),
    ]).then(([g,l])=>{setGroups(g.groups||[]);setLedgers(l.ledgers||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[cid,token]);
  useEffect(()=>{load();},[load]);

  const openNew=()=>{setEditing(null);setF({name:"",group_id:groups[0]?.id||"",opening_balance:"0",opening_type:"Dr",gstin:"",address:"",phone:""});setModal(true);};
  const openEdit=l=>{setEditing(l);setF({name:l.name,group_id:l.group_id,opening_balance:String(l.opening_balance||0),opening_type:l.opening_type||"Dr",gstin:l.gstin||"",address:l.address||"",phone:l.phone||""});setModal(true);};

  const save=async()=>{
    if(!f.name||!f.group_id)return toast("Name and Group required","error");
    try{
      if(editing)await api(`/accounting/companies/${cid}/ledgers/${editing.id}`,"PUT",f,token);
      else await api(`/accounting/companies/${cid}/ledgers`,"POST",f,token);
      toast("✅ Saved","success");setModal(false);load();
    }catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete ledger?"))return;try{await api(`/accounting/companies/${cid}/ledgers/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  const viewStatement=async l=>{
    setViewLedger(l);
    try{const d=await api(`/accounting/companies/${cid}/ledgers/${l.id}/statement`,"GET",null,token);setStmt(d);}catch(e){toast(e.message,"error");}
  };

  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const filtered=ledgers.filter(l=>!search||l.name.toLowerCase().includes(search.toLowerCase()));
  const grouped={};
  filtered.forEach(l=>{const g=groups.find(g=>g.id===l.group_id);const gn=g?.name||"Other";if(!grouped[gn])grouped[gn]=[];grouped[gn].push(l);});

  if(!cid)return null;
  if(loading)return<Spinner/>;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,gap:10,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search ledger..." style={{...S.input,width:240}}/>
      <button onClick={openNew} style={S.btn}>+ New Ledger</button>
    </div>
    {Object.keys(grouped).length===0?<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>No ledgers yet</div>:
      Object.entries(grouped).map(([gname,lgs])=>(
        <div key={gname} style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#58a6ff",fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{gname}</div>
          <div style={S.card}>
            <table style={S.tbl}><tbody>
              {lgs.map(l=>(
                <tr key={l.id}>
                  <td style={{...S.td,fontWeight:600,color:C.text,cursor:"pointer"}} onClick={()=>viewStatement(l)}>{l.name}{l.is_default&&<span style={{fontSize:9,color:C.muted,marginLeft:6}}>(default)</span>}</td>
                  <td style={{...S.td,textAlign:"right",color:l.opening_type==="Dr"?"#3fb950":"#f85149"}}>{fR(l.opening_balance)} {l.opening_type}</td>
                  <td style={{...S.tdR,width:100}}>
                    <button onClick={()=>openEdit(l)} style={{...S.btnO,fontSize:10,padding:"3px 8px",marginRight:4}}>Edit</button>
                    {!l.is_default&&<button onClick={()=>del(l.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button>}
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
      ))
    }
    {modal&&(<Modal title={editing?"Edit Ledger":"New Ledger"} onClose={()=>setModal(false)}>
      <div style={S.fg}>
        <label style={S.label}>GSTIN (optional — auto-fills name & address)</label>
        <GSTINInput value={f.gstin} onChange={v=>setF(p=>({...p,gstin:v}))} token={token} onVerified={info=>setF(p=>({
          ...p,
          gstin:info.gstin,
          name:info.business_name||p.name,
          address:[info.address,info.city,info.state,info.pincode].filter(Boolean).join(", ")||p.address,
        }))}/>
      </div>
      <div style={S.fg}><label style={S.label}>Ledger Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Trade/Legal name auto-fills from GSTIN"/></div>
      <div style={S.fg}><label style={S.label}>Under Group *</label><select style={S.select} value={f.group_id} onChange={e=>setF(p=>({...p,group_id:e.target.value}))}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Opening Balance</label><input type="number" style={S.input} value={f.opening_balance} onChange={e=>setF(p=>({...p,opening_balance:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Dr/Cr</label><select style={S.select} value={f.opening_type} onChange={e=>setF(p=>({...p,opening_type:e.target.value}))}><option>Dr</option><option>Cr</option></select></div>
      </div>
      <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,minHeight:50}} value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>)}
    {viewLedger&&(<Modal title={`${viewLedger.name} — Statement`} onClose={()=>{setViewLedger(null);setStmt(null);}} wide>
      {!stmt?<Spinner/>:(<>
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{...S.kpi,flex:1}}><div style={S.label}>Opening</div><div style={{fontWeight:700}}>{fR(stmt.opening_balance)} {stmt.opening_type}</div></div>
          <div style={{...S.kpi,flex:1}}><div style={S.label}>Closing</div><div style={{fontWeight:700,color:stmt.closing_type==="Dr"?"#3fb950":"#f85149"}}>{fR(stmt.closing_balance)} {stmt.closing_type}</div></div>
        </div>
        <table style={S.tbl}><thead><tr>{["Date","Voucher","Narration","Dr","Cr"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(stmt.transactions||[]).map((t,i)=>(<tr key={i}><td style={S.td}>{t.date}</td><td style={S.td}>{t.voucher_no}({t.voucher_type})</td><td style={S.td}>{t.narration}</td><td style={{...S.td,color:"#3fb950"}}>{t.dr_amount>0?fR(t.dr_amount):"—"}</td><td style={{...S.tdR,color:"#f85149"}}>{t.cr_amount>0?fR(t.cr_amount):"—"}</td></tr>))}</tbody></table>
        {!stmt.transactions?.length&&<div style={{textAlign:"center",padding:20,color:C.muted}}>No transactions</div>}
      </>)}
    </Modal>)}
  </div>);
}

// ── CHART OF ACCOUNTS (Groups) ──────────────────────────────────────────────
function ChartOfAccounts({token,toast,company}){
  const[groups,setGroups]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[f,setF]=useState({name:"",nature:"Asset",affects_gross:false});
  const cid=company?.id;
  const load=()=>{if(!cid)return;setLoading(true);api(`/accounting/companies/${cid}/groups`,"GET",null,token).then(d=>{setGroups(d.groups||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[cid]);
  const save=async()=>{if(!f.name)return toast("Name required","error");try{await api(`/accounting/companies/${cid}/groups`,"POST",f,token);toast("Created","success");setModal(false);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete group?"))return;try{await api(`/accounting/companies/${cid}/groups/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  if(!cid)return null;
  if(loading)return<Spinner/>;
  const NATURES=["Asset","Liability","Income","Expense"];
  return(<div>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>{setF({name:"",nature:"Asset",affects_gross:false});setModal(true);}} style={S.btn}>+ New Group</button></div>
    <div style={S.col2}>
      {NATURES.map(nat=>(
        <div key={nat} style={S.card}>
          <div style={{fontSize:12,fontWeight:700,color:"#58a6ff",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{nat}</div>
          {groups.filter(g=>g.nature===nat).map(g=>(
            <div key={g.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.text}}>{g.name}{g.is_default&&<span style={{fontSize:9,color:C.muted,marginLeft:6}}>(default)</span>}</span>
              {!g.is_default&&<button onClick={()=>del(g.id)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:14}}>✕</button>}
            </div>
          ))}
        </div>
      ))}
    </div>
    {modal&&(<Modal title="New Group" onClose={()=>setModal(false)}>
      <div style={S.fg}><label style={S.label}>Group Name</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Nature</label><select style={S.select} value={f.nature} onChange={e=>setF(p=>({...p,nature:e.target.value}))}>{NATURES.map(n=><option key={n}>{n}</option>)}</select></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Create</button></div>
    </Modal>)}
  </div>);
}

// ── HSN AUTOCOMPLETE ─────────────────────────────────────────────────────────
function HSNInput({value,onChange,onSelect,token,placeholder}){
  const[results,setResults]=useState([]);const[show,setShow]=useState(false);const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShow(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  useEffect(()=>{
    if(!value||value.length<2){setResults([]);return;}
    const t=setTimeout(()=>{
      api(`/hsn/search?q=${encodeURIComponent(value)}`,"GET",null,token).then(d=>setResults(d.results||[])).catch(()=>{});
    },300);
    return()=>clearTimeout(t);
  },[value,token]);
  return(<div ref={ref} style={{position:"relative"}}>
    <input style={S.input} value={value} onChange={e=>{onChange(e.target.value);setShow(true);}} onFocus={()=>setShow(true)} placeholder={placeholder||"HSN/SAC"}/>
    {show&&results.length>0&&(
      <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:7,zIndex:50,maxHeight:200,overflowY:"auto",marginTop:2}}>
        {results.map(r=>(
          <div key={r.code} onClick={()=>{onSelect(r);setShow(false);}} style={{padding:"7px 10px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,fontSize:11}}
            onMouseEnter={e=>e.currentTarget.style.background="#1c2333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{fontWeight:600,color:C.text}}>{r.code} <span style={{color:"#58a6ff"}}>({r.gst_rate}%)</span></div>
            <div style={{color:C.muted,fontSize:10}}>{r.description?.substring(0,60)}</div>
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ── GSTIN AUTOCOMPLETE/VALIDATE ──────────────────────────────────────────────
function GSTINInput({value,onChange,onVerified,token}){
  const[checking,setChecking]=useState(false);const[status,setStatus]=useState(null);const[errMsg,setErrMsg]=useState("");
  const verify=async()=>{
    if(!value||value.length!==15)return;
    setChecking(true);setErrMsg("");
    try{
      const d=await api(`/gstin/lookup/${value}`,"GET",null,token);
      if(d&&d.success&&d.valid){setStatus("valid");onVerified&&onVerified(d);}
      else{setStatus("invalid");setErrMsg(d?.message||"Invalid GSTIN");}
    }catch(e){setStatus("invalid");setErrMsg(e.message||"Verification failed");}
    setChecking(false);
  };
  return(<div>
    <div style={{position:"relative"}}>
      <input style={{...S.input,paddingRight:70}} value={value} maxLength={15} onChange={e=>{onChange(e.target.value.toUpperCase());setStatus(null);setErrMsg("");}} onBlur={verify} placeholder="22AAAAA0000A1Z5"/>
      <div style={{position:"absolute",right:8,top:6,fontSize:10}}>
        {checking?"⏳":status==="valid"?<span style={{color:"#3fb950"}}>✓ Valid</span>:status==="invalid"?<span style={{color:"#f85149"}}>✗ Invalid</span>:value.length===15?<button onClick={verify} style={{background:"none",border:"none",color:"#58a6ff",cursor:"pointer",fontSize:10}}>Verify</button>:null}
      </div>
    </div>
    {errMsg&&<div style={{fontSize:11,color:"#f85149",marginTop:4}}>{errMsg}</div>}
  </div>);
}

// ── PARTIES (Sundry Debtors/Creditors as Ledgers) ───────────────────────────
function Parties({token,toast,company}){
  const[parties,setParties]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(null);
  const[f,setF]=useState({name:"",type:"Customer",gstin:"",state:"",address:"",phone:"",email:"",opening_balance:"0",opening_type:"Dr"});
  const[search,setSearch]=useState("");
  const cid=company?.id;
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Other"];

  const load=useCallback(()=>{
    if(!cid){setLoading(false);return;}
    setLoading(true);
    api(`/accounting/companies/${cid}/parties${search?`?search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setParties(d.parties||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[cid,token,search]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{
    if(!f.name)return toast("Name required","error");
    try{await api(`/accounting/companies/${cid}/parties`,"POST",f,token);toast("✅ Party added","success");setModal(null);load();}catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete party?"))return;try{await api(`/accounting/companies/${cid}/ledgers/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;

  if(!cid)return null;
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search parties..." style={{...S.input,width:240}}/>
      <button onClick={()=>{setF({name:"",type:"Customer",gstin:"",state:"",address:"",phone:"",email:"",opening_balance:"0",opening_type:"Dr"});setModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ New Party</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {parties.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No parties yet. Add customers/suppliers as ledgers.</div>:(
          <table style={S.tbl}><thead><tr>{["Name","Type","GSTIN","Balance","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{parties.map(p=>(
            <tr key={p.id}>
              <td style={{...S.td,fontWeight:600,color:C.text}}>{p.name}</td>
              <td style={S.td}>{badge(p.group_name?.includes("Debtor")?"Customer":"Supplier",p.group_name?.includes("Debtor")?"green":"amber")}</td>
              <td style={{...S.td,...S.mono}}>{p.gstin||"—"}</td>
              <td style={{...S.td,color:p.opening_type==="Dr"?"#3fb950":"#f85149"}}>{fR(p.current_balance??p.opening_balance)} {p.current_type||p.opening_type}</td>
              <td style={S.tdR}><button onClick={()=>del(p.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&(<Modal title="New Party" onClose={()=>setModal(null)}>
      <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}><option>Customer</option><option>Supplier</option><option>Both</option></select></div>
      <div style={S.fg}><label style={S.label}>GSTIN</label><GSTINInput value={f.gstin} onChange={v=>setF(p=>({...p,gstin:v}))} token={token} onVerified={info=>setF(p=>({...p,gstin:info.gstin,state:info.state||p.state,address:info.address||p.address,name:p.name||info.business_name}))}/></div>
      <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Opening Balance</label><input type="number" style={S.input} value={f.opening_balance} onChange={e=>setF(p=>({...p,opening_balance:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Dr/Cr</label><select style={S.select} value={f.opening_type} onChange={e=>setF(p=>({...p,opening_type:e.target.value}))}><option>Dr</option><option>Cr</option></select></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>)}
  </div>);
}

// ── SALES / PURCHASE INVOICING (company-scoped, party = ledger) ────────────
function InvoiceList({token,toast,type,company,setView}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[showForm,setShowForm]=useState(false);const[search,setSearch]=useState("");
  const cid=company?.id;
  const label=type==="SALES"?"Sales Invoice":"Purchase Bill";

  const load=useCallback(()=>{
    if(!cid){setLoading(false);return;}
    setLoading(true);
    api(`/accounting/companies/${cid}/invoices?type=${type}${search?`&search=${encodeURIComponent(search)}`:""}`,"GET",null,token)
      .then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[cid,token,type,search]);
  useEffect(()=>{load();},[load]);

  const del=async id=>{if(!window.confirm("Delete invoice? This will also reverse its voucher."))return;try{await api(`/accounting/companies/${cid}/invoices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;

  if(!cid)return null;

  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
      {[{l:`Total ${label}s`,v:invoices.length,c:"#58a6ff"},{l:"Total Amount",v:fmtM(invoices.reduce((a,i)=>a+parseFloat(i.total_amount||0),0)),c:"#3fb950"},{l:"Outstanding",v:fmtM(invoices.reduce((a,i)=>a+parseFloat(i.balance_due||0),0)),c:"#e3b341"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontSize:k.l.includes("Amount")||k.l.includes("Out")?14:22,fontWeight:700,color:k.c}}>{k.v}</div></div>
      ))}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{...S.input,width:240}}/>
      <button onClick={()=>setShowForm(true)} style={{...S.btn,marginLeft:"auto"}}>+ New {label}</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {invoices.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No {label.toLowerCase()}s yet</div>:(
          <table style={S.tbl}><thead><tr>{[`${label} No`,"Date","Party","Amount","Status","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{invoices.map(inv=>(
            <tr key={inv.id}>
              <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{inv.invoice_no}</td>
              <td style={S.td}>{inv.invoice_date}</td>
              <td style={S.td}>{inv.party_name}</td>
              <td style={{...S.td,fontWeight:600}}>{fR(inv.total_amount)}</td>
              <td style={S.td}>{badge(inv.status,inv.status==="paid"?"green":inv.status==="partial"?"amber":"red")}</td>
              <td style={S.tdR}><button onClick={()=>del(inv.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {showForm&&<InvoiceForm token={token} toast={toast} type={type} company={company} onClose={()=>setShowForm(false)} onSave={()=>{setShowForm(false);load();}}/>}
  </div>);
}

function InvoiceForm({token,toast,type,company,onClose,onSave}){
  const[parties,setParties]=useState([]);const[products,setProducts]=useState([]);const cid=company?.id;
  const[f,setF]=useState({party_id:"",invoice_no:"",invoice_date:today(),place_of_supply:company?.state||"",is_igst:false});
  const[items,setItems]=useState([{name:"",hsn_sac:"",qty:"1",rate:"0",gst_rate:"18",unit:"PCS"}]);
  const[saving,setSaving]=useState(false);
  useEffect(()=>{
    api(`/accounting/companies/${cid}/parties`,"GET",null,token).then(d=>setParties(d.parties||[])).catch(()=>{});
    api(`/accounting/companies/${cid}/products`,"GET",null,token).then(d=>setProducts(d.products||[])).catch(()=>{});
    api(`/accounting/companies/${cid}/invoices/next-number?type=${type}`,"GET",null,token).then(d=>setF(p=>({...p,invoice_no:d.next_number||""}))).catch(()=>{});
  },[cid]);

  const setItem=(i,k,v)=>{const n=[...items];n[i]={...n[i],[k]:v};setItems(n);};
  const addItem=()=>setItems(p=>[...p,{name:"",hsn_sac:"",qty:"1",rate:"0",gst_rate:"18",unit:"PCS"}]);
  const remItem=i=>setItems(p=>p.filter((_,j)=>j!==i));

  const calc=item=>{const qty=parseFloat(item.qty)||0,rate=parseFloat(item.rate)||0,gst=parseFloat(item.gst_rate)||0;const taxable=qty*rate;const gstAmt=taxable*gst/100;return{taxable,gstAmt,total:taxable+gstAmt};};
  const totals=items.reduce((a,it)=>{const c=calc(it);return{taxable:a.taxable+c.taxable,gst:a.gst+c.gstAmt,total:a.total+c.total};},{taxable:0,gst:0,total:0});

  const save=async()=>{
    if(!f.party_id)return toast("Select party","error");
    if(items.every(i=>!i.name))return toast("Add at least one item","error");
    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/invoices`,"POST",{...f,invoice_type:type,items:items.filter(i=>i.name),total_amount:totals.total,taxable_amount:totals.taxable,total_tax:totals.gst},token);
      toast(`✅ ${type==="SALES"?"Invoice":"Bill"} created & voucher posted!`,"success");
      onSave();
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  return(<Modal title={`New ${type==="SALES"?"Sales Invoice":"Purchase Bill"}`} onClose={onClose} wide>
    <div style={S.col3}>
      <div style={S.fg}><label style={S.label}>{type==="SALES"?"Customer":"Supplier"} *</label><select style={S.select} value={f.party_id} onChange={e=>setF(p=>({...p,party_id:e.target.value}))}><option value="">Select</option>{parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>{type==="SALES"?"Invoice":"Bill"} No</label><input style={S.input} value={f.invoice_no} onChange={e=>setF(p=>({...p,invoice_no:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={f.invoice_date} onChange={e=>setF(p=>({...p,invoice_date:e.target.value}))}/></div>
    </div>
    <div style={{...S.fg,display:"flex",alignItems:"center",gap:8}}>
      <input type="checkbox" checked={f.is_igst} onChange={e=>setF(p=>({...p,is_igst:e.target.checked}))}/>
      <span style={{fontSize:12,color:C.sub}}>Inter-state (IGST applicable)</span>
    </div>
    <table style={{...S.tbl,marginBottom:10}}>
      <thead><tr>{["Item","HSN","Qty","Rate","GST%","Amount",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{items.map((item,i)=>{const c=calc(item);return(
        <tr key={i}>
          <td style={S.td}>
            <input list={`prod-${i}`} style={{...S.input,fontSize:11}} value={item.name} onChange={e=>{
              const v=e.target.value;setItem(i,"name",v);
              const prod=products.find(p=>p.name===v);
              if(prod){setItem(i,"hsn_sac",prod.hsn_sac||"");setItem(i,"rate",String(prod.sale_price||prod.purchase_price||0));setItem(i,"gst_rate",String(prod.gst_rate||18));setItem(i,"unit",prod.unit||"PCS");}
            }}/>
            <datalist id={`prod-${i}`}>{products.map(p=><option key={p.id} value={p.name}/>)}</datalist>
          </td>
          <td style={S.td}><HSNInput value={item.hsn_sac} onChange={v=>setItem(i,"hsn_sac",v)} token={token} onSelect={h=>{setItem(i,"hsn_sac",h.code);setItem(i,"gst_rate",String(h.gst_rate||18));}} placeholder="HSN"/></td>
          <td style={S.td}><input type="number" style={{...S.input,width:65,fontSize:11}} value={item.qty} onChange={e=>setItem(i,"qty",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,width:80,fontSize:11}} value={item.rate} onChange={e=>setItem(i,"rate",e.target.value)}/></td>
          <td style={S.td}><select style={{...S.select,width:65,fontSize:11}} value={item.gst_rate} onChange={e=>setItem(i,"gst_rate",e.target.value)}>{[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
          <td style={{...S.td,fontWeight:600}}>{fR(c.total)}</td>
          <td style={S.tdR}><button onClick={()=>remItem(i)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer"}}>✕</button></td>
        </tr>
      );})}</tbody>
    </table>
    <button onClick={addItem} style={{...S.btnO,fontSize:11,marginBottom:14}}>+ Add Item</button>
    <div style={{...S.card,background:"#0c1d2e"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>Taxable Amount</span><span>{fR(totals.taxable)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>GST</span><span>{fR(totals.gst)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6}}><span>Total</span><span style={{color:"#3fb950"}}>{fR(totals.total)}</span></div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}><button onClick={onClose} style={S.btnO}>Cancel</button><button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"Save & Post Voucher"}</button></div>
  </Modal>);
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
function Products({token,toast,company}){
  const[products,setProducts]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[f,setF]=useState({name:"",hsn_sac:"",unit:"PCS",gst_rate:"18",sale_price:"0",purchase_price:"0",stock_qty:"0"});
  const cid=company?.id;
  const load=useCallback(()=>{if(!cid){setLoading(false);return;}setLoading(true);api(`/accounting/companies/${cid}/products`,"GET",null,token).then(d=>{setProducts(d.products||[]);setLoading(false);}).catch(()=>setLoading(false));},[cid,token]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{if(!f.name)return toast("Name required","error");try{await api(`/accounting/companies/${cid}/products`,"POST",f,token);toast("✅ Added","success");setModal(false);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/accounting/companies/${cid}/products/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  if(!cid)return null;
  return(<div>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>{setF({name:"",hsn_sac:"",unit:"PCS",gst_rate:"18",sale_price:"0",purchase_price:"0",stock_qty:"0"});setModal(true);}} style={S.btn}>+ New Product</button></div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {products.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No products yet</div>:(
          <table style={S.tbl}><thead><tr>{["Name","HSN","Unit","GST%","Sale Price","Stock","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{products.map(p=>(<tr key={p.id}><td style={{...S.td,fontWeight:600}}>{p.name}</td><td style={{...S.td,...S.mono}}>{p.hsn_sac||"—"}</td><td style={S.td}>{p.unit}</td><td style={S.td}>{p.gst_rate}%</td><td style={S.td}>{fR(p.sale_price)}</td><td style={S.td}>{p.stock_qty}</td><td style={S.tdR}><button onClick={()=>del(p.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td></tr>))}</tbody></table>
        )}
      </div>
    )}
    {modal&&(<Modal title="New Product" onClose={()=>setModal(false)}>
      <div style={S.fg}><label style={S.label}>Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>HSN/SAC</label><HSNInput value={f.hsn_sac} onChange={v=>setF(p=>({...p,hsn_sac:v}))} token={token} onSelect={h=>setF(p=>({...p,hsn_sac:h.code,gst_rate:String(h.gst_rate||18),name:p.name||h.description,unit:h.uom||p.unit}))}/></div>
        <div style={S.fg}><label style={S.label}>Unit</label><input style={S.input} value={f.unit} onChange={e=>setF(p=>({...p,unit:e.target.value}))}/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>GST %</label><select style={S.select} value={f.gst_rate} onChange={e=>setF(p=>({...p,gst_rate:e.target.value}))}>{[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Sale Price</label><input type="number" style={S.input} value={f.sale_price} onChange={e=>setF(p=>({...p,sale_price:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Stock Qty</label><input type="number" style={S.input} value={f.stock_qty} onChange={e=>setF(p=>({...p,stock_qty:e.target.value}))}/></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>)}
  </div>);
}

// ── ACCOUNTING REPORTS (Trial Balance, P&L, Balance Sheet, Day Book) ───────
function AccountingReports({token,toast,company}){
  const[rtype,setRtype]=useState("trial-balance");const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const[from,setFrom]=useState(company?.fy_start||"2025-04-01");const[to,setTo]=useState(today());
  const cid=company?.id;
  const REPORTS=[{k:"trial-balance",l:"Trial Balance"},{k:"profit-loss",l:"Profit & Loss"},{k:"balance-sheet",l:"Balance Sheet"},{k:"day-book",l:"Day Book"},{k:"cash-book",l:"Cash Book"}];
  const load=async()=>{setLoading(true);try{const d=await api(`/accounting/companies/${cid}/reports/${rtype}?from=${from}&to=${to}`,"GET",null,token);setData(d);}catch(e){toast(e.message,"error");}setLoading(false);};
  useEffect(()=>{if(cid)load();},[cid,rtype]);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  if(!cid)return null;
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      {REPORTS.map(r=><button key={r.k} onClick={()=>setRtype(r.k)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${rtype===r.k?"#1F6FEB":C.border}`,background:rtype===r.k?"#0c1d2e":"transparent",color:rtype===r.k?"#58a6ff":C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{r.l}</button>)}
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...S.input,width:130,fontSize:11}}/>
        <span style={{color:C.muted}}>to</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...S.input,width:130,fontSize:11}}/>
        <button onClick={load} style={S.btnO}>Run</button>
      </div>
    </div>
    {loading?<Spinner/>:!data?<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>Click Run to generate report</div>:(
      <div style={S.card}>
        {rtype==="trial-balance"&&(<table style={S.tbl}><thead><tr>{["Ledger","Group","Debit","Credit"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{(data.rows||[]).map((r,i)=>(<tr key={i}><td style={S.td}>{r.ledger_name}</td><td style={S.td}>{r.group_name}</td><td style={{...S.td,color:"#3fb950"}}>{r.debit>0?fR(r.debit):"—"}</td><td style={{...S.tdR,color:"#f85149"}}>{r.credit>0?fR(r.credit):"—"}</td></tr>))}</tbody>
          <tfoot><tr><td colSpan={2} style={{...S.td,fontWeight:700}}>TOTAL</td><td style={{...S.td,fontWeight:700,color:"#3fb950"}}>{fR(data.total_debit)}</td><td style={{...S.tdR,fontWeight:700,color:"#f85149"}}>{fR(data.total_credit)}</td></tr></tfoot>
        </table>)}
        {rtype==="profit-loss"&&(<div style={S.col2}>
          <div><div style={{fontWeight:700,color:"#f85149",marginBottom:8}}>Expenses</div>{(data.expenses||[]).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span>{r.name}</span><span>{fR(r.amount)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}}><span>Total Expenses</span><span>{fR(data.total_expenses)}</span></div></div>
          <div><div style={{fontWeight:700,color:"#3fb950",marginBottom:8}}>Income</div>{(data.income||[]).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span>{r.name}</span><span>{fR(r.amount)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}}><span>Total Income</span><span>{fR(data.total_income)}</span></div></div>
          <div style={{gridColumn:"span 2",...S.card,background:data.net_profit>=0?"#0d2818":"#2d0e0e",marginTop:10}}><div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}><span>{data.net_profit>=0?"Net Profit":"Net Loss"}</span><span style={{color:data.net_profit>=0?"#3fb950":"#f85149"}}>{fR(Math.abs(data.net_profit))}</span></div></div>
        </div>)}
        {rtype==="balance-sheet"&&(<div style={S.col2}>
          <div><div style={{fontWeight:700,color:"#58a6ff",marginBottom:8}}>Liabilities</div>{(data.liabilities||[]).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span>{r.name}</span><span>{fR(r.amount)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}}><span>Total</span><span>{fR(data.total_liabilities)}</span></div></div>
          <div><div style={{fontWeight:700,color:"#3fb950",marginBottom:8}}>Assets</div>{(data.assets||[]).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span>{r.name}</span><span>{fR(r.amount)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}}><span>Total</span><span>{fR(data.total_assets)}</span></div></div>
        </div>)}
        {(rtype==="day-book"||rtype==="cash-book")&&(<table style={S.tbl}><thead><tr>{["Date","Voucher","Type","Particulars","Dr","Cr"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{(data.entries||[]).map((r,i)=>(<tr key={i}><td style={S.td}>{r.date}</td><td style={{...S.td,color:"#58a6ff"}}>{r.voucher_no}</td><td style={S.td}>{badge(r.voucher_type,"gray")}</td><td style={S.td}>{r.particulars}</td><td style={{...S.td,color:"#3fb950"}}>{r.dr_amount>0?fR(r.dr_amount):"—"}</td><td style={{...S.tdR,color:"#f85149"}}>{r.cr_amount>0?fR(r.cr_amount):"—"}</td></tr>))}</tbody>
        </table>)}
        {!data.rows?.length&&!data.entries?.length&&!data.expenses&&!data.assets&&<div style={{textAlign:"center",padding:30,color:C.muted}}>No data for this period</div>}
      </div>
    )}
  </div>);
}

// ── GST CLIENTS (company-scoped) ────────────────────────────────────────────
function GSTClients({token,toast,company}){
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[f,setF]=useState({name:"",gstin:"",state:"",type:"Trader",turnover:"",status:"compliant"});
  const cid=company?.id;
  const load=()=>{if(!cid)return;setLoading(true);api(`/clients?company_id=${cid}`,"GET",null,token).then(d=>{setClients(d.clients||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[cid]);
  const save=async()=>{if(!f.name)return toast("Name required","error");try{await api("/clients","POST",{...f,company_id:cid},token);toast("✅ Added","success");setModal(false);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  if(!cid)return null;
  return(<div>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>{setF({name:"",gstin:"",state:"",type:"Trader",turnover:"",status:"compliant"});setModal(true);}} style={S.btn}>+ New Client</button></div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {clients.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No GST clients for this company yet</div>:(
          <table style={S.tbl}><thead><tr>{["Name","GSTIN","State","Type","Status","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{clients.map(c=>(<tr key={c.id}><td style={{...S.td,fontWeight:600}}>{c.name}</td><td style={{...S.td,...S.mono}}>{c.gstin||"—"}</td><td style={S.td}>{c.state||"—"}</td><td style={S.td}>{c.type}</td><td style={S.td}>{badge(c.status,c.status==="compliant"?"green":"red")}</td><td style={S.tdR}><button onClick={()=>del(c.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td></tr>))}</tbody></table>
        )}
      </div>
    )}
    {modal&&(<Modal title="New GST Client" onClose={()=>setModal(false)}>
      <div style={S.fg}><label style={S.label}>Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>GSTIN</label><GSTINInput value={f.gstin} onChange={v=>setF(p=>({...p,gstin:v}))} token={token} onVerified={info=>setF(p=>({...p,gstin:info.gstin,state:info.state||p.state,name:p.name||info.business_name}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}><option>Trader</option><option>Manufacturer</option><option>Service Provider</option></select></div>
        <div style={S.fg}><label style={S.label}>Status</label><select style={S.select} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))}><option value="compliant">Compliant</option><option value="non-compliant">Non-Compliant</option></select></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>)}
  </div>);
}

// ── GSTR-1 / GSTR-3B (auto-fill from company invoices) ─────────────────────
function GSTRFiling({token,toast,company,formType}){
  const[period,setPeriod]=useState("");const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const cid=company?.id;
  const PERIODS=[];
  for(let y=2026;y>=2022;y--)for(let m=12;m>=1;m--)PERIODS.push(`${String(m).padStart(2,"0")}-${y}`);
  const load=async()=>{if(!period)return toast("Select period","error");setLoading(true);try{const d=await api(`/accounting/companies/${cid}/${formType}?period=${period}`,"GET",null,token);setData(d);}catch(e){toast(e.message,"error");}setLoading(false);};
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  if(!cid)return null;
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <select style={{...S.select,width:160}} value={period} onChange={e=>setPeriod(e.target.value)}><option value="">Select Period</option>{PERIODS.map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={load} style={S.btn}>Generate</button>
    </div>
    {loading?<Spinner/>:!data?<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>Select period and generate</div>:(
      <div>
        {formType==="gstr1"&&(<div style={S.card}>
          <div style={{fontWeight:700,marginBottom:10}}>GSTR-1 — Outward Supplies ({period})</div>
          <div style={S.col3}>
            {[{l:"B2B Invoices",v:data.b2b_count||0},{l:"B2C Invoices",v:data.b2c_count||0},{l:"Total Taxable Value",v:fR(data.total_taxable)},{l:"Total IGST",v:fR(data.total_igst)},{l:"Total CGST",v:fR(data.total_cgst)},{l:"Total SGST",v:fR(data.total_sgst)}].map(k=><div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700}}>{k.v}</div></div>)}
          </div>
        </div>)}
        {formType==="gstr3b"&&(<div style={S.card}>
          <div style={{fontWeight:700,marginBottom:10}}>GSTR-3B Summary ({period})</div>
          <table style={S.tbl}><thead><tr>{["Particulars","Taxable Value","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={S.td}>Outward Taxable Supplies</td><td style={S.td}>{fR(data.outward?.taxable)}</td><td style={S.td}>{fR(data.outward?.igst)}</td><td style={S.td}>{fR(data.outward?.cgst)}</td><td style={S.tdR}>{fR(data.outward?.sgst)}</td></tr>
            <tr><td style={S.td}>Inward (ITC Eligible)</td><td style={S.td}>{fR(data.inward?.taxable)}</td><td style={S.td}>{fR(data.inward?.igst)}</td><td style={S.td}>{fR(data.inward?.cgst)}</td><td style={S.tdR}>{fR(data.inward?.sgst)}</td></tr>
            <tr style={{fontWeight:700,background:"#0c1d2e"}}><td style={S.td}>Net Tax Payable</td><td style={S.td}>—</td><td style={S.td}>{fR(data.net_payable?.igst)}</td><td style={S.td}>{fR(data.net_payable?.cgst)}</td><td style={S.tdR}>{fR(data.net_payable?.sgst)}</td></tr>
          </tbody></table>
        </div>)}
      </div>
    )}
  </div>);
}

// ── BANK STATEMENT IMPORT (company-scoped) ──────────────────────────────────
function BankStatement({token,toast,company,setView}){
  const[file,setFile]=useState(null);const[bankName,setBankName]=useState("");const[preview,setPreview]=useState(null);
  const[step,setStep]=useState(1);const[uploading,setUploading]=useState(false);const[importing,setImporting]=useState(false);
  const cid=company?.id;
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const upload=async()=>{
    if(!file)return toast("Select PDF","error");
    setUploading(true);
    try{
      const fd=new FormData();fd.append("file",file);if(bankName)fd.append("bank_name",bankName);
      const res=await fetch(`${API}/bank/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const data=await res.json();
      if(data.success){setPreview(data.preview);if(data.preview?.bank_name)setBankName(data.preview.bank_name);setStep(2);}
      else toast(data.message||"Upload failed","error");
    }catch(e){toast("Upload failed: "+e.message,"error");}
    setUploading(false);
  };

  const doImport=async()=>{
    setImporting(true);
    try{
      const d=await api("/bank/import","POST",{bank_name:bankName,transactions:preview.transactions,company_id:cid,create_vouchers:true},token);
      toast(d.message,"success");setStep(3);
    }catch(e){toast(e.message,"error");}
    setImporting(false);
  };

  const reset=()=>{setFile(null);setPreview(null);setStep(1);};
  if(!cid)return null;

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:8}}>📥 How to import</div>
      <div style={{fontSize:12,color:C.sub,lineHeight:1.8}}>1. Download bank statement PDF (digital, not scanned)<br/>2. Upload below — AI auto-categorizes<br/>3. Review & Import → vouchers auto-posted to <b>{company?.name}</b><br/>4. Unknown parties → Suspense Account (fix later in Voucher Entry)</div>
    </div>

    {step===1&&(<div style={S.card}>
      <div style={S.fg}><label style={S.label}>Bank Name (optional - auto-detected)</label><input style={S.input} value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="HDFC, SBI, ICICI..."/></div>
      <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:30,textAlign:"center",marginBottom:14}}>
        {file?(<div><div style={{fontSize:28,marginBottom:6}}>✅</div><div style={{color:"#3fb950",fontWeight:600}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnO,marginTop:8,fontSize:11}}>Remove</button></div>):
        (<div><div style={{fontSize:32,marginBottom:8}}>📄</div><label style={{...S.btnO,cursor:"pointer",display:"inline-block"}}>Choose PDF<input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}
      </div>
      <button onClick={upload} disabled={!file||uploading} style={{...S.btn,width:"100%",padding:12,opacity:!file||uploading?0.5:1}}>{uploading?"Analyzing...":"Upload & Analyze →"}</button>
    </div>)}

    {step===2&&preview&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Transactions",v:preview.total_txns,c:"#58a6ff"},{l:"Total Debit",v:fR(preview.total_debit),c:"#f85149"},{l:"Total Credit",v:fR(preview.total_credit),c:"#3fb950"}].map(k=><div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c}}>{k.v}</div></div>)}
      </div>
      <div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:12}}>
        <div style={{fontSize:12,color:"#3fb950",fontWeight:600}}>✅ Vouchers will be auto-created in {company?.name}'s books. Unknown parties → Suspense Account.</div>
      </div>
      <div style={{...S.card,maxHeight:400,overflowY:"auto"}}>
        <table style={S.tbl}><thead><tr>{["Date","Narration","Dr","Cr","Category"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{preview.transactions.map((t,i)=>(<tr key={i}><td style={S.td}>{t.txn_date}</td><td style={{...S.td,maxWidth:280}}>{t.description}</td><td style={{...S.td,color:"#f85149"}}>{t.debit>0?fR(t.debit):"—"}</td><td style={{...S.td,color:"#3fb950"}}>{t.credit>0?fR(t.credit):"—"}</td><td style={S.td}>{badge(t.category,t.category==="Suspense"?"amber":"gray")}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <button onClick={reset} style={S.btnO}>Cancel</button>
        <button onClick={doImport} disabled={importing} style={S.btnG}>{importing?"Importing...":"✅ Import & Create Vouchers"}</button>
      </div>
    </div>)}

    {step===3&&(<div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:56,marginBottom:12}}>🎉</div>
      <div style={{fontSize:18,fontWeight:700,color:"#3fb950",marginBottom:16}}>Imported Successfully!</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button onClick={reset} style={S.btn}>Import Another</button>
        <button onClick={()=>setView("vouchers")} style={S.btnG}>View Vouchers →</button>
        <button onClick={()=>setView("bank-recon")} style={{...S.btn,background:"#9333ea"}}>Reconciliation →</button>
      </div>
    </div>)}
  </div>);
}

// ── BANK RECONCILIATION ──────────────────────────────────────────────────────
function BankReconciliation({token,toast,company}){
  const[txns,setTxns]=useState([]);const[summary,setSummary]=useState(null);const[loading,setLoading]=useState(true);const[filter,setFilter]=useState("unreconciled");
  const cid=company?.id;
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const load=useCallback(()=>{if(!cid)return;setLoading(true);api(`/bank/reconciliation?company_id=${cid}${filter!=="all"?`&status=${filter}`:""}`, "GET",null,token).then(d=>{setTxns(d.transactions||[]);setSummary(d.summary);setLoading(false);}).catch(()=>setLoading(false));},[cid,token,filter]);
  useEffect(()=>{load();},[load]);
  const reconcile=async t=>{try{await api("/bank/reconcile","POST",{txn_id:t.id,value_date:t.txn_date},token);toast("✅ Reconciled","success");load();}catch(e){toast(e.message,"error");}};
  const unreconcile=async id=>{try{await api(`/bank/reconcile/${id}`,"DELETE",null,token);toast("Undone","success");load();}catch(e){toast(e.message,"error");}};
  const autoMatch=async()=>{try{const d=await api(`/bank/reconcile/auto-match?company_id=${cid}`,"GET",null,token);toast(d.message,"success");load();}catch(e){toast(e.message,"error");}};
  if(!cid)return null;
  return(<div>
    {summary&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[{l:"Total",v:summary.total,c:"#58a6ff"},{l:"Reconciled",v:summary.reconciled,c:"#3fb950"},{l:"Pending",v:summary.unreconciled,c:"#f85149"},{l:"Net Balance",v:fR(summary.net_balance),c:"#e3b341"}].map(k=><div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:k.l==="Net Balance"?13:20}}>{k.v}</div></div>)}
    </div>}
    <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center"}}>
      {["unreconciled","reconciled","all"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===f?"#58a6ff":C.border}`,background:filter===f?"#0c1d2e":"transparent",color:filter===f?"#58a6ff":C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{f}</button>)}
      <button onClick={autoMatch} style={{...S.btn,marginLeft:"auto"}}>⚡ Auto-Match</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {txns.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No transactions</div>:(
          <table style={S.tbl}><thead><tr>{["Date","Narration","Dr","Cr","Voucher","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{txns.map(t=>(<tr key={t.id}><td style={S.td}>{t.txn_date}</td><td style={{...S.td,maxWidth:250}}>{t.description}</td><td style={{...S.td,color:"#f85149"}}>{t.debit>0?fR(t.debit):"—"}</td><td style={{...S.td,color:"#3fb950"}}>{t.credit>0?fR(t.credit):"—"}</td><td style={S.td}>{t.voucher_no||"—"}</td><td style={S.tdR}>{t.is_reconciled?<button onClick={()=>unreconcile(t.id)} style={{...S.btnO,fontSize:10,padding:"3px 8px"}}>Undo</button>:<button onClick={()=>reconcile(t)} style={{...S.btnG,fontSize:10,padding:"3px 8px"}}>Reconcile</button>}</td></tr>))}</tbody></table>
        )}
      </div>
    )}
  </div>);
}

// ── AI INVOICE SCANNER (image/PDF → voucher) ────────────────────────────────
function AIInvoiceScanner({token,toast,company}){
  const[file,setFile]=useState(null);const[preview,setPreview]=useState(null);const[scanning,setScanning]=useState(false);const[saving,setSaving]=useState(false);
  const[ledgers,setLedgers]=useState([]);const[ext,setExt]=useState(null);
  const cid=company?.id;
  useEffect(()=>{if(cid)api(`/accounting/companies/${cid}/ledgers`,"GET",null,token).then(d=>setLedgers(d.ledgers||[])).catch(()=>{});},[cid]);

  const onFile=e=>{const f=e.target.files[0];setFile(f);setExt(null);if(f){const r=new FileReader();r.onload=ev=>setPreview(ev.target.result);r.readAsDataURL(f);}};

  const findLedger=name=>ledgers.find(l=>l.name.toLowerCase()===String(name||"").toLowerCase());
  const findLedgerLike=re=>ledgers.find(l=>re.test(l.name));

  const scan=async()=>{
    if(!file)return toast("Select an image","error");
    setScanning(true);
    try{
      const fd=new FormData();fd.append("file",file);fd.append("company_id",cid);
      const res=await fetch(`${API}/ai/scan-invoice`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){
        const data=d.data;
        // Match party ledger by name (existing Sundry Debtor/Creditor)
        const partyLedger=ledgers.find(l=>l.name.toLowerCase().includes(String(data.vendor_name||"").toLowerCase().split(" ")[0])&&/debtor|creditor/i.test(l.group_name||""));
        setExt({
          type:data.type||"purchase",
          vendor_name:data.vendor_name||"",
          vendor_gstin:data.vendor_gstin||"",
          invoice_no:data.invoice_no||"",
          invoice_date:data.invoice_date||today(),
          taxable_amount:String(data.taxable_amount||0),
          cgst_amount:String(data.cgst_amount||0),
          sgst_amount:String(data.sgst_amount||0),
          igst_amount:String(data.igst_amount||0),
          total_amount:String(data.total_amount||0),
          description:data.description||"",
          party_ledger_id:partyLedger?.id||"",
          expense_ledger:data.suggested_ledger||"Purchase Account",
        });
        toast("✅ Scanned! Review details below.","success");
      }else toast(d.message||"Scan failed","error");
    }catch(e){toast("Scan failed: "+e.message,"error");}
    setScanning(false);
  };

  const setF=(k,v)=>setExt(p=>({...p,[k]:v}));

  const computedTotal=()=>{
    const t=parseFloat(ext?.taxable_amount)||0,c=parseFloat(ext?.cgst_amount)||0,s=parseFloat(ext?.sgst_amount)||0,i=parseFloat(ext?.igst_amount)||0;
    return t+c+s+i;
  };

  const post=async()=>{
    if(!ext)return;
    const taxable=parseFloat(ext.taxable_amount)||0;
    const cgst=parseFloat(ext.cgst_amount)||0;
    const sgst=parseFloat(ext.sgst_amount)||0;
    const igst=parseFloat(ext.igst_amount)||0;
    const total=parseFloat(ext.total_amount)||computedTotal();
    if(total<=0)return toast("Total amount must be greater than 0","error");

    const isPurchase=ext.type!=="sales";
    // Find expense/purchase ledger
    const expLedger=findLedger(ext.expense_ledger)||findLedger("Purchase Account")||findLedger("Suspense Account");
    const cgstLedger=findLedger(isPurchase?"Input CGST":"Output CGST");
    const sgstLedger=findLedger(isPurchase?"Input SGST":"Output SGST");
    const igstLedger=findLedger(isPurchase?"Input IGST":"Output IGST");
    const partyLedger=ext.party_ledger_id?ledgers.find(l=>l.id===ext.party_ledger_id):(findLedger("Suspense Account"));

    if(!expLedger||!partyLedger)return toast("Required ledgers (Purchase/Suspense Account) not found in Chart of Accounts","error");

    const narration=`${ext.vendor_name||"Unknown Vendor"} | Inv# ${ext.invoice_no||"-"} | ${ext.description||""}`.trim();
    const items=[];
    if(isPurchase){
      if(taxable>0)items.push({ledger_id:expLedger.id,dr_amount:taxable,cr_amount:0,narration});
      if(cgst>0&&cgstLedger)items.push({ledger_id:cgstLedger.id,dr_amount:cgst,cr_amount:0,narration:"CGST - "+narration});
      if(sgst>0&&sgstLedger)items.push({ledger_id:sgstLedger.id,dr_amount:sgst,cr_amount:0,narration:"SGST - "+narration});
      if(igst>0&&igstLedger)items.push({ledger_id:igstLedger.id,dr_amount:igst,cr_amount:0,narration:"IGST - "+narration});
      items.push({ledger_id:partyLedger.id,dr_amount:0,cr_amount:total,narration});
    }else{
      items.push({ledger_id:partyLedger.id,dr_amount:total,cr_amount:0,narration});
      if(taxable>0)items.push({ledger_id:expLedger.id,dr_amount:0,cr_amount:taxable,narration});
      if(cgst>0&&cgstLedger)items.push({ledger_id:cgstLedger.id,dr_amount:0,cr_amount:cgst,narration:"CGST - "+narration});
      if(sgst>0&&sgstLedger)items.push({ledger_id:sgstLedger.id,dr_amount:0,cr_amount:sgst,narration:"SGST - "+narration});
      if(igst>0&&igstLedger)items.push({ledger_id:igstLedger.id,dr_amount:0,cr_amount:igst,narration:"IGST - "+narration});
    }
    // Balance check
    const td=items.reduce((a,i)=>a+(i.dr_amount||0),0),tc=items.reduce((a,i)=>a+(i.cr_amount||0),0);
    if(Math.abs(td-tc)>0.5)return toast(`Not balanced: Dr ${td} vs Cr ${tc}. Adjust amounts.`,"error");

    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/vouchers`,"POST",{voucher_type:isPurchase?"PURCHASE":"SALES",date:ext.invoice_date,ref_no:ext.invoice_no,narration,items},token);
      toast("✅ Voucher posted!","success");
      setFile(null);setPreview(null);setExt(null);
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };

  const partyOptions=ledgers.filter(l=>/debtor|creditor/i.test(l.group_name||""));
  const expenseOptions=ledgers.filter(l=>l.nature==="Expense"||l.name==="Purchase Account"||l.name==="Suspense Account");

  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:6}}>🤖 AI Invoice/Bill Scanner</div>
      <div style={{fontSize:12,color:C.sub}}>Upload a photo of an invoice/bill — AI extracts vendor, invoice no, date, taxable amount, CGST/SGST/IGST and total. Review & post as voucher.</div>
    </div>
    <div style={S.col2}>
      <div style={S.card}>
        <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:20,textAlign:"center",marginBottom:12,minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {preview?<img src={preview} alt="" style={{maxWidth:"100%",maxHeight:280,borderRadius:8}}/>:
          <label style={{...S.btnO,cursor:"pointer"}}>Choose Invoice Image<input type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/></label>}
        </div>
        <button onClick={scan} disabled={!file||scanning} style={{...S.btn,width:"100%",opacity:!file||scanning?0.5:1}}>{scanning?"🔍 Scanning with AI...":"🔍 Scan with AI"}</button>
      </div>
      <div style={S.card}>
        <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:C.text}}>Extracted Details — Review &amp; Edit</div>
        {!ext?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:12}}>Scan an invoice to see extracted details</div>:(<>
          <div style={S.col2}>
            <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={ext.type} onChange={e=>setF("type",e.target.value)}><option value="purchase">Purchase</option><option value="sales">Sales</option></select></div>
            <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={ext.invoice_date} onChange={e=>setF("invoice_date",e.target.value)}/></div>
          </div>
          <div style={S.col2}>
            <div style={S.fg}><label style={S.label}>Vendor/Party Name</label><input style={S.input} value={ext.vendor_name} onChange={e=>setF("vendor_name",e.target.value)}/></div>
            <div style={S.fg}><label style={S.label}>Invoice No</label><input style={S.input} value={ext.invoice_no} onChange={e=>setF("invoice_no",e.target.value)}/></div>
          </div>
          {ext.vendor_gstin&&<div style={S.fg}><label style={S.label}>Vendor GSTIN</label><input style={S.input} value={ext.vendor_gstin} onChange={e=>setF("vendor_gstin",e.target.value)}/></div>}
          <div style={S.fg}><label style={S.label}>Description</label><input style={S.input} value={ext.description} onChange={e=>setF("description",e.target.value)}/></div>

          <div style={{...S.card,background:"#0c1d2e",padding:10,marginBottom:10}}>
            <div style={{fontSize:11,color:"#58a6ff",fontWeight:600,marginBottom:8}}>Amounts</div>
            <div style={S.col2}>
              <div style={S.fg}><label style={S.label}>Taxable Amount</label><input type="number" style={S.input} value={ext.taxable_amount} onChange={e=>setF("taxable_amount",e.target.value)}/></div>
              <div style={S.fg}><label style={S.label}>Total Amount</label><input type="number" style={S.input} value={ext.total_amount} onChange={e=>setF("total_amount",e.target.value)}/></div>
            </div>
            <div style={S.col3}>
              <div style={S.fg}><label style={S.label}>CGST</label><input type="number" style={S.input} value={ext.cgst_amount} onChange={e=>setF("cgst_amount",e.target.value)}/></div>
              <div style={S.fg}><label style={S.label}>SGST</label><input type="number" style={S.input} value={ext.sgst_amount} onChange={e=>setF("sgst_amount",e.target.value)}/></div>
              <div style={S.fg}><label style={S.label}>IGST</label><input type="number" style={S.input} value={ext.igst_amount} onChange={e=>setF("igst_amount",e.target.value)}/></div>
            </div>
            <div style={{fontSize:11,color:Math.abs(computedTotal()-(parseFloat(ext.total_amount)||0))>0.5?"#e3b341":"#3fb950"}}>
              Taxable+Tax = {fmtM(computedTotal())} {Math.abs(computedTotal()-(parseFloat(ext.total_amount)||0))>0.5?"⚠ doesn't match Total":"✅ matches Total"}
            </div>
          </div>

          <div style={S.fg}><label style={S.label}>{ext.type==="sales"?"Customer Ledger":"Supplier Ledger"} (party)</label>
            <select style={S.select} value={ext.party_ledger_id} onChange={e=>setF("party_ledger_id",e.target.value)}>
              <option value="">— Suspense Account (fix later) —</option>
              {partyOptions.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div style={S.fg}><label style={S.label}>{ext.type==="sales"?"Sales/Income Ledger":"Expense/Purchase Ledger"}</label>
            <select style={S.select} value={ext.expense_ledger} onChange={e=>setF("expense_ledger",e.target.value)}>
              {expenseOptions.map(l=><option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>

          <button onClick={post} disabled={saving} style={{...S.btnG,width:"100%",marginTop:8}}>{saving?"Posting...":"✅ Post as Voucher"}</button>
        </>)}
      </div>
    </div>
  </div>);
}

// ── SETTINGS + BACKUP (compact) ─────────────────────────────────────────────
function Settings({token,user,toast,onLogout}){
  return(<div style={S.card}>
    <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Account</div>
    <div style={{marginBottom:6}}><span style={{color:C.muted}}>Name:</span> {user.name}</div>
    <div style={{marginBottom:6}}><span style={{color:C.muted}}>Email:</span> {user.email}</div>
    <div style={{marginBottom:14}}><span style={{color:C.muted}}>Firm:</span> {user.firm_name}</div>
    <button onClick={onLogout} style={S.btnR}>Logout</button>
  </div>);
}

function BackupRestore({token,toast,company}){
  const cid=company?.id;
  const exportData=async()=>{
    try{
      const res=await fetch(`${API}/backup/export${cid?`?company_id=${cid}`:""}`,{headers:{Authorization:`Bearer ${token}`}});
      const text=await res.text();
      const blob=new Blob([text],{type:"application/json"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
      a.download=`taxpro_${company?.name||"backup"}_${today()}.json`;a.click();URL.revokeObjectURL(url);
      toast("✅ Downloaded","success");
    }catch(e){toast(e.message,"error");}
  };
  return(<div style={S.card}>
    <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>💾 Backup {company?`— ${company.name}`:"(All Companies)"}</div>
    <button onClick={exportData} style={S.btnG}>Download Backup (.json)</button>
  </div>);
}

// ── NAV STRUCTURE — All under active company ────────────────────────────────
const NAV=[
  {key:"dashboard",icon:"🏠",label:"Dashboard",group:"MAIN"},
  {key:"ledgers",  icon:"📒",label:"Ledgers",         group:"MASTERS"},
  {key:"groups",   icon:"🗂",label:"Chart of Accounts",group:"MASTERS"},
  {key:"products", icon:"📦",label:"Products & Stock",group:"MASTERS"},
  {key:"vouchers", icon:"✏️",label:"Voucher Entry (F4-F9)",group:"TRANSACTIONS"},
  {key:"sales",    icon:"📄",label:"Sales Invoice",   group:"TRANSACTIONS"},
  {key:"purchases",icon:"🧾",label:"Purchase Bill",   group:"TRANSACTIONS"},
  {key:"bank",     icon:"🏦",label:"Bank Statement",  group:"TRANSACTIONS"},
  {key:"bank-recon",icon:"⇌",label:"Bank Reconciliation",group:"TRANSACTIONS"},
  {key:"acc-reports",icon:"📊",label:"Accounting Reports",group:"REPORTS"},
  {key:"bank-book",icon:"🏦",label:"Bank Book (Monthly)",group:"REPORTS"},
  {key:"gstr1",    icon:"📤",label:"GSTR-1",          group:"GST SUITE"},
  {key:"gstr3b",   icon:"📑",label:"GSTR-3B",         group:"GST SUITE"},
  {key:"reconcile",icon:"⇄",label:"GST Reconciliation",group:"GST SUITE"},
  {key:"gstr2a",   icon:"📥",label:"GSTR-2A Import",  group:"GST SUITE"},
  {key:"einvoice", icon:"🔖",label:"E-Invoice",       group:"GST SUITE"},
  {key:"ewaybill", icon:"🚛",label:"E-Way Bill",      group:"GST SUITE"},
  {key:"hsn",      icon:"🏷",label:"HSN/SAC Codes",   group:"GST SUITE"},
  {key:"ai-invoice",icon:"🤖",label:"AI Invoice Scanner",group:"AI TOOLS"},
  {key:"ai-assist",icon:"✦",label:"AI Assistant",     group:"AI TOOLS"},
  {key:"backup",   icon:"💾",label:"Backup",          group:"SETTINGS"},
  {key:"settings", icon:"⚙",label:"Settings",         group:"SETTINGS"},
];
const TITLES=Object.fromEntries(NAV.map(n=>[n.key,n.label]));

export default function App(){
  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).catch(()=>{});},[]);
  const[user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("tp_user"));}catch{return null;}});
  const[token,setToken]=useState(()=>localStorage.getItem("tp_token")||"");
  const[company,setCompany]=useState(()=>{try{return JSON.parse(localStorage.getItem("tp_company"));}catch{return null;}});
  const[view,setView]=useState("dashboard");
  const[toast,setToast]=useState(null);
  const[showCompanyPicker,setShowCompanyPicker]=useState(false);
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const isMobile=useIsMobile();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4000);};
  const logout=()=>{localStorage.clear();setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};
  const selectCompany=c=>{setCompany(c);if(c)localStorage.setItem("tp_company",JSON.stringify(c));else localStorage.removeItem("tp_company");setShowCompanyPicker(false);setView("dashboard");};
  const goView=k=>{setView(k);if(isMobile)setSidebarOpen(false);};

  // verify stored company still exists
  useEffect(()=>{
    if(company&&token){
      api("/accounting/companies","GET",null,token).then(d=>{
        if(!(d.companies||[]).find(c=>c.id===company.id)){setCompany(null);localStorage.removeItem("tp_company");}
      }).catch(()=>{});
    }
  },[token]);

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const GROUPS=["MAIN","MASTERS","TRANSACTIONS","REPORTS","GST SUITE","AI TOOLS","SETTINGS"];
  const needsCompany=!["dashboard","settings","backup"].includes(view);

  return(
    <div style={S.app}>
      <GlobalStyles/>
      {/* TOP BAR */}
      <div style={S.topbar}>
        {isMobile&&<button onClick={()=>setSidebarOpen(p=>!p)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:16,padding:"4px 9px",cursor:"pointer"}}>☰</button>}
        <div style={{fontWeight:800,fontSize:15,color:C.text,flexShrink:0}}>🛡️{!isMobile&&" TaxPro"}</div>
        {!isMobile&&<div style={{width:1,height:24,background:C.border}}/>}
        <div onClick={()=>setShowCompanyPicker(true)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:7,background:company?"#0c1d2e":"#2d1b00",border:`1px solid ${company?"#1f4872":"#9e6a03"}`,minWidth:0,overflow:"hidden",flex:isMobile?1:"none"}}>
          <span style={{fontSize:14,flexShrink:0}}>🏢</span>
          <div style={{minWidth:0,overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:700,color:company?"#58a6ff":"#e3b341",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{company?company.name:"No Company Selected"}</div>
            {company&&!isMobile&&<div style={{fontSize:9,color:C.muted,whiteSpace:"nowrap"}}>FY {company.fy_start?.substring(0,4)}-{company.fy_end?.substring(2,4)} · GSTIN: {company.gstin||"—"}</div>}
          </div>
          <span style={{fontSize:10,color:C.muted,flexShrink:0}}>▾</span>
        </div>
        <div style={{marginLeft:isMobile?0:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {!isMobile&&<span style={{fontSize:12,color:C.muted}}>{user.name}</span>}
          {!isMobile&&badge("Live","green")}
          <button onClick={logout} style={{...S.btnO,fontSize:11,padding:"4px 10px"}}>{isMobile?"⏻":"Logout"}</button>
        </div>
      </div>

      <div style={S.body}>
        {/* SIDEBAR */}
        {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:149}}/>}
        <div style={isMobile?{
          ...S.sidebar,position:"fixed",top:50,bottom:0,left:0,zIndex:150,
          transform:sidebarOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.2s ease",
          boxShadow:sidebarOpen?"4px 0 24px rgba(0,0,0,0.5)":"none",
        }:S.sidebar}>
          {GROUPS.map(g=>(
            <div key={g}>
              <div style={{fontSize:9,color:"#444C56",padding:"10px 14px 4px",letterSpacing:1.5,fontWeight:700}}>{g}</div>
              {NAV.filter(n=>n.group===g).map(n=>(
                <button key={n.key} onClick={()=>goView(n.key)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 14px",border:"none",background:view===n.key?"rgba(31,111,235,0.12)":"transparent",borderLeft:view===n.key?"2px solid #1F6FEB":"2px solid transparent",color:view===n.key?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:view===n.key?600:400,textAlign:"left"}}>
                  <span style={{fontSize:14}}>{n.icon}</span><span>{n.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div style={{...S.main,padding:isMobile?10:18}}>
          <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>{TITLES[view]}</div>
          {needsCompany&&!company?(
            <CompanyCtx company={null} onGo={()=>setShowCompanyPicker(true)}/>
          ):(<>
            {view==="dashboard"  &&<Dashboard token={token} company={company} setView={setView}/>}
            {view==="ledgers"    &&<LedgerManager token={token} toast={showToast} company={company}/>}
            {view==="groups"     &&<ChartOfAccounts token={token} toast={showToast} company={company}/>}
            {view==="products"   &&<Products token={token} toast={showToast} company={company}/>}
            {view==="vouchers"   &&<VoucherEntry token={token} toast={showToast} company={company}/>}
            {view==="sales"      &&<InvoiceList token={token} toast={showToast} type="SALES" company={company} setView={setView}/>}
            {view==="purchases"  &&<InvoiceList token={token} toast={showToast} type="PURCHASE" company={company} setView={setView}/>}
            {view==="bank"       &&<BankStatement token={token} toast={showToast} company={company} setView={setView}/>}
            {view==="bank-recon" &&<BankReconciliation token={token} toast={showToast} company={company}/>}
            {view==="acc-reports"&&<AccountingReports token={token} toast={showToast} company={company}/>}
            {view==="bank-book"  &&<BankBook token={token} toast={showToast} company={company}/>}
            {view==="gstr1"      &&<GSTRFiling token={token} toast={showToast} company={company} formType="gstr1"/>}
            {view==="gstr3b"     &&<GSTRFiling token={token} toast={showToast} company={company} formType="gstr3b"/>}
            {view==="ai-invoice" &&<AIInvoiceScanner token={token} toast={showToast} company={company} setView={setView}/>}
            {view==="hsn"        &&<HSNManager token={token} toast={showToast}/>}
            {view==="einvoice"   &&<EInvoice token={token} toast={showToast} company={company}/>}
            {view==="ewaybill"   &&<EWayBill token={token} toast={showToast} company={company}/>}
            {view==="reconcile"  &&<GSTReconciliation token={token} toast={showToast} company={company}/>}
            {view==="gstr2a"     &&<GSTR2AImport token={token} toast={showToast} company={company}/>}
            {view==="ai-assist"  &&<AIAssistant token={token} toast={showToast} company={company}/>}
          </>)}
          {view==="settings"&&<Settings token={token} user={user} toast={showToast} onLogout={logout}/>}
          {view==="backup"&&<BackupRestore token={token} toast={showToast} company={company}/>}
        </div>
      </div>

      {/* COMPANY PICKER MODAL */}
      {showCompanyPicker&&(<Modal title="Select Company" onClose={()=>setShowCompanyPicker(false)} wide>
        <CompanyManager token={token} toast={showToast} onSelect={selectCompany} current={company}/>
      </Modal>)}

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ── HSN MANAGER ──────────────────────────────────────────────────────────────
function HSNManager({token,toast}){
  const[file,setFile]=useState(null);const[uploading,setUploading]=useState(false);const[codes,setCodes]=useState([]);const[search,setSearch]=useState("");const[loading,setLoading]=useState(true);
  const load=useCallback(()=>{setLoading(true);api(`/hsn/codes${search?`?search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setCodes(d.codes||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,search]);
  useEffect(()=>{load();},[load]);
  const upload=async()=>{
    if(!file)return toast("Select file","error");
    setUploading(true);
    try{
      const fd=new FormData();fd.append("file",file);
      const res=await fetch(`${API}/hsn/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast(`✅ Imported ${d.imported||0} codes!`,"success");setFile(null);load();}
      else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setUploading(false);
  };
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>🏷 HSN/SAC Code Library</div>
      <div style={{fontSize:12,color:C.sub}}>Upload Excel/CSV with columns: HSN Code, Description, GST Rate, Unit. Used for autocomplete in invoicing.</div>
    </div>
    <div style={S.card}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <label style={{...S.btnO,cursor:"pointer"}}>{file?file.name:"Choose Excel/CSV"}<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label>
        <button onClick={upload} disabled={!file||uploading} style={{...S.btnG,opacity:!file||uploading?0.5:1}}>{uploading?"Uploading...":"Upload & Import"}</button>
      </div>
    </div>
    <div style={{margin:"14px 0"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search HSN code or description..." style={{...S.input,width:300}}/></div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {codes.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No HSN codes yet. Upload a list above.</div>:(
          <table style={S.tbl}><thead><tr>{["Code","Description","GST%","Unit"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{codes.slice(0,100).map(c=>(<tr key={c.code}><td style={{...S.td,...S.mono,fontWeight:600}}>{c.code}</td><td style={S.td}>{c.description}</td><td style={S.td}>{c.gst_rate}%</td><td style={S.tdR}>{c.uom}</td></tr>))}</tbody></table>
        )}
        {codes.length>100&&<div style={{textAlign:"center",padding:10,color:C.muted,fontSize:11}}>Showing first 100 of {codes.length}</div>}
      </div>
    )}
  </div>);
}

// ── E-INVOICE ────────────────────────────────────────────────────────────────
function EInvoice({token,toast,company}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[generating,setGenerating]=useState(null);const[result,setResult]=useState(null);
  const cid=company?.id;
  const load=useCallback(()=>{if(!cid)return;setLoading(true);api(`/accounting/companies/${cid}/einvoice`,"GET",null,token).then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));},[cid,token]);
  useEffect(()=>{load();},[load]);
  const generate=async id=>{setGenerating(id);try{const d=await api(`/accounting/companies/${cid}/einvoice/generate`,"POST",{invoice_id:id},token);setResult(d);toast("✅ IRN Generated","success");load();}catch(e){toast(e.message,"error");}setGenerating(null);};
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:6}}>🔖 E-Invoice (IRN Generation)</div>
      <div style={{fontSize:12,color:C.sub}}>Generate IRN for B2B sales invoices of {company?.name}. Mandatory if turnover &gt; ₹5 Cr.</div>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {invoices.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No sales invoices yet</div>:(
          <table style={S.tbl}><thead><tr>{["Invoice No","Date","Party","Amount","IRN","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{invoices.map(inv=>(<tr key={inv.id}>
            <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{inv.invoice_no}</td>
            <td style={S.td}>{inv.invoice_date}</td>
            <td style={S.td}>{inv.party_name}</td>
            <td style={S.td}>{fR(inv.total_amount)}</td>
            <td style={{...S.td,...S.mono,fontSize:10}}>{inv.einvoice_irn?inv.einvoice_irn.substring(0,20)+"...":"—"}</td>
            <td style={S.tdR}>{inv.einvoice_irn?badge("Generated","green"):<button onClick={()=>generate(inv.id)} disabled={generating===inv.id} style={{...S.btn,fontSize:10,padding:"4px 10px"}}>{generating===inv.id?"...":"Generate IRN"}</button>}</td>
          </tr>))}</tbody></table>
        )}
      </div>
    )}
    {result&&(<Modal title="E-Invoice Generated" onClose={()=>setResult(null)}>
      <div style={{...S.card,background:"#0d2818",border:"1px solid #238636"}}>
        <div style={{marginBottom:6}}><b>IRN:</b> <span style={S.mono}>{result.irn}</span></div>
        <div style={{marginBottom:6}}><b>Ack No:</b> {result.ack_no}</div>
        <div style={{marginBottom:6}}><b>Ack Date:</b> {result.ack_date}</div>
        <div><b>Invoice:</b> {result.invoice_no} — {fR(result.total_amount)}</div>
      </div>
    </Modal>)}
  </div>);
}

// ── E-WAY BILL ───────────────────────────────────────────────────────────────
function EWayBill({token,toast,company}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(null);
  const[f,setF]=useState({transporter_name:"",vehicle_no:"",distance:"100"});const[result,setResult]=useState(null);
  const cid=company?.id;
  const load=useCallback(()=>{if(!cid)return;setLoading(true);api(`/accounting/companies/${cid}/ewaybill`,"GET",null,token).then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));},[cid,token]);
  useEffect(()=>{load();},[load]);
  const generate=async()=>{try{const d=await api(`/accounting/companies/${cid}/ewaybill/generate`,"POST",{invoice_id:modal.id,...f},token);setResult(d);setModal(null);toast("✅ E-Way Bill Generated","success");load();}catch(e){toast(e.message,"error");}};
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#e3b341",marginBottom:6}}>🚛 E-Way Bill</div>
      <div style={{fontSize:12,color:C.sub}}>Required for goods movement &gt; ₹50,000. Shows {company?.name}'s sales invoices above ₹50,000.</div>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {invoices.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No invoices above ₹50,000</div>:(
          <table style={S.tbl}><thead><tr>{["Invoice No","Date","Party","Amount","EWB No","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{invoices.map(inv=>(<tr key={inv.id}>
            <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{inv.invoice_no}</td>
            <td style={S.td}>{inv.invoice_date}</td>
            <td style={S.td}>{inv.party_name}</td>
            <td style={S.td}>{fR(inv.total_amount)}</td>
            <td style={{...S.td,...S.mono}}>{inv.ewb_no||"—"}</td>
            <td style={S.tdR}>{inv.ewb_no?badge("Generated","green"):<button onClick={()=>{setF({transporter_name:"",vehicle_no:"",distance:"100"});setModal(inv);}} style={{...S.btn,fontSize:10,padding:"4px 10px"}}>Generate</button>}</td>
          </tr>))}</tbody></table>
        )}
      </div>
    )}
    {modal&&(<Modal title={`E-Way Bill — ${modal.invoice_no}`} onClose={()=>setModal(null)}>
      <div style={S.fg}><label style={S.label}>Transporter Name</label><input style={S.input} value={f.transporter_name} onChange={e=>setF(p=>({...p,transporter_name:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Vehicle No</label><input style={S.input} value={f.vehicle_no} onChange={e=>setF(p=>({...p,vehicle_no:e.target.value}))} placeholder="MH12AB1234"/></div>
      <div style={S.fg}><label style={S.label}>Distance (km)</label><input type="number" style={S.input} value={f.distance} onChange={e=>setF(p=>({...p,distance:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={generate} style={S.btn}>Generate E-Way Bill</button></div>
    </Modal>)}
    {result&&(<Modal title="E-Way Bill Generated" onClose={()=>setResult(null)}>
      <div style={{...S.card,background:"#0d2818",border:"1px solid #238636"}}>
        <div style={{marginBottom:6}}><b>EWB No:</b> <span style={S.mono}>{result.ewb_no}</span></div>
        <div style={{marginBottom:6}}><b>Valid Till:</b> {result.valid_till}</div>
        <div style={{marginBottom:6}}><b>Transporter:</b> {result.transporter_name}</div>
        <div><b>Vehicle:</b> {result.vehicle_no||"—"} | Distance: {result.distance} km</div>
      </div>
    </Modal>)}
  </div>);
}

// ── GST RECONCILIATION (2A vs Books) ────────────────────────────────────────
function GSTReconciliation({token,toast,company}){
  const[period,setPeriod]=useState("");
  const[records,setRecords]=useState([]);const[summary,setSummary]=useState(null);const[loading,setLoading]=useState(false);
  const cid=company?.id;
  const PERIODS=[];for(let y=2026;y>=2022;y--)for(let m=12;m>=1;m--)PERIODS.push(`${String(m).padStart(2,"0")}-${y}`);
  const load=async()=>{
    if(!period)return toast("Select period","error");
    setLoading(true);
    try{const d=await api(`/accounting/companies/${cid}/reconciliation?period=${period}`, "GET",null,token);setRecords(d.records||[]);setSummary(d.summary);}catch(e){toast(e.message,"error");}
    setLoading(false);
  };
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>⇄ GST Reconciliation — {company?.name}</div>
      <div style={{fontSize:12,color:C.sub}}>Compares GSTR-2A (imported) data against this company's purchase books for the selected period.</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <select style={{...S.select,width:160}} value={period} onChange={e=>setPeriod(e.target.value)}><option value="">Select Period</option>{PERIODS.map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={load} style={S.btn}>Reconcile</button>
    </div>
    {loading?<Spinner/>:summary&&(<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Total Records",v:summary.total,c:"#58a6ff"},{l:"Matched",v:summary.matched,c:"#3fb950"},{l:"Mismatched",v:summary.mismatched,c:"#e3b341"},{l:"Missing in Books",v:summary.missing,c:"#f85149"}].map(k=><div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>)}
      </div>
      <div style={S.card}>
        {records.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No records. Import GSTR-2A first.</div>:(
          <table style={S.tbl}><thead><tr>{["Vendor","Invoice No","Taxable","IGST","CGST","SGST","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{records.map(r=>(<tr key={r.id}><td style={{...S.td,fontWeight:600}}>{r.vendor_name}</td><td style={S.td}>{r.invoice_no}</td><td style={S.td}>{fR(r.taxable_value)}</td><td style={S.td}>{fR(r.igst)}</td><td style={S.td}>{fR(r.cgst)}</td><td style={S.td}>{fR(r.sgst)}</td><td style={S.tdR}>{badge(r.status,r.status==="matched"?"green":r.status==="mismatch"?"amber":"red")}</td></tr>))}</tbody></table>
        )}
      </div>
    </>)}
  </div>);
}

// ── GSTR-2A IMPORT ───────────────────────────────────────────────────────────
function GSTR2AImport({token,toast,company}){
  const[period,setPeriod]=useState("");
  const[file,setFile]=useState(null);const[preview,setPreview]=useState(null);const[importing,setImporting]=useState(false);const[previewing,setPreviewing]=useState(false);
  const cid=company?.id;
  const PERIODS=[];for(let y=2026;y>=2022;y--)for(let m=12;m>=1;m--)PERIODS.push(`${String(m).padStart(2,"0")}-${y}`);

  const doPreview=async()=>{
    if(!file)return toast("Select Excel/CSV file","error");
    setPreviewing(true);
    try{
      const fd=new FormData();fd.append("file",file);
      const res=await fetch(`${API}/accounting/companies/${cid}/gstr2a/preview`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success)setPreview(d);else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setPreviewing(false);
  };
  const doImport=async()=>{
    if(!period)return toast("Select period","error");
    setImporting(true);
    try{
      const fd=new FormData();fd.append("file",file);fd.append("period",period);
      const res=await fetch(`${API}/accounting/companies/${cid}/gstr2a/import`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast(d.message,"success");setFile(null);setPreview(null);}else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setImporting(false);
  };
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>📥 GSTR-2A Import — {company?.name}</div>
      <div style={{fontSize:12,color:C.sub}}>Download GSTR-2A from GST portal (Excel) → Upload here → Reconcile with books in "GST Reconciliation"</div>
    </div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Period</label><select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}><option value="">Select</option>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>File</label><label style={{...S.btnO,cursor:"pointer",display:"block",textAlign:"center"}}>{file?file.name:"Choose Excel/CSV"}<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{setFile(e.target.files[0]);setPreview(null);}} style={{display:"none"}}/></label></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <button onClick={doPreview} disabled={!file||previewing} style={{...S.btnO,opacity:!file?0.5:1}}>{previewing?"Loading...":"Preview"}</button>
      <button onClick={doImport} disabled={!file||importing} style={{...S.btnG,opacity:!file?0.5:1}}>{importing?"Importing...":"Import for Reconciliation"}</button>
    </div>
    {preview&&(<div style={S.card}>
      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{preview.count} total rows — showing first {preview.preview.length}</div>
      <table style={S.tbl}><thead><tr>{["Vendor","GSTIN","Invoice No","Taxable","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{preview.preview.map((r,i)=>(<tr key={i}><td style={S.td}>{r.vendor_name}</td><td style={{...S.td,...S.mono,fontSize:10}}>{r.gstin}</td><td style={S.td}>{r.invoice_no}</td><td style={S.td}>{fR(r.taxable_value)}</td><td style={S.td}>{fR(r.igst)}</td><td style={S.td}>{fR(r.cgst)}</td><td style={S.tdR}>{fR(r.sgst)}</td></tr>))}</tbody></table>
    </div>)}
  </div>);
}

// ── AI ASSISTANT (Chat) ──────────────────────────────────────────────────────
function AIAssistant({token,toast,company}){
  const[messages,setMessages]=useState([{role:"assistant",content:`Hi! I'm your AI assistant for ${company?.name||"your company"}. Ask me about GST, accounting, Tally entries, or tax compliance.`}]);
  const[input,setInput]=useState("");const[sending,setSending]=useState(false);const cid=company?.id;
  const send=async()=>{
    if(!input.trim())return;
    const msg=input;setInput("");
    setMessages(p=>[...p,{role:"user",content:msg}]);
    setSending(true);
    try{
      const d=await api(`/accounting/companies/${cid}/ai-chat`,"POST",{message:msg},token);
      setMessages(p=>[...p,{role:"assistant",content:d.reply}]);
    }catch(e){setMessages(p=>[...p,{role:"assistant",content:"⚠ "+e.message}]);}
    setSending(false);
  };
  if(!cid)return null;
  return(<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 160px)"}}>
    <div style={{flex:1,overflowY:"auto",...S.card,marginBottom:10}}>
      {messages.map((m,i)=>(
        <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
          <div style={{maxWidth:"75%",padding:"9px 14px",borderRadius:10,background:m.role==="user"?"#1F6FEB":"#21262D",color:m.role==="user"?"#fff":C.sub,fontSize:13,whiteSpace:"pre-wrap"}}>{m.content}</div>
        </div>
      ))}
      {sending&&<div style={{color:C.muted,fontSize:12}}>AI is thinking...</div>}
    </div>
    <div style={{display:"flex",gap:8}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about GST, accounting, Tally entries..." style={{...S.input,flex:1}}/>
      <button onClick={send} disabled={sending} style={S.btn}>Send</button>
    </div>
  </div>);
}

// ── BANK BOOK — Month-wise (Tally-style) ────────────────────────────────────
function BankBook({token,toast,company}){
  const[bankLedgers,setBankLedgers]=useState([]);const[selected,setSelected]=useState("");
  const[months,setMonths]=useState([]);const[expanded,setExpanded]=useState({});const[loading,setLoading]=useState(false);
  const[detail,setDetail]=useState({});
  const cid=company?.id;
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  useEffect(()=>{
    if(!cid)return;
    api(`/accounting/companies/${cid}/ledgers`,"GET",null,token).then(d=>{
      const banks=(d.ledgers||[]).filter(l=>/bank|cash/i.test(l.name));
      setBankLedgers(banks);
      if(banks[0])setSelected(banks[0].id);
    }).catch(()=>{});
  },[cid]);

  const load=useCallback(async()=>{
    if(!selected||!cid)return;
    setLoading(true);
    try{
      const d=await api(`/accounting/companies/${cid}/ledgers/${selected}/statement`,"GET",null,token);
      const txns=d.transactions||[];
      const byMonth={};
      txns.forEach(t=>{
        const m=t.date?.substring(0,7); // YYYY-MM
        if(!byMonth[m])byMonth[m]={dr:0,cr:0,count:0,txns:[]};
        byMonth[m].dr+=parseFloat(t.dr_amount||0);
        byMonth[m].cr+=parseFloat(t.cr_amount||0);
        byMonth[m].count++;
        byMonth[m].txns.push(t);
      });
      const monthList=Object.keys(byMonth).sort().reverse().map(m=>({month:m,...byMonth[m]}));
      setMonths(monthList);
      setDetail(byMonth);
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  },[selected,cid,token]);
  useEffect(()=>{load();},[load]);

  const monthName=m=>{const[y,mo]=m.split("-");return new Date(y,mo-1).toLocaleString("en-IN",{month:"long",year:"numeric"});};

  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>🏦 Bank Book — Month-wise Summary</div>
      <div style={{fontSize:12,color:C.sub}}>All Bank/Cash voucher entries (from Bank Import, Sales, Purchase, manual vouchers) grouped by month — like Tally's Bank Book.</div>
    </div>
    {bankLedgers.length===0?<div style={{...S.card,textAlign:"center",padding:30,color:C.muted}}>No Bank/Cash ledgers found. Create one in Ledgers (under Asset group).</div>:(<>
      <div style={{marginBottom:14}}>
        <select style={{...S.select,width:240}} value={selected} onChange={e=>setSelected(e.target.value)}>{bankLedgers.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>
      </div>
      {loading?<Spinner/>:months.length===0?<div style={{...S.card,textAlign:"center",padding:30,color:C.muted}}>No transactions for this ledger yet</div>:(
        months.map(m=>(
          <div key={m.month} style={{...S.card,marginBottom:8}}>
            <div onClick={()=>setExpanded(p=>({...p,[m.month]:!p[m.month]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div style={{fontWeight:700,color:C.text,fontSize:13}}>{expanded[m.month]?"▾":"▸"} {monthName(m.month)} <span style={{color:C.muted,fontSize:11,fontWeight:400}}>({m.count} entries)</span></div>
              <div style={{display:"flex",gap:16}}>
                <span style={{color:"#3fb950",fontWeight:600,fontSize:12}}>Dr {fR(m.dr)}</span>
                <span style={{color:"#f85149",fontWeight:600,fontSize:12}}>Cr {fR(m.cr)}</span>
                <span style={{color:m.dr-m.cr>=0?"#3fb950":"#f85149",fontWeight:700,fontSize:12}}>Net {fR(Math.abs(m.dr-m.cr))} {m.dr-m.cr>=0?"Dr":"Cr"}</span>
              </div>
            </div>
            {expanded[m.month]&&(
              <table style={{...S.tbl,marginTop:10}}><thead><tr>{["Date","Voucher","Type","Narration","Dr","Cr"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{m.txns.map((t,i)=>(<tr key={i}><td style={S.td}>{t.date}</td><td style={{...S.td,color:"#58a6ff"}}>{t.voucher_no}</td><td style={S.td}>{badge(t.voucher_type,t.voucher_type==="RECEIPT"?"green":t.voucher_type==="PAYMENT"?"red":"gray")}</td><td style={{...S.td,maxWidth:240}}>{t.narration||t.v_narration}</td><td style={{...S.td,color:"#3fb950"}}>{t.dr_amount>0?fR(t.dr_amount):"—"}</td><td style={{...S.tdR,color:"#f85149"}}>{t.cr_amount>0?fR(t.cr_amount):"—"}</td></tr>))}</tbody></table>
            )}
          </div>
        ))
      )}
    </>)}
  </div>);
}