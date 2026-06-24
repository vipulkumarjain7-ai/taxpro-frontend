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
  const[f,setF]=useState({name:"",email:"",password:"",firm:"",phone:""});
  const[loading,setLoading]=useState(false);
  const[warming,setWarming]=useState(true);
  const[err,setErr]=useState("");
  const[otpStep,setOtpStep]=useState(null); // {otp_token, sent_to} when 2FA OTP required
  const[otpCode,setOtpCode]=useState("");
  useEffect(()=>{fetch(`${API.replace("/api","")}/health`).then(()=>setWarming(false)).catch(()=>setWarming(false));},[]);

  const finishAuth=(d)=>{
    localStorage.setItem("tp_token",d.token);
    localStorage.setItem("tp_user",JSON.stringify(d.user));
    onAuth(d.user,d.token);
  };

  const go=async()=>{
    setErr("");setLoading(true);
    try{
      const d=await api(tab==="login"?"/auth/login":"/auth/register","POST",
        tab==="login"?{email:f.email,password:f.password}:{name:f.name,email:f.email,password:f.password,firm_name:f.firm,phone:f.phone});
      if(d.require_otp){
        setOtpStep({otp_token:d.otp_token,sent_to:d.sent_to});
      }else{
        finishAuth(d);
      }
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const verifyOtp=async()=>{
    if(!otpCode||otpCode.length<6)return setErr("Enter the 6-digit OTP");
    setErr("");setLoading(true);
    try{
      const d=await api("/auth/verify-login-otp","POST",{otp_token:otpStep.otp_token,code:otpCode},null);
      finishAuth(d);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  // ── OTP VERIFICATION SCREEN ──
  if(otpStep){
    return(
      <div style={{minHeight:"100vh",background:"#0D1117",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:"min(400px,92vw)"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:8}}>🔐</div>
            <div style={{fontSize:18,fontWeight:800,color:C.text}}>Verify it's you</div>
            <div style={{fontSize:12,color:C.muted,marginTop:6}}>
              We sent a 6-digit code to{otpStep.sent_to?.email?` ${otpStep.sent_to.email}`:""}{otpStep.sent_to?.phone?` and ${otpStep.sent_to.phone}`:""}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.fg}>
              <label style={S.label}>Enter OTP</label>
              <input style={{...S.input,fontSize:20,letterSpacing:6,textAlign:"center"}} maxLength={6} value={otpCode}
                onChange={e=>setOtpCode(e.target.value.replace(/\D/g,""))} onKeyDown={e=>e.key==="Enter"&&verifyOtp()} placeholder="000000" autoFocus/>
            </div>
            {err&&<div style={{background:"#2d0e0e",border:"1px solid #6e1c1c",color:"#f85149",padding:"9px 12px",borderRadius:7,fontSize:12,marginBottom:12}}>⚠ {err}</div>}
            <button onClick={verifyOtp} disabled={loading} style={{...S.btn,width:"100%",padding:11,opacity:loading?0.7:1}}>{loading?"Verifying...":"Verify & Continue →"}</button>
            <button onClick={()=>{setOtpStep(null);setOtpCode("");setErr("");}} style={{...S.btnO,width:"100%",marginTop:8}}>← Back to login</button>
            <div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:10}}>OTP valid for 10 minutes</div>
          </div>
        </div>
      </div>
    );
  }

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
            <div style={S.fg}><label style={S.label}>Mobile Number (for OTP login later)</label><input style={S.input} placeholder="9876543210" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))}/></div>
          </>}
          <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value})) } onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          <div style={S.fg}><label style={S.label}>Password</label><input style={S.input} type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
          {tab==="register"&&<div style={{fontSize:10,color:C.muted,marginTop:-8,marginBottom:14}}>Min 8 characters, at least 1 number</div>}
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
    {icon:"🧾",title:"GST Suite",desc:"GSTR-1, 3B, 2A/2B Recon, CMP-08, GSTR-4/9/9C/10, E-Invoice, Legal Library",keys:["gstr3b"],color:"#0e9182"},
    {icon:"📝",title:"Income Tax",desc:"ITR Filing, TDS, 26AS, Form 16, Challan 280, AI Tax Planning",keys:["it-clients"],color:"#2563eb"},
    {icon:"🤖",title:"AI Tools",desc:"Invoice Scanner, AI Bill Generator, AI Assistant",keys:["ai-invoice"],color:"#e11d48"},
    {icon:"🏦",title:"Banking",desc:"Bank Statement Import, Reconciliation",keys:["bank"],color:"#d97706"},
    {icon:"📅",title:"Compliance",desc:"Compliance Calendar, All Due Dates Auto-seeded",keys:["compliance"],color:"#7c3aed"},
    {icon:"📁",title:"Practice Mgmt",desc:"Document Manager, Payroll, Employees",keys:["documents"],color:"#059669"},
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
// Small reusable "..." action menu
function ActionMenu({items}){
  const[open,setOpen]=useState(false);const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  return(<div ref={ref} style={{position:"relative",display:"inline-block"}}>
    <button onClick={()=>setOpen(p=>!p)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"2px 8px"}}>⋮</button>
    {open&&(
      <div style={{position:"absolute",right:0,top:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:7,zIndex:60,minWidth:140,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
        {items.map((it,i)=>(
          <button key={i} onClick={()=>{setOpen(false);it.onClick();}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",border:"none",background:"transparent",color:it.danger?"#f85149":C.sub,cursor:"pointer",fontFamily:"inherit",fontSize:12}}
            onMouseEnter={e=>e.currentTarget.style.background="#1c2333"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{it.label}</button>
        ))}
      </div>
    )}
  </div>);
}

function InvoiceList({token,toast,type,company,setView}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[showForm,setShowForm]=useState(false);const[search,setSearch]=useState("");
  const[viewingVoucher,setViewingVoucher]=useState(null);
  const[editingInv,setEditingInv]=useState(null);
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
  const viewVoucher=async voucherId=>{
    if(!voucherId)return toast("No voucher linked","error");
    try{const d=await api(`/accounting/companies/${cid}/vouchers/${voucherId}`,"GET",null,token);setViewingVoucher(d.voucher);}catch(e){toast(e.message,"error");}
  };
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const totalAmt=invoices.reduce((a,i)=>a+parseFloat(i.total_amount||0),0);
  const unpaidAmt=invoices.reduce((a,i)=>a+parseFloat(i.balance_due||0),0);
  const paidAmt=totalAmt-unpaidAmt;

  if(!cid)return null;

  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{...S.kpi,flex:1,minWidth:120}}><div style={S.label}>Paid</div><div style={{fontSize:15,fontWeight:700,color:"#3fb950"}}>{fR(paidAmt)}</div></div>
      <div style={{fontSize:18,color:C.muted}}>+</div>
      <div style={{...S.kpi,flex:1,minWidth:120}}><div style={S.label}>Unpaid</div><div style={{fontSize:15,fontWeight:700,color:"#e3b341"}}>{fR(unpaidAmt)}</div></div>
      <div style={{fontSize:18,color:C.muted}}>=</div>
      <div style={{...S.kpi,flex:1,minWidth:120,background:"#0c1d2e"}}><div style={S.label}>Total ({invoices.length} {label}s)</div><div style={{fontSize:15,fontWeight:700,color:"#58a6ff"}}>{fR(totalAmt)}</div></div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name or invoice no..." style={{...S.input,width:240}}/>
      <button onClick={()=>setShowForm(true)} style={{...S.btn,marginLeft:"auto"}}>+ New {label}</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {invoices.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>No {label.toLowerCase()}s yet</div>:(
          <table style={S.tbl}><thead><tr>{["Date","Invoice No","Party Name","Amount","Balance Due","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{invoices.map(inv=>(
            <tr key={inv.id}>
              <td style={S.td}>{inv.invoice_date}</td>
              <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{inv.invoice_no}</td>
              <td style={S.td}>{inv.party_name}</td>
              <td style={{...S.td,fontWeight:600}}>{fR(inv.total_amount)}</td>
              <td style={{...S.td,color:parseFloat(inv.balance_due)>0?"#e3b341":"#3fb950"}}>{fR(inv.balance_due)}</td>
              <td style={S.td}>{badge(inv.status,inv.status==="paid"?"green":inv.status==="partial"?"amber":"red")}</td>
              <td style={S.tdR}>
                <ActionMenu items={[
                  {label:"✏️ Edit",onClick:()=>setEditingInv(inv)},
                  {label:"📄 View Voucher",onClick:()=>viewVoucher(inv.voucher_id)},
                  {label:"🗑 Delete",danger:true,onClick:()=>del(inv.id)},
                ]}/>
              </td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {showForm&&<InvoiceForm token={token} toast={toast} type={type} company={company} onClose={()=>setShowForm(false)} onSave={()=>{setShowForm(false);load();}}/>}
    {editingInv&&(
      <Modal title={`Edit ${label} — ${editingInv.invoice_no}`} onClose={()=>setEditingInv(null)} wide>
        <InvoiceEditor token={token} toast={toast} company={company} type={type==="SALES"?"sales":"purchase"} editingId={editingInv.id}
          initialData={{
            party_id:editingInv.party_id,vendor_name:editingInv.party_name,vendor_gstin:"",
            invoice_no:editingInv.invoice_no,invoice_date:String(editingInv.invoice_date).substring(0,10),
            place_of_supply:editingInv.place_of_supply||company?.state||"",
            items:(typeof editingInv.items==="string"?JSON.parse(editingInv.items):editingInv.items)||[],
          }}
          onCancel={()=>setEditingInv(null)}
          onSaved={()=>{setEditingInv(null);load();}}
        />
      </Modal>
    )}
    {viewingVoucher&&(
      <Modal title={`${viewingVoucher.voucher_no} — ${viewingVoucher.voucher_type}`} onClose={()=>setViewingVoucher(null)} wide>
        <div style={{display:"flex",gap:8,marginBottom:12}}>{badge(viewingVoucher.voucher_type,"blue")}{badge(viewingVoucher.date,"gray")}{viewingVoucher.narration&&<span style={{fontSize:12,color:C.muted}}>{viewingVoucher.narration}</span>}</div>
        <table style={S.tbl}><thead><tr>{["Ledger","Dr Amount","Cr Amount"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(viewingVoucher.items||[]).map((it,i)=>(
          <tr key={i}><td style={{...S.td,fontWeight:600,color:C.text}}>{it.ledger_name}</td><td style={{...S.td,color:"#3fb950",fontWeight:it.dr_amount>0?700:400}}>{it.dr_amount>0?fR(it.dr_amount):"—"}</td><td style={{...S.tdR,color:"#f85149",fontWeight:it.cr_amount>0?700:400}}>{it.cr_amount>0?fR(it.cr_amount):"—"}</td></tr>
        ))}</tbody>
        <tfoot><tr><td style={{...S.td,fontWeight:700}}>Total</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR((viewingVoucher.items||[]).reduce((a,i)=>a+parseFloat(i.dr_amount||0),0))}</td><td style={{...S.tdR,color:"#f85149",fontWeight:700}}>{fR((viewingVoucher.items||[]).reduce((a,i)=>a+parseFloat(i.cr_amount||0),0))}</td></tr></tfoot>
        </table>
      </Modal>
    )}
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
// ── Shared Period Selector — Monthly + Financial Year ──────────────────────
function PeriodSelector({period,setPeriod,fy,setFy,mode,setMode,label}){
  const MONTHS_LIST=[];
  for(let y=2027;y>=2020;y--)for(let m=12;m>=1;m--)MONTHS_LIST.push(`${String(m).padStart(2,"0")}-${y}`);
  const FY_LIST_SEL=["2026-27","2025-26","2024-25","2023-24","2022-23","2021-22","2020-21","2019-20","2018-19","2017-18"];
  const isMon=!mode||mode==="monthly";
  return(<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
    <div style={{display:"flex",gap:4}}>
      <button onClick={()=>setMode("monthly")} style={{padding:"5px 14px",borderRadius:"7px 0 0 7px",border:`1px solid ${isMon?"#1F6FEB":C.border}`,background:isMon?"#1F6FEB":"transparent",color:isMon?"#fff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Monthly</button>
      <button onClick={()=>setMode("fy")} style={{padding:"5px 14px",borderRadius:"0 7px 7px 0",border:`1px solid ${!isMon?"#1F6FEB":C.border}`,background:!isMon?"#1F6FEB":"transparent",color:!isMon?"#fff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Financial Year</button>
    </div>
    {isMon?(<select style={{...S.select,width:150}} value={period} onChange={e=>setPeriod(e.target.value)}>
      <option value="">Select {label||"Period"}</option>{MONTHS_LIST.map(p=><option key={p}>{p}</option>)}
    </select>):(<select style={{...S.select,width:150}} value={fy} onChange={e=>setFy(e.target.value)}>
      <option value="">Select FY</option>{FY_LIST_SEL.map(f=><option key={f}>{f}</option>)}
    </select>)}
  </div>);
}

// ── GSTR-3B — Official table format (Table 3.1, 3.2, 4, 5, 5.1, 6) ──────────
function GSTR3B({token,toast,company}){
  const cid=company?.id;
  const[period,setPeriod]=useState("");const[fy,setFy]=useState("");const[mode,setMode]=useState("monthly");
  const[data,setData]=useState(null);const[loading,setLoading]=useState(false);const[saving,setSaving]=useState(false);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const num=v=>parseFloat(v)||0;

  // Editable overrides for manual adjustment
  const[t31,setT31]=useState(null);const[t4,setT4]=useState(null);const[t51,setT51]=useState(null);const[t6,setT6]=useState(null);

  const load=async()=>{
    const param=mode==="monthly"?period:fy;
    if(!param)return toast("Select period","error");
    setLoading(true);
    try{
      const d=await api(`/accounting/companies/${cid}/gstr3b?${mode==="monthly"?`period=${param}`:`fy=${param}`}`,"GET",null,token);
      setData(d);
      setT31(d.table3_1);setT4(d.table4);setT51(d.table5_1);setT6(d.table6_tax_payment);
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  if(!cid)return null;
  const p=data?.period||data?.fy||"";

  const TaxRow=({label,row,setRow,editable,style={}})=>row?(
    <tr style={style}>
      <td style={{...S.td,color:C.sub,fontSize:12}}>{label}</td>
      {["taxable","igst","cgst","sgst","cess"].map(k=>(
        <td key={k} style={S.td}>
          {editable?<input type="number" style={{...S.input,fontSize:11,padding:"4px 8px"}} value={row[k]||0} onChange={e=>setRow(p=>({...p,[k]:e.target.value}))}/>:fR(row[k]||0)}
        </td>
      ))}
    </tr>
  ):null;

  const TaxHeader=()=><tr>{["Description","Taxable Value (₹)","Integrated Tax (₹)","Central Tax (₹)","State/UT Tax (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>;

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>📋 FORM GSTR-3B — Monthly Summary Return</div>
      <div style={{fontSize:12,color:C.sub}}>Auto-populated from your Sales/Purchase invoices. Review each table and adjust manually where needed before filing on the GST portal.</div>
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
      <PeriodSelector period={period} setPeriod={setPeriod} fy={fy} setFy={setFy} mode={mode} setMode={setMode}/>
      <button onClick={load} disabled={loading} style={S.btn}>{loading?"Loading...":"Load Data"}</button>
    </div>
    {!data&&!loading&&<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>Select period and click Load Data</div>}
    {loading&&<Spinner/>}
    {data&&t31&&(<>
      <div style={S.card}>
        <div style={{fontWeight:700,color:C.text,marginBottom:8}}>
          FORM GSTR-3B · {company.name} · GSTIN: {company.gstin||"—"} · Period: {p}
        </div>
      </div>

      {/* Table 3.1 */}
      <div style={{...S.card,borderLeft:"3px solid #1F6FEB"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#58a6ff"}}>3.1 Details of Outward Supplies and inward supplies liable to reverse charge</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><TaxHeader/></thead>
          <tbody>
            <TaxRow label="(a) Outward taxable supplies (other than zero rated, nil rated and exempted)" row={t31.a} setRow={v=>setT31(p=>({...p,a:typeof v==="function"?v(p.a):v}))} editable/>
            <TaxRow label="(b) Outward taxable supplies (zero rated)" row={t31.b} setRow={v=>setT31(p=>({...p,b:typeof v==="function"?v(p.b):v}))} editable/>
            <TaxRow label="(c) Other outward supplies (Nil rated, exempted)" row={{taxable:t31.c?.taxable||0,igst:0,cgst:0,sgst:0,cess:0}} setRow={v=>setT31(p=>({...p,c:{taxable:v.taxable}}))} editable/>
            <TaxRow label="(d) Inward supplies (liable to reverse charge)" row={t31.d} setRow={v=>setT31(p=>({...p,d:typeof v==="function"?v(p.d):v}))} editable/>
            <TaxRow label="(e) Non-GST outward supplies" row={{taxable:t31.e?.taxable||0,igst:0,cgst:0,sgst:0,cess:0}} setRow={v=>setT31(p=>({...p,e:{taxable:v.taxable}}))} editable/>
          </tbody>
          <tfoot>
            <tr style={{background:"#0c1d2e",fontWeight:700}}>
              <td style={S.td}>Total Outward Tax</td>
              {["taxable","igst","cgst","sgst","cess"].map(k=><td key={k} style={S.td}>{fR((num(t31.a[k])+num(t31.b[k])+num(t31.d[k])))}</td>)}
            </tr>
          </tfoot>
        </table></div>
      </div>

      {/* Table 3.2 */}
      {data.table3_2?.length>0&&(<div style={{...S.card,borderLeft:"3px solid #238636"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#3fb950"}}>3.2 Of the supplies shown in 3.1(a), details of inter-State supplies made to unregistered persons, composition taxable persons and UIN holders</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["Place of Supply (State/UT)","Total Taxable Value (₹)","Amount of Integrated Tax (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{data.table3_2.map((r,i)=><tr key={i}><td style={S.td}>{r.place_of_supply}</td><td style={S.td}>{fR(r.taxable)}</td><td style={S.tdR}>{fR(r.igst)}</td></tr>)}</tbody>
        </table></div>
      </div>)}

      {/* Table 4 — ITC */}
      {t4&&(<div style={{...S.card,borderLeft:"3px solid #9333ea"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#bf91f3"}}>4 Eligible ITC</div>
        <div style={{fontWeight:600,fontSize:11,color:C.muted,marginBottom:6}}>4(A) ITC Available (whether in full or part):</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["","Integrated Tax (₹)","Central Tax (₹)","State/UT Tax (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[["(1) Import of goods","itc_a1"],["(2) Import of services","itc_a2"],["(3) Inward supplies liable to reverse charge (other than 1 & 2 above)","itc_a3"],["(4) Inward supplies from ISD","itc_a4"],["(5) All other ITC","itc_a5"]].map(([l,k])=>(
              <tr key={k}><td style={{...S.td,fontSize:12,color:C.sub}}>{l}</td>
              {["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11,padding:"4px 8px"}} value={t4[k]?.[f]||0} onChange={e=>setT4(p=>({...p,[k]:{...p[k],[f]:e.target.value}}))}/></td>)}</tr>
            ))}
            <tr style={{fontWeight:700,background:"#0c1d2e"}}><td style={S.td}>(C) Net ITC Available [(A)-(B)]</td>
            {["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}>{fR(num(t4.itc_a5?.[f]||0)+num(t4.itc_a4?.[f]||0)+num(t4.itc_a3?.[f]||0))}</td>)}</tr>
          </tbody>
        </table></div>
        <div style={{fontWeight:600,fontSize:11,color:C.muted,margin:"10px 0 6px"}}>4(D) Ineligible ITC:</div>
        <div className="tp-table-wrap"><table style={S.tbl}><thead><tr>{["","IGST","CGST","SGST","Cess"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[["(1) As per Section 17(5)","itc_d1"],["(2) Others","itc_d2"]].map(([l,k])=>(
              <tr key={k}><td style={{...S.td,fontSize:12,color:C.sub}}>{l}</td>
              {["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11,padding:"4px 8px"}} value={t4[k]?.[f]||0} onChange={e=>setT4(p=>({...p,[k]:{...p[k],[f]:e.target.value}}))}/></td>)}</tr>
            ))}
          </tbody>
        </table></div>
      </div>)}

      {/* Table 5 */}
      <div style={{...S.card,borderLeft:"3px solid #d97706"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#e3b341"}}>5 Values of exempt, nil-rated and non-GST inward supplies</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["Nature of supplies","Inter-State (₹)","Intra-State (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={{...S.td,fontSize:12,color:C.sub}}>(a) From a supplier under composition scheme, Exempt and Nil rated supply</td><td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={data.table5?.from_composition||0}/></td><td style={S.td}><input type="number" style={{...S.input,fontSize:11}} defaultValue={0}/></td></tr>
            <tr><td style={{...S.td,fontSize:12,color:C.sub}}>(b) Non-GST supply</td><td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={data.table5?.non_gst||0}/></td><td style={S.td}><input type="number" style={{...S.input,fontSize:11}} defaultValue={0}/></td></tr>
          </tbody>
        </table></div>
      </div>

      {/* Table 5.1 — Interest & Late Fee */}
      {t51&&(<div style={{...S.card,borderLeft:"3px solid #f85149"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#f85149"}}>5.1 Interest and Late Fee payable</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["","IGST (₹)","CGST (₹)","SGST/UTGST (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={{...S.td,fontSize:12,color:C.sub}}>Interest</td>{["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t51.interest?.[f]||0} onChange={e=>setT51(p=>({...p,interest:{...p.interest,[f]:e.target.value}}))}/></td>)}</tr>
            <tr><td style={{...S.td,fontSize:12,color:C.sub}}>Late Fee</td><td style={S.td}>—</td>{["cgst","sgst"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t51.late_fee?.[f]||0} onChange={e=>setT51(p=>({...p,late_fee:{...p.late_fee,[f]:e.target.value}}))}/></td>)}<td style={S.td}>—</td></tr>
          </tbody>
        </table></div>
      </div>)}

      {/* Table 6 — Tax Payment */}
      {t6&&(<div style={{...S.card,borderLeft:"3px solid #3fb950",background:"#0d2818"}}>
        <div style={{fontWeight:700,marginBottom:10,color:"#3fb950"}}>6 Payment of Tax</div>
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["Description","IGST (₹)","CGST (₹)","SGST/UTGST (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <tr style={{fontWeight:600}}><td style={{...S.td,color:"#e3b341"}}>Tax payable</td>{["igst","cgst","sgst","cess"].map(f=><td key={f} style={{...S.td,color:"#e3b341",fontWeight:700}}>{fR(t6.payable?.[f]||0)}</td>)}</tr>
            <tr><td style={{...S.td,color:C.sub}}>Paid through ITC</td>{["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t6.itc_used?.[f]||0} onChange={e=>setT6(p=>({...p,itc_used:{...p.itc_used,[f]:e.target.value}}))}/></td>)}</tr>
            <tr><td style={{...S.td,color:C.sub}}>Paid through Cash Ledger</td>{["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t6.cash_used?.[f]||0} onChange={e=>setT6(p=>({...p,cash_used:{...p.cash_used,[f]:e.target.value}}))}/></td>)}</tr>
            <tr><td style={{...S.td,color:C.sub}}>Interest paid</td>{["igst","cgst","sgst","cess"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t6.interest?.[f]||0} onChange={e=>setT6(p=>({...p,interest:{...p.interest,[f]:e.target.value}}))}/></td>)}</tr>
            <tr><td style={{...S.td,color:C.sub}}>Late fee paid</td><td style={S.td}>—</td>{["cgst","sgst"].map(f=><td key={f} style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={t6.late_fee?.[f]||0} onChange={e=>setT6(p=>({...p,late_fee:{...p.late_fee,[f]:e.target.value}}))}/></td>)}<td style={S.td}>—</td></tr>
          </tbody>
        </table></div>
      </div>)}

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4,flexWrap:"wrap"}}>
        <GSTDownloadBar
          disabled={!data}
          onJson={()=>downloadJSON(buildGSTR3B_JSON(data,company,mode==="monthly"?period:fy),`GSTR3B_${company.gstin||"GSTIN"}_${mode==="monthly"?period:fy}.json`)}
          onExcel={()=>downloadGSTR3B_Excel(data,company,mode==="monthly"?period:fy)}
          onPdf={()=>downloadGSTR3B_PDF(data,company,mode==="monthly"?period:fy)}
          onWord={()=>openPrintWindow(buildPrintHTML("FORM GSTR-3B",company.gstin||"",company.name,mode==="monthly"?period:fy,document.querySelector(".gstr3b-body")?.innerHTML||""),`GSTR3B_${company.gstin}.doc`)}
        />
        <button onClick={()=>window.open("https://services.gst.gov.in/services/auth/fowelcome","_blank")} style={S.btnO}>🌐 File on GST Portal</button>
      </div>
    </>)}
  </div>);
}

// ── Keep GSTRFiling for backward compatibility ──
function GSTRFiling({token,toast,company,formType}){
  return formType==="gstr3b"?<GSTR3B token={token} toast={toast} company={company}/>:<GSTR1 token={token} toast={toast} company={company}/>;
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
// ── SHARED: Invoice Editor (party select/create + items table + save) ──────
// initialData: {party_id, vendor_name, vendor_gstin, invoice_no, invoice_date, place_of_supply, items:[{name,qty,unit,rate,gst_rate}]}
// type: 'sales' | 'purchase'. editingId: if set, PUT (edit existing invoice) else POST (create new).
function InvoiceEditor({token,toast,company,type,initialData,editingId,onSaved,onCancel}){
  const cid=company?.id;
  const[meta,setMeta]=useState(()=>({
    party_id:initialData?.party_id||"",
    vendor_name:initialData?.vendor_name||initialData?.party_name||"",
    vendor_gstin:initialData?.vendor_gstin||"",
    invoice_no:initialData?.invoice_no||"",
    invoice_date:initialData?.invoice_date||today(),
    place_of_supply:initialData?.place_of_supply||company?.state||"",
  }));
  const[items,setItems]=useState(()=>(initialData?.items||[]).map(it=>({
    name:it.name||"Item",hsn_sac:it.hsn_sac||"",qty:String(it.qty??1),unit:it.unit||"PCS",rate:String(it.rate??0),gst_rate:String(it.gst_rate??18),
  })));
  const[parties,setParties]=useState([]);
  const[newSupplierMode,setNewSupplierMode]=useState(!initialData?.party_id);
  const[creatingSupplier,setCreatingSupplier]=useState(false);
  const[saving,setSaving]=useState(false);

  const loadParties=useCallback(()=>{
    if(!cid)return;
    api(`/accounting/companies/${cid}/parties`,"GET",null,token).then(d=>setParties(d.parties||[])).catch(()=>{});
  },[cid,token]);
  useEffect(()=>{loadParties();},[loadParties]);

  const setM=(k,v)=>setMeta(p=>({...p,[k]:v}));
  const setItemField=(i,k,v)=>{const n=[...items];n[i]={...n[i],[k]:v};setItems(n);};
  const addItemRow=()=>setItems(p=>[...p,{name:"",hsn_sac:"",qty:"1",unit:"PCS",rate:"0",gst_rate:"18"}]);
  const removeItemRow=i=>setItems(p=>p.filter((_,j)=>j!==i));

  const calcLine=it=>{const qty=parseFloat(it.qty)||0,rate=parseFloat(it.rate)||0,gst=parseFloat(it.gst_rate)||0;const amt=qty*rate;return{amount:amt,tax:amt*gst/100,total:amt+(amt*gst/100)};};
  const totals=items.reduce((a,it)=>{const c=calcLine(it);return{taxable:a.taxable+c.amount,tax:a.tax+c.tax,total:a.total+c.total};},{taxable:0,tax:0,total:0});

  const createSupplier=async()=>{
    if(!meta.vendor_name)return toast("Enter "+(type==="sales"?"customer":"supplier")+" name","error");
    setCreatingSupplier(true);
    try{
      await api(`/accounting/companies/${cid}/parties`,"POST",{
        name:meta.vendor_name,type:type==="sales"?"Customer":"Supplier",
        gstin:meta.vendor_gstin||"",state:meta.place_of_supply||"",opening_balance:"0",opening_type:"Dr",
      },token);
      toast("✅ Ledger created","success");
      await new Promise(r=>setTimeout(r,300));
      const pd=await api(`/accounting/companies/${cid}/parties`,"GET",null,token);
      setParties(pd.parties||[]);
      const created=(pd.parties||[]).find(p=>p.name.toLowerCase()===meta.vendor_name.toLowerCase());
      if(created){setM("party_id",created.id);setNewSupplierMode(false);}
    }catch(e){toast(e.message,"error");}
    setCreatingSupplier(false);
  };

  const save=async()=>{
    if(!meta.party_id)return toast(`Select or create a ${type==="sales"?"customer":"supplier"} first`,"error");
    if(items.length===0||items.every(it=>!it.name))return toast("Add at least one item","error");
    const isIgst=!!(meta.place_of_supply&&company?.state&&meta.place_of_supply!==company.state);
    setSaving(true);
    const payload={
      party_id:meta.party_id,
      invoice_no:meta.invoice_no||`${type==="sales"?"SALES":"PUR"}-${Date.now()}`,
      invoice_date:meta.invoice_date,
      invoice_type:type==="sales"?"SALES":"PURCHASE",
      is_igst:isIgst,
      place_of_supply:meta.place_of_supply,
      items:items.map(it=>({name:it.name,hsn_sac:it.hsn_sac,qty:parseFloat(it.qty)||0,unit:it.unit,rate:parseFloat(it.rate)||0,gst_rate:parseFloat(it.gst_rate)||0})),
      total_amount:Math.round(totals.total*100)/100,
      taxable_amount:Math.round(totals.taxable*100)/100,
      total_tax:Math.round(totals.tax*100)/100,
    };
    try{
      if(editingId)await api(`/accounting/companies/${cid}/invoices/${editingId}`,"PUT",payload,token);
      else await api(`/accounting/companies/${cid}/invoices`,"POST",payload,token);
      toast(editingId?"✅ Invoice updated & voucher re-posted!":"✅ Invoice saved & voucher posted!","success");
      onSaved&&onSaved();
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };

  const partyOptions=parties.filter(p=>type==="sales"?/debtor|customer/i.test(p.group_name||""):/creditor|supplier/i.test(p.group_name||""));
  const selectedParty=parties.find(p=>p.id===meta.party_id);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  return(<div>
    <div style={S.card}>
      <div style={S.col2}>
        <div style={S.fg}>
          <label style={S.label}>{type==="sales"?"Customer":"Supplier"} {!newSupplierMode&&"*"}</label>
          {!newSupplierMode?(<>
            <select style={S.select} value={meta.party_id} onChange={e=>setM("party_id",e.target.value)}>
              <option value="">— Select —</option>
              {partyOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {selectedParty&&<div style={{fontSize:11,color:"#e3b341",marginTop:4}}>BAL: {fR(selectedParty.current_balance)} {selectedParty.current_type}</div>}
            <button onClick={()=>setNewSupplierMode(true)} style={{...S.btnO,fontSize:10,marginTop:6,padding:"4px 10px"}}>+ New {type==="sales"?"Customer":"Supplier"}</button>
          </>):(<>
            <input style={S.input} value={meta.vendor_name} onChange={e=>setM("vendor_name",e.target.value)} placeholder="Party name"/>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <button onClick={createSupplier} disabled={creatingSupplier} style={{...S.btnG,fontSize:11,padding:"5px 12px"}}>{creatingSupplier?"Creating...":"✅ Create Ledger"}</button>
              {partyOptions.length>0&&<button onClick={()=>setNewSupplierMode(false)} style={{...S.btnO,fontSize:11,padding:"5px 12px"}}>Select Existing</button>}
            </div>
          </>)}
        </div>
        <div style={S.fg}><label style={S.label}>{type==="sales"?"Customer":"Vendor"} GSTIN</label><input style={S.input} value={meta.vendor_gstin} onChange={e=>setM("vendor_gstin",e.target.value.toUpperCase())}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>{type==="sales"?"Invoice":"Bill"} Number</label><input style={S.input} value={meta.invoice_no} onChange={e=>setM("invoice_no",e.target.value)}/></div>
        <div style={S.fg}><label style={S.label}>{type==="sales"?"Invoice":"Bill"} Date</label><input type="date" style={S.input} value={meta.invoice_date} onChange={e=>setM("invoice_date",e.target.value)}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>State of Supply</label><input style={S.input} value={meta.place_of_supply} onChange={e=>setM("place_of_supply",e.target.value)} placeholder="e.g. Uttar Pradesh"/>
        {company?.state&&meta.place_of_supply&&meta.place_of_supply!==company.state&&<div style={{fontSize:11,color:"#e3b341",marginTop:4}}>⚠ Different from company state ({company.state}) → IGST will apply</div>}
      </div>
    </div>

    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Items</div>
      <div className="tp-table-wrap">
      <table style={S.tbl}>
        <thead><tr>{["#","Item","HSN/SAC","Qty","Unit","Price/Unit","Tax %","Tax Amt","Amount",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{items.map((it,i)=>{const c=calcLine(it);return(
          <tr key={i}>
            <td style={S.td}>{i+1}</td>
            <td style={S.td}><input style={{...S.input,fontSize:12,minWidth:140}} value={it.name} onChange={e=>setItemField(i,"name",e.target.value)}/></td>
            <td style={S.td}><input style={{...S.input,width:80,fontSize:12}} value={it.hsn_sac} onChange={e=>setItemField(i,"hsn_sac",e.target.value)} placeholder="HSN"/></td>
            <td style={S.td}><input type="number" style={{...S.input,width:65,fontSize:12}} value={it.qty} onChange={e=>setItemField(i,"qty",e.target.value)}/></td>
            <td style={S.td}><input style={{...S.input,width:65,fontSize:12}} value={it.unit} onChange={e=>setItemField(i,"unit",e.target.value)}/></td>
            <td style={S.td}><input type="number" style={{...S.input,width:85,fontSize:12}} value={it.rate} onChange={e=>setItemField(i,"rate",e.target.value)}/></td>
            <td style={S.td}><select style={{...S.select,width:65,fontSize:12}} value={it.gst_rate} onChange={e=>setItemField(i,"gst_rate",e.target.value)}>{[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
            <td style={S.td}>{fR(c.tax)}</td>
            <td style={{...S.td,fontWeight:600}}>{fR(c.total)}</td>
            <td style={S.tdR}><button onClick={()=>removeItemRow(i)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:15}}>✕</button></td>
          </tr>
        );})}</tbody>
      </table>
      </div>
      <button onClick={addItemRow} style={{...S.btnO,fontSize:11,marginTop:10}}>+ Add Row</button>
    </div>

    <div style={{...S.card,background:"#0c1d2e"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>Taxable Amount</span><span>{fR(totals.taxable)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>Total Tax (CGST+SGST/IGST)</span><span>{fR(totals.tax)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6}}><span>Total</span><span style={{color:"#3fb950"}}>{fR(totals.total)}</span></div>
    </div>

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
      {onCancel&&<button onClick={onCancel} style={S.btnO}>← Back</button>}
      <button onClick={save} disabled={saving} style={{...S.btnG,padding:"10px 24px"}}>{saving?"Saving...":editingId?"💾 Update":"💾 Save"}</button>
    </div>
  </div>);
}

function AIInvoiceScanner({token,toast,company,setView}){
  const[file,setFile]=useState(null);const[preview,setPreview]=useState(null);
  const[step,setStep]=useState("upload"); // upload | uploading | review | form | done
  const[ext,setExt]=useState(null); // raw extracted data
  const[items,setItems]=useState([]); // editable items [{name,qty,unit,rate,gst_rate}]
  const[meta,setMeta]=useState(null); // {type,vendor_name,vendor_gstin,invoice_no,invoice_date,place_of_supply,party_id}
  const[parties,setParties]=useState([]);
  const cid=company?.id;

  const loadParties=useCallback(()=>{
    if(!cid)return;
    api(`/accounting/companies/${cid}/parties`,"GET",null,token).then(d=>setParties(d.parties||[])).catch(()=>{});
  },[cid,token]);
  useEffect(()=>{loadParties();},[loadParties]);

  const onFile=e=>{
    const f=e.target.files[0];setFile(f);
    if(f){const r=new FileReader();r.onload=ev=>setPreview(ev.target.result);r.readAsDataURL(f);}
  };

  const reset=()=>{setFile(null);setPreview(null);setExt(null);setItems([]);setMeta(null);setStep("upload");};

  const scan=async()=>{
    if(!file)return toast("Select an invoice image","error");
    setStep("uploading");
    try{
      const fd=new FormData();fd.append("file",file);fd.append("company_id",cid);
      const res=await fetch(`${API}/ai/scan-invoice`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){
        const data=d.data;
        setExt(data);
        setItems((data.items||[]).map(it=>({
          name:it.name||"Item",qty:String(it.qty||1),unit:it.unit||"PCS",rate:String(it.rate||0),gst_rate:String(it.gst_rate??18),
        })));
        setStep("review");
      }else{toast(d.message||"Scan failed","error");setStep("upload");}
    }catch(e){toast("Scan failed: "+e.message,"error");setStep("upload");}
  };

  // ── REVIEW STEP helpers ──
  const setItemField=(i,k,v)=>{const n=[...items];n[i]={...n[i],[k]:v};setItems(n);};
  const addItemRow=()=>setItems(p=>[...p,{name:"",qty:"1",unit:"PCS",rate:"0",gst_rate:"18"}]);
  const removeItemRow=i=>setItems(p=>p.filter((_,j)=>j!==i));

  const confirmReview=()=>{
    if(items.length===0||items.every(it=>!it.name))return toast("Add at least one item","error");
    // Try to auto-match a party ledger by vendor name
    const vName=(ext?.vendor_name||"").toLowerCase().trim();
    const matched=parties.find(p=>p.name.toLowerCase().trim()===vName)||parties.find(p=>vName&&p.name.toLowerCase().includes(vName.split(" ")[0]));
    setMeta({
      type:ext?.type==="sales"?"sales":"purchase",
      vendor_name:ext?.vendor_name||"",
      vendor_gstin:ext?.vendor_gstin||"",
      invoice_no:ext?.invoice_no||"",
      invoice_date:ext?.invoice_date||today(),
      place_of_supply:ext?.place_of_supply||company?.state||"",
      party_id:matched?.id||"",
    });
    setStep("form");
  };

  if(!cid)return null;

  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:6}}>🤖 AI Purchase/Sales Bill Scanner</div>
      <div style={{fontSize:12,color:C.sub}}>Upload an invoice photo → AI reads all items, quantities, rates & GST → review & edit → post as Purchase/Sales voucher automatically.</div>
    </div>

    {/* STEP 1: UPLOAD */}
    {step==="upload"&&(
      <div style={S.card}>
        <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:24,textAlign:"center",marginBottom:14,minHeight:180,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {preview?<img src={preview} alt="" style={{maxWidth:"100%",maxHeight:260,borderRadius:8}}/>:
          <label style={{...S.btnO,cursor:"pointer"}}>📤 Choose Invoice Image<input type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/></label>}
        </div>
        {preview&&<div style={{textAlign:"center",marginBottom:10}}><button onClick={()=>{setFile(null);setPreview(null);}} style={{...S.btnO,fontSize:11}}>Remove</button></div>}
        <button onClick={scan} disabled={!file} style={{...S.btn,width:"100%",padding:12,opacity:!file?0.5:1}}>🔍 Upload &amp; Scan with AI →</button>
      </div>
    )}

    {/* STEP 2: UPLOADING */}
    {step==="uploading"&&(
      <div style={{...S.card,textAlign:"center",padding:50}}>
        <div style={{fontSize:40,marginBottom:14}}>📄</div>
        <div style={{fontWeight:700,color:C.text,marginBottom:14}}>Uploading &amp; Reading Invoice...</div>
        <div style={{height:6,borderRadius:4,background:C.border,overflow:"hidden",maxWidth:300,margin:"0 auto"}}>
          <div style={{height:"100%",width:"60%",background:"linear-gradient(90deg,#1F6FEB,#bf91f3)",animation:"tpscan 1.2s ease-in-out infinite"}}/>
        </div>
        <style>{`@keyframes tpscan{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}</style>
        <div style={{fontSize:11,color:C.muted,marginTop:10}}>Please do not close — AI is extracting items, amounts &amp; GST</div>
      </div>
    )}

    {/* STEP 3: REVIEW COLUMNS */}
    {step==="review"&&(
      <div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Review Extracted Items</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:12}}>Check &amp; edit item details extracted from the invoice. You can add/remove rows.</div>
          <div className="tp-table-wrap">
          <table style={S.tbl}>
            <thead><tr>{["Item Name","Qty","Unit","Price/Unit","Tax Rate %",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{items.map((it,i)=>(
              <tr key={i}>
                <td style={S.td}><input style={{...S.input,fontSize:12}} value={it.name} onChange={e=>setItemField(i,"name",e.target.value)}/></td>
                <td style={S.td}><input type="number" style={{...S.input,width:70,fontSize:12}} value={it.qty} onChange={e=>setItemField(i,"qty",e.target.value)}/></td>
                <td style={S.td}><input style={{...S.input,width:70,fontSize:12}} value={it.unit} onChange={e=>setItemField(i,"unit",e.target.value)}/></td>
                <td style={S.td}><input type="number" style={{...S.input,width:90,fontSize:12}} value={it.rate} onChange={e=>setItemField(i,"rate",e.target.value)}/></td>
                <td style={S.td}><select style={{...S.select,width:70,fontSize:12}} value={it.gst_rate} onChange={e=>setItemField(i,"gst_rate",e.target.value)}>{[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
                <td style={S.tdR}><button onClick={()=>removeItemRow(i)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:15}}>✕</button></td>
              </tr>
            ))}</tbody>
          </table>
          </div>
          <button onClick={addItemRow} style={{...S.btnO,fontSize:11,marginTop:10}}>+ Add Row</button>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
          <button onClick={reset} style={S.btnO}>Cancel</button>
          <button onClick={confirmReview} style={S.btn}>Confirm →</button>
        </div>
      </div>
    )}

    {/* STEP 4: FULL EDITABLE FORM (shared InvoiceEditor) */}
    {step==="form"&&meta&&(
      <InvoiceEditor token={token} toast={toast} company={company} type={meta.type==="sales"?"sales":"purchase"}
        initialData={{party_id:meta.party_id,vendor_name:meta.vendor_name,vendor_gstin:meta.vendor_gstin,invoice_no:meta.invoice_no,invoice_date:meta.invoice_date,place_of_supply:meta.place_of_supply,items}}
        onCancel={()=>setStep("review")}
        onSaved={()=>setStep("done")}
      />
    )}

    {/* STEP 5: DONE */}
    {step==="done"&&(
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:56,marginBottom:12}}>🎉</div>
        <div style={{fontSize:18,fontWeight:700,color:"#3fb950",marginBottom:16}}>Bill Saved &amp; Voucher Posted!</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={reset} style={S.btn}>Scan Another</button>
          <button onClick={()=>setView(meta?.type==="sales"?"sales":"purchases")} style={S.btnG}>View {meta?.type==="sales"?"Sales":"Purchase"} Register →</button>
        </div>
      </div>
    )}
  </div>);
}

// ── AI BILL GENERATOR — natural language → editable invoice ────────────────
function AIBillGenerator({token,toast,company,setView}){
  const[type,setType]=useState("sales"); // sales | purchase
  const[prompt,setPrompt]=useState("");
  const[step,setStep]=useState("input"); // input | generating | form | done
  const[meta,setMeta]=useState(null);
  const[items,setItems]=useState([]);
  const cid=company?.id;

  const examples=type==="sales"?[
    "Rahul Traders ko ₹50,000 ka maal becha, 18% GST (CGST 4500 + SGST 4500), aaj ki date",
    "Sharma Enterprises ko pichle mahine jaisa bill bana do — same party, product aur amount",
    "Gupta Sons ko ₹25,000 taxable, IGST 5%, namkeen ka sale",
  ]:[
    "Bala Ji Agency se ₹46,800 ka namkeen khareeda, CGST 1170 + SGST 1170",
    "ABC Suppliers se pichli baar jaisa purchase bill bana do",
  ];

  const generate=async()=>{
    if(!prompt.trim())return toast("Likho kya invoice banana hai","error");
    setStep("generating");
    try{
      const d=await api(`/accounting/companies/${cid}/ai/generate-invoice`,"POST",{prompt,type},token);
      if(d.success){
        const data=d.data;
        setMeta({
          party_id:data.party_id||"",
          vendor_name:data.matched_party_name||data.party_name||"",
          vendor_gstin:"",
          invoice_no:data.invoice_no||"",
          invoice_date:data.invoice_date||today(),
          place_of_supply:data.place_of_supply||company?.state||"",
        });
        setItems((data.items||[]).map(it=>({name:it.name,qty:String(it.qty),unit:it.unit||"PCS",rate:String(it.rate),gst_rate:String(it.gst_rate)})));
        if(!data.party_id)toast(`"${data.party_name}" — naya party lagta hai, neeche create kar lo`,"success");
        setStep("form");
      }else{toast(d.message||"Generate failed","error");setStep("input");}
    }catch(e){toast(e.message,"error");setStep("input");}
  };

  const reset=()=>{setPrompt("");setMeta(null);setItems([]);setStep("input");};

  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:6}}>🪄 AI Bill Generator — bolo aur bill ban jayega</div>
      <div style={{fontSize:12,color:C.sub}}>Hindi/English mein likho: party ka naam, product, amount, taxable value, CGST/SGST/IGST. Ya "pichle mahine jaisa" bolke purana bill repeat karo — date AI khud aaj ki kar dega. Review/edit karo, fir save → voucher auto-post hoga.</div>
    </div>

    {step==="input"&&(
      <div style={S.card}>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {["sales","purchase"].map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{padding:"6px 16px",borderRadius:7,border:`1px solid ${type===t?"#1F6FEB":C.border}`,background:type===t?"#0c1d2e":"transparent",color:type===t?"#58a6ff":C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:type===t?600:400}}>{t==="sales"?"📤 Sales Invoice":"📥 Purchase Bill"}</button>
          ))}
        </div>
        <div style={S.fg}>
          <label style={S.label}>Apna instruction likho</label>
          <textarea style={{...S.input,minHeight:100,resize:"vertical"}} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={examples[0]}/>
        </div>
        <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Examples (click to use):</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
          {examples.map((ex,i)=>(
            <button key={i} onClick={()=>setPrompt(ex)} style={{textAlign:"left",padding:"8px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>💬 {ex}</button>
          ))}
        </div>
        <button onClick={generate} disabled={!prompt.trim()} style={{...S.btn,width:"100%",padding:12,opacity:!prompt.trim()?0.5:1}}>✨ Generate Invoice</button>
      </div>
    )}

    {step==="generating"&&(
      <div style={{...S.card,textAlign:"center",padding:50}}>
        <div style={{fontSize:40,marginBottom:14}}>🪄</div>
        <div style={{fontWeight:700,color:C.text,marginBottom:14}}>AI is generating your invoice...</div>
        <div style={{height:6,borderRadius:4,background:C.border,overflow:"hidden",maxWidth:300,margin:"0 auto"}}>
          <div style={{height:"100%",width:"60%",background:"linear-gradient(90deg,#1F6FEB,#bf91f3)",animation:"tpscan 1.2s ease-in-out infinite"}}/>
        </div>
        <style>{`@keyframes tpscan{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}</style>
      </div>
    )}

    {step==="form"&&meta&&(
      <InvoiceEditor token={token} toast={toast} company={company} type={type}
        initialData={{...meta,items}}
        onCancel={reset}
        onSaved={()=>setStep("done")}
      />
    )}

    {step==="done"&&(
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:56,marginBottom:12}}>🎉</div>
        <div style={{fontSize:18,fontWeight:700,color:"#3fb950",marginBottom:16}}>Invoice Generated &amp; Voucher Posted!</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={reset} style={S.btn}>Generate Another</button>
          <button onClick={()=>setView(type==="sales"?"sales":"purchases")} style={S.btnG}>View {type==="sales"?"Sales":"Purchase"} Register →</button>
        </div>
      </div>
    )}
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
  {key:"gstr1",    icon:"📤",label:"GSTR-1 (Outward)",  group:"GST SUITE"},
  {key:"gstr3b",   icon:"📑",label:"GSTR-3B (Summary)", group:"GST SUITE"},
  {key:"gstr2recon",icon:"🔄",label:"GSTR-2A/2B Recon", group:"GST SUITE"},
  {key:"cmp08",    icon:"📋",label:"CMP-08 (Quarterly)",group:"GST SUITE"},
  {key:"gstr4",    icon:"📄",label:"GSTR-4 (Annual Comp.)",group:"GST SUITE"},
  {key:"gstr9",    icon:"📊",label:"GSTR-9 (Annual Reg.)",group:"GST SUITE"},
  {key:"gstr9c",   icon:"📑",label:"GSTR-9C (Reconciliation)",group:"GST SUITE"},
  {key:"gstr10",   icon:"🔚",label:"GSTR-10 (Final Return)",group:"GST SUITE"},
  {key:"legal-library",icon:"📚",label:"Legal Library",   group:"GST SUITE"},
  {key:"notice-reply",icon:"🤖",label:"AI Notice Reply",  group:"GST SUITE"},
  {key:"reconcile",icon:"⇄",label:"GST Reconciliation",group:"GST SUITE"},
  {key:"gstr2a",   icon:"📥",label:"GSTR-2A Import",  group:"GST SUITE"},
  {key:"einvoice", icon:"🔖",label:"E-Invoice",       group:"GST SUITE"},
  {key:"ewaybill", icon:"🚛",label:"E-Way Bill",      group:"GST SUITE"},
  {key:"hsn",      icon:"🏷",label:"HSN/SAC Codes",   group:"GST SUITE"},
  {key:"ai-invoice",icon:"🤖",label:"AI Invoice Scanner",group:"AI TOOLS"},
  {key:"ai-bill",icon:"🪄",label:"AI Bill Generator",group:"AI TOOLS"},
  {key:"ai-assist",icon:"✦",label:"AI Assistant",     group:"AI TOOLS"},
  {key:"it-clients",  icon:"👤",label:"IT Clients",        group:"INCOME TAX"},
  {key:"it-returns",  icon:"📝",label:"ITR Computation",   group:"INCOME TAX"},
  {key:"26as",        icon:"📊",label:"26AS/AIS Import",   group:"INCOME TAX"},
  {key:"form16",      icon:"📄",label:"Form 16 / 16A",     group:"INCOME TAX"},
  {key:"challan280",  icon:"🧾",label:"Challan 280",       group:"INCOME TAX"},
  {key:"tax-planning",icon:"🤖",label:"AI Tax Planning",   group:"INCOME TAX"},
  {key:"advance-tax", icon:"🧮",label:"Advance Tax",       group:"INCOME TAX"},
  {key:"tds",         icon:"📌",label:"TDS Module",        group:"INCOME TAX"},
  {key:"it-portal",   icon:"🔗",label:"IT Portal Links",   group:"INCOME TAX"},
  {key:"compliance",icon:"📅",label:"Compliance Calendar",group:"PRACTICE"},
  {key:"documents", icon:"📁",label:"Document Manager",group:"PRACTICE"},
  {key:"payroll",   icon:"💰",label:"Payroll",        group:"PRACTICE"},
  {key:"employees", icon:"👥",label:"Employees",      group:"PRACTICE"},
  {key:"backup",   icon:"💾",label:"Backup",          group:"SETTINGS"},
  {key:"security", icon:"🔐",label:"Security & Sessions",group:"SETTINGS"},
  {key:"settings", icon:"⚙",label:"Settings",         group:"SETTINGS"},
  {key:"admin",    icon:"👑",label:"Admin Panel",      group:"ADMIN"},
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
  const[isAdmin,setIsAdmin]=useState(false);
  const isMobile=useIsMobile();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4000);};
  const logout=()=>{api("/auth/logout","POST",null,token).catch(()=>{});localStorage.clear();setUser(null);setToken("");};
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

  // check admin status once logged in
  useEffect(()=>{
    if(token)api("/admin/me","GET",null,token).then(d=>setIsAdmin(!!d.is_admin)).catch(()=>{});
  },[token]);

  // heartbeat — lets Admin Panel show accurate "last active" status
  useEffect(()=>{
    if(!token)return;
    const ping=()=>api("/auth/heartbeat","POST",null,token).catch(()=>{});
    ping();
    const id=setInterval(ping,5*60*1000); // every 5 min
    return()=>clearInterval(id);
  },[token]);

  if(!user||!token)return<AuthScreen onAuth={onAuth}/>;

  const GROUPS=["MAIN","MASTERS","TRANSACTIONS","REPORTS","GST SUITE","AI TOOLS","INCOME TAX","PRACTICE","SETTINGS",...(isAdmin?["ADMIN"]:[])];
  const needsCompany=!["dashboard","settings","backup","security","admin","legal-library"].includes(view);

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
              {NAV.filter(n=>n.group===g&&(n.key!=="admin"||isAdmin)).map(n=>(
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
            {view==="gstr1"      &&<GSTR1 token={token} toast={showToast} company={company}/>}
          {view==="gstr2recon" &&<GSTR2Reconciliation token={token} toast={showToast} company={company}/>}
          {view==="gstr10"     &&<GSTR10 token={token} toast={showToast} company={company}/>}
          {view==="cmp08"      &&<CMP08 token={token} toast={showToast} company={company}/>}
          {view==="gstr4"      &&<GSTR4 token={token} toast={showToast} company={company}/>}
          {view==="gstr9"      &&<GSTR9 token={token} toast={showToast} company={company}/>}
          {view==="gstr9c"     &&<GSTR9C token={token} toast={showToast} company={company}/>}
          {view==="legal-library"&&<LegalLibrary token={token} toast={showToast} isAdmin={isAdmin}/>}
          {view==="notice-reply" &&<NoticeReplyGenerator token={token} toast={showToast} company={company}/>}
            {view==="gstr3b"     &&<GSTR3B token={token} toast={showToast} company={company}/>}
            {view==="ai-invoice" &&<AIInvoiceScanner token={token} toast={showToast} company={company} setView={setView}/>}
            {view==="ai-bill"    &&<AIBillGenerator token={token} toast={showToast} company={company} setView={setView}/>}
            {view==="hsn"        &&<HSNManager token={token} toast={showToast} isAdmin={isAdmin}/>}
            {view==="einvoice"   &&<EInvoice token={token} toast={showToast} company={company}/>}
            {view==="ewaybill"   &&<EWayBill token={token} toast={showToast} company={company}/>}
            {view==="reconcile"  &&<GSTReconciliation token={token} toast={showToast} company={company}/>}
            {view==="gstr2a"     &&<GSTR2AImport token={token} toast={showToast} company={company}/>}
            {view==="ai-assist"  &&<AIAssistant token={token} toast={showToast} company={company}/>}
          </>)}
          {view==="it-clients"  &&<ITClients token={token} toast={showToast} companyId={company?.id}/>}
          {view==="it-returns"  &&<ITReturns token={token} toast={showToast} companyId={company?.id}/>}
          {view==="26as"        &&<AIS26AS token={token} toast={showToast}/>}
          {view==="form16"      &&<Form16Generator token={token} toast={showToast}/>}
          {view==="challan280"  &&<Challan280 token={token} toast={showToast}/>}
          {view==="tax-planning"&&<TaxPlanning token={token} toast={showToast}/>}
          {view==="advance-tax" &&<AdvanceTaxCalc token={token} toast={showToast}/>}
          {view==="security"    &&<SecuritySettings token={token} toast={showToast} user={user}/>}
          {view==="admin"       &&(isAdmin?<AdminPanel token={token} toast={showToast}/>:<AdminClaim token={token} toast={showToast} onDone={()=>setIsAdmin(true)}/>)}
          {view==="tds"         &&<TDSModule token={token} toast={showToast} companyId={company?.id}/>}
          {view==="it-portal"   &&<ITPortal token={token} toast={showToast}/>}
          {view==="compliance"  &&<ComplianceCalendar token={token} toast={showToast} companyId={company?.id}/>}
          {view==="documents"   &&<DocumentManager token={token} toast={showToast} companyId={company?.id}/>}
          {view==="payroll"     &&<Payroll token={token} toast={showToast} companyId={company?.id}/>}
          {view==="employees"   &&<Employees token={token} toast={showToast} companyId={company?.id}/>}
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
function HSNManager({token,toast,isAdmin}){
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
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>🏷 HSN/SAC Code Library {!isAdmin&&badge("Read-only","gray")}</div>
      <div style={{fontSize:12,color:C.sub}}>{isAdmin?"Upload Excel/CSV with columns: HSN Code, Description, GST Rate, Unit. This is shared — every client uses the same library.":"This master library is maintained by your administrator and shared across all clients. Used for autocomplete in invoicing."}</div>
    </div>
    {isAdmin?(
      <div style={S.card}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <label style={{...S.btnO,cursor:"pointer"}}>{file?file.name:"Choose Excel/CSV"}<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label>
          <button onClick={upload} disabled={!file||uploading} style={{...S.btnG,opacity:!file||uploading?0.5:1}}>{uploading?"Uploading...":"Upload & Import"}</button>
        </div>
        <div style={{fontSize:11,color:"#e3b341",marginTop:8}}>⚠ This updates the library for ALL clients on the platform.</div>
      </div>
    ):(
      <div style={{...S.card,background:"#0c1922",padding:"10px 14px"}}>
        <span style={{fontSize:12,color:C.muted}}>🔒 Only your administrator can upload or modify this library.</span>
      </div>
    )}
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

// ════════════════════════════════════════════════════════
// SPECTRUM CLOUD MODULES
// ════════════════════════════════════════════════════════

// ── IT CLIENT MANAGER ────────────────────────────────────────────────────────
function ITClients({token,toast,companyId}){
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(null);const[search,setSearch]=useState("");
  const[f,setF]=useState({name:"",pan:"",aadhaar:"",dob:"",email:"",phone:"",address:"",client_type:"Individual",gstin:"",tan:"",din:""});
  const TYPES=["Individual","HUF","Firm","Company","LLP","Trust","AOP","BOI"];
  const load=useCallback(()=>{
    setLoading(true);
    api(`/it/clients${companyId?`?company_id=${companyId}`:""}${search?`${companyId?"&":"?"}search=${encodeURIComponent(search)}`:""}`, "GET",null,token)
      .then(d=>{setClients(d.clients||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId,search]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{
    if(!f.name)return toast("Name required","error");
    try{
      if(modal==="edit")await api(`/it/clients/${modal.id}`,"PUT",{...f,company_id:companyId||null},token);
      else await api("/it/clients","POST",{...f,company_id:companyId||null},token);
      toast("✅ Saved","success");setModal(null);load();
    }catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete client?"))return;try{await api(`/it/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name or PAN..." style={{...S.input,width:240}}/>
      <button onClick={()=>{setF({name:"",pan:"",aadhaar:"",dob:"",email:"",phone:"",address:"",client_type:"Individual",gstin:"",tan:"",din:""});setModal("new");}} style={{...S.btn,marginLeft:"auto"}}>+ New Client</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {clients.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No IT clients yet</div>:(
          <table style={S.tbl}><thead><tr>{["Name","PAN","Type","Phone","Email","Returns","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{clients.map(c=>(
            <tr key={c.id}>
              <td style={{...S.td,fontWeight:600,color:C.text}}>{c.name}</td>
              <td style={{...S.td,...S.mono}}>{c.pan||"—"}</td>
              <td style={S.td}>{badge(c.client_type,"gray")}</td>
              <td style={S.td}>{c.phone||"—"}</td>
              <td style={S.td}>{c.email||"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{c.return_count||0}</td>
              <td style={S.tdR}><ActionMenu items={[{label:"✏️ Edit",onClick:()=>{setF({...c});setModal({id:c.id});}},,{label:"🗑 Delete",danger:true,onClick:()=>del(c.id)}]}/></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&<Modal title={typeof modal==="object"?"Edit Client":"New IT Client"} onClose={()=>setModal(null)} wide>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Client Type</label><select style={S.select} value={f.client_type} onChange={e=>setF(p=>({...p,client_type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={f.pan} onChange={e=>setF(p=>({...p,pan:e.target.value.toUpperCase()}))} maxLength={10} placeholder="AAAAA0000A"/></div>
        <div style={S.fg}><label style={S.label}>Aadhaar</label><input style={S.input} value={f.aadhaar} onChange={e=>setF(p=>({...p,aadhaar:e.target.value}))} maxLength={12}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Date of Birth/Incorporation</label><input type="date" style={S.input} value={f.dob} onChange={e=>setF(p=>({...p,dob:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} value={f.gstin} onChange={e=>setF(p=>({...p,gstin:e.target.value.toUpperCase()}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>TAN</label><input style={S.input} value={f.tan} onChange={e=>setF(p=>({...p,tan:e.target.value.toUpperCase()}))} maxLength={10}/></div>
        <div style={S.fg}><label style={S.label}>DIN (for directors)</label><input style={S.input} value={f.din} onChange={e=>setF(p=>({...p,din:e.target.value}))}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,minHeight:50}} value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>}
  </div>);
}

// ── ITR FILING ───────────────────────────────────────────────────────────────
function ITReturns({token,toast,companyId}){
  const[returns,setReturns]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(null);
  const[f,setF]=useState({client_id:"",ay:"2026-27",itr_type:"ITR-1",salary_income:"0",hp_income:"0",business_income:"0",capital_gains:"0",other_income:"0",exempt_income:"0",deduction_80c:"0",deduction_80d:"0",other_deductions:"0",tds_deducted:"0",advance_tax:"0",notes:""});
  const[computed,setComputed]=useState(null);
  const AYS=["2026-27","2025-26","2024-25","2023-24","2022-23"];
  const ITR_TYPES=["ITR-1","ITR-2","ITR-3","ITR-4","ITR-5","ITR-6","ITR-7"];
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      api(`/it/returns${companyId?`?company_id=${companyId}`:""}`, "GET",null,token),
      api(`/it/clients${companyId?`?company_id=${companyId}`:""}`, "GET",null,token),
    ]).then(([r,c])=>{setReturns(r.returns||[]);setClients(c.clients||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId]);

  const compute=()=>{
    const income=(parseFloat(f.salary_income)||0)+(parseFloat(f.hp_income)||0)+(parseFloat(f.business_income)||0)+(parseFloat(f.capital_gains)||0)+(parseFloat(f.other_income)||0);
    const ded=(parseFloat(f.deduction_80c)||0)+(parseFloat(f.deduction_80d)||0)+(parseFloat(f.other_deductions)||0);
    const net=Math.max(0,income-ded);
    let tax=0;
    if(net>1500000)tax=125000+(net-1500000)*0.3;
    else if(net>1000000)tax=75000+(net-1000000)*0.2;
    else if(net>500000)tax=12500+(net-500000)*0.2;
    else if(net>250000)tax=(net-250000)*0.05;
    const cess=Math.round(tax*0.04*100)/100;const totalTax=Math.round((tax+cess)*100)/100;
    const tds=parseFloat(f.tds_deducted)||0;const adv=parseFloat(f.advance_tax)||0;
    const bal=Math.max(0,totalTax-tds-adv);const ref=Math.max(0,tds+adv-totalTax);
    setComputed({total_income:net,gross_tax:tax,cess,total_tax:totalTax,tds,advance_tax:adv,balance_due:bal,refund_due:ref});
  };

  const save=async()=>{
    try{const d=await api("/it/returns","POST",{...f,company_id:companyId||null},token);setComputed(d.computed);toast("✅ ITR saved","success");setModal(null);setReturns(p=>[...p]);window.location.reload();}
    catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/it/returns/${id}`,"DELETE",null,token);toast("Deleted","success");setReturns(p=>p.filter(r=>r.id!==id));}catch(e){toast(e.message,"error");}};
  const updateStatus=async(id,status)=>{try{await api(`/it/returns/${id}`,"PUT",{status},token);setReturns(p=>p.map(r=>r.id===id?{...r,status}:r));}catch(e){toast(e.message,"error");}};

  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Total Returns",v:returns.length,c:"#58a6ff"},{l:"Filed",v:returns.filter(r=>r.status==="filed").length,c:"#3fb950"},{l:"Draft",v:returns.filter(r=>r.status==="draft").length,c:"#e3b341"},{l:"Refund Due",v:fR(returns.reduce((a,r)=>a+parseFloat(r.refund_due||0),0)),c:"#bf91f3"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:k.l.includes("₹")?12:18}}>{k.v}</div></div>
      ))}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <select style={{...S.select,width:160}} onChange={e=>{}}>
        {AYS.map(ay=><option key={ay}>{ay}</option>)}
      </select>
      <button onClick={()=>{setF({client_id:"",ay:"2026-27",itr_type:"ITR-1",salary_income:"0",hp_income:"0",business_income:"0",capital_gains:"0",other_income:"0",exempt_income:"0",deduction_80c:"0",deduction_80d:"0",other_deductions:"0",tds_deducted:"0",advance_tax:"0",notes:""});setComputed(null);setModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ New ITR</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {returns.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No ITR records yet</div>:(
          <table style={S.tbl}><thead><tr>{["Client","PAN","AY","ITR Type","Total Income","Tax","TDS","Balance/Refund","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{returns.map(r=>(
            <tr key={r.id}>
              <td style={{...S.td,fontWeight:600}}>{r.client_name||"—"}</td>
              <td style={{...S.td,...S.mono}}>{r.pan||"—"}</td>
              <td style={S.td}>{r.ay}</td>
              <td style={S.td}>{badge(r.itr_type,"blue")}</td>
              <td style={S.td}>{fR(r.total_income)}</td>
              <td style={S.td}>{fR(r.tax_liability)}</td>
              <td style={S.td}>{fR(r.tds_deducted)}</td>
              <td style={S.td}>{r.refund_due>0?<span style={{color:"#3fb950"}}>Refund: {fR(r.refund_due)}</span>:r.tax_liability-r.tds_deducted-r.advance_tax>0?<span style={{color:"#f85149"}}>Due: {fR(r.tax_liability-r.tds_deducted-r.advance_tax)}</span>:<span style={{color:"#3fb950"}}>Nil</span>}</td>
              <td style={S.td}>{badge(r.status,r.status==="filed"?"green":r.status==="draft"?"amber":"gray")}</td>
              <td style={S.tdR}><ActionMenu items={[{label:"✅ Mark Filed",onClick:()=>updateStatus(r.id,"filed")},{label:"🗑 Delete",danger:true,onClick:()=>del(r.id)}]}/></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&<Modal title="New ITR" onClose={()=>setModal(null)} wide>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Client</label><select style={S.select} value={f.client_id} onChange={e=>setF(p=>({...p,client_id:e.target.value}))}><option value="">— Select —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.pan||"No PAN"})</option>)}</select></div>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>AY</label><select style={S.select} value={f.ay} onChange={e=>setF(p=>({...p,ay:e.target.value}))}>{AYS.map(a=><option key={a}>{a}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>ITR Type</label><select style={S.select} value={f.itr_type} onChange={e=>setF(p=>({...p,itr_type:e.target.value}))}>{ITR_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,color:"#58a6ff",marginBottom:8,fontSize:12}}>Income (₹)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[["Salary/Pension","salary_income"],["House Property","hp_income"],["Business/Prof","business_income"],["Capital Gains","capital_gains"],["Other Sources","other_income"],["Exempt Income","exempt_income"]].map(([l,k])=>(
            <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,color:"#3fb950",marginBottom:8,fontSize:12}}>Deductions (₹)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[["80C (max 1.5L)","deduction_80c"],["80D Medical","deduction_80d"],["Other Ded.","other_deductions"],["TDS Deducted","tds_deducted"],["Advance Tax","advance_tax"]].map(([l,k])=>(
            <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
      </div>
      <button onClick={compute} style={{...S.btnO,width:"100%",marginBottom:10}}>🧮 Compute Tax</button>
      {computed&&(<div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:10}}>
        <div style={S.col2}>
          {[["Total Income",computed.total_income],["Gross Tax",computed.gross_tax],["+ Cess (4%)",computed.cess],["Total Tax",computed.total_tax],["- TDS",computed.tds],["- Advance Tax",computed.advance_tax]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted}}>{l}</span><span style={{fontWeight:600}}>{fR(v)}</span></div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14,marginTop:8,color:computed.refund_due>0?"#3fb950":"#f85149"}}>
          <span>{computed.refund_due>0?"REFUND DUE":"BALANCE DUE"}</span>
          <span>{fR(Math.max(computed.refund_due,computed.balance_due))}</span>
        </div>
      </div>)}
      <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,minHeight:40}} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save ITR</button></div>
    </Modal>}
  </div>);
}

// ── ADVANCE TAX CALCULATOR ────────────────────────────────────────────────────
function AdvanceTaxCalc({token,toast}){
  const[f,setF]=useState({estimated_income:"",tds_deducted:"0",fy:"2026-27"});const[result,setResult]=useState(null);const[loading,setLoading]=useState(false);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const calc=async()=>{
    setLoading(true);
    try{const d=await api("/it/advance-tax","POST",f,token);setResult(d);}catch(e){toast(e.message,"error");}
    setLoading(false);
  };
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>🧮 Advance Tax Calculator</div>
      <div style={{fontSize:12,color:C.muted}}>Compute advance tax installments for the financial year based on estimated income and TDS already deducted.</div>
    </div>
    <div style={S.card}>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Estimated Total Income (₹)</label><input type="number" style={S.input} value={f.estimated_income} onChange={e=>setF(p=>({...p,estimated_income:e.target.value}))} placeholder="1200000"/></div>
        <div style={S.fg}><label style={S.label}>TDS Already Deducted (₹)</label><input type="number" style={S.input} value={f.tds_deducted} onChange={e=>setF(p=>({...p,tds_deducted:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Financial Year</label><select style={S.select} value={f.fy} onChange={e=>setF(p=>({...p,fy:e.target.value}))}>{["2026-27","2025-26"].map(y=><option key={y}>{y}</option>)}</select></div>
      </div>
      <button onClick={calc} disabled={!f.estimated_income||loading} style={{...S.btn,opacity:!f.estimated_income?0.5:1}}>{loading?"Calculating...":"🧮 Calculate"}</button>
    </div>
    {result&&(<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14}}>
        {[{l:"Estimated Income",v:fR(result.estimated_income),c:"#58a6ff"},{l:"Total Tax + Cess",v:fR(result.gross_tax),c:"#f85149"},{l:"Less: TDS",v:fR(result.tds),c:"#3fb950"},{l:"Net Advance Tax",v:fR(result.net_advance_tax),c:"#e3b341"}].map(k=>(
          <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:13}}>{k.v}</div></div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:600,marginBottom:10}}>Installment Schedule</div>
        <table style={S.tbl}><thead><tr>{["Installment","Due Date","Cumulative %","Amount Payable"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{result.installments.map((inst,i)=>(
          <tr key={i}><td style={S.td}>{["1st","2nd","3rd","4th"][i]} Installment</td><td style={S.td}>{inst.date}</td><td style={S.td}>{inst.pct}%</td><td style={{...S.tdR,fontWeight:700,color:"#e3b341"}}>{fR(inst.amount)}</td></tr>
        ))}</tbody></table>
        <div style={{...S.card,background:"#2d1b00",marginTop:10,fontSize:11,color:"#e3b341"}}>
          ⚠ Advance tax applicable if total tax liability ≥ ₹10,000. If advance tax is not deposited by due dates, interest u/s 234B & 234C is charged @1% per month.
        </div>
      </div>
    </>)}
  </div>);
}

// ── TDS MODULE ────────────────────────────────────────────────────────────────
function TDSModule({token,toast,companyId}){
  const[entries,setEntries]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[f,setF]=useState({client_id:"",deductee_name:"",deductee_pan:"",deductee_type:"Company",section:"194C",payment_date:today(),payment_amount:"",tds_rate:"1",tds_amount:"",challan_no:"",challan_date:"",quarter:"Q1",fy:"2025-26",form_type:"26Q"});
  const[summary,setSummary]=useState(null);
  const SECTIONS=["192 - Salary","193 - Interest","194A - Interest (Other)","194B - Lottery","194C - Contractors","194D - Insurance","194G - Commission","194H - Brokerage","194I - Rent","194J - Professional Fees","194K - Dividends","194Q - Purchase of Goods","206C - TCS"];
  const QUARTERS=["Q1 (Apr-Jun)","Q2 (Jul-Sep)","Q3 (Oct-Dec)","Q4 (Jan-Mar)"];
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const load=useCallback(()=>{
    setLoading(true);
    Promise.all([
      api(`/tds${companyId?`?company_id=${companyId}`:""}`, "GET",null,token),
      api(`/it/clients${companyId?`?company_id=${companyId}`:""}`, "GET",null,token),
    ]).then(([t,c])=>{
      setEntries(t.entries||[]);setClients(c.clients||[]);
      const totalDed=(t.entries||[]).reduce((a,e)=>a+parseFloat(e.tds_amount||0),0);
      const totalDep=(t.entries||[]).reduce((a,e)=>a+parseFloat(e.tds_deposited||0),0);
      setSummary({total:t.entries?.length,totalDed,totalDep,pending:totalDed-totalDep});
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[token,companyId]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{
    if(!f.deductee_name||!f.payment_amount)return toast("Deductee name and amount required","error");
    try{await api("/tds","POST",{...f,company_id:companyId||null},token);toast("✅ TDS entry added","success");setModal(false);load();}
    catch(e){toast(e.message,"error");}
  };
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/tds/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  return(<div>
    {summary&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Total Entries",v:summary.total,c:"#58a6ff"},{l:"TDS Deducted",v:fR(summary.totalDed),c:"#e3b341"},{l:"TDS Deposited",v:fR(summary.totalDep),c:"#3fb950"},{l:"Pending Deposit",v:fR(summary.pending),c:"#f85149"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:k.l.includes("₹")?12:20}}>{k.v}</div></div>
      ))}
    </div>)}
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <select style={{...S.select,width:80}} onChange={e=>{}}>
        {QUARTERS.map(q=><option key={q}>{q}</option>)}
      </select>
      <button onClick={()=>{setF({...f,payment_date:today()});setModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add TDS Entry</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {entries.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No TDS entries. Start adding deductions.</div>:(
          <table style={S.tbl}><thead><tr>{["Date","Deductee","PAN","Section","Payment","TDS","Deposited","Challan","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{entries.map(e=>(
            <tr key={e.id}>
              <td style={S.td}>{e.payment_date}</td>
              <td style={{...S.td,fontWeight:600}}>{e.deductee_name}</td>
              <td style={{...S.td,...S.mono}}>{e.deductee_pan||"—"}</td>
              <td style={S.td}>{e.section}</td>
              <td style={S.td}>{fR(e.payment_amount)}</td>
              <td style={{...S.td,color:"#e3b341",fontWeight:600}}>{fR(e.tds_amount)}</td>
              <td style={{...S.td,color:"#3fb950"}}>{fR(e.tds_deposited)}</td>
              <td style={S.td}>{e.challan_no||"—"}</td>
              <td style={S.td}>{badge(e.status==="deposited"?"Deposited":"Pending",e.status==="deposited"?"green":"amber")}</td>
              <td style={S.tdR}><button onClick={()=>del(e.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&<Modal title="New TDS Entry" onClose={()=>setModal(false)} wide>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Deductee Name *</label><input style={S.input} value={f.deductee_name} onChange={e=>setF(p=>({...p,deductee_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Deductee PAN</label><input style={S.input} value={f.deductee_pan} onChange={e=>setF(p=>({...p,deductee_pan:e.target.value.toUpperCase()}))} maxLength={10}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Section</label><select style={S.select} value={f.section} onChange={e=>setF(p=>({...p,section:e.target.value.split(" - ")[0]}))}>
          {SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
        </select></div>
        <div style={S.fg}><label style={S.label}>Payment Date</label><input type="date" style={S.input} value={f.payment_date} onChange={e=>setF(p=>({...p,payment_date:e.target.value}))}/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Payment Amount (₹)</label><input type="number" style={S.input} value={f.payment_amount} onChange={e=>{const amt=parseFloat(e.target.value)||0;const tds=Math.round(amt*(parseFloat(f.tds_rate)||0)/100);setF(p=>({...p,payment_amount:e.target.value,tds_amount:String(tds)}));}}/></div>
        <div style={S.fg}><label style={S.label}>TDS Rate (%)</label><input type="number" style={S.input} value={f.tds_rate} onChange={e=>{const rate=parseFloat(e.target.value)||0;const tds=Math.round((parseFloat(f.payment_amount)||0)*rate/100);setF(p=>({...p,tds_rate:e.target.value,tds_amount:String(tds)}));}}/></div>
        <div style={S.fg}><label style={S.label}>TDS Amount (₹)</label><input type="number" style={S.input} value={f.tds_amount} onChange={e=>setF(p=>({...p,tds_amount:e.target.value}))}/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Quarter</label><select style={S.select} value={f.quarter} onChange={e=>setF(p=>({...p,quarter:e.target.value}))}><option value="Q1">Q1 (Apr-Jun)</option><option value="Q2">Q2 (Jul-Sep)</option><option value="Q3">Q3 (Oct-Dec)</option><option value="Q4">Q4 (Jan-Mar)</option></select></div>
        <div style={S.fg}><label style={S.label}>Challan No</label><input style={S.input} value={f.challan_no} onChange={e=>setF(p=>({...p,challan_no:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Challan Date</label><input type="date" style={S.input} value={f.challan_date} onChange={e=>setF(p=>({...p,challan_date:e.target.value}))}/></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>}
  </div>);
}

// ── COMPLIANCE CALENDAR ───────────────────────────────────────────────────────
function ComplianceCalendar({token,toast,companyId}){
  const[tasks,setTasks]=useState([]);const[loading,setLoading]=useState(true);const[filter,setFilter]=useState("all");const[modal,setModal]=useState(false);
  const[f,setF]=useState({task_name:"",category:"GST",due_date:"",client_name:"",period:"",priority:"normal",notes:""});
  const CATS=["GST","TDS","Income Tax","ROC","Payroll","Audit","FEMA","Other"];
  const fmtDate=d=>d?new Date(d).toLocaleDateString("en-IN"):"-";
  const isOverdue=d=>new Date(d)<new Date()&&d;
  const isDueSoon=d=>{const diff=(new Date(d)-new Date())/(1000*60*60*24);return diff>=0&&diff<=7;};

  const load=useCallback(()=>{
    setLoading(true);
    api(`/compliance?${companyId?`company_id=${companyId}&`:""}${filter!=="all"?`status=${filter}`:""}`,"GET",null,token)
      .then(d=>{setTasks(d.tasks||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId,filter]);
  useEffect(()=>{load();},[load]);

  const seedTasks=async()=>{try{const d=await api("/compliance/seed","POST",{company_id:companyId,fy:"2026-27"},token);toast(d.message,"success");load();}catch(e){toast(e.message,"error");}};
  const toggle=async(t)=>{try{await api(`/compliance/${t.id}`,"PUT",{status:t.status==="done"?"pending":"done"},token);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/compliance/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const save=async()=>{if(!f.task_name||!f.due_date)return toast("Task name and due date required","error");try{await api("/compliance","POST",{...f,company_id:companyId||null},token);toast("✅ Added","success");setModal(false);load();}catch(e){toast(e.message,"error");}};

  const pending=tasks.filter(t=>t.status!=="done").length;
  const overdue=tasks.filter(t=>t.status!=="done"&&isOverdue(t.due_date)).length;
  const dueSoon=tasks.filter(t=>t.status!=="done"&&isDueSoon(t.due_date)).length;

  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Total",v:tasks.length,c:"#58a6ff"},{l:"Pending",v:pending,c:"#e3b341"},{l:"Overdue",v:overdue,c:"#f85149"},{l:"Due in 7 days",v:dueSoon,c:"#bf91f3"},{l:"Done",v:tasks.filter(t=>t.status==="done").length,c:"#3fb950"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>
      ))}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      {["all","pending","done"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===s?"#58a6ff":C.border}`,background:filter===s?"#0c1d2e":"transparent",color:filter===s?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>{s}</button>)}
      <button onClick={seedTasks} style={{...S.btnO,fontSize:11,marginLeft:"auto"}}>🌱 Seed Standard Dates</button>
      <button onClick={()=>{setF({task_name:"",category:"GST",due_date:"",client_name:"",period:"",priority:"normal",notes:""});setModal(true);}} style={S.btn}>+ Add Task</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {tasks.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No tasks. Click "Seed Standard Dates" to auto-populate all compliance due dates.</div>:(
          <table style={S.tbl}><thead><tr>{["Due Date","Task","Category","Client","Priority","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{tasks.map(t=>(
            <tr key={t.id} style={{background:t.status==="done"?"rgba(35,134,54,0.05)":isOverdue(t.due_date)&&t.status!=="done"?"rgba(218,54,51,0.08)":""}}>
              <td style={{...S.td,fontWeight:600,color:isOverdue(t.due_date)&&t.status!=="done"?"#f85149":isDueSoon(t.due_date)?"#e3b341":C.sub}}>{fmtDate(t.due_date)}</td>
              <td style={{...S.td,textDecoration:t.status==="done"?"line-through":""}}>{t.task_name}</td>
              <td style={S.td}>{badge(t.category,t.category==="GST"?"blue":t.category==="TDS"?"amber":t.category==="Income Tax"?"purple":"gray")}</td>
              <td style={S.td}>{t.client_name||"—"}</td>
              <td style={S.td}>{badge(t.priority,t.priority==="high"?"red":t.priority==="normal"?"gray":"gray")}</td>
              <td style={S.td}><button onClick={()=>toggle(t)} style={{...S.btnO,fontSize:10,padding:"3px 10px"}}>{t.status==="done"?"✅ Done":"Mark Done"}</button></td>
              <td style={S.tdR}><button onClick={()=>del(t.id)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:14}}>✕</button></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&<Modal title="Add Compliance Task" onClose={()=>setModal(false)}>
      <div style={S.fg}><label style={S.label}>Task Name *</label><input style={S.input} value={f.task_name} onChange={e=>setF(p=>({...p,task_name:e.target.value}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Category</label><select style={S.select} value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Due Date *</label><input type="date" style={S.input} value={f.due_date} onChange={e=>setF(p=>({...p,due_date:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Client Name</label><input style={S.input} value={f.client_name} onChange={e=>setF(p=>({...p,client_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Period (e.g. 05-2026)</label><input style={S.input} value={f.period} onChange={e=>setF(p=>({...p,period:e.target.value}))}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>Priority</label><select style={S.select} value={f.priority} onChange={e=>setF(p=>({...p,priority:e.target.value}))}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Add</button></div>
    </Modal>}
  </div>);
}

// ── DOCUMENT MANAGER ─────────────────────────────────────────────────────────
function DocumentManager({token,toast,companyId}){
  const[docs,setDocs]=useState([]);const[loading,setLoading]=useState(true);const[uploading,setUploading]=useState(false);const[catFilter,setCatFilter]=useState("all");const[file,setFile]=useState(null);
  const[f,setF]=useState({doc_name:"",doc_type:"ITR Acknowledgment",category:"IT",tags:"",ay:"2026-27",client_id:""});
  const[clients,setClients]=useState([]);const[showUpload,setShowUpload]=useState(false);
  const DOC_TYPES=["ITR Acknowledgment","Form 16","Form 16A","GST Return","GSTR-1","GSTR-3B","Bank Statement","Audit Report","Tax Audit 3CD","Balance Sheet","P&L Account","TDS Certificate","Advance Tax Challan","Other"];
  const CATS=["IT","GST","TDS","Audit","Payroll","Bank","Other"];
  const fmtSize=b=>b>1024*1024?`${(b/1024/1024).toFixed(1)} MB`:b>1024?`${(b/1024).toFixed(0)} KB`:`${b} B`;

  const load=useCallback(()=>{
    setLoading(true);
    Promise.all([
      api(`/documents?${companyId?`company_id=${companyId}&`:""}${catFilter!=="all"?`category=${catFilter}`:""}`,"GET",null,token),
      api(`/it/clients${companyId?`?company_id=${companyId}`:""}`, "GET",null,token),
    ]).then(([d,c])=>{setDocs(d.documents||[]);setClients(c.clients||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId,catFilter]);
  useEffect(()=>{load();},[load]);

  const upload=async()=>{
    if(!file)return toast("Select a file","error");
    setUploading(true);
    try{
      const fd=new FormData();fd.append("file",file);
      Object.entries({...f,company_id:companyId||""}).forEach(([k,v])=>v&&fd.append(k,v));
      const res=await fetch(`${API}/documents`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast("✅ Document uploaded","success");setShowUpload(false);setFile(null);load();}else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setUploading(false);
  };
  const del=async id=>{if(!window.confirm("Delete document?"))return;try{await api(`/documents/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const download=id=>{window.open(`${API}/documents/${id}/download?token=${token}`,"_blank");};

  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      {["all",...CATS].map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${catFilter===c?"#58a6ff":C.border}`,background:catFilter===c?"#0c1d2e":"transparent",color:catFilter===c?"#58a6ff":C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{c}</button>)}
      <button onClick={()=>setShowUpload(true)} style={{...S.btn,marginLeft:"auto"}}>📤 Upload Document</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {docs.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No documents uploaded yet</div>:(
          <table style={S.tbl}><thead><tr>{["Document Name","Type","Category","AY","Size","Date",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{docs.map(d=>(
            <tr key={d.id}>
              <td style={{...S.td,fontWeight:600,cursor:"pointer",color:"#58a6ff"}} onClick={()=>download(d.id)}>📄 {d.doc_name}</td>
              <td style={S.td}>{d.doc_type}</td>
              <td style={S.td}>{badge(d.category,d.category==="IT"?"blue":d.category==="GST"?"teal":"gray")}</td>
              <td style={S.td}>{d.ay||"—"}</td>
              <td style={S.td}>{fmtSize(d.file_size||0)}</td>
              <td style={S.td}>{new Date(d.created_at).toLocaleDateString("en-IN")}</td>
              <td style={S.tdR}><ActionMenu items={[{label:"⬇️ Download",onClick:()=>download(d.id)},{label:"🗑 Delete",danger:true,onClick:()=>del(d.id)}]}/></td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {showUpload&&<Modal title="Upload Document" onClose={()=>{setShowUpload(false);setFile(null);}}>
      <div style={S.fg}><label style={S.label}>File</label>
        <label style={{...S.btnO,cursor:"pointer",display:"block",textAlign:"center"}}>
          {file?`✅ ${file.name}`:"Choose File (PDF, Excel, Image)"}
          <input type="file" accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.doc,.docx" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/>
        </label>
      </div>
      <div style={S.fg}><label style={S.label}>Document Name</label><input style={S.input} value={f.doc_name} onChange={e=>setF(p=>({...p,doc_name:e.target.value}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Document Type</label><select style={S.select} value={f.doc_type} onChange={e=>setF(p=>({...p,doc_type:e.target.value}))}>{DOC_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Category</label><select style={S.select} value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Assessment Year</label><select style={S.select} value={f.ay} onChange={e=>setF(p=>({...p,ay:e.target.value}))}>{["2026-27","2025-26","2024-25","2023-24"].map(a=><option key={a}>{a}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Client</label><select style={S.select} value={f.client_id} onChange={e=>setF(p=>({...p,client_id:e.target.value}))}><option value="">— General —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowUpload(false)} style={S.btnO}>Cancel</button><button onClick={upload} disabled={!file||uploading} style={{...S.btn,opacity:!file?0.5:1}}>{uploading?"Uploading...":"Upload"}</button></div>
    </Modal>}
  </div>);
}

// ── PAYROLL MODULE ────────────────────────────────────────────────────────────
function Payroll({token,toast,companyId}){
  const[salaries,setSalaries]=useState([]);const[loading,setLoading]=useState(true);const[processing,setProcessing]=useState(false);
  const[month,setMonth]=useState(String(new Date().getMonth()+1).padStart(2,"0"));const[year,setYear]=useState(String(new Date().getFullYear()));
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const MONTHS=["01","02","03","04","05","06","07","08","09","10","11","12"];
  const MNAMES={};["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].forEach((m,i)=>MNAMES[String(i+1).padStart(2,"0")]=m);

  const load=useCallback(()=>{
    if(!companyId)return;
    setLoading(true);
    api(`/payroll/salaries?company_id=${companyId}&period=${month}-${year}`,"GET",null,token)
      .then(d=>{setSalaries(d.salaries||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId,month,year]);
  useEffect(()=>{load();},[load]);

  const process=async()=>{
    if(!companyId)return toast("Select company","error");
    setProcessing(true);
    try{const d=await api("/payroll/process","POST",{company_id:companyId,month:parseInt(month),year:parseInt(year)},token);toast(d.message,"success");load();}
    catch(e){toast(e.message,"error");}
    setProcessing(false);
  };

  const totalGross=salaries.reduce((a,s)=>a+parseFloat(s.gross||0),0);
  const totalNet=salaries.reduce((a,s)=>a+parseFloat(s.net_salary||0),0);
  const totalPF=salaries.reduce((a,s)=>a+parseFloat(s.pf_employee||0)+parseFloat(s.pf_employer||0),0);

  if(!companyId)return<div style={{...S.card,textAlign:"center",padding:30,color:C.muted}}>Select a company first</div>;
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>💰 Payroll Processing</div>
      <div style={{fontSize:12,color:C.muted}}>Process monthly salary for all active employees. Automatic PF (12%/12%), ESI (0.75%/3.25% if salary ≤ ₹21,000), and Professional Tax deductions.</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <select style={{...S.select,width:80}} value={month} onChange={e=>setMonth(e.target.value)}>{MONTHS.map(m=><option key={m}>{m}</option>)}</select>
      <select style={{...S.select,width:90}} value={year} onChange={e=>setYear(e.target.value)}>{["2026","2025","2024"].map(y=><option key={y}>{y}</option>)}</select>
      <button onClick={process} disabled={processing} style={{...S.btnG,opacity:processing?0.5:1}}>{processing?"Processing...":"⚙ Process Salary"}</button>
      <button onClick={load} style={S.btnO}>🔄</button>
    </div>
    {salaries.length>0&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Employees",v:salaries.length,c:"#58a6ff"},{l:"Gross Payroll",v:fR(totalGross),c:"#e3b341"},{l:"Net Payable",v:fR(totalNet),c:"#3fb950"},{l:"PF (Emp+Empr)",v:fR(totalPF),c:"#bf91f3"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:k.l.includes("₹")?12:20}}>{k.v}</div></div>
      ))}
    </div>)}
    {loading?<Spinner/>:(
      <div style={S.card}>
        {salaries.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>Click "Process Salary" to generate salary for {MNAMES[month]}-{year}</div>:(
          <table style={S.tbl}><thead><tr>{["Employee","Designation","Gross","PF (Emp)","ESI (Emp)","PT","Net Salary"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{salaries.map(s=>(
            <tr key={s.id}>
              <td style={{...S.td,fontWeight:600}}>{s.emp_name}</td>
              <td style={S.td}>{s.designation||"—"}</td>
              <td style={{...S.td,color:"#e3b341"}}>{fR(s.gross)}</td>
              <td style={S.td}>{fR(s.pf_employee)}</td>
              <td style={S.td}>{fR(s.esi_employee)}</td>
              <td style={S.td}>{fR(s.pt)}</td>
              <td style={{...S.tdR,fontWeight:700,color:"#3fb950"}}>{fR(s.net_salary)}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr><td colSpan={2} style={{...S.td,fontWeight:700}}>TOTAL</td><td style={{...S.td,color:"#e3b341",fontWeight:700}}>{fR(totalGross)}</td><td colSpan={3} style={S.td}/><td style={{...S.tdR,fontWeight:700,color:"#3fb950"}}>{fR(totalNet)}</td></tr></tfoot></table>
        )}
      </div>
    )}
  </div>);
}

// ── EMPLOYEES ────────────────────────────────────────────────────────────────
function Employees({token,toast,companyId}){
  const[emps,setEmps]=useState([]);const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[f,setF]=useState({name:"",employee_code:"",designation:"",department:"",pan:"",uan:"",doj:today(),basic_salary:"",hra:"",special_allowance:"",other_allowance:"",pf_applicable:true,esi_applicable:false,pt_applicable:false,pt_amount:"200"});
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;

  const load=useCallback(()=>{
    if(!companyId)return;setLoading(true);
    api(`/payroll/employees?company_id=${companyId}`,"GET",null,token).then(d=>{setEmps(d.employees||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,companyId]);
  useEffect(()=>{load();},[load]);

  const calcGross=()=>([f.basic_salary,f.hra,f.special_allowance,f.other_allowance].reduce((a,v)=>a+(parseFloat(v)||0),0));
  const save=async()=>{if(!f.name||!f.basic_salary)return toast("Name and basic salary required","error");try{await api("/payroll/employees","POST",{...f,company_id:companyId},token);toast("✅ Employee added","success");setModal(false);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete employee?"))return;try{await api(`/payroll/employees/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};

  if(!companyId)return<div style={{...S.card,textAlign:"center",padding:30,color:C.muted}}>Select a company first</div>;
  return(<div>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>{setF({name:"",employee_code:"",designation:"",department:"",pan:"",uan:"",doj:today(),basic_salary:"",hra:"",special_allowance:"",other_allowance:"",pf_applicable:true,esi_applicable:false,pt_applicable:false,pt_amount:"200"});setModal(true);}} style={S.btn}>+ New Employee</button></div>
    {loading?<Spinner/>:(
      <div style={S.card}>
        {emps.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No employees yet</div>:(
          <table style={S.tbl}><thead><tr>{["Name","Code","Designation","Basic","Gross","PF","DoJ","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{emps.map(e=>{const gross=(parseFloat(e.basic_salary)||0)+(parseFloat(e.hra)||0)+(parseFloat(e.special_allowance)||0)+(parseFloat(e.other_allowance)||0);return(
            <tr key={e.id}>
              <td style={{...S.td,fontWeight:600}}>{e.name}</td>
              <td style={S.td}>{e.employee_code||"—"}</td>
              <td style={S.td}>{e.designation||"—"}</td>
              <td style={S.td}>{fR(e.basic_salary)}</td>
              <td style={{...S.td,color:"#e3b341"}}>{fR(gross)}</td>
              <td style={S.td}>{e.pf_applicable?badge("PF","green"):badge("No PF","gray")}</td>
              <td style={S.td}>{e.doj?.substring(0,10)||"—"}</td>
              <td style={S.tdR}><button onClick={()=>del(e.id)} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
            </tr>
          );})}
          </tbody></table>
        )}
      </div>
    )}
    {modal&&<Modal title="New Employee" onClose={()=>setModal(false)} wide>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Employee Code</label><input style={S.input} value={f.employee_code} onChange={e=>setF(p=>({...p,employee_code:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Designation</label><input style={S.input} value={f.designation} onChange={e=>setF(p=>({...p,designation:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Department</label><input style={S.input} value={f.department} onChange={e=>setF(p=>({...p,department:e.target.value}))}/></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={f.pan} onChange={e=>setF(p=>({...p,pan:e.target.value.toUpperCase()}))} maxLength={10}/></div>
        <div style={S.fg}><label style={S.label}>UAN</label><input style={S.input} value={f.uan} onChange={e=>setF(p=>({...p,uan:e.target.value}))}/></div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,color:"#58a6ff",marginBottom:8,fontSize:12}}>Salary Structure</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[["Basic Salary *","basic_salary"],["HRA","hra"],["Special Allowance","special_allowance"],["Other Allowance","other_allowance"]].map(([l,k])=>(
            <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{fontSize:12,color:"#3fb950",marginTop:6}}>Gross: {fR(calcGross())}/month</div>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:14}}>
        {[["PF (12%)","pf_applicable"],["ESI (if ≤₹21K)","esi_applicable"],["Prof. Tax","pt_applicable"]].map(([l,k])=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}>
            <input type="checkbox" checked={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.checked}))}/>{l}
          </label>
        ))}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>}
  </div>);
}

// ════════════════════════════════════════════
// INCOME TAX PORTAL FEATURES
// ════════════════════════════════════════════

// ── 26AS / AIS IMPORT & RECONCILIATION ──────────────────────────────────────
function AIS26AS({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[ay,setAy]=useState("2026-27");
  const[file,setFile]=useState(null);const[source,setSource]=useState("26AS");const[uploading,setUploading]=useState(false);
  const[entries,setEntries]=useState([]);const[summary,setSummary]=useState(null);const[loading,setLoading]=useState(false);
  const AYS=["2026-27","2025-26","2024-25","2023-24"];
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  useEffect(()=>{api("/it/clients","GET",null,token).then(d=>setClients(d.clients||[])).catch(()=>{});},[token]);

  const upload=async()=>{
    if(!file||!clientId)return toast("Select client and file","error");
    setUploading(true);
    try{
      const fd=new FormData();fd.append("file",file);fd.append("client_id",clientId);fd.append("ay",ay);fd.append("source",source);
      const res=await fetch(`${API}/it/import-26as`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast(d.message,"success");setFile(null);loadEntries();}
      else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setUploading(false);
  };

  const loadEntries=useCallback(()=>{
    if(!clientId)return;setLoading(true);
    api(`/it/26as/${clientId}?ay=${ay}`,"GET",null,token)
      .then(d=>{setEntries(d.entries||[]);setSummary(d.summary);setLoading(false);}).catch(()=>setLoading(false));
  },[clientId,ay,token]);
  useEffect(()=>{if(clientId)loadEntries();},[loadEntries]);

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:6}}>📊 26AS / AIS Data Import</div>
      <div style={{fontSize:12,color:C.sub}}>Download 26AS or AIS from IT portal as Excel → upload here → reconcile with your TDS records.</div>
      <div style={{marginTop:8}}><button onClick={()=>window.open("https://eportal.incometax.gov.in/iec/foservices/#/view-tax-credit-26AS","_blank")} style={{...S.btnO,fontSize:11}}>🌐 Download from IT Portal →</button></div>
    </div>
    <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:12}}>
        <div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— Select —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>AY</label><select style={S.select} value={ay} onChange={e=>setAy(e.target.value)}>{AYS.map(a=><option key={a}>{a}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Source</label><select style={S.select} value={source} onChange={e=>setSource(e.target.value)}><option>26AS</option><option>AIS</option><option>TIS</option></select></div>
        <div style={S.fg}><label style={S.label}>Excel File</label><label style={{...S.btnO,cursor:"pointer",display:"block",textAlign:"center"}}>{file?file.name:"Choose Excel (.xlsx)"}<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>
      </div>
      <button onClick={upload} disabled={!file||!clientId||uploading} style={{...S.btn,opacity:!file||!clientId?0.5:1}}>{uploading?"Importing...":"📤 Import"}</button>
    </div>
    {summary&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
      {[{l:"Total Entries",v:summary.count,c:"#58a6ff"},{l:"Total Income",v:fR(summary.total_income),c:"#e3b341"},{l:"TDS Deducted",v:fR(summary.total_tds),c:"#3fb950"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c}}>{k.v}</div></div>
      ))}
    </div>}
    {loading?<Spinner/>:entries.length>0&&(
      <div style={S.card}>
        <table style={S.tbl}><thead><tr>{["Deductor","TAN","Section","Amount","TDS","Date","Source"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{entries.map(e=>(
          <tr key={e.id}><td style={{...S.td,fontWeight:600}}>{e.deductor_name}</td><td style={{...S.td,...S.mono}}>{e.deductor_tan||"—"}</td><td style={S.td}>{e.section||"—"}</td><td style={S.td}>{fR(e.amount)}</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{fR(e.tds_amount)}</td><td style={S.td}>{e.date?.substring(0,10)||"—"}</td><td style={S.tdR}>{badge(e.source,"blue")}</td></tr>
        ))}</tbody>
        <tfoot><tr><td colSpan={3} style={{...S.td,fontWeight:700}}>Total</td><td style={{...S.td,fontWeight:700}}>{fR(entries.reduce((a,e)=>a+parseFloat(e.amount||0),0))}</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR(entries.reduce((a,e)=>a+parseFloat(e.tds_amount||0),0))}</td><td colSpan={2}/></tr></tfoot>
        </table>
      </div>
    )}
  </div>);
}

// ── FORM 16 GENERATOR ────────────────────────────────────────────────────────
function Form16Generator({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[ay,setAy]=useState("2026-27");const[fy,setFy]=useState("2025-26");const[formType,setFormType]=useState("16");
  const[tdsEntries,setTdsEntries]=useState([]);const[loading,setLoading]=useState(false);
  const AYS=["2026-27","2025-26","2024-25"];const FYS=["2025-26","2024-25","2023-24"];

  useEffect(()=>{api("/it/clients","GET",null,token).then(d=>setClients(d.clients||[])).catch(()=>{});},[token]);
  useEffect(()=>{
    if(!clientId)return;
    api(`/tds?client_id=${clientId}&fy=${fy}&form_type=${formType==="16"?"24Q":"26Q"}`,"GET",null,token).then(d=>setTdsEntries(d.entries||[])).catch(()=>{});
  },[clientId,fy,formType,token]);

  const generate=()=>{
    if(!clientId)return toast("Select client","error");
    const url=`${API}/it/form${formType}/${clientId}?ay=${ay}&fy=${fy}`;
    window.open(`${url}&token=${token}`,"_blank");
  };

  const generate16A=id=>{window.open(`${API}/it/form16a/${id}?token=${token}`,"_blank");};

  return(<div>
    <div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#3fb950",marginBottom:4}}>📄 Form 16 / 16A Generator</div>
      <div style={{fontSize:12,color:C.sub}}>Generate TDS certificates as printable PDF. Form 16 (Salary) and Form 16A (Non-Salary).</div>
    </div>
    <div style={S.card}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["16","Form 16 (Salary)"],["16A","Form 16A (Non-Salary)"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFormType(k)} style={{padding:"7px 18px",borderRadius:7,border:`1px solid ${formType===k?"#1F6FEB":C.border}`,background:formType===k?"#0c1d2e":"transparent",color:formType===k?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:formType===k?600:400}}>{l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        <div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— Select —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.pan||"No PAN"})</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Assessment Year</label><select style={S.select} value={ay} onChange={e=>setAy(e.target.value)}>{AYS.map(a=><option key={a}>{a}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Financial Year</label><select style={S.select} value={fy} onChange={e=>setFy(e.target.value)}>{FYS.map(f=><option key={f}>{f}</option>)}</select></div>
      </div>
      {formType==="16"&&(<button onClick={generate} disabled={!clientId} style={{...S.btnG,opacity:!clientId?0.5:1}}>🖨 Generate Form 16 (PDF)</button>)}
    </div>
    {formType==="16A"&&tdsEntries.length>0&&(
      <div style={S.card}>
        <div style={{fontWeight:600,marginBottom:10}}>TDS Entries — Generate Form 16A per entry:</div>
        <table style={S.tbl}><thead><tr>{["Deductee","Section","Payment Amt","TDS","Date","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{tdsEntries.map(t=>(
          <tr key={t.id}><td style={S.td}>{t.deductee_name}</td><td style={S.td}>{t.section}</td><td style={S.td}>₹{parseFloat(t.payment_amount||0).toLocaleString("en-IN")}</td><td style={{...S.td,color:"#3fb950"}}>₹{parseFloat(t.tds_amount||0).toLocaleString("en-IN")}</td><td style={S.td}>{t.payment_date}</td><td style={S.tdR}><button onClick={()=>generate16A(t.id)} style={{...S.btn,fontSize:11,padding:"4px 10px"}}>🖨 Form 16A</button></td></tr>
        ))}</tbody></table>
      </div>
    )}
    {formType==="16A"&&tdsEntries.length===0&&clientId&&(<div style={{...S.card,textAlign:"center",padding:30,color:C.muted}}>No 26Q TDS entries for this client in {fy}. Add TDS entries first.</div>)}
  </div>);
}

// ── CHALLAN 280 PRE-FILL ─────────────────────────────────────────────────────
function Challan280({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[ay,setAy]=useState("2026-27");
  const[amount,setAmount]=useState("");const[payType,setPayType]=useState("300");const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const PAY_TYPES=[["100","Advance Tax"],["300","Self-Assessment Tax"],["400","Tax on Regular Assessment"],["106","Tax on Distributed Profits"],["107","Tax on Distributed Income"]];

  useEffect(()=>{api("/it/clients","GET",null,token).then(d=>setClients(d.clients||[])).catch(()=>{});},[token]);

  const prefill=async()=>{
    setLoading(true);
    try{const d=await api("/it/challan280","POST",{client_id:clientId,ay,amount,payment_type:payType},token);setData(d);}catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  return(<div>
    <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#e3b341",marginBottom:4}}>🧾 Challan 280 — IT Tax Payment Guide</div>
      <div style={{fontSize:12,color:C.sub}}>Fill details here → Follow steps to pay on IT portal. Challan BSR code & serial number save karo TDS module mein.</div>
    </div>
    <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        <div style={S.fg}><label style={S.label}>Client (optional)</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— Self/General —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Assessment Year</label><select style={S.select} value={ay} onChange={e=>setAy(e.target.value)}>{["2026-27","2025-26","2024-25"].map(a=><option key={a}>{a}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Payment Type</label><select style={S.select} value={payType} onChange={e=>setPayType(e.target.value)}>{PAY_TYPES.map(([v,l])=><option key={v} value={v}>({v}) {l}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Amount (₹)</label><input type="number" style={S.input} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="50000"/></div>
      </div>
      <button onClick={prefill} disabled={!amount||loading} style={{...S.btn,opacity:!amount?0.5:1}}>{loading?"...":" Generate Steps"}</button>
    </div>
    {data&&(<>
      {data.client?.pan&&<div style={{...S.card,background:"#0c1d2e",marginBottom:10}}>
        <div style={{fontWeight:600,marginBottom:6}}>Pre-fill Details</div>
        <div style={S.col2}>
          {[["PAN",data.client.pan],["Name",data.client.name],["AY",ay],["Payment Type",PAY_TYPES.find(p=>p[0]===payType)?.[1]||payType],["Amount",`₹${parseFloat(amount).toLocaleString("en-IN")}`]].map(([l,v])=>(
            v&&<div key={l} style={{display:"flex",gap:8,padding:"4px 0"}}><span style={{color:C.muted,minWidth:80}}>{l}:</span><b style={{color:C.text}}>{v}</b></div>
          ))}
        </div>
      </div>}
      <div style={S.card}>
        <div style={{fontWeight:600,color:"#3fb950",marginBottom:10}}>Steps to Pay on IT Portal:</div>
        {data.data.steps.map((step,i)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{background:C.primary,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</span>
            <span style={{fontSize:12,color:C.sub}}>{step}</span>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button onClick={()=>window.open(data.data.direct_link,"_blank")} style={{...S.btnG}}>🌐 Open IT Portal e-Pay Tax →</button>
        </div>
      </div>
    </>)}
  </div>);
}

// ── AI TAX PLANNING ───────────────────────────────────────────────────────────
function TaxPlanning({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[ay,setAy]=useState("2026-27");
  const[suggestions,setSuggestions]=useState(null);const[loading,setLoading]=useState(false);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;

  useEffect(()=>{api("/it/clients","GET",null,token).then(d=>setClients(d.clients||[])).catch(()=>{});},[token]);
  const generate=async()=>{
    setLoading(true);
    try{const d=await api("/it/tax-planning","POST",{client_id:clientId||null,ay},token);setSuggestions(d.suggestions);}catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:4}}>🤖 AI Tax Planning Advisor</div>
      <div style={{fontSize:12,color:C.sub}}>AI analyzes client's income & deductions → suggests optimal tax saving strategies, regime comparison, actionable investments.</div>
    </div>
    <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
        <div style={S.fg}><label style={S.label}>Client (optional)</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— General Advice —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Assessment Year</label><select style={S.select} value={ay} onChange={e=>setAy(e.target.value)}>{["2026-27","2025-26"].map(a=><option key={a}>{a}</option>)}</select></div>
      </div>
      <button onClick={generate} disabled={loading} style={{...S.btn,opacity:loading?0.5:1}}>{loading?"🤖 Analyzing...":"✨ Generate Tax Plan"}</button>
    </div>
    {loading&&<div style={{...S.card,textAlign:"center",padding:30}}><Spinner/><div style={{marginTop:10,color:C.muted,fontSize:12}}>AI is analyzing tax situation...</div></div>}
    {suggestions&&!loading&&(<>
      <div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:10}}>
        <div style={{fontWeight:700,color:"#3fb950",marginBottom:6,fontSize:13}}>{suggestions.summary}</div>
        <div style={S.col2}>
          <div style={{...S.kpi,background:"#0D1117"}}><div style={S.label}>Old Regime Tax</div><div style={{fontWeight:700,color:"#f85149",fontSize:14}}>{fR(suggestions.old_regime_tax||0)}</div></div>
          <div style={{...S.kpi,background:"#0D1117"}}><div style={S.label}>New Regime Tax</div><div style={{fontWeight:700,color:"#58a6ff",fontSize:14}}>{fR(suggestions.new_regime_tax||0)}</div></div>
        </div>
        <div style={{marginTop:10,padding:"8px 12px",background:suggestions.recommended_regime?.includes("Old")?"#2d1b00":"#0c1d2e",borderRadius:7,fontSize:12,fontWeight:600}}>
          ✅ Recommended: <span style={{color:"#e3b341"}}>{suggestions.recommended_regime}</span>
          {suggestions.old_regime_tax&&suggestions.new_regime_tax?<span style={{color:C.muted,fontWeight:400}}> (Save {fR(Math.abs((suggestions.old_regime_tax||0)-(suggestions.new_regime_tax||0)))})</span>:null}
        </div>
      </div>
      {suggestions.suggestions?.length>0&&(<div style={S.card}>
        <div style={{fontWeight:600,marginBottom:10}}>💡 Tax Saving Opportunities</div>
        {suggestions.suggestions.map((s,i)=>(
          <div key={i} style={{...S.card,padding:12,marginBottom:8,background:"#0D1117"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontWeight:700,color:C.text}}>{s.category}</span>
              <div style={{display:"flex",gap:6}}>
                {badge(s.priority,s.priority==="High"?"green":s.priority==="Medium"?"amber":"gray")}
                {s.potential_saving>0&&<span style={{color:"#3fb950",fontWeight:700,fontSize:11}}>Save {fR(s.potential_saving)}</span>}
              </div>
            </div>
            <div style={{fontSize:12,color:C.sub}}>{s.action}</div>
          </div>
        ))}
      </div>)}
      {suggestions.immediate_actions?.length>0&&(<div style={S.card}>
        <div style={{fontWeight:600,marginBottom:8,color:"#e3b341"}}>⚡ Immediate Actions</div>
        {suggestions.immediate_actions.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.primary,fontWeight:700}}>{i+1}.</span>
            <span style={{fontSize:12,color:C.sub}}>{a}</span>
          </div>
        ))}
      </div>)}
      {suggestions.caution&&<div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03"}}><span style={{color:"#e3b341",fontSize:12}}>⚠ {suggestions.caution}</span></div>}
    </>)}
  </div>);
}

// ── IT PORTAL INTEGRATION ─────────────────────────────────────────────────────
function ITPortal({token,toast}){
  const[links,setLinks]=useState([]);
  useEffect(()=>{api("/it/portal-links","GET",null,token).then(d=>setLinks(d.links||[])).catch(()=>{});},[token]);
  const COLORS={"#1F6FEB":"Filing","#238636":"Payment","#9333ea":"TRACES","#d97706":"Registration","#0e9182":"Status"};
  const colorMap={"e-Filing Portal":"#1F6FEB","e-Pay Tax":"#238636","26AS":"#9333ea","TDS":"#9333ea","TAN":"#d97706","PAN":"#d97706","Status":"#0e9182","Demand":"#e11d48"};
  const getColor=name=>Object.entries(colorMap).find(([k])=>name.includes(k))?.[1]||"#1F6FEB";

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>🔗 Income Tax Portal Integration</div>
      <div style={{fontSize:12,color:C.sub}}>Direct links to all IT portal services. TaxPro prepares your data — portal pe ek click mein jaao aur file/pay karo.</div>
    </div>
    <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginBottom:14}}>
      <div style={{fontSize:12,color:"#e3b341",fontWeight:600,marginBottom:4}}>⚠ Official e-Filing API (ERI) ke baare mein</div>
      <div style={{fontSize:11,color:C.sub,lineHeight:1.7}}>Direct ITR filing ke liye Income Tax Dept ka <b>ERI (e-Return Intermediary) license</b> chahiye hota hai — yeh CA firms ke liye available hai. TaxPro abhi data preparation + PDF generate karta hai. <b>Manual upload IT portal se karo.</b><br/>Future roadmap: ERI license le ke direct filing!</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
      {links.map((l,i)=>(
        <div key={i} style={{...S.card,marginBottom:0,cursor:"pointer",border:`1px solid ${C.border}`,transition:"border-color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=getColor(l.name)}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontWeight:700,color:C.text,fontSize:12}}>{l.name}</div>
          </div>
          <div style={{fontSize:11,color:C.muted,marginBottom:12,lineHeight:1.6}}>{l.desc}</div>
          <button onClick={()=>window.open(l.url,"_blank")} style={{...S.btn,background:getColor(l.name),fontSize:11,padding:"6px 14px"}}>Open Portal →</button>
        </div>
      ))}
    </div>
    <div style={{...S.card,marginTop:14}}>
      <div style={{fontWeight:600,marginBottom:10}}>💡 Workflow: TaxPro → IT Portal</div>
      {[
        ["1️⃣ Client Data","IT Clients mein PAN, Aadhaar, DOB enter karo"],
        ["2️⃣ 26AS Import","IT portal se 26AS download karo → TaxPro mein import karo"],
        ["3️⃣ ITR Computation","ITR Filing section mein income/deductions enter karo → tax compute karo"],
        ["4️⃣ Tax Planning","AI Tax Planning se suggestions lo — old vs new regime compare karo"],
        ["5️⃣ Challan Payment","Balance tax ho to Challan 280 section se IT portal pe jaao → pay karo"],
        ["6️⃣ Form 16/16A","TDS module mein entries karo → Form 16 generate karo → download PDF"],
        ["7️⃣ Manual Filing","IT portal pe login karo → e-file ITR (TaxPro ka computed data use karo)"],
      ].map(([step,desc])=>(
        <div key={step} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:16,flexShrink:0}}>{step}</span>
          <span style={{fontSize:12,color:C.sub}}>{desc}</span>
        </div>
      ))}
    </div>
  </div>);
}

// ════════════════════════════════════════════
// ADMIN PANEL — usage analytics across all users
// ════════════════════════════════════════════
function AdminPanel({token,toast}){
  const[stats,setStats]=useState(null);const[users,setUsers]=useState([]);const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("all");const[search,setSearch]=useState("");const[tab,setTab]=useState("users");
  const[logs,setLogs]=useState([]);
  const isMobile=useIsMobile();

  const load=useCallback(()=>{
    setLoading(true);
    Promise.all([
      api("/admin/stats","GET",null,token),
      api(`/admin/users?${filter!=="all"?`status=${filter}&`:""}${search?`search=${encodeURIComponent(search)}`:""}`,"GET",null,token),
    ]).then(([s,u])=>{setStats(s.stats);setUsers(u.users||[]);setLoading(false);}).catch(e=>{toast(e.message,"error");setLoading(false);});
  },[token,filter,search]);
  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    if(tab==="logs")api("/admin/audit-logs?limit=150","GET",null,token).then(d=>setLogs(d.logs||[])).catch(()=>{});
  },[tab,token]);

  const toggleSuspend=async(u)=>{
    if(!window.confirm(`${u.is_suspended?"Unsuspend":"Suspend"} ${u.name}?`))return;
    try{await api(`/admin/users/${u.id}/suspend`,"POST",{suspended:!u.is_suspended},token);toast("✅ Updated","success");load();}catch(e){toast(e.message,"error");}
  };

  const fmtDate=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const activityColor=days=>days===null?"#8b949e":days<=1?"#3fb950":days<=7?"#e3b341":"#f85149";
  const activityLabel=days=>days===null?"Never logged in":days===0?"Today":days===1?"Yesterday":`${days} days ago`;

  if(loading&&!stats)return<Spinner/>;

  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3"}}>👑 Admin Panel — Usage Analytics</div>
      <div style={{fontSize:11,color:C.muted,marginTop:4}}>Visible only to admin accounts. See every registered user, their contact info, and how actively they use TaxPro GST.</div>
    </div>

    {stats&&<div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Total Users",v:stats.total_users,c:"#58a6ff"},{l:"Active (7d)",v:stats.active_7d,c:"#3fb950"},{l:"Active (30d)",v:stats.active_30d,c:"#0e9182"},{l:"New This Month",v:stats.new_this_month,c:"#bf91f3"},{l:"Suspended",v:stats.suspended,c:"#f85149"},{l:"Companies",v:stats.total_companies,c:"#e3b341"},{l:"Total Vouchers",v:stats.total_vouchers,c:"#d97706"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>
      ))}
    </div>}

    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[["users","👥 Users"],["logs","📜 Audit Log"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"7px 16px",borderRadius:7,border:`1px solid ${tab===k?"#1F6FEB":C.border}`,background:tab===k?"#0c1d2e":"transparent",color:tab===k?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===k?600:400}}>{l}</button>)}
    </div>

    {tab==="users"&&(<>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name, email, phone..." style={{...S.input,width:240}}/>
        {["all","active","inactive","suspended"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===s?"#58a6ff":C.border}`,background:filter===s?"#0c1d2e":"transparent",color:filter===s?"#58a6ff":C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit",textTransform:"capitalize"}}>{s}</button>)}
      </div>
      <div className="tp-table-wrap"><div style={S.card}>
        {users.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No users found</div>:(
          <table style={S.tbl}><thead><tr>{["Name","Email","Phone","Firm","Signed Up","Last Active","Companies","Vouchers","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{opacity:u.is_suspended?0.5:1}}>
              <td style={{...S.td,fontWeight:600,color:C.text}}>{u.name}{u.is_admin&&<span style={{marginLeft:6}} title="Admin">👑</span>}</td>
              <td style={S.td}>{u.email}</td>
              <td style={S.td}>{u.phone||"—"}</td>
              <td style={S.td}>{u.firm_name||"—"}</td>
              <td style={S.td}>{fmtDate(u.created_at)} <span style={{color:C.muted,fontSize:10}}>({u.days_since_signup}d ago)</span></td>
              <td style={{...S.td,color:activityColor(u.days_since_active),fontWeight:600}}>{activityLabel(u.days_since_active)}</td>
              <td style={{...S.td,textAlign:"center"}}>{u.company_count}</td>
              <td style={{...S.td,textAlign:"center"}}>{u.voucher_count}</td>
              <td style={S.td}>{u.is_suspended?badge("Suspended","red"):u.days_since_active===null?badge("Never logged in","gray"):u.days_since_active<=7?badge("Active","green"):badge("Inactive","amber")}</td>
              <td style={S.tdR}><button onClick={()=>toggleSuspend(u)} style={{...(u.is_suspended?S.btnG:S.btnR),fontSize:10,padding:"3px 10px"}}>{u.is_suspended?"Unsuspend":"Suspend"}</button></td>
            </tr>
          ))}</tbody></table>
        )}
      </div></div>
    </>)}

    {tab==="logs"&&(
      <div className="tp-table-wrap"><div style={S.card}>
        {logs.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No audit logs yet</div>:(
          <table style={S.tbl}><thead><tr>{["Time","User","Action","Details","IP"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{logs.map(l=>(
            <tr key={l.id}>
              <td style={S.td}>{new Date(l.created_at).toLocaleString("en-IN")}</td>
              <td style={S.td}>{l.user_name||"—"}<br/><span style={{fontSize:10,color:C.muted}}>{l.user_email}</span></td>
              <td style={S.td}>{badge(l.action,l.action.includes("failed")||l.action.includes("revoke")?"red":l.action.includes("login")?"green":"blue")}</td>
              <td style={{...S.td,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis"}}>{l.details||"—"}</td>
              <td style={{...S.td,...S.mono,fontSize:10}}>{l.ip_address||"—"}</td>
            </tr>
          ))}</tbody></table>
        )}
      </div></div>
    )}
  </div>);
}

// ── ADMIN CLAIM SCREEN (one-time, for the very first admin setup) ──
function AdminClaim({token,toast,onDone}){
  const[secret,setSecret]=useState("");const[loading,setLoading]=useState(false);
  const claim=async()=>{
    if(!secret)return toast("Enter the setup key","error");
    setLoading(true);
    try{await api("/admin/claim","POST",{secret},token);toast("✅ You are now admin!","success");onDone&&onDone();}
    catch(e){toast(e.message,"error");}
    setLoading(false);
  };
  return(<div style={{...S.card,maxWidth:420,margin:"40px auto",textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:10}}>🔑</div>
    <div style={{fontWeight:700,marginBottom:6}}>Become Admin</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Enter the ADMIN_SETUP_KEY you set in your backend's environment variables (Render → Environment).</div>
    <input type="password" style={{...S.input,marginBottom:10}} value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Setup key"/>
    <button onClick={claim} disabled={loading} style={{...S.btn,width:"100%"}}>{loading?"Verifying...":"Claim Admin Access"}</button>
  </div>);
}

// ════════════════════════════════════════════
// SECURITY & BACKUP SETTINGS
// ════════════════════════════════════════════
function SecuritySettings({token,toast,user}){
  const[sessions,setSessions]=useState([]);const[loading,setLoading]=useState(true);
  const[twoFA,setTwoFA]=useState(false);const[backupStatus,setBackupStatus]=useState(null);
  const[pwForm,setPwForm]=useState({current_password:"",new_password:"",confirm:""});const[changingPw,setChangingPw]=useState(false);
  const[sendingBackup,setSendingBackup]=useState(false);

  const load=useCallback(()=>{
    setLoading(true);
    Promise.all([
      api("/auth/sessions","GET",null,token),
      api("/backup/status","GET",null,token),
    ]).then(([s,b])=>{setSessions(s.sessions||[]);setBackupStatus(b);setLoading(false);}).catch(()=>setLoading(false));
  },[token]);
  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    api("/auth/me","GET",null,token).then(d=>{}).catch(()=>{});
  },[]);

  const toggle2FA=async()=>{
    try{const d=await api("/auth/toggle-2fa","POST",{enabled:!twoFA},token);setTwoFA(d.two_factor_enabled);toast(d.two_factor_enabled?"✅ OTP login enabled":"2FA disabled","success");}
    catch(e){toast(e.message,"error");}
  };

  const revokeSession=async(id)=>{
    if(!window.confirm("Log out this device?"))return;
    try{await api(`/auth/sessions/${id}`,"DELETE",null,token);toast("Device logged out","success");load();}catch(e){toast(e.message,"error");}
  };
  const revokeOthers=async()=>{
    if(!window.confirm("Log out ALL other devices? You'll stay logged in here."))return;
    try{await api("/auth/sessions/revoke-others","POST",null,token);toast("✅ All other devices logged out","success");load();}catch(e){toast(e.message,"error");}
  };

  const changePassword=async()=>{
    if(pwForm.new_password!==pwForm.confirm)return toast("New passwords don't match","error");
    if(pwForm.new_password.length<8)return toast("New password must be at least 8 characters","error");
    setChangingPw(true);
    try{await api("/auth/change-password","POST",{current_password:pwForm.current_password,new_password:pwForm.new_password},token);toast("✅ Password changed. Other devices logged out.","success");setPwForm({current_password:"",new_password:"",confirm:""});}
    catch(e){toast(e.message,"error");}
    setChangingPw(false);
  };

  const emailBackupNow=async()=>{
    setSendingBackup(true);
    try{const d=await api("/backup/email-now","POST",null,token);toast(d.message,"success");load();}catch(e){toast(e.message,"error");}
    setSendingBackup(false);
  };
  const toggleAutoBackup=async()=>{
    try{await api("/backup/toggle-auto","POST",{enabled:!backupStatus.backup_email_enabled},token);load();}catch(e){toast(e.message,"error");}
  };

  if(loading)return<Spinner/>;
  return(<div>
    {/* Backup reminder banner */}
    {backupStatus&&(backupStatus.days_since===null||backupStatus.days_since>14)&&(
      <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#e3b341",fontSize:13}}>Backup Reminder</div>
            <div style={{fontSize:12,color:C.sub}}>{backupStatus.days_since===null?"You've never received an emailed backup.":`Last backup email was ${backupStatus.days_since} days ago.`} Click below to email yourself a fresh backup now.</div>
          </div>
          <button onClick={emailBackupNow} disabled={sendingBackup} style={S.btn}>{sendingBackup?"Sending...":"📧 Backup Now"}</button>
        </div>
      </div>
    )}

    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>🔐 Two-Factor Authentication (OTP Login)</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:12}}>When enabled, every login requires a 6-digit OTP sent to your registered email{user?.phone?" and mobile number":""}.</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={toggle2FA} style={{...S.btn,background:twoFA?C.green:C.border,color:twoFA?"#fff":C.muted}}>{twoFA?"✅ Enabled — Click to Disable":"Enable OTP Login"}</button>
      </div>
      {!user?.phone&&<div style={{fontSize:11,color:"#e3b341",marginTop:8}}>⚠ No mobile number on file — OTP will go to email only. Add phone in Settings for SMS backup.</div>}
    </div>

    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>📱 Active Sessions ({sessions.length})</div>
      {sessions.length===0?<div style={{color:C.muted,fontSize:12}}>No active sessions</div>:sessions.map(s=>(
        <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{s.device_info?.substring(0,60)||"Unknown device"}{s.id===sessions.current_session_id&&<span style={{marginLeft:8}}>{badge("This device","green")}</span>}</div>
            <div style={{fontSize:10,color:C.muted}}>IP: {s.ip_address||"—"} · Last active: {new Date(s.last_active_at).toLocaleString("en-IN")}</div>
          </div>
          <button onClick={()=>revokeSession(s.id)} style={{...S.btnR,fontSize:10,padding:"4px 10px"}}>Logout</button>
        </div>
      ))}
      {sessions.length>1&&<button onClick={revokeOthers} style={{...S.btnO,marginTop:12,fontSize:11}}>🔒 Logout All Other Devices</button>}
    </div>

    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🔑 Change Password</div>
      <div style={S.fg}><label style={S.label}>Current Password</label><input type="password" style={S.input} value={pwForm.current_password} onChange={e=>setPwForm(p=>({...p,current_password:e.target.value}))}/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>New Password</label><input type="password" style={S.input} value={pwForm.new_password} onChange={e=>setPwForm(p=>({...p,new_password:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Confirm New Password</label><input type="password" style={S.input} value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))}/></div>
      </div>
      <button onClick={changePassword} disabled={changingPw||!pwForm.current_password||!pwForm.new_password} style={{...S.btn,opacity:!pwForm.current_password||!pwForm.new_password?0.5:1}}>{changingPw?"Changing...":"Change Password"}</button>
    </div>

    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>💾 Automatic Backup</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Weekly backup auto-emailed to <b>{backupStatus?.email}</b>. {backupStatus&&!backupStatus.smtp_configured&&<span style={{color:"#f85149"}}>⚠ Email not configured on server yet.</span>}</div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={toggleAutoBackup} style={{...S.btn,background:backupStatus?.backup_email_enabled?C.green:C.border,color:backupStatus?.backup_email_enabled?"#fff":C.muted}}>{backupStatus?.backup_email_enabled?"✅ Weekly Auto-Backup ON":"Auto-Backup OFF"}</button>
        <button onClick={emailBackupNow} disabled={sendingBackup} style={S.btnO}>{sendingBackup?"Sending...":"📧 Send Backup Now"}</button>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:8}}>Last backup email: {backupStatus?.last_backup_email_at?new Date(backupStatus.last_backup_email_at).toLocaleString("en-IN"):"Never"}</div>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════
// GST SUITE — COMPOSITION SCHEME (CMP-08, GSTR-4) + ANNUAL RETURNS (GSTR-9, GSTR-9C)
// ════════════════════════════════════════════════════════

const FY_LIST=(()=>{const arr=[];for(let y=2026;y>=2020;y--)arr.push(`${y}-${String(y+1).slice(2)}`);return arr;})();
const QUARTERS=[["Q1","Apr–Jun"],["Q2","Jul–Sep"],["Q3","Oct–Dec"],["Q4","Jan–Mar"]];

// ── CMP-08 — Quarterly Statement-cum-Challan ─────────────────────────────────
function CMP08({token,toast,company}){
  const cid=company?.id;
  const[fy,setFy]=useState(FY_LIST[1]);
  const[returns,setReturns]=useState({});
  const[editing,setEditing]=useState(null); // quarter key when form open
  const[f,setF]=useState({});
  const[loading,setLoading]=useState(true);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const load=useCallback(()=>{
    if(!cid)return;setLoading(true);
    api(`/accounting/companies/${cid}/cmp08?fy=${fy}`,"GET",null,token).then(d=>{
      const byQ={};(d.returns||[]).forEach(r=>byQ[r.quarter]=r);setReturns(byQ);setLoading(false);
    }).catch(()=>setLoading(false));
  },[cid,fy,token]);
  useEffect(()=>{load();},[load]);

  const openQuarter=async(q)=>{
    const existing=returns[q];
    if(existing){
      setF({composition_rate:String(existing.composition_rate),outward_taxable:String(existing.outward_taxable),outward_cgst:String(existing.outward_cgst),outward_sgst:String(existing.outward_sgst),outward_cess:String(existing.outward_cess),
        inward_rcm_taxable:String(existing.inward_rcm_taxable),inward_rcm_igst:String(existing.inward_rcm_igst),inward_rcm_cgst:String(existing.inward_rcm_cgst),inward_rcm_sgst:String(existing.inward_rcm_sgst),inward_rcm_cess:String(existing.inward_rcm_cess),
        interest_cgst:String(existing.interest_cgst),interest_sgst:String(existing.interest_sgst),interest_igst:String(existing.interest_igst),interest_cess:String(existing.interest_cess)});
    }else{
      try{
        const af=await api(`/accounting/companies/${cid}/cmp08/auto-fill?fy=${fy}&quarter=${q}`,"GET",null,token);
        const rate=2; // default composition rate %, editable
        const taxable=af.outward_taxable;
        setF({composition_rate:String(rate),outward_taxable:String(taxable),outward_cgst:String(Math.round(taxable*rate/2)/100),outward_sgst:String(Math.round(taxable*rate/2)/100),outward_cess:"0",
          inward_rcm_taxable:"0",inward_rcm_igst:"0",inward_rcm_cgst:"0",inward_rcm_sgst:"0",inward_rcm_cess:"0",
          interest_cgst:"0",interest_sgst:"0",interest_igst:"0",interest_cess:"0"});
      }catch(e){toast(e.message,"error");}
    }
    setEditing(q);
  };

  const recalcTax=(taxable,rate)=>{const t=(parseFloat(taxable)||0)*(parseFloat(rate)||0)/100;return{cgst:Math.round(t*50)/100,sgst:Math.round(t*50)/100};};
  const setField=(k,v)=>{
    const n={...f,[k]:v};
    if(k==="outward_taxable"||k==="composition_rate"){const{cgst,sgst}=recalcTax(k==="outward_taxable"?v:n.outward_taxable,k==="composition_rate"?v:n.composition_rate);n.outward_cgst=String(cgst);n.outward_sgst=String(sgst);}
    setF(n);
  };

  const save=async()=>{
    try{await api(`/accounting/companies/${cid}/cmp08`,"POST",{fy,quarter:editing,...f},token);toast("✅ CMP-08 saved","success");setEditing(null);load();}
    catch(e){toast(e.message,"error");}
  };
  const markFiled=async(q)=>{
    const arn=prompt("Enter ARN (Acknowledgement Reference Number) from GST portal after filing:");
    if(!arn)return;
    try{await api(`/accounting/companies/${cid}/cmp08/${returns[q].id}/file`,"POST",{arn},token);toast("✅ Marked as filed","success");load();}catch(e){toast(e.message,"error");}
  };
  const downloadCMP08=(q)=>{
    const r=returns[q];if(!r)return;
    const json=buildCMP08_JSON(r,company,fy,q);
    downloadJSON(json,`CMP08_${company.gstin||"GSTIN"}_${fy}_${q}.json`);
  };
  const printForm=(q)=>{
    const r=returns[q];if(!r)return;
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>CMP-08 ${fy} ${q}</title><style>body{font-family:Arial;font-size:12px;margin:24px}h2{text-align:center}table{width:100%;border-collapse:collapse;margin-bottom:16px}td,th{border:1px solid #000;padding:6px 8px}</style></head><body>
    <h2>FORM GST CMP-08<br/><span style="font-size:12px">[See rule 62]</span><br/><span style="font-size:13px">Statement for payment of self-assessed tax</span></h2>
    <table><tr><td><b>Company:</b> ${company.name}</td><td><b>GSTIN:</b> ${company.gstin||"—"}</td></tr>
    <tr><td><b>Financial Year:</b> ${fy}</td><td><b>Quarter:</b> ${q} (${QUARTERS.find(x=>x[0]===q)?.[1]})</td></tr></table>
    <h3>Table 3 — Summary of self-assessed liability</h3>
    <table><tr><th>Particulars</th><th>Taxable Value</th><th>Integrated Tax</th><th>Central Tax</th><th>State/UT Tax</th><th>Cess</th></tr>
    <tr><td>3(1) Outward supplies (including exempt supplies)</td><td>${fR(r.outward_taxable)}</td><td>—</td><td>${fR(r.outward_cgst)}</td><td>${fR(r.outward_sgst)}</td><td>${fR(r.outward_cess)}</td></tr>
    <tr><td>3(2) Inward supplies attracting reverse charge incl. import of services</td><td>${fR(r.inward_rcm_taxable)}</td><td>${fR(r.inward_rcm_igst)}</td><td>${fR(r.inward_rcm_cgst)}</td><td>${fR(r.inward_rcm_sgst)}</td><td>${fR(r.inward_rcm_cess)}</td></tr>
    <tr><td><b>3(3) Tax payable (1+2)</b></td><td>—</td><td><b>${fR(r.inward_rcm_igst)}</b></td><td><b>${fR(r.outward_cgst+r.inward_rcm_cgst)}</b></td><td><b>${fR(r.outward_sgst+r.inward_rcm_sgst)}</b></td><td><b>${fR(r.outward_cess+r.inward_rcm_cess)}</b></td></tr>
    <tr><td>3(4) Interest payable, if any</td><td>—</td><td>${fR(r.interest_igst)}</td><td>${fR(r.interest_cgst)}</td><td>${fR(r.interest_sgst)}</td><td>${fR(r.interest_cess)}</td></tr>
    <tr><td><b>3(5) Total tax and interest payable</b></td><td>—</td><td><b>${fR(r.inward_rcm_igst+r.interest_igst)}</b></td><td><b>${fR(r.outward_cgst+r.inward_rcm_cgst+r.interest_cgst)}</b></td><td><b>${fR(r.outward_sgst+r.inward_rcm_sgst+r.interest_sgst)}</b></td><td><b>${fR(r.outward_cess+r.inward_rcm_cess+r.interest_cess)}</b></td></tr>
    </table>
    ${r.arn?`<p><b>ARN:</b> ${r.arn} &nbsp;&nbsp; <b>Filed on:</b> ${new Date(r.filed_date).toLocaleDateString("en-IN")}</p>`:""}
    <p>Verification: I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief.</p>
    <br/><p>Date: _____________ &nbsp;&nbsp;&nbsp; Signature: _____________</p>
    <script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>📋 FORM GST CMP-08 — Quarterly Statement (Composition Dealers)</div>
      <div style={{fontSize:12,color:C.sub}}>Self-assessed tax statement under Rule 62. Composition dealers cannot make inter-state outward supplies — IGST on outward is always nil.</div>
    </div>
    <div style={{marginBottom:14}}><select style={{...S.select,width:140}} value={fy} onChange={e=>setFy(e.target.value)}>{FY_LIST.map(y=><option key={y}>{y}</option>)}</select></div>
    {loading?<Spinner/>:(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        {QUARTERS.map(([q,label])=>{const r=returns[q];return(
          <div key={q} style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontWeight:700,color:C.text}}>{q} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>({label})</span></div>
              {r?(r.status==="filed"?badge("Filed","green"):badge("Draft","amber")):badge("Not Started","gray")}
            </div>
            {r&&<div style={{fontSize:12,color:C.sub,marginBottom:10}}>
              <div>Taxable: {fR(r.outward_taxable)}</div>
              <div>Tax: {fR(r.outward_cgst+r.outward_sgst+r.inward_rcm_igst+r.inward_rcm_cgst+r.inward_rcm_sgst)}</div>
            </div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>openQuarter(q)} style={{...S.btnO,fontSize:11,padding:"5px 10px"}}>{r?"Edit":"Prepare"}</button>
              {r&&<button onClick={()=>printForm(q)} style={{...S.btnO,fontSize:11,padding:"5px 10px"}}>🖨 Print</button>}
              {r&&<button onClick={()=>downloadCMP08(q)} style={{...S.btnO,fontSize:11,padding:"5px 10px"}}>⬇ JSON</button>}
              {r&&r.status!=="filed"&&<button onClick={()=>markFiled(q)} style={{...S.btnG,fontSize:11,padding:"5px 10px"}}>Mark Filed</button>}
            </div>
          </div>
        );})}
      </div>
    )}
    {editing&&(<Modal title={`CMP-08 — ${editing} ${fy}`} onClose={()=>setEditing(null)} wide>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,marginBottom:8,color:"#58a6ff"}}>3(1) Outward Supplies (incl. exempt)</div>
        <div style={S.col3}>
          <div style={S.fg}><label style={S.label}>Composition Rate %</label><select style={S.select} value={f.composition_rate} onChange={e=>setField("composition_rate",e.target.value)}><option value="1">1% (Trader)</option><option value="2">2% (Manufacturer)</option><option value="5">5% (Restaurant)</option><option value="6">6% (Services)</option></select></div>
          <div style={S.fg}><label style={S.label}>Taxable Value (Turnover)</label><input type="number" style={S.input} value={f.outward_taxable} onChange={e=>setField("outward_taxable",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Cess</label><input type="number" style={S.input} value={f.outward_cess} onChange={e=>setField("outward_cess",e.target.value)}/></div>
        </div>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>Central Tax (auto)</label><input type="number" style={{...S.input,background:"#0D1117"}} value={f.outward_cgst} readOnly/></div>
          <div style={S.fg}><label style={S.label}>State/UT Tax (auto)</label><input type="number" style={{...S.input,background:"#0D1117"}} value={f.outward_sgst} readOnly/></div>
        </div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,marginBottom:8,color:"#e3b341"}}>3(2) Inward Supplies attracting Reverse Charge</div>
        <div style={S.col3}>
          <div style={S.fg}><label style={S.label}>Taxable Value</label><input type="number" style={S.input} value={f.inward_rcm_taxable} onChange={e=>setField("inward_rcm_taxable",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Integrated Tax</label><input type="number" style={S.input} value={f.inward_rcm_igst} onChange={e=>setField("inward_rcm_igst",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Cess</label><input type="number" style={S.input} value={f.inward_rcm_cess} onChange={e=>setField("inward_rcm_cess",e.target.value)}/></div>
        </div>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>Central Tax</label><input type="number" style={S.input} value={f.inward_rcm_cgst} onChange={e=>setField("inward_rcm_cgst",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>State/UT Tax</label><input type="number" style={S.input} value={f.inward_rcm_sgst} onChange={e=>setField("inward_rcm_sgst",e.target.value)}/></div>
        </div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginBottom:10}}>
        <div style={{fontWeight:600,marginBottom:8,color:"#f85149"}}>3(4) Interest Payable (if filed late)</div>
        <div style={S.col3}>
          <div style={S.fg}><label style={S.label}>Integrated Tax</label><input type="number" style={S.input} value={f.interest_igst} onChange={e=>setField("interest_igst",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>Central Tax</label><input type="number" style={S.input} value={f.interest_cgst} onChange={e=>setField("interest_cgst",e.target.value)}/></div>
          <div style={S.fg}><label style={S.label}>State Tax</label><input type="number" style={S.input} value={f.interest_sgst} onChange={e=>setField("interest_sgst",e.target.value)}/></div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setEditing(null)} style={S.btnO}>Cancel</button><button onClick={save} style={S.btn}>Save</button></div>
    </Modal>)}
  </div>);
}

// ── GSTR-4 — Annual Return for Composition Taxpayers ─────────────────────────
function GSTR4({token,toast,company}){
  const cid=company?.id;
  const[fy,setFy]=useState(FY_LIST[1]);
  const[ret,setRet]=useState(null);
  const[af,setAf]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const[table6,setTable6]=useState({taxable:"0",cgst:"0",sgst:"0",cess:"0"});
  const[table7,setTable7]=useState({igst:"0",cgst:"0",sgst:"0"});
  const[table8,setTable8]=useState({interest_payable:"0",interest_paid:"0",late_fee_payable:"0",late_fee_paid:"0"});

  const load=useCallback(async()=>{
    if(!cid)return;setLoading(true);
    try{
      const[r,a]=await Promise.all([
        api(`/accounting/companies/${cid}/gstr4?fy=${fy}`,"GET",null,token),
        api(`/accounting/companies/${cid}/gstr4/auto-fill?fy=${fy}`,"GET",null,token),
      ]);
      setRet(r.return);setAf(a);
      if(r.return?.data){
        setTable6(r.return.data.table6||table6);
        setTable7(r.return.data.table7||table7);
        setTable8(r.return.data.table8||table8);
      }
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  },[cid,fy,token]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{
    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/gstr4`,"POST",{fy,data:{table4a:af?.table4a,table5:af?.table5,table5_total:af?.table5_total,table6,table7,table8}},token);
      toast("✅ GSTR-4 saved","success");
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const markFiled=async()=>{
    const arn=prompt("Enter ARN from GST portal:");if(!arn)return;
    try{await api(`/accounting/companies/${cid}/gstr4/file`,"POST",{fy,arn},token);toast("✅ Marked filed","success");load();}catch(e){toast(e.message,"error");}
  };

  if(!cid)return null;
  if(loading)return<Spinner/>;

  const t5=af?.table5_total||{taxable:0,cgst:0,sgst:0,cess:0};
  const totalTaxPayable=t5.cgst+t5.sgst+t5.cess;

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>📄 FORM GSTR-4 — Annual Return (Composition Taxpayer)</div>
      <div style={{fontSize:12,color:C.sub}}>Auto-aggregates your 4 quarterly CMP-08 filings for the year. File all 4 quarters' CMP-08 first for accurate Table 5.</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <select style={{...S.select,width:140}} value={fy} onChange={e=>setFy(e.target.value)}>{FY_LIST.map(y=><option key={y}>{y}</option>)}</select>
      {ret&&(ret.status==="filed"?badge("Filed — ARN: "+ret.arn,"green"):badge("Draft","amber"))}
    </div>

    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>Table 4A — Inward Supplies from Registered Suppliers</div>
      {af?.table4a?.length>0?(
        <div className="tp-table-wrap"><table style={S.tbl}><thead><tr>{["Supplier","GSTIN","Invoices","Taxable Value","Tax"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{af.table4a.map((s,i)=>(<tr key={i}><td style={S.td}>{s.party_name}</td><td style={{...S.td,...S.mono}}>{s.gstin||"—"}</td><td style={S.td}>{s.cnt}</td><td style={S.td}>{fR(s.taxable)}</td><td style={S.td}>{fR(s.tax)}</td></tr>))}</tbody></table></div>
      ):<div style={{color:C.muted,fontSize:12}}>No purchase invoices recorded for this FY.</div>}
    </div>

    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>Table 5 — Summary of Self-Assessed Liability (from CMP-08)</div>
      <table style={S.tbl}><thead><tr>{["Quarter","Status","Taxable Value","Central Tax","State Tax","Cess"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{QUARTERS.map(([q])=>{const r=af?.table5?.[q];return(
        <tr key={q}><td style={S.td}>{q}</td><td style={S.td}>{r?badge(r.status,r.status==="filed"?"green":"amber"):badge("Not filed","red")}</td><td style={S.td}>{r?fR(r.taxable):"—"}</td><td style={S.td}>{r?fR(r.cgst):"—"}</td><td style={S.td}>{r?fR(r.sgst):"—"}</td><td style={S.td}>{r?fR(r.cess):"—"}</td></tr>
      );})}</tbody>
      <tfoot><tr style={{fontWeight:700,background:"#0c1d2e"}}><td colSpan={2} style={S.td}>Total</td><td style={S.td}>{fR(t5.taxable)}</td><td style={S.td}>{fR(t5.cgst)}</td><td style={S.td}>{fR(t5.sgst)}</td><td style={S.td}>{fR(t5.cess)}</td></tr></tfoot>
      </table>
    </div>

    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>Table 7 — TDS/TCS Credit Received</div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Integrated Tax</label><input type="number" style={S.input} value={table7.igst} onChange={e=>setTable7(p=>({...p,igst:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Central Tax</label><input type="number" style={S.input} value={table7.cgst} onChange={e=>setTable7(p=>({...p,cgst:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>State Tax</label><input type="number" style={S.input} value={table7.sgst} onChange={e=>setTable7(p=>({...p,sgst:e.target.value}))}/></div>
      </div>
    </div>

    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>Table 8 — Interest &amp; Late Fee Payable/Paid</div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Interest Payable</label><input type="number" style={S.input} value={table8.interest_payable} onChange={e=>setTable8(p=>({...p,interest_payable:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Interest Paid</label><input type="number" style={S.input} value={table8.interest_paid} onChange={e=>setTable8(p=>({...p,interest_paid:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Late Fee Payable</label><input type="number" style={S.input} value={table8.late_fee_payable} onChange={e=>setTable8(p=>({...p,late_fee_payable:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Late Fee Paid</label><input type="number" style={S.input} value={table8.late_fee_paid} onChange={e=>setTable8(p=>({...p,late_fee_paid:e.target.value}))}/></div>
      </div>
    </div>

    <div style={{...S.card,background:"#0d2818",border:"1px solid #238636"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total Tax Payable (Table 5)</span><span style={{color:"#3fb950"}}>{fR(totalTaxPayable)}</span></div>
    </div>

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
      <GSTDownloadBar disabled={!af}
        onJson={()=>downloadJSON({gstin:company.gstin,fy,table4a:af?.table4a,table5:af?.table5,table5_total:af?.table5_total,table6,table7,table8},`GSTR4_${company.gstin||"GSTIN"}_${fy}.json`)}
        onPdf={()=>{const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});const t5=af?.table5_total||{};const body=`<h3>Table 5 — CMP-08 Quarterly Summary</h3><table><tr><th>Quarter</th><th>Taxable</th><th>CGST</th><th>SGST</th></tr>${["Q1","Q2","Q3","Q4"].map(q=>`<tr><td>${q}</td><td>${n(af?.table5?.[q]?.taxable||0)}</td><td>${n(af?.table5?.[q]?.cgst||0)}</td><td>${n(af?.table5?.[q]?.sgst||0)}</td></tr>`).join("")}<tr><td><b>Total</b></td><td><b>${n(t5.taxable)}</b></td><td><b>${n(t5.cgst)}</b></td><td><b>${n(t5.sgst)}</b></td></tr></table>`;openPrintWindow(buildPrintHTML("FORM GSTR-4 — Annual Return (Composition)",company.gstin||"",company.name,fy,body),`GSTR4_${company.gstin}.pdf`);}}
      />
      <button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"💾 Save Draft"}</button>
      {ret?.status!=="filed"&&<button onClick={markFiled} style={S.btnG}>Mark as Filed</button>}
    </div>
  </div>);
}

// ── GSTR-9 — Annual Return for Regular Taxpayers (full official table structure) ──
function GSTR9({token,toast,company}){
  const cid=company?.id;
  const[fy,setFy]=useState(FY_LIST[1]);
  const[ret,setRet]=useState(null);
  const[af,setAf]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[open,setOpen]=useState({part2:true});
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const blank4={taxable:"0",igst:"0",cgst:"0",sgst:"0",cess:"0"};
  const[table4,setTable4]=useState({b2b:{...blank4},b2c:{...blank4},exports_with_tax:{...blank4},exports_without_tax:{taxable:"0"},sez_with_tax:{...blank4},sez_without_tax:{taxable:"0"},deemed_exports:{...blank4},advances:{...blank4},rcm_inward:{...blank4},credit_notes:{...blank4},debit_notes:{...blank4}});
  const[table5,setTable5]=useState({exempted:{taxable:"0"},nil_rated:{taxable:"0"},non_gst:{taxable:"0"},no_supply:{taxable:"0"}});
  const blank6={igst:"0",cgst:"0",sgst:"0",cess:"0"};
  const[table6,setTable6]=useState({inputs:{...blank6},capital_goods:{...blank6},input_services:{...blank6},import_goods:{...blank6},import_services:{...blank6},isd:{...blank6},itc_total_availed:"0"});
  const[table7,setTable7]=useState({rule37:{...blank6},rule42:{...blank6},sec17_5:{...blank6},others:{...blank6},total_reversed:"0"});
  const[table8,setTable8]=useState({itc_2a:"0",itc_lapsed:"0"});
  const[table9,setTable9]=useState({
    tax_payable:{igst:"0",cgst:"0",sgst:"0",cess:"0"},
    tax_paid_cash:{igst:"0",cgst:"0",sgst:"0",cess:"0"},
    tax_paid_itc:{igst:"0",cgst:"0",sgst:"0",cess:"0"},
    interest_paid:"0",late_fee_paid:"0",
  });
  const[table10_13,setTable10_13]=useState({supplies_added:{...blank4},supplies_reduced:{...blank4},itc_reversed_prev:"0",itc_availed_prev:"0"});
  const[table14,setTable14]=useState({tax_paid:"0"});
  const[table15,setTable15]=useState({refund_claimed:"0",refund_sanctioned:"0",refund_rejected:"0",refund_pending:"0",demand_raised:"0",demand_paid:"0",demand_pending:"0"});
  const[table16,setTable16]=useState({composition_inward:"0",deemed_supply:"0",goods_on_approval:"0"});
  const[table19,setTable19]=useState({late_fee_central:"0",late_fee_state:"0"});
  const[hsnOut,setHsnOut]=useState([]);const[hsnIn,setHsnIn]=useState([]);

  const load=useCallback(async()=>{
    if(!cid)return;setLoading(true);
    try{
      const[r,a]=await Promise.all([
        api(`/accounting/companies/${cid}/gstr9?fy=${fy}`,"GET",null,token),
        api(`/accounting/companies/${cid}/gstr9/auto-fill?fy=${fy}`,"GET",null,token),
      ]);
      setRet(r.return);setAf(a);
      setHsnOut(a.table17_hsn_outward||[]);setHsnIn(a.table18_hsn_inward||[]);
      if(r.return?.data){
        const d=r.return.data;
        if(d.table4)setTable4(d.table4);if(d.table5)setTable5(d.table5);
        if(d.table6)setTable6(d.table6);if(d.table7)setTable7(d.table7);if(d.table8)setTable8(d.table8);
        if(d.table9)setTable9(d.table9);if(d.table10_13)setTable10_13(d.table10_13);
        if(d.table15)setTable15(d.table15);if(d.table16)setTable16(d.table16);if(d.table19)setTable19(d.table19);
      }else if(a){
        setTable4(p=>({...p,b2b:{taxable:String(a.table4.b2b.taxable),igst:String(a.table4.b2b.igst),cgst:String(a.table4.b2b.cgst),sgst:String(a.table4.b2b.sgst),cess:"0"},
          b2c:{taxable:String(a.table4.b2c.taxable),igst:String(a.table4.b2c.igst),cgst:String(a.table4.b2c.cgst),sgst:String(a.table4.b2c.sgst),cess:"0"}}));
        setTable6(p=>({...p,inputs:{igst:String(a.table6b.igst),cgst:String(a.table6b.cgst),sgst:String(a.table6b.sgst),cess:"0"},
          itc_total_availed:String(a.table6b.igst+a.table6b.cgst+a.table6b.sgst)}));
      }
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  },[cid,fy,token]);
  useEffect(()=>{load();},[load]);

  const num=v=>parseFloat(v)||0;
  const sumRow=r=>num(r.igst)+num(r.cgst)+num(r.sgst)+num(r.cess);
  const table4TaxableTotal=()=>Object.values(table4).reduce((a,r)=>a+num(r.taxable),0)-num(table4.credit_notes?.taxable||0)+num(table4.debit_notes?.taxable||0);
  const itcAvailedTotal=()=>["inputs","capital_goods","input_services","import_goods","import_services","isd"].reduce((a,k)=>a+sumRow(table6[k]||{}),0);
  const itcReversedTotal=()=>["rule37","rule42","sec17_5","others"].reduce((a,k)=>a+sumRow(table7[k]||{}),0);
  const netItc=()=>itcAvailedTotal()-itcReversedTotal();
  const taxPayableTotal=()=>sumRow(table9.tax_payable);
  const taxPaidTotal=()=>sumRow(table9.tax_paid_cash)+sumRow(table9.tax_paid_itc);

  const save=async()=>{
    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/gstr9`,"POST",{fy,data:{table4,table5,table6:{...table6,itc_total_availed:String(itcAvailedTotal())},table7:{...table7,total_reversed:String(itcReversedTotal())},table8,table9,table10_13,table14,table15,table16,table19,table17_hsn_outward:hsnOut,table18_hsn_inward:hsnIn}},token);
      toast("✅ GSTR-9 saved","success");
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const markFiled=async()=>{
    const arn=prompt("Enter ARN from GST portal:");if(!arn)return;
    try{await api(`/accounting/companies/${cid}/gstr9/file`,"POST",{fy,arn},token);toast("✅ Marked filed","success");load();}catch(e){toast(e.message,"error");}
  };

  const Section=({id,title,color,children})=>(
    <div style={{...S.card,borderLeft:`3px solid ${color}`}}>
      <div onClick={()=>setOpen(p=>({...p,[id]:!p[id]}))} style={{display:"flex",justifyContent:"space-between",cursor:"pointer",alignItems:"center"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13}}>{open[id]?"▾":"▸"} {title}</div>
      </div>
      {open[id]&&<div style={{marginTop:14}}>{children}</div>}
    </div>
  );
  const RateRow=({label,obj,setObj,fields=["taxable","igst","cgst","sgst","cess"]})=>(
    <div style={{display:"grid",gridTemplateColumns:`180px repeat(${fields.length},1fr)`,gap:8,alignItems:"center",marginBottom:6}}>
      <div style={{fontSize:12,color:C.sub}}>{label}</div>
      {fields.map(f=><input key={f} type="number" style={{...S.input,fontSize:11,padding:"5px 8px"}} value={obj[f]||"0"} onChange={e=>setObj(p=>({...p,[f]:e.target.value}))} placeholder={f}/>)}
    </div>
  );
  const RateHeader=({fields=["taxable","igst","cgst","sgst","cess"]})=>(
    <div style={{display:"grid",gridTemplateColumns:`180px repeat(${fields.length},1fr)`,gap:8,marginBottom:6}}>
      <div/>{fields.map(f=><div key={f} style={{fontSize:10,color:C.muted,textTransform:"uppercase"}}>{f==="taxable"?"Taxable Val.":f==="igst"?"Integrated Tax":f==="cgst"?"Central Tax":f==="sgst"?"State Tax":"Cess"}</div>)}
    </div>
  );

  if(!cid)return null;
  if(loading)return<Spinner/>;

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>📊 FORM GSTR-9 — Annual Return (Regular Taxpayer)</div>
      <div style={{fontSize:12,color:C.sub}}>{company.name} · GSTIN: {company.gstin||"—"} · FY {fy}. Auto-filled fields are estimates from your books — review and adjust before filing.</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <select style={{...S.select,width:140}} value={fy} onChange={e=>setFy(e.target.value)}>{FY_LIST.map(y=><option key={y}>{y}</option>)}</select>
      {ret&&(ret.status==="filed"?badge("Filed — ARN: "+ret.arn,"green"):badge("Draft","amber"))}
      {af&&<span style={{fontSize:11,color:C.muted}}>{af.invoice_count?.sales||0} sales, {af.invoice_count?.purchase||0} purchase invoices found for FY</span>}
    </div>

    {/* PART II — Table 4 & 5: Outward Supplies */}
    <Section id="part2" title="Part II — Outward & Inward Supplies (Table 4 & 5)" color="#1F6FEB">
      <div style={{fontSize:11,color:"#58a6ff",fontWeight:600,marginBottom:6}}>Table 4 — Supplies/advances on which tax IS payable</div>
      <RateHeader/>
      <RateRow label="4A: To unregistered persons (B2C)" obj={table4.b2c} setObj={v=>setTable4(p=>({...p,b2c:typeof v==="function"?v(p.b2c):v}))}/>
      <RateRow label="4B: To registered persons (B2B)" obj={table4.b2b} setObj={v=>setTable4(p=>({...p,b2b:typeof v==="function"?v(p.b2b):v}))}/>
      <RateRow label="4C: Exports with payment of tax" obj={table4.exports_with_tax} setObj={v=>setTable4(p=>({...p,exports_with_tax:typeof v==="function"?v(p.exports_with_tax):v}))}/>
      <RateRow label="4D: Supply to SEZ with tax" obj={table4.sez_with_tax} setObj={v=>setTable4(p=>({...p,sez_with_tax:typeof v==="function"?v(p.sez_with_tax):v}))}/>
      <RateRow label="4E: Deemed Exports" obj={table4.deemed_exports} setObj={v=>setTable4(p=>({...p,deemed_exports:typeof v==="function"?v(p.deemed_exports):v}))}/>
      <RateRow label="4F: Advances (tax paid, no invoice)" obj={table4.advances} setObj={v=>setTable4(p=>({...p,advances:typeof v==="function"?v(p.advances):v}))}/>
      <RateRow label="4G: Inward supplies — RCM" obj={table4.rcm_inward} setObj={v=>setTable4(p=>({...p,rcm_inward:typeof v==="function"?v(p.rcm_inward):v}))}/>
      <RateRow label="4I: Credit Notes issued (−)" obj={table4.credit_notes} setObj={v=>setTable4(p=>({...p,credit_notes:typeof v==="function"?v(p.credit_notes):v}))}/>
      <RateRow label="4J: Debit Notes issued (+)" obj={table4.debit_notes} setObj={v=>setTable4(p=>({...p,debit_notes:typeof v==="function"?v(p.debit_notes):v}))}/>
      <div style={{...S.card,background:"#0D1117",marginTop:10,padding:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>4N: Total Taxable Value</span><span style={{color:"#3fb950"}}>{fR(table4TaxableTotal())}</span></div>
      </div>

      <div style={{fontSize:11,color:"#e3b341",fontWeight:600,marginTop:18,marginBottom:6}}>Table 5 — Outward supplies on which tax is NOT payable</div>
      <div style={S.col2}>
        {[["5A/5B: Exports/SEZ without tax","exports_without_tax"],["5D: Exempted","exempted"],["5E: Nil Rated","nil_rated"],["5F: Non-GST supply","non_gst"]].map(([l,k])=>(
          <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={table5[k]?.taxable||"0"} onChange={e=>setTable5(p=>({...p,[k]:{taxable:e.target.value}}))}/></div>
        ))}
      </div>
    </Section>

    {/* PART III — Table 6, 7, 8: ITC */}
    <Section id="part3" title="Part III — Input Tax Credit (Table 6, 7 & 8)" color="#238636">
      <div style={{fontSize:11,color:"#3fb950",fontWeight:600,marginBottom:6}}>Table 6 — ITC Availed</div>
      <RateHeader fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6B: Inputs" obj={table6.inputs} setObj={v=>setTable6(p=>({...p,inputs:typeof v==="function"?v(p.inputs):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6B: Capital Goods" obj={table6.capital_goods} setObj={v=>setTable6(p=>({...p,capital_goods:typeof v==="function"?v(p.capital_goods):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6B: Input Services" obj={table6.input_services} setObj={v=>setTable6(p=>({...p,input_services:typeof v==="function"?v(p.input_services):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6E: Import of Goods" obj={table6.import_goods} setObj={v=>setTable6(p=>({...p,import_goods:typeof v==="function"?v(p.import_goods):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6F: Import of Services" obj={table6.import_services} setObj={v=>setTable6(p=>({...p,import_services:typeof v==="function"?v(p.import_services):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="6G: ITC from ISD" obj={table6.isd} setObj={v=>setTable6(p=>({...p,isd:typeof v==="function"?v(p.isd):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <div style={{...S.card,background:"#0D1117",marginTop:10,padding:10}}><div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>6O: Total ITC Availed</span><span style={{color:"#3fb950"}}>{fR(itcAvailedTotal())}</span></div></div>

      <div style={{fontSize:11,color:"#f85149",fontWeight:600,marginTop:18,marginBottom:6}}>Table 7 — ITC Reversed &amp; Ineligible</div>
      <RateHeader fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="7A: As per Rule 37" obj={table7.rule37} setObj={v=>setTable7(p=>({...p,rule37:typeof v==="function"?v(p.rule37):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="7C/D: As per Rule 42/43" obj={table7.rule42} setObj={v=>setTable7(p=>({...p,rule42:typeof v==="function"?v(p.rule42):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="7E: As per Section 17(5)" obj={table7.sec17_5} setObj={v=>setTable7(p=>({...p,sec17_5:typeof v==="function"?v(p.sec17_5):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <RateRow label="7H: Other reversals" obj={table7.others} setObj={v=>setTable7(p=>({...p,others:typeof v==="function"?v(p.others):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <div style={{...S.card,background:"#0D1117",marginTop:10,padding:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,marginBottom:4}}><span>7I: Total ITC Reversed</span><span style={{color:"#f85149"}}>{fR(itcReversedTotal())}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>7J: Net ITC Available (6O − 7I)</span><span style={{color:"#58a6ff"}}>{fR(netItc())}</span></div>
      </div>

      <div style={{fontSize:11,color:"#bf91f3",fontWeight:600,marginTop:18,marginBottom:6}}>Table 8 — Other ITC Information</div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>8A: ITC as per GSTR-2A/2B</label><input type="number" style={S.input} value={table8.itc_2a} onChange={e=>setTable8(p=>({...p,itc_2a:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>8K: ITC Lapsed</label><input type="number" style={S.input} value={table8.itc_lapsed} onChange={e=>setTable8(p=>({...p,itc_lapsed:e.target.value}))}/></div>
      </div>
    </Section>

    {/* PART IV — Table 9: Tax Paid */}
    <Section id="part4" title="Part IV — Tax Paid (Table 9)" color="#9333ea">
      {af?.table9_ledgers?.length>0&&<div style={{...S.card,background:"#0c1922",marginBottom:10,padding:10}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>From your GST ledgers (net movement during the FY):</div>
        {af.table9_ledgers.map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}><span>{l.name}</span><span>{fR(l.net)}</span></div>)}
      </div>}
      <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Tax Payable</div>
      <RateRow label="" obj={table9.tax_payable} setObj={v=>setTable9(p=>({...p,tax_payable:typeof v==="function"?v(p.tax_payable):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <div style={{fontSize:11,color:C.muted,fontWeight:600,marginTop:10,marginBottom:6}}>Paid through Cash</div>
      <RateRow label="" obj={table9.tax_paid_cash} setObj={v=>setTable9(p=>({...p,tax_paid_cash:typeof v==="function"?v(p.tax_paid_cash):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <div style={{fontSize:11,color:C.muted,fontWeight:600,marginTop:10,marginBottom:6}}>Paid through ITC</div>
      <RateRow label="" obj={table9.tax_paid_itc} setObj={v=>setTable9(p=>({...p,tax_paid_itc:typeof v==="function"?v(p.tax_paid_itc):v}))} fields={["igst","cgst","sgst","cess"]}/>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Interest Paid</label><input type="number" style={S.input} value={table9.interest_paid} onChange={e=>setTable9(p=>({...p,interest_paid:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Late Fee Paid</label><input type="number" style={S.input} value={table9.late_fee_paid} onChange={e=>setTable9(p=>({...p,late_fee_paid:e.target.value}))}/></div>
      </div>
      <div style={{...S.card,background:taxPayableTotal()<=taxPaidTotal()?"#0d2818":"#2d0e0e",marginTop:10,padding:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total Payable: {fR(taxPayableTotal())}</span><span>Total Paid: {fR(taxPaidTotal())}</span></div>
      </div>
    </Section>

    {/* PART V — Table 10-13 */}
    <Section id="part5" title="Part V — Prior-year transactions declared in returns of Apr–Sep current FY (Table 10-13)" color="#d97706">
      <RateHeader/>
      <RateRow label="10/11: Supplies amended/reduced" obj={table10_13.supplies_added} setObj={v=>setTable10_13(p=>({...p,supplies_added:typeof v==="function"?v(p.supplies_added):v}))}/>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>12: ITC reversed (prev. FY)</label><input type="number" style={S.input} value={table10_13.itc_reversed_prev} onChange={e=>setTable10_13(p=>({...p,itc_reversed_prev:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>13: ITC availed (prev. FY)</label><input type="number" style={S.input} value={table10_13.itc_availed_prev} onChange={e=>setTable10_13(p=>({...p,itc_availed_prev:e.target.value}))}/></div>
      </div>
    </Section>

    {/* PART VI — Table 14-19 */}
    <Section id="part6" title="Part VI — Other Information (Table 14-19)" color="#e11d48">
      <div style={S.fg}><label style={S.label}>14: Differential tax paid on account of 10 &amp; 11</label><input type="number" style={S.input} value={table14.tax_paid} onChange={e=>setTable14({tax_paid:e.target.value})}/></div>
      <div style={{fontSize:11,color:"#58a6ff",fontWeight:600,marginTop:14,marginBottom:6}}>Table 15 — Demands &amp; Refunds</div>
      <div style={S.col3}>
        {[["Refund Claimed","refund_claimed"],["Refund Sanctioned","refund_sanctioned"],["Refund Rejected","refund_rejected"],["Refund Pending","refund_pending"],["Demand Raised","demand_raised"],["Demand Paid","demand_paid"]].map(([l,k])=>(
          <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={table15[k]} onChange={e=>setTable15(p=>({...p,[k]:e.target.value}))}/></div>
        ))}
      </div>
      <div style={{fontSize:11,color:"#bf91f3",fontWeight:600,marginTop:14,marginBottom:6}}>Table 16 — Composition/Deemed Supply/Goods on Approval</div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Inward from Composition</label><input type="number" style={S.input} value={table16.composition_inward} onChange={e=>setTable16(p=>({...p,composition_inward:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Deemed Supply u/s 143</label><input type="number" style={S.input} value={table16.deemed_supply} onChange={e=>setTable16(p=>({...p,deemed_supply:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Goods Sent on Approval</label><input type="number" style={S.input} value={table16.goods_on_approval} onChange={e=>setTable16(p=>({...p,goods_on_approval:e.target.value}))}/></div>
      </div>

      <div style={{fontSize:11,color:"#3fb950",fontWeight:600,marginTop:14,marginBottom:6}}>Table 17 — HSN-wise Summary of Outward Supplies</div>
      {hsnOut.length>0?(
        <div className="tp-table-wrap"><table style={S.tbl}><thead><tr>{["HSN","Description","UQC","Qty","Taxable Value","Tax"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{hsnOut.map((h,i)=><tr key={i}><td style={{...S.td,...S.mono}}>{h.hsn}</td><td style={S.td}>{h.description}</td><td style={S.td}>{h.uqc}</td><td style={S.td}>{h.quantity}</td><td style={S.td}>{fR(h.taxable_value)}</td><td style={S.td}>{fR(h.tax)}</td></tr>)}</tbody></table></div>
      ):<div style={{color:C.muted,fontSize:12}}>No HSN data found — ensure invoice items have HSN/SAC codes filled in.</div>}

      <div style={{fontSize:11,color:"#e3b341",fontWeight:600,marginTop:14,marginBottom:6}}>Table 18 — HSN-wise Summary of Inward Supplies</div>
      {hsnIn.length>0?(
        <div className="tp-table-wrap"><table style={S.tbl}><thead><tr>{["HSN","Description","UQC","Qty","Taxable Value","Tax"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{hsnIn.map((h,i)=><tr key={i}><td style={{...S.td,...S.mono}}>{h.hsn}</td><td style={S.td}>{h.description}</td><td style={S.td}>{h.uqc}</td><td style={S.td}>{h.quantity}</td><td style={S.td}>{fR(h.taxable_value)}</td><td style={S.td}>{fR(h.tax)}</td></tr>)}</tbody></table></div>
      ):<div style={{color:C.muted,fontSize:12}}>No HSN data found.</div>}

      <div style={{fontSize:11,color:"#f85149",fontWeight:600,marginTop:14,marginBottom:6}}>Table 19 — Late Fee Payable &amp; Paid</div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Central Tax Late Fee</label><input type="number" style={S.input} value={table19.late_fee_central} onChange={e=>setTable19(p=>({...p,late_fee_central:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>State Tax Late Fee</label><input type="number" style={S.input} value={table19.late_fee_state} onChange={e=>setTable19(p=>({...p,late_fee_state:e.target.value}))}/></div>
      </div>
    </Section>

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10,flexWrap:"wrap"}}>
      <GSTDownloadBar disabled={false}
        onJson={()=>{downloadJSON({gstin:company.gstin,fy,table4,table5,table6:{...table6,itc_total_availed:String(itcAvailedTotal())},table7:{...table7,total_reversed:String(itcReversedTotal())},table8,table9,table10_13,table15,table16,table19,table17_hsn_outward:hsnOut,table18_hsn_inward:hsnIn},`GSTR9_${company.gstin||"GSTIN"}_${fy}.json`);}}
        onExcel={()=>{const XLSX=window.XLSX||null;if(!XLSX)return alert("Reload for Excel");const n=v=>parseFloat(v)||0;const wb=XLSX.utils.book_new();const rows=[["GSTR-9 Annual Return"],["FY:",fy,"GSTIN:",company.gstin||""],[""],["Table","Particulars","Taxable","IGST","CGST","SGST"],["4A","B2B Outward",n(table4.b2b?.taxable),n(table4.b2b?.igst),n(table4.b2b?.cgst),n(table4.b2b?.sgst)],["4A","B2C Outward",n(table4.b2c?.taxable),n(table4.b2c?.igst),n(table4.b2c?.cgst),n(table4.b2c?.sgst)],["6O","ITC Availed",itcAvailedTotal()],["7I","ITC Reversed",itcReversedTotal()],["7J","Net ITC",netItc()],["9","Tax Payable",n(table9.tax_payable?.igst)+n(table9.tax_payable?.cgst)+n(table9.tax_payable?.sgst)]];const ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,"GSTR-9");const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});const blob=new Blob([buf],{type:"application/octet-stream"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GSTR9_${company.gstin||"GSTIN"}_${fy}.xlsx`;a.click();}}
        onPdf={()=>{const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});const body=`<h3>Part II — Table 4 Outward</h3><table><tr><th>Category</th><th>Taxable</th><th>IGST</th><th>CGST</th><th>SGST</th></tr><tr><td>B2B</td><td>${n(table4.b2b?.taxable)}</td><td>${n(table4.b2b?.igst)}</td><td>${n(table4.b2b?.cgst)}</td><td>${n(table4.b2b?.sgst)}</td></tr><tr><td>B2C</td><td>${n(table4.b2c?.taxable)}</td><td>${n(table4.b2c?.igst)}</td><td>${n(table4.b2c?.cgst)}</td><td>${n(table4.b2c?.sgst)}</td></tr></table><h3>Part III — ITC</h3><table><tr><th>Particulars</th><th>Amount</th></tr><tr><td>6O Total ITC Availed</td><td>${n(itcAvailedTotal())}</td></tr><tr><td>7I Total ITC Reversed</td><td>${n(itcReversedTotal())}</td></tr><tr><td>7J Net ITC</td><td><b>${n(netItc())}</b></td></tr></table><h3>Part IV — Tax Payment</h3><table><tr><th>Particulars</th><th>IGST</th><th>CGST</th><th>SGST</th></tr><tr><td>Payable</td><td>${n(table9.tax_payable?.igst)}</td><td>${n(table9.tax_payable?.cgst)}</td><td>${n(table9.tax_payable?.sgst)}</td></tr></table>`;openPrintWindow(buildPrintHTML("FORM GSTR-9 — Annual Return",company.gstin||"",company.name,fy,body),`GSTR9_${company.gstin}.pdf`);}}
      />
      <button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"💾 Save Draft"}</button>
      {ret?.status!=="filed"&&<button onClick={markFiled} style={S.btnG}>Mark as Filed</button>}
    </div>
  </div>);
}

// ── GSTR-9C — Reconciliation Statement (audited figures vs Annual Return) ────
function GSTR9C({token,toast,company}){
  const cid=company?.id;
  const[fy,setFy]=useState(FY_LIST[1]);
  const[ret,setRet]=useState(null);
  const[af,setAf]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const[table5,setTable5]=useState({turnover_audited:"0",unbilled_opening:"0",unadjusted_advances:"0",deemed_supply:"0",credit_notes_after_fy:"0",trade_discounts:"0",unbilled_closing:"0",credit_notes_disallowed:"0",composition_turnover:"0",other_adjustments:"0"});
  const[reasons5,setReasons5]=useState("");
  const[table9rows,setTable9rows]=useState([{rate:"5%",taxable:"0",igst:"0",cgst:"0",sgst:"0",cess:"0"},{rate:"12%",taxable:"0",igst:"0",cgst:"0",sgst:"0",cess:"0"},{rate:"18%",taxable:"0",igst:"0",cgst:"0",sgst:"0",cess:"0"},{rate:"28%",taxable:"0",igst:"0",cgst:"0",sgst:"0",cess:"0"}]);
  const[reasons9,setReasons9]=useState("");
  const[table12,setTable12]=useState({itc_per_books:"0",itc_booked_prior_claimed_now:"0",itc_booked_now_claimed_later:"0"});
  const[reasons12,setReasons12]=useState("");
  const[table14rows,setTable14rows]=useState([
    {head:"Purchases",value:"0",itc:"0"},{head:"Freight / Carriage",value:"0",itc:"0"},{head:"Power and Fuel",value:"0",itc:"0"},
    {head:"Rent and Insurance",value:"0",itc:"0"},{head:"Employees' Cost",value:"0",itc:"0"},{head:"Capital Goods",value:"0",itc:"0"},{head:"Any Other",value:"0",itc:"0"},
  ]);
  const[certification,setCertification]=useState({auditor_name:"",frn:"",membership_no:"",place:"",date:today(),recommendation:""});

  const load=useCallback(async()=>{
    if(!cid)return;setLoading(true);
    try{
      const[r,a]=await Promise.all([
        api(`/accounting/companies/${cid}/gstr9c?fy=${fy}`,"GET",null,token),
        api(`/accounting/companies/${cid}/gstr9c/auto-fill?fy=${fy}`,"GET",null,token),
      ]);
      setRet(r.return);setAf(a);
      if(r.return?.data){
        const d=r.return.data;
        if(d.table5)setTable5(d.table5);if(d.reasons5)setReasons5(d.reasons5);
        if(d.table9rows)setTable9rows(d.table9rows);if(d.reasons9)setReasons9(d.reasons9);
        if(d.table12)setTable12(d.table12);if(d.reasons12)setReasons12(d.reasons12);
        if(d.table14rows)setTable14rows(d.table14rows);if(d.certification)setCertification(d.certification);
      }
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  },[cid,fy,token]);
  useEffect(()=>{load();},[load]);

  const num=v=>parseFloat(v)||0;
  const annualTurnoverAfterAdj=()=>num(table5.turnover_audited)+num(table5.unbilled_opening)+num(table5.unadjusted_advances)+num(table5.deemed_supply)
    -num(table5.credit_notes_after_fy)-num(table5.trade_discounts)+num(table5.unbilled_closing)-num(table5.credit_notes_disallowed)
    -num(table5.composition_turnover)+num(table5.other_adjustments);
  const turnoverGstr9=af?.turnover_as_per_gstr9||0;
  const unreconciledTurnover=()=>turnoverGstr9-annualTurnoverAfterAdj();

  const table9TotalsPayable=()=>table9rows.reduce((a,r)=>({taxable:a.taxable+num(r.taxable),igst:a.igst+num(r.igst),cgst:a.cgst+num(r.cgst),sgst:a.sgst+num(r.sgst),cess:a.cess+num(r.cess)}),{taxable:0,igst:0,cgst:0,sgst:0,cess:0});
  const taxPaidGstr9=af?.tax_paid_gstr9||0;
  const t9=table9TotalsPayable();
  const unreconciledTax=()=>(t9.igst+t9.cgst+t9.sgst+t9.cess)-taxPaidGstr9;

  const itcPerBooks=()=>num(table12.itc_per_books)+num(table12.itc_booked_prior_claimed_now)-num(table12.itc_booked_now_claimed_later);
  const itcGstr9=af?.itc_claimed_gstr9||0;
  const unreconciledItc=()=>itcGstr9-itcPerBooks();

  const setT9Row=(i,k,v)=>{const n=[...table9rows];n[i]={...n[i],[k]:v};setTable9rows(n);};
  const setT14Row=(i,k,v)=>{const n=[...table14rows];n[i]={...n[i],[k]:v};setTable14rows(n);};
  const table14ItcTotal=()=>table14rows.reduce((a,r)=>a+num(r.itc),0);

  const save=async()=>{
    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/gstr9c`,"POST",{fy,data:{table5,reasons5,table9rows,reasons9,table12,reasons12,table14rows,certification}},token);
      toast("✅ GSTR-9C saved","success");
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const markFiled=async()=>{
    const arn=prompt("Enter ARN from GST portal:");if(!arn)return;
    try{await api(`/accounting/companies/${cid}/gstr9c/file`,"POST",{fy,arn},token);toast("✅ Marked filed","success");load();}catch(e){toast(e.message,"error");}
  };

  if(!cid)return null;
  if(loading)return<Spinner/>;

  if(af&&af.gstr9_found===false){
    return(<div style={{...S.card,textAlign:"center",padding:40}}>
      <div style={{fontSize:36,marginBottom:10}}>⚠️</div>
      <div style={{fontWeight:700,color:"#e3b341",marginBottom:8}}>File GSTR-9 First</div>
      <div style={{fontSize:12,color:C.muted}}>{af.message}</div>
    </div>);
  }

  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:4}}>📑 FORM GSTR-9C — Reconciliation Statement</div>
      <div style={{fontSize:12,color:C.sub}}>{company.name} · GSTIN: {company.gstin||"—"} · FY {fy}. Reconciles audited financial-statement figures against your filed GSTR-9. Requires CA certification before filing.</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <select style={{...S.select,width:140}} value={fy} onChange={e=>setFy(e.target.value)}>{FY_LIST.map(y=><option key={y}>{y}</option>)}</select>
      {ret&&(ret.status==="filed"?badge("Filed — ARN: "+ret.arn,"green"):badge("Draft","amber"))}
    </div>

    {/* Part II — Table 5,6,7: Turnover Reconciliation */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:10}}>Part II — Table 5: Reconciliation of Gross Turnover</div>
      <div style={S.col2}>
        {[["5A: Turnover as per Audited Financial Statements","turnover_audited"],["5B: Unbilled revenue (opening)","unbilled_opening"],["5C: Unadjusted advances (closing)","unadjusted_advances"],
          ["5D: Deemed Supply u/Schedule I","deemed_supply"],["5E: Credit notes issued after FY-end","credit_notes_after_fy"],["5F: Trade discounts (not GST-permissible)","trade_discounts"],
          ["5H: Unbilled revenue (closing)","unbilled_closing"],["5J: Credit notes (GST-disallowed)","credit_notes_disallowed"],["5L: Composition-period turnover","composition_turnover"],["5M-O: Other Adjustments (net)","other_adjustments"]].map(([l,k])=>(
          <div key={k} style={S.fg}><label style={S.label}>{l}</label><input type="number" style={S.input} value={table5[k]} onChange={e=>setTable5(p=>({...p,[k]:e.target.value}))}/></div>
        ))}
      </div>
      <div style={{...S.card,background:"#0c1922",marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span>5P: Annual Turnover after Adjustments</span><b>{fR(annualTurnoverAfterAdj())}</b></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span>5Q: Turnover as declared in GSTR-9</span><b>{fR(turnoverGstr9)}</b></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontWeight:700,color:Math.abs(unreconciledTurnover())<1?"#3fb950":"#f85149"}}><span>5R: Un-Reconciled Turnover</span><span>{fR(unreconciledTurnover())}</span></div>
      </div>
      <div style={S.fg}><label style={S.label}>Table 6 — Reasons for un-reconciled turnover (if any)</label><textarea style={{...S.input,minHeight:50}} value={reasons5} onChange={e=>setReasons5(e.target.value)} placeholder="e.g. Difference due to year-end provisions, etc."/></div>
    </div>

    {/* Part III — Table 9,10,11: Tax Reconciliation */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:10}}>Part III — Table 9: Reconciliation of Rate-wise Liability &amp; Tax Paid</div>
      <div className="tp-table-wrap"><table style={S.tbl}>
        <thead><tr>{["Rate","Taxable Value","IGST","CGST","SGST","Cess"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{table9rows.map((r,i)=>(<tr key={i}>
          <td style={S.td}>{r.rate}</td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.taxable} onChange={e=>setT9Row(i,"taxable",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.igst} onChange={e=>setT9Row(i,"igst",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.cgst} onChange={e=>setT9Row(i,"cgst",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.sgst} onChange={e=>setT9Row(i,"sgst",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.cess} onChange={e=>setT9Row(i,"cess",e.target.value)}/></td>
        </tr>))}</tbody>
        <tfoot><tr style={{fontWeight:700,background:"#0c1d2e"}}><td style={S.td}>9O: Total</td><td style={S.td}>{fR(t9.taxable)}</td><td style={S.td}>{fR(t9.igst)}</td><td style={S.td}>{fR(t9.cgst)}</td><td style={S.td}>{fR(t9.sgst)}</td><td style={S.td}>{fR(t9.cess)}</td></tr></tfoot>
      </table></div>
      <div style={{...S.card,background:"#0c1922",marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span>9P: Tax Paid as per GSTR-9</span><b>{fR(taxPaidGstr9)}</b></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontWeight:700,color:Math.abs(unreconciledTax())<1?"#3fb950":"#f85149"}}><span>9Q: Un-Reconciled Tax Payment</span><span>{fR(unreconciledTax())}</span></div>
      </div>
      <div style={S.fg}><label style={S.label}>Table 10 — Reasons for un-reconciled payment of tax</label><textarea style={{...S.input,minHeight:50}} value={reasons9} onChange={e=>setReasons9(e.target.value)}/></div>
    </div>

    {/* Part IV — Table 12,13,14: ITC Reconciliation */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:10}}>Part IV — Table 12: Reconciliation of Net ITC</div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>12A: ITC per Audited Books</label><input type="number" style={S.input} value={table12.itc_per_books} onChange={e=>setTable12(p=>({...p,itc_per_books:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>12B: ITC booked earlier, claimed now (+)</label><input type="number" style={S.input} value={table12.itc_booked_prior_claimed_now} onChange={e=>setTable12(p=>({...p,itc_booked_prior_claimed_now:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>12C: ITC booked now, claimed later (−)</label><input type="number" style={S.input} value={table12.itc_booked_now_claimed_later} onChange={e=>setTable12(p=>({...p,itc_booked_now_claimed_later:e.target.value}))}/></div>
      </div>
      <div style={{...S.card,background:"#0c1922",marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span>12D: ITC per Books (A+B−C)</span><b>{fR(itcPerBooks())}</b></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}><span>12E: ITC Claimed in GSTR-9</span><b>{fR(itcGstr9)}</b></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontWeight:700,color:Math.abs(unreconciledItc())<1?"#3fb950":"#f85149"}}><span>12F: Un-Reconciled ITC</span><span>{fR(unreconciledItc())}</span></div>
      </div>
      <div style={S.fg}><label style={S.label}>Table 13 — Reasons for un-reconciled ITC</label><textarea style={{...S.input,minHeight:50}} value={reasons12} onChange={e=>setReasons12(e.target.value)}/></div>

      <div style={{fontWeight:700,color:C.text,marginTop:18,marginBottom:10}}>Table 14 — ITC declared in GSTR-9 vs ITC availed per Expense Head</div>
      <div className="tp-table-wrap"><table style={S.tbl}>
        <thead><tr>{["Expense Head","Value","Eligible ITC"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{table14rows.map((r,i)=>(<tr key={i}>
          <td style={S.td}>{r.head}</td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.value} onChange={e=>setT14Row(i,"value",e.target.value)}/></td>
          <td style={S.td}><input type="number" style={{...S.input,fontSize:11}} value={r.itc} onChange={e=>setT14Row(i,"itc",e.target.value)}/></td>
        </tr>))}</tbody>
        <tfoot><tr style={{fontWeight:700,background:"#0c1d2e"}}><td colSpan={2} style={S.td}>14R: Total ITC per Books</td><td style={S.td}>{fR(table14ItcTotal())}</td></tr></tfoot>
      </table></div>
    </div>

    {/* Certification */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:10}}>Part B — Certification &amp; Auditor's Recommendation</div>
      <div style={S.fg}><label style={S.label}>Auditor's Recommendation on Additional Liability</label><textarea style={{...S.input,minHeight:60}} value={certification.recommendation} onChange={e=>setCertification(p=>({...p,recommendation:e.target.value}))} placeholder="State any additional tax liability arising from non-reconciliation above, if applicable."/></div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Auditor / CA Name</label><input style={S.input} value={certification.auditor_name} onChange={e=>setCertification(p=>({...p,auditor_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Membership No.</label><input style={S.input} value={certification.membership_no} onChange={e=>setCertification(p=>({...p,membership_no:e.target.value}))}/></div>
      </div>
      <div style={S.col3}>
        <div style={S.fg}><label style={S.label}>Firm Registration No.</label><input style={S.input} value={certification.frn} onChange={e=>setCertification(p=>({...p,frn:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Place</label><input style={S.input} value={certification.place} onChange={e=>setCertification(p=>({...p,place:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={certification.date} onChange={e=>setCertification(p=>({...p,date:e.target.value}))}/></div>
      </div>
    </div>

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
      <GSTDownloadBar disabled={false}
        onJson={()=>downloadJSON({gstin:company.gstin,fy,table5,reasons5,table9rows,reasons9,table12,reasons12,table14rows,certification},`GSTR9C_${company.gstin||"GSTIN"}_${fy}.json`)}
        onPdf={()=>{
          const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});
          const body=`<h3>Part II — Table 5: Turnover Reconciliation</h3><table><tr><th>Particulars</th><th>Amount (₹)</th></tr><tr><td>5A Turnover per Fin. Statements</td><td>${n(table5.turnover_audited)}</td></tr><tr><td>5Q Turnover as per GSTR-9</td><td>${n(af?.turnover_as_per_gstr9||0)}</td></tr></table><h3>Part B — Certification</h3><p>CA: ${certification.auditor_name||"—"} | MRN: ${certification.membership_no||"—"} | FRN: ${certification.frn||"—"} | Date: ${certification.date||"—"}</p><p>Recommendation: ${certification.recommendation||"NIL"}</p>`;
          openPrintWindow(buildPrintHTML("FORM GSTR-9C — Reconciliation Statement",company.gstin||"",company.name,fy,body),`GSTR9C_${company.gstin}.pdf`);
        }}
      />
      <button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"💾 Save Draft"}</button>
      {ret?.status!=="filed"&&<button onClick={markFiled} style={S.btnG}>Mark as Filed</button>}
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════
// LEGAL LIBRARY — GST Act, Rules, Circulars, Case Law (uploaded by the CA)
// + AI NOTICE REPLY GENERATOR (grounded — only cites uploaded references)
// ════════════════════════════════════════════════════════

const LEGAL_REF_TYPES=[["act_section","Act Section"],["rule","Rule"],["circular","Circular"],["notification","Notification"],["case_law","Case Law / Order"]];

function LegalLibrary({token,toast,isAdmin}){
  const[refs,setRefs]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState("");const[typeFilter,setTypeFilter]=useState("all");
  const[modal,setModal]=useState(null);const[mode,setMode]=useState("paste"); // paste | upload
  const[file,setFile]=useState(null);const[uploading,setUploading]=useState(false);
  const[f,setF]=useState({ref_type:"act_section",act_name:"CGST Act",reference_no:"",title:"",full_text:"",court_name:"",case_citation:"",case_date:"",tags:""});
  const[viewing,setViewing]=useState(null);

  const load=useCallback(()=>{
    setLoading(true);
    api(`/legal/references?${typeFilter!=="all"?`ref_type=${typeFilter}&`:""}${search?`search=${encodeURIComponent(search)}`:""}`, "GET",null,token)
      .then(d=>{setRefs(d.references||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[token,typeFilter,search]);
  useEffect(()=>{load();},[load]);

  const resetForm=()=>{setF({ref_type:"act_section",act_name:"CGST Act",reference_no:"",title:"",full_text:"",court_name:"",case_citation:"",case_date:"",tags:""});setFile(null);setMode("paste");};

  const save=async()=>{
    if(!f.title)return toast("Title required","error");
    if(mode==="paste"){
      if(!f.full_text)return toast("Paste the text content","error");
      try{await api("/legal/references","POST",f,token);toast("✅ Added to library","success");setModal(null);resetForm();load();}catch(e){toast(e.message,"error");}
    }else{
      if(!file)return toast("Select a PDF","error");
      setUploading(true);
      try{
        const fd=new FormData();fd.append("file",file);
        Object.entries(f).forEach(([k,v])=>v&&k!=="full_text"&&fd.append(k,v));
        const res=await fetch(`${API}/legal/references/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
        const d=await res.json();
        if(d.success){toast(d.message,"success");setModal(null);resetForm();load();}else toast(d.message,"error");
      }catch(e){toast(e.message,"error");}
      setUploading(false);
    }
  };
  const del=async id=>{if(!window.confirm("Delete this reference?"))return;try{await api(`/legal/references/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const view=async id=>{try{const d=await api(`/legal/references/${id}`,"GET",null,token);setViewing(d.reference);}catch(e){toast(e.message,"error");}};

  const typeColor=t=>t==="case_law"?"purple":t==="circular"?"amber":t==="rule"?"teal":t==="notification"?"gray":"blue";
  const typeLabel=t=>LEGAL_REF_TYPES.find(x=>x[0]===t)?.[1]||t;

  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:4}}>📚 Legal Library — GST Act, Rules, Circulars &amp; Case Law {!isAdmin&&badge("Read-only","gray")}</div>
      <div style={{fontSize:12,color:C.sub}}>{isAdmin?"Maintained by you (admin) and shared with every client. The AI Notice Reply Generator only cites documents from this library — never invented citations.":"Maintained by your administrator and shared across all clients. Used by the AI Notice Reply Generator — it only cites documents from here, never invented citations."}</div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search title, section no, tags..." style={{...S.input,width:240}}/>
      <select style={{...S.select,width:170}} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
        <option value="all">All Types</option>{LEGAL_REF_TYPES.map(([k,l])=><option key={k} value={k}>{l}</option>)}
      </select>
      {isAdmin&&<button onClick={()=>{resetForm();setModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Reference</button>}
    </div>
    {!isAdmin&&<div style={{...S.card,background:"#0c1922",padding:"10px 14px",marginBottom:14}}><span style={{fontSize:12,color:C.muted}}>🔒 Only your administrator can add, edit, or delete entries in this library.</span></div>}
    {loading?<Spinner/>:(
      <div style={S.card}>
        {refs.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>
          <div style={{fontSize:36,marginBottom:10}}>📖</div>
          No references in your library yet. Add GST Act sections, Rules, Circulars, or Case Law/Orders to get started.
        </div>:(
          <table style={S.tbl}><thead><tr>{["Type","Reference","Title","Tags","Added",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{refs.map(r=>(
            <tr key={r.id} style={{cursor:"pointer"}} onClick={()=>view(r.id)}>
              <td style={S.td}>{badge(typeLabel(r.ref_type),typeColor(r.ref_type))}</td>
              <td style={{...S.td,fontWeight:600}}>{r.ref_type==="case_law"?(r.case_citation||"—"):(r.reference_no||"—")}</td>
              <td style={S.td}>{r.title}{r.act_name&&<div style={{fontSize:10,color:C.muted}}>{r.act_name}</div>}</td>
              <td style={{...S.td,fontSize:11,color:C.muted}}>{r.tags||"—"}</td>
              <td style={S.td}>{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
              <td style={S.tdR}>{isAdmin&&<button onClick={e=>{e.stopPropagation();del(r.id);}} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button>}</td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    )}
    {modal&&(<Modal title="Add Legal Reference" onClose={()=>setModal(null)} wide>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["paste","✏️ Paste Text"],["upload","📤 Upload PDF"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMode(k)} style={{padding:"7px 16px",borderRadius:7,border:`1px solid ${mode===k?"#1F6FEB":C.border}`,background:mode===k?"#0c1d2e":"transparent",color:mode===k?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>{l}</button>
        ))}
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>Type *</label><select style={S.select} value={f.ref_type} onChange={e=>setF(p=>({...p,ref_type:e.target.value}))}>{LEGAL_REF_TYPES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Act Name</label><select style={S.select} value={f.act_name} onChange={e=>setF(p=>({...p,act_name:e.target.value}))}><option>CGST Act</option><option>SGST Act</option><option>IGST Act</option><option>CGST Rules</option><option>GST Compensation Cess Act</option><option>Other</option></select></div>
      </div>
      <div style={S.fg}><label style={S.label}>Title *</label><input style={S.input} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder={f.ref_type==="case_law"?"e.g. ABC Traders vs State of Maharashtra":"e.g. Time limit for ITC claim"}/></div>
      {f.ref_type==="case_law"?(<>
        <div style={S.col2}>
          <div style={S.fg}><label style={S.label}>Court / Tribunal</label><input style={S.input} value={f.court_name} onChange={e=>setF(p=>({...p,court_name:e.target.value}))} placeholder="e.g. Bombay High Court, GSTAT"/></div>
          <div style={S.fg}><label style={S.label}>Citation</label><input style={S.input} value={f.case_citation} onChange={e=>setF(p=>({...p,case_citation:e.target.value}))} placeholder="As printed on the order"/></div>
        </div>
        <div style={S.fg}><label style={S.label}>Order Date</label><input type="date" style={S.input} value={f.case_date} onChange={e=>setF(p=>({...p,case_date:e.target.value}))}/></div>
      </>):(
        <div style={S.fg}><label style={S.label}>Reference No.</label><input style={S.input} value={f.reference_no} onChange={e=>setF(p=>({...p,reference_no:e.target.value}))} placeholder="e.g. Section 73, Rule 142, Circular No. 31/05/2018"/></div>
      )}
      <div style={S.fg}><label style={S.label}>Tags (comma-separated, helps AI matching)</label><input style={S.input} value={f.tags} onChange={e=>setF(p=>({...p,tags:e.target.value}))} placeholder="e.g. ITC, mismatch, late fee, reverse charge"/></div>
      {mode==="paste"?(
        <div style={S.fg}><label style={S.label}>Full Text *</label><textarea style={{...S.input,minHeight:160,fontFamily:"monospace",fontSize:11}} value={f.full_text} onChange={e=>setF(p=>({...p,full_text:e.target.value}))} placeholder="Paste the exact text of the Act section / rule / circular / judgment here..."/></div>
      ):(
        <div style={S.fg}><label style={S.label}>PDF File *</label>
          <label style={{...S.btnO,cursor:"pointer",display:"block",textAlign:"center"}}>{file?`✅ ${file.name}`:"Choose PDF"}<input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label>
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>Text will be auto-extracted. Scanned/image-only PDFs won't extract — paste manually instead in that case.</div>
        </div>
      )}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setModal(null)} style={S.btnO}>Cancel</button><button onClick={save} disabled={uploading} style={S.btn}>{uploading?"Uploading...":"Save to Library"}</button></div>
    </Modal>)}
    {viewing&&(<Modal title={viewing.title} onClose={()=>setViewing(null)} wide>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {badge(typeLabel(viewing.ref_type),typeColor(viewing.ref_type))}
        {viewing.act_name&&badge(viewing.act_name,"gray")}
        {viewing.reference_no&&badge(viewing.reference_no,"blue")}
        {viewing.court_name&&badge(viewing.court_name,"purple")}
      </div>
      <div style={{...S.card,background:"#0D1117",maxHeight:400,overflowY:"auto",whiteSpace:"pre-wrap",fontSize:12,lineHeight:1.7,fontFamily:"monospace"}}>{viewing.full_text}</div>
    </Modal>)}
  </div>);
}

// ── AI NOTICE REPLY GENERATOR (company-scoped) ──────────────────────────────
function NoticeReplyGenerator({token,toast,company}){
  const cid=company?.id;
  const[notices,setNotices]=useState([]);const[loading,setLoading]=useState(true);
  const[showNew,setShowNew]=useState(false);const[active,setActive]=useState(null); // notice being worked on
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;
  const NOTICE_TYPES=["SCN under Section 73 (non-fraud)","SCN under Section 74 (fraud)","ASMT-10 (Scrutiny)","DRC-01 (Demand)","REG-17 (Registration Cancellation)","ITC Mismatch Notice","E-Way Bill Notice","Audit Notice (ADT-01)","Other"];

  const load=useCallback(()=>{
    if(!cid)return;setLoading(true);
    api(`/accounting/companies/${cid}/notices`,"GET",null,token).then(d=>{setNotices(d.notices||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[cid,token]);
  useEffect(()=>{load();},[load]);

  const openNotice=async(n)=>{
    try{const d=await api(`/accounting/companies/${cid}/notices/${n.id}`,"GET",null,token);setActive(d.notice);}catch(e){toast(e.message,"error");}
  };
  const del=async(id)=>{if(!window.confirm("Delete this notice?"))return;try{await api(`/accounting/companies/${cid}/notices/${id}`,"DELETE",null,token);toast("Deleted","success");setActive(null);load();}catch(e){toast(e.message,"error");}};

  if(!cid)return null;
  return(<div>
    <div style={{...S.card,background:"#1a0a2e",border:"1px solid #6e40c9",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#bf91f3",marginBottom:4}}>🤖 AI Notice Reply Generator</div>
      <div style={{fontSize:12,color:C.sub}}>Upload a GST notice → AI drafts a reply citing sections/rules/case law from your <b>Legal Library</b> only. Always review before filing.</div>
    </div>
    {!active?(<>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>setShowNew(true)} style={S.btn}>+ New Notice</button></div>
      {loading?<Spinner/>:(
        <div style={S.card}>
          {notices.length===0?<div style={{textAlign:"center",padding:30,color:C.muted}}>No notices recorded for {company.name} yet</div>:(
            <table style={S.tbl}><thead><tr>{["Ref No","Type","Issued","Due Date","Amount","Status","Reply",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{notices.map(n=>(
              <tr key={n.id} style={{cursor:"pointer"}} onClick={()=>openNotice(n)}>
                <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{n.ref_no}</td>
                <td style={S.td}>{n.type}</td>
                <td style={S.td}>{n.issued_date}</td>
                <td style={S.td}>{n.due_date}</td>
                <td style={S.td}>{fR(n.amount)}</td>
                <td style={S.td}>{badge(n.status,n.status==="overdue"?"red":n.status==="resolved"?"green":"amber")}</td>
                <td style={S.td}>{n.ai_reply_draft?badge("Drafted","green"):badge("Pending","gray")}</td>
                <td style={S.tdR}><button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...S.btnR,fontSize:10,padding:"3px 8px"}}>Del</button></td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
      )}
      {showNew&&<NewNoticeModal token={token} toast={toast} cid={cid} onClose={()=>setShowNew(false)} onSaved={(n)=>{setShowNew(false);load();openNotice(n);}} types={NOTICE_TYPES}/>}
    </>):(
      <NoticeDetail token={token} toast={toast} cid={cid} notice={active} company={company} onBack={()=>{setActive(null);load();}} onDelete={()=>del(active.id)}/>
    )}
  </div>);
}

function NewNoticeModal({token,toast,cid,onClose,onSaved,types}){
  const[f,setF]=useState({ref_no:"",type:types[0],issued_date:today(),due_date:"",amount:"0",priority:"medium",description:""});
  const[saving,setSaving]=useState(false);
  const save=async()=>{
    if(!f.ref_no)return toast("Reference number required","error");
    setSaving(true);
    try{const d=await api(`/accounting/companies/${cid}/notices`,"POST",f,token);toast("✅ Notice added","success");onSaved(d.notice);}
    catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  return(<Modal title="New GST Notice" onClose={onClose}>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Reference No *</label><input style={S.input} value={f.ref_no} onChange={e=>setF(p=>({...p,ref_no:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}>{types.map(t=><option key={t}>{t}</option>)}</select></div>
    </div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Issued Date</label><input type="date" style={S.input} value={f.issued_date} onChange={e=>setF(p=>({...p,issued_date:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Reply Due Date</label><input type="date" style={S.input} value={f.due_date} onChange={e=>setF(p=>({...p,due_date:e.target.value}))}/></div>
    </div>
    <div style={S.col2}>
      <div style={S.fg}><label style={S.label}>Demand Amount (₹)</label><input type="number" style={S.input} value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Priority</label><select style={S.select} value={f.priority} onChange={e=>setF(p=>({...p,priority:e.target.value}))}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
    </div>
    <div style={S.fg}><label style={S.label}>Issue / Description</label><textarea style={{...S.input,minHeight:60}} value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Brief summary if known — you can also upload the notice PDF/photo on the next screen for AI to extract this."/></div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={onClose} style={S.btnO}>Cancel</button><button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"Save & Continue"}</button></div>
  </Modal>);
}

function NoticeDetail({token,toast,cid,notice,company,onBack,onDelete}){
  const[file,setFile]=useState(null);const[scanning,setScanning]=useState(false);
  const[summary,setSummary]=useState(null);
  const[generating,setGenerating]=useState(false);
  const[reply,setReply]=useState(notice.ai_reply_draft||"");
  const[refsUsed,setRefsUsed]=useState(notice.references_used?(typeof notice.references_used==="string"?JSON.parse(notice.references_used):notice.references_used):[]);
  const[grounded,setGrounded]=useState(null);
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN")}`;

  const scanFile=async()=>{
    if(!file)return toast("Choose a file first","error");
    setScanning(true);
    try{
      const fd=new FormData();fd.append("file",file);
      const res=await fetch(`${API}/notices/${notice.id}/scan-notice`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){setSummary(d.summary);toast("✅ Notice scanned","success");}else toast(d.message,"error");
    }catch(e){toast("Scan failed: "+e.message,"error");}
    setScanning(false);
  };

  const generateReply=async()=>{
    setGenerating(true);
    try{
      const d=await api(`/notices/${notice.id}/generate-grounded-reply`,"POST",null,token);
      setReply(d.reply);setRefsUsed(d.references_used||[]);setGrounded(d.grounded);
      toast(d.grounded?`✅ Reply drafted, citing ${d.references_used.length} reference(s) from your library`:"⚠ Reply drafted — no matching references found in your library","success");
    }catch(e){toast(e.message,"error");}
    setGenerating(false);
  };

  const saveReplyEdits=async()=>{
    try{await api(`/accounting/companies/${cid}/notices/${notice.id}/status`,"PATCH",{status:"resolved"},token);}catch(e){}
    toast("Marked resolved (reply already saved)","success");
  };

  const downloadDoc=()=>{
    window.open(`${API}/notices/${notice.id}/reply/download?token=${token}`,"_blank");
  };

  return(<div>
    <button onClick={onBack} style={{...S.btnO,marginBottom:14,fontSize:12}}>← Back to Notices</button>

    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.text}}>{notice.ref_no}</div>
          <div style={{fontSize:12,color:C.muted}}>{notice.type} · Issued {notice.issued_date} · Due {notice.due_date}</div>
        </div>
        {badge(notice.status,notice.status==="overdue"?"red":notice.status==="resolved"?"green":"amber")}
      </div>
      {notice.amount>0&&<div style={{fontSize:12,color:"#e3b341"}}>Demand: {fR(notice.amount)}</div>}
      {notice.description&&<div style={{fontSize:12,color:C.sub,marginTop:6}}>{notice.description}</div>}
    </div>

    {/* Step 1: Upload/Scan */}
    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>1. Upload Notice (PDF or Photo) — Optional but recommended</div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{...S.btnO,cursor:"pointer"}}>{file?`✅ ${file.name}`:"Choose File"}<input type="file" accept=".pdf,image/*" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label>
        <button onClick={scanFile} disabled={!file||scanning} style={{...S.btn,opacity:!file?0.5:1}}>{scanning?"🔍 Reading notice...":"🔍 Scan with AI"}</button>
      </div>
      {summary&&(<div style={{...S.card,background:"#0c1922",marginTop:12}}>
        <div style={{fontSize:11,color:"#58a6ff",fontWeight:600,marginBottom:6}}>Extracted Details</div>
        {summary.notice_type&&<div style={{fontSize:12,marginBottom:3}}><b>Type:</b> {summary.notice_type}</div>}
        {summary.section_invoked&&<div style={{fontSize:12,marginBottom:3}}><b>Section Invoked:</b> {summary.section_invoked}</div>}
        {summary.issue_summary&&<div style={{fontSize:12,marginBottom:3}}><b>Issue:</b> {summary.issue_summary}</div>}
        {summary.key_points?.length>0&&<ul style={{margin:"6px 0",paddingLeft:18,fontSize:12}}>{summary.key_points.map((p,i)=><li key={i}>{p}</li>)}</ul>}
      </div>)}
    </div>

    {/* Step 2: Generate Reply */}
    <div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>2. Generate AI Reply</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:10}}>AI searches your <b>Legal Library</b> for relevant Act sections, Rules, Circulars, or Case Law matching this notice's topic, and cites only what it finds there.</div>
      <button onClick={generateReply} disabled={generating} style={S.btn}>{generating?"✨ Drafting...":reply?"🔄 Regenerate Reply":"✨ Generate Reply"}</button>
      {grounded===false&&<div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginTop:10}}><span style={{fontSize:12,color:"#e3b341"}}>⚠ No matching references found in your Legal Library for this notice. The draft below covers general/procedural points only — add relevant Act sections, rules, or case law to your library for stronger grounding.</span></div>}
    </div>

    {/* Step 3: Review & Download */}
    {reply&&(<div style={S.card}>
      <div style={{fontWeight:700,marginBottom:10,color:C.text}}>3. Review, Edit &amp; Download</div>
      <textarea style={{...S.input,minHeight:280,fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.6}} value={reply} onChange={e=>setReply(e.target.value)}/>
      {refsUsed.length>0&&(<div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginTop:10}}>
        <div style={{fontSize:11,color:"#3fb950",fontWeight:600,marginBottom:6}}>✅ References Cited (from your library)</div>
        {refsUsed.map((r,i)=><div key={i} style={{fontSize:12,padding:"3px 0"}}>{i+1}. {r.ref_type==="case_law"?`${r.title} — ${r.court_name||""} ${r.case_citation||""}`:`${r.act_name||""} ${r.reference_no||""} — ${r.title}`}</div>)}
      </div>)}
      <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03",marginTop:10,padding:10}}>
        <span style={{fontSize:11,color:"#e3b341"}}>⚠ This is an AI-drafted starting point. Verify all facts, figures, and citations, and have it reviewed by a qualified professional before submitting to the GST department.</span>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
        <button onClick={downloadDoc} style={S.btnG}>📄 Download as Word Doc</button>
        <button onClick={saveReplyEdits} style={S.btnO}>✅ Mark Resolved</button>
        <button onClick={onDelete} style={{...S.btnR,marginLeft:"auto"}}>🗑 Delete Notice</button>
      </div>
    </div>)}
  </div>);
}

// ── GSTR-1 — Official table format (Tables 4–13) ────────────────────────────
function GSTR1({token,toast,company}){
  const cid=company?.id;
  const[period,setPeriod]=useState("");const[fy,setFy]=useState("");const[mode,setMode]=useState("monthly");
  const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const[open,setOpen]=useState({t4:true,t5:false,t7:false,t12:false});
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const load=async()=>{
    const param=mode==="monthly"?period:fy;
    if(!param)return toast("Select period","error");
    setLoading(true);
    try{const d=await api(`/accounting/companies/${cid}/gstr1?${mode==="monthly"?`period=${param}`:`fy=${param}`}`,"GET",null,token);setData(d);}
    catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  if(!cid)return null;
  const p=data?.period||data?.fy||"";
  const s=data?.summary||{};
  const Sec=({id,title,color,count,badge:bdg,children})=>(
    <div style={{...S.card,borderLeft:`3px solid ${color}`}}>
      <div onClick={()=>setOpen(x=>({...x,[id]:!x[id]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:12}}>{open[id]?"▾":"▸"} {title}</div>
        <div style={{display:"flex",gap:8}}>{bdg&&<span style={{fontSize:11,color,background:color+"22",padding:"2px 8px",borderRadius:10}}>{bdg}</span>}</div>
      </div>
      {open[id]&&<div style={{marginTop:12}}>{children}</div>}
    </div>
  );

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>📤 FORM GSTR-1 — Return for Outward Supplies</div>
      <div style={{fontSize:12,color:C.sub}}>Auto-populated from your sales invoices. Review each table, fill manual items (nil/exempt, documents issued), then file on GST portal.</div>
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
      <PeriodSelector period={period} setPeriod={setPeriod} fy={fy} setFy={setFy} mode={mode} setMode={setMode}/>
      <button onClick={load} disabled={loading} style={S.btn}>{loading?"Loading...":"Load Data"}</button>
    </div>
    {loading&&<Spinner/>}
    {!data&&!loading&&<div style={{...S.card,textAlign:"center",padding:40,color:C.muted}}>Select period and click Load Data</div>}
    {data&&(<>
      <div style={S.card}>
        <div style={{fontWeight:700,marginBottom:10,color:C.text}}>FORM GSTR-1 · {company.name} · GSTIN: {company.gstin||"—"} · Period: {p}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
          {[{l:"B2B Invoices",v:s.b2b_count||0,c:"#58a6ff"},{l:"B2C Large",v:s.b2c_large_count||0,c:"#bf91f3"},{l:"B2C Small",v:s.b2c_small_count||0,c:"#d97706"},{l:"Total Invoices",v:s.total_invoices||0,c:"#3fb950"},{l:"Taxable Value",v:fR(s.total_taxable),c:"#e3b341"},{l:"IGST",v:fR(s.total_igst),c:"#58a6ff"},{l:"CGST",v:fR(s.total_cgst),c:"#9333ea"},{l:"SGST",v:fR(s.total_sgst),c:"#0e9182"}].map(k=>(
            <div key={k.l} style={S.kpi}><div style={S.label}>{k.l}</div><div style={{fontWeight:700,color:k.c,fontSize:12}}>{k.v}</div></div>
          ))}
        </div>
      </div>

      {/* Table 4 — B2B */}
      <Sec id="t4" title="Table 4 — B2B Invoices (Taxable outward supplies to registered persons)" color="#58a6ff" badge={`${data.table4_b2b?.length||0} GSTINs`}>
        {data.table4_b2b?.length>0?(<>
          {data.table4_b2b.map((party,pi)=>(
            <div key={pi} style={{marginBottom:14}}>
              <div style={{fontWeight:600,fontSize:12,color:"#58a6ff",padding:"4px 0"}}>{party.gstin} — {party.name}</div>
              <div className="tp-table-wrap"><table style={S.tbl}>
                <thead><tr>{["Invoice No","Date","Invoice Value (₹)","Taxable Value (₹)","IGST (₹)","CGST (₹)","SGST (₹)","Cess (₹)","Place of Supply"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{party.invoices.map((inv,ii)=>(
                  <tr key={ii}>
                    <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{inv.invoice_no}</td>
                    <td style={S.td}>{String(inv.date).substring(0,10)}</td>
                    <td style={S.td}>{fR(inv.value)}</td><td style={S.td}>{fR(inv.taxable)}</td>
                    <td style={S.td}>{fR(inv.igst)}</td><td style={S.td}>{fR(inv.cgst)}</td>
                    <td style={S.td}>{fR(inv.sgst)}</td><td style={S.td}>{fR(inv.cess)}</td>
                    <td style={S.td}>{inv.place_of_supply||"—"}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{fontWeight:700,background:"#0c1d2e"}}>
                  <td colSpan={3} style={S.td}>Sub-Total</td>
                  <td style={S.td}>{fR(party.invoices.reduce((a,i)=>a+i.taxable,0))}</td>
                  <td style={S.td}>{fR(party.invoices.reduce((a,i)=>a+i.igst,0))}</td>
                  <td style={S.td}>{fR(party.invoices.reduce((a,i)=>a+i.cgst,0))}</td>
                  <td style={S.td}>{fR(party.invoices.reduce((a,i)=>a+i.sgst,0))}</td>
                  <td colSpan={2} style={S.td}/>
                </tr></tfoot>
              </table></div>
            </div>
          ))}
        </>):<div style={{color:C.muted,fontSize:12}}>No B2B invoices for this period</div>}
      </Sec>

      {/* Table 5 — B2C Large */}
      <Sec id="t5" title="Table 5 — B2C (Large) — Inter-state supplies to unregistered persons (Invoice value > ₹2.5L)" color="#bf91f3" badge={`${data.table5_b2cl?.length||0} states`}>
        {data.table5_b2cl?.length>0?(
          <div className="tp-table-wrap"><table style={S.tbl}>
            <thead><tr>{["Place of Supply (State)","Taxable Value (₹)","IGST (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{data.table5_b2cl.map((r,i)=>(
              <tr key={i}><td style={S.td}>{r.state}</td><td style={S.td}>{fR(r.taxable)}</td><td style={S.td}>{fR(r.igst)}</td><td style={S.tdR}>{fR(r.cess||0)}</td></tr>
            ))}</tbody>
          </table></div>
        ):<div style={{color:C.muted,fontSize:12}}>No B2C Large inter-state supplies above ₹2.5L</div>}
      </Sec>

      {/* Table 7 — B2C Small */}
      <Sec id="t7" title="Table 7 — B2C (Others) — All remaining outward supplies to unregistered persons" color="#d97706" badge={`${Object.keys(data.table7_b2cs||{}).length||0} groups`}>
        {data.table7_b2cs&&Object.values(data.table7_b2cs).length>0?(
          <div className="tp-table-wrap"><table style={S.tbl}>
            <thead><tr>{["State/Type","Taxable Value (₹)","IGST (₹)","CGST (₹)","SGST/UTGST (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{Object.values(data.table7_b2cs).map((r,i)=>(
              <tr key={i}><td style={S.td}>{r.state}</td><td style={S.td}>{fR(r.taxable)}</td><td style={S.td}>{fR(r.igst)}</td><td style={S.td}>{fR(r.cgst)}</td><td style={S.td}>{fR(r.sgst)}</td><td style={S.tdR}>{fR(r.cess||0)}</td></tr>
            ))}</tbody>
          </table></div>
        ):<div style={{color:C.muted,fontSize:12}}>No B2C small supplies</div>}
      </Sec>

      {/* Table 8 — Nil/Exempt/Non-GST */}
      <Sec id="t8" title="Table 8 — Nil rated, Exempt and Non-GST outward supplies (manual entry)" color="#0e9182">
        <div style={S.col2}>
          {[["8A: Inter-state exempt/nil rated","t8_inter_nil"],["8B: Intra-state exempt/nil rated","t8_intra_nil"],["8C: Inter-state non-GST","t8_inter_nongst"],["8D: Intra-state non-GST","t8_intra_nongst"]].map(([l,k])=>(
            <div key={k} style={S.fg}><label style={S.label}>{l} (₹)</label><input type="number" style={S.input} defaultValue={0}/></div>
          ))}
        </div>
      </Sec>

      {/* Table 12 — HSN Summary */}
      <Sec id="t12" title="Table 12 — HSN-wise Summary of Outward Supplies" color="#3fb950" badge={`${data.table12_hsn?.length||0} HSN codes`}>
        {data.table12_hsn?.length>0?(
          <div className="tp-table-wrap"><table style={S.tbl}>
            <thead><tr>{["HSN Code","Description","UQC","Total Qty","Total Value (₹)","Taxable Value (₹)","Integrated Tax (₹)","Central Tax (₹)","State/UT Tax (₹)","Cess (₹)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{data.table12_hsn.map((h,i)=>(
              <tr key={i}>
                <td style={{...S.td,...S.mono,fontWeight:600}}>{h.hsn_sac}</td>
                <td style={S.td}>{h.description}</td><td style={S.td}>{h.uqc}</td>
                <td style={S.td}>{h.qty}</td>
                <td style={S.td}>{fR(h.total_value)}</td><td style={S.td}>{fR(h.taxable_value)}</td>
                <td style={S.td}>{fR(h.igst)}</td><td style={S.td}>{fR(h.cgst)}</td>
                <td style={S.td}>{fR(h.sgst)}</td><td style={S.tdR}>{fR(h.cess||0)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ):<div style={{color:C.muted,fontSize:12}}>No HSN data — add HSN/SAC codes to your invoice items to populate this table.</div>}
      </Sec>

      {/* Table 13 — Document Summary */}
      <Sec id="t13" title="Table 13 — Documents Issued (Invoices, DN, CN, Receipts)" color="#e3b341">
        <div className="tp-table-wrap"><table style={S.tbl}>
          <thead><tr>{["Nature of Document","Sr. No From","Sr. No To","Total Issued","Cancelled","Net Issued"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{[["Invoices for outward supply","","","","",""],["Invoices for inward supply (RCM)","","","","",""],["Revised Invoice","","","","",""],["Debit Note","","","","",""],["Credit Note","","","","",""],["Receipt Voucher","","","","",""],["Payment Voucher","","","","",""],["Refund Voucher","","","","",""]].map(([doc,...vals],i)=>(
            <tr key={i}><td style={{...S.td,color:C.sub,fontSize:12}}>{doc}</td>{vals.map((v,vi)=><td key={vi} style={S.td}><input type="number" style={{...S.input,fontSize:11,padding:"4px 8px"}} defaultValue={v}/></td>)}</tr>
          ))}</tbody>
        </table></div>
      </Sec>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4,flexWrap:"wrap"}}>
        <GSTDownloadBar
          disabled={!data}
          onJson={()=>downloadJSON(buildGSTR1_JSON(data,company,mode==="monthly"?period:fy),`GSTR1_${company.gstin||"GSTIN"}_${mode==="monthly"?period:fy}.json`)}
          onExcel={()=>downloadGSTR1_Excel(data,company,mode==="monthly"?period:fy)}
          onPdf={()=>downloadGSTR1_PDF(data,company,mode==="monthly"?period:fy)}
        />
        <button onClick={()=>window.open("https://services.gst.gov.in/services/auth/fowelcome","_blank")} style={S.btnO}>🌐 File on GST Portal</button>
      </div>
    </>)}
  </div>);
}

// ── GSTR-2B / 2A Upload + Reconciliation ─────────────────────────────────────
function GSTR2Reconciliation({token,toast,company}){
  const cid=company?.id;
  const[period,setPeriod]=useState("");const[fy,setFy]=useState("");const[mode,setMode]=useState("monthly");
  const[source,setSource]=useState("2B");
  const[file,setFile]=useState(null);const[uploading,setUploading]=useState(false);
  const[recon,setRecon]=useState(null);const[loading,setLoading]=useState(false);
  const[statusFilter,setStatusFilter]=useState("all");
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  const upload=async()=>{
    if(!file)return toast("Select Excel/CSV file","error");
    const param=mode==="monthly"?period:fy;
    if(!param)return toast("Select period","error");
    setUploading(true);
    try{
      const fd=new FormData();fd.append("file",file);fd.append("source",source);
      if(mode==="monthly")fd.append("period",period);else fd.append("fy",fy);
      const res=await fetch(`${API}/accounting/companies/${cid}/gstr2/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const d=await res.json();
      if(d.success){toast(d.message,"success");setFile(null);reconcile();}else toast(d.message,"error");
    }catch(e){toast(e.message,"error");}
    setUploading(false);
  };

  const reconcile=async()=>{
    const param=mode==="monthly"?period:fy;
    if(!param)return toast("Select period","error");
    setLoading(true);
    try{
      const d=await api(`/accounting/companies/${cid}/gstr2/reconcile?source=${source}&${mode==="monthly"?`period=${period}`:`fy=${fy}`}`,"GET",null,token);
      setRecon(d);
    }catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  const statusColor=s=>s==="matched"?"#3fb950":s==="mismatch"?"#f85149":s==="unmatched"?"#e3b341":"#58a6ff";
  const statusBadge=s=>badge(s,s==="matched"?"green":s==="mismatch"?"red":s==="unmatched"?"amber":"blue");
  if(!cid)return null;

  const rows=recon?.reconciled||[];
  const extraBooks=recon?.only_in_books||[];
  const filtered=statusFilter==="all"?rows:statusFilter==="books_only"?extraBooks:rows.filter(r=>r.recon_status===statusFilter);

  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:4}}>🔄 GSTR-2A / 2B Reconciliation</div>
      <div style={{fontSize:12,color:C.sub}}>Download GSTR-2A or 2B Excel from GST portal → upload here → AI reconciles with your purchase invoices → mismatches highlighted.</div>
    </div>

    {/* Controls */}
    <div style={S.card}>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          {["2A","2B"].map(s=>(
            <button key={s} onClick={()=>setSource(s)} style={{padding:"6px 16px",borderRadius:7,border:`1px solid ${source===s?"#1F6FEB":C.border}`,background:source===s?"#1F6FEB":"transparent",color:source===s?"#fff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:source===s?600:400}}>GSTR-{s}</button>
          ))}
        </div>
        <PeriodSelector period={period} setPeriod={setPeriod} fy={fy} setFy={setFy} mode={mode} setMode={setMode} label="Period"/>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{...S.btnO,cursor:"pointer"}}>{file?`✅ ${file.name}`:"📥 Choose Excel from GST Portal"}<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label>
        <button onClick={upload} disabled={!file||uploading} style={{...S.btn,opacity:!file?0.5:1}}>{uploading?"Uploading...":"Upload & Reconcile"}</button>
        {!file&&<button onClick={reconcile} disabled={loading} style={S.btnO}>{loading?"Loading...":"Reconcile Existing"}</button>}
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:8}}>Download GSTR-{source} Excel from: <a href="https://services.gst.gov.in/services/auth/fowelcome" target="_blank" rel="noopener noreferrer" style={{color:"#58a6ff"}}>GST Portal → Returns → {source==="2B"?"GSTR-2B":"GSTR-2A"}</a></div>
    </div>

    {loading&&<Spinner/>}
    {recon&&(<>
      {/* Summary KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10,marginBottom:14}}>
        {[
          {l:"Total in "+source,v:recon.summary.total_2b,c:"#58a6ff"},
          {l:"✅ Matched",v:recon.summary.matched,c:"#3fb950"},
          {l:"⚠️ Mismatch",v:recon.summary.mismatch,c:"#f85149"},
          {l:"❓ Not in Books",v:recon.summary.unmatched_2b,c:"#e3b341"},
          {l:"📚 Only in Books",v:recon.summary.only_in_books,c:"#bf91f3"},
          {l:"Total in Books",v:recon.summary.total_books,c:"#0e9182"},
        ].map(k=>(
          <div key={k.l} onClick={()=>setStatusFilter(k.l.includes("Matched")?"matched":k.l.includes("Mismatch")?"mismatch":k.l.includes("Not in")?"unmatched":k.l.includes("Only in")?"books_only":"all")} style={{...S.kpi,cursor:"pointer",border:`1px solid ${statusFilter===k.l?"#1F6FEB":C.border}`}}>
            <div style={S.label}>{k.l}</div>
            <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {[["all","All"],["matched","✅ Matched"],["mismatch","⚠️ Mismatch"],["unmatched","❓ Not in Books"],["books_only","📚 Only in Books"]].map(([k,l])=>(
          <button key={k} onClick={()=>setStatusFilter(k)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${statusFilter===k?"#58a6ff":C.border}`,background:statusFilter===k?"#0c1d2e":"transparent",color:statusFilter===k?"#58a6ff":C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>{l}</button>
        ))}
      </div>

      {/* Results table */}
      <div style={S.card}>
        {statusFilter==="books_only"?(
          extraBooks.length===0?<div style={{textAlign:"center",padding:20,color:"#3fb950"}}>✅ All purchase entries in books are matched in GSTR-{source}!</div>:(
            <div className="tp-table-wrap"><table style={S.tbl}>
              <thead><tr>{["Supplier","Invoice No","Date","Taxable (₹)","Tax (₹)","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{extraBooks.map((r,i)=>(
                <tr key={i} style={{background:"rgba(191,145,243,0.05)"}}>
                  <td style={S.td}>{r.party_name||"—"}</td>
                  <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{r.invoice_no}</td>
                  <td style={S.td}>{String(r.invoice_date||"").substring(0,10)}</td>
                  <td style={S.td}>{fR(r.taxable_amount)}</td>
                  <td style={S.td}>{fR(r.total_tax)}</td>
                  <td style={S.td}>{badge("Only in Books","purple")}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )
        ):(
          filtered.length===0?<div style={{textAlign:"center",padding:20,color:C.muted}}>No entries in this category</div>:(
            <div className="tp-table-wrap"><table style={S.tbl}>
              <thead><tr>{["Supplier GSTIN","Supplier Name","Invoice No","Date","Taxable "+source+" (₹)","Taxable Books (₹)","Tax "+source+" (₹)","Tax Books (₹)","Status","Mismatch Details"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((r,i)=>(
                <tr key={i} style={{background:r.recon_status==="mismatch"?"rgba(248,81,73,0.06)":r.recon_status==="matched"?"rgba(63,185,80,0.04)":"rgba(227,179,65,0.04)"}}>
                  <td style={{...S.td,...S.mono,fontSize:11}}>{r.supplier_gstin||"—"}</td>
                  <td style={S.td}>{r.supplier_name||"—"}</td>
                  <td style={{...S.td,fontWeight:600,color:"#58a6ff"}}>{r.invoice_no}</td>
                  <td style={S.td}>{String(r.invoice_date||"").substring(0,10)}</td>
                  <td style={S.td}>{fR(r.taxable_value)}</td>
                  <td style={S.td}>{r.matched_invoice?fR(r.matched_invoice.taxable):"—"}</td>
                  <td style={S.td}>{fR((parseFloat(r.igst)||0)+(parseFloat(r.cgst)||0)+(parseFloat(r.sgst)||0))}</td>
                  <td style={S.td}>{r.matched_invoice?fR(r.matched_invoice.total_tax):"—"}</td>
                  <td style={S.td}>{statusBadge(r.recon_status)}</td>
                  <td style={{...S.td,maxWidth:200,fontSize:11,color:"#f85149"}}>{r.mismatch_fields?.join(" | ")||"—"}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )
        )}
      </div>

      {recon.summary.mismatch>0&&(
        <div style={{...S.card,background:"#2d0e0e",border:"1px solid #6e1c1c",marginTop:0}}>
          <div style={{fontWeight:700,color:"#f85149",marginBottom:6}}>⚠ {recon.summary.mismatch} Mismatches Found</div>
          <div style={{fontSize:12,color:C.sub}}>These invoices exist in both GSTR-{source} and your books but with different taxable values or tax amounts. Verify with the supplier and correct before filing GSTR-3B to avoid ITC reversal notices from the department.</div>
        </div>
      )}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        <GSTDownloadBar disabled={!recon}
          onExcel={()=>downloadGSTR2Recon_Excel(recon,company,source,mode==="monthly"?period:fy)}
          onJson={()=>downloadJSON(recon,`GSTR${source}_Recon_${company.gstin||"GSTIN"}_${mode==="monthly"?period:fy}.json`)}
        />
      </div>
    </>)}
  </div>);
}

// ── GSTR-10 — Final Return (on cancellation of GST registration) ─────────────
function GSTR10({token,toast,company}){
  const cid=company?.id;
  const[ret,setRet]=useState(null);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);
  const[f,setF]=useState({cancellation_date:"",effective_cancellation_date:"",reason_for_cancellation:""});
  const REASONS=["Ceased to be liable to pay tax","Discontinuance of business/Closure of business","Others"];
  const fR=n=>`₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  // Stock tables
  const emptyStockRow=()=>({description:"",unit:"NOS",qty:"0",taxable_value:"0",itc_availed:"0",tax_payable:"0"});
  const[t5_inputs,setT5inputs]=useState([emptyStockRow()]);
  const[t5_semi,setT5semi]=useState([emptyStockRow()]);
  const[t5_finished,setT5finished]=useState([emptyStockRow()]);
  const[t5_cg,setT5cg]=useState([emptyStockRow()]);

  useEffect(()=>{
    if(!cid)return;setLoading(true);
    api(`/accounting/companies/${cid}/gstr10`,"GET",null,token).then(d=>{
      setRet(d.return);
      if(d.return){
        setF({cancellation_date:d.return.cancellation_date||"",effective_cancellation_date:d.return.effective_cancellation_date||"",reason_for_cancellation:d.return.reason_for_cancellation||""});
        if(d.return.table5_inputs?.length)setT5inputs(d.return.table5_inputs);
        if(d.return.table5_semi_finished?.length)setT5semi(d.return.table5_semi_finished);
        if(d.return.table5_finished?.length)setT5finished(d.return.table5_finished);
        if(d.return.table5_capital_goods?.length)setT5cg(d.return.table5_capital_goods);
      }
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[cid,token]);

  const setRow=(setter,i,k,v)=>setter(p=>{const n=[...p];n[i]={...n[i],[k]:v};return n;});
  const addRow=setter=>setter(p=>[...p,emptyStockRow()]);
  const removeRow=(setter,i)=>setter(p=>p.filter((_,j)=>j!==i));
  const totalTax=(rows)=>rows.reduce((a,r)=>a+parseFloat(r.tax_payable||0),0);
  const grandTotal=()=>totalTax(t5_inputs)+totalTax(t5_semi)+totalTax(t5_finished)+totalTax(t5_cg);

  const StockTable=({title,rows,setter})=>(
    <div style={{marginBottom:16}}>
      <div style={{fontWeight:600,color:C.text,marginBottom:6,fontSize:12}}>{title}</div>
      <div className="tp-table-wrap"><table style={S.tbl}>
        <thead><tr>{["Description of Goods","Unit","Qty","Taxable Value (₹)","ITC Availed (₹)","Tax Payable (₹)",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>(
          <tr key={i}>
            <td style={S.td}><input style={{...S.input,fontSize:11,minWidth:140}} value={r.description} onChange={e=>setRow(setter,i,"description",e.target.value)}/></td>
            <td style={S.td}><input style={{...S.input,fontSize:11,width:55}} value={r.unit} onChange={e=>setRow(setter,i,"unit",e.target.value)}/></td>
            <td style={S.td}><input type="number" style={{...S.input,fontSize:11,width:65}} value={r.qty} onChange={e=>setRow(setter,i,"qty",e.target.value)}/></td>
            <td style={S.td}><input type="number" style={{...S.input,fontSize:11,width:90}} value={r.taxable_value} onChange={e=>setRow(setter,i,"taxable_value",e.target.value)}/></td>
            <td style={S.td}><input type="number" style={{...S.input,fontSize:11,width:90}} value={r.itc_availed} onChange={e=>setRow(setter,i,"itc_availed",e.target.value)}/></td>
            <td style={S.td}><input type="number" style={{...S.input,fontSize:11,width:90}} value={r.tax_payable} onChange={e=>setRow(setter,i,"tax_payable",e.target.value)}/></td>
            <td style={S.tdR}><button onClick={()=>removeRow(setter,i)} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:14}}>✕</button></td>
          </tr>
        ))}</tbody>
      </table></div>
      <button onClick={()=>addRow(setter)} style={{...S.btnO,fontSize:11,marginTop:6}}>+ Add Row</button>
    </div>
  );

  const save=async()=>{
    setSaving(true);
    try{
      await api(`/accounting/companies/${cid}/gstr10`,"POST",{...f,table5_inputs:t5_inputs,table5_semi_finished:t5_semi,table5_finished:t5_finished,table5_capital_goods:t5_cg,total_tax_payable:grandTotal()},token);
      toast("✅ GSTR-10 saved","success");
    }catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const markFiled=async()=>{
    const arn=prompt("Enter ARN from GST Portal:");if(!arn)return;
    try{await api(`/accounting/companies/${cid}/gstr10/file`,"POST",{arn},token);toast("✅ Filed","success");}catch(e){toast(e.message,"error");}
  };

  if(!cid)return null;
  if(loading)return<Spinner/>;

  return(<div>
    <div style={{...S.card,background:"#2d0e0e",border:"1px solid #6e1c1c",marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:"#f85149",marginBottom:4}}>⚠️ FORM GSTR-10 — Final Return</div>
      <div style={{fontSize:12,color:C.sub}}>Filed when GST registration is cancelled or surrendered. Must be filed within 3 months of cancellation order or effective date, whichever is later. Declares stock held on cancellation date and tax payable thereon.</div>
    </div>

    {/* Part-I: Basic Details */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:10}}>Part-I — Basic Details</div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>1. GSTIN</label><div style={{...S.input,background:"#0D1117",padding:"9px 12px",fontSize:12,color:C.muted}}>{company.gstin||"Not set"}</div></div>
        <div style={S.fg}><label style={S.label}>2. Legal Name</label><div style={{...S.input,background:"#0D1117",padding:"9px 12px",fontSize:12,color:C.muted}}>{company.name}</div></div>
      </div>
      <div style={S.col2}>
        <div style={S.fg}><label style={S.label}>3. Date of Cancellation Order</label><input type="date" style={S.input} value={f.cancellation_date} onChange={e=>setF(p=>({...p,cancellation_date:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>3a. Effective Date of Cancellation</label><input type="date" style={S.input} value={f.effective_cancellation_date} onChange={e=>setF(p=>({...p,effective_cancellation_date:e.target.value}))}/></div>
      </div>
      <div style={S.fg}><label style={S.label}>4. Reason for Cancellation</label><select style={S.select} value={f.reason_for_cancellation} onChange={e=>setF(p=>({...p,reason_for_cancellation:e.target.value}))}><option value="">— Select —</option>{REASONS.map(r=><option key={r}>{r}</option>)}</select></div>
    </div>

    {/* Table 5 — Stock at time of cancellation */}
    <div style={{...S.card,borderLeft:"3px solid #e3b341"}}>
      <div style={{fontWeight:700,color:"#e3b341",marginBottom:4}}>Table 5 — Details of Goods held in stock on the date of filing</div>
      <div style={{fontSize:12,color:C.sub,marginBottom:14}}>Tax payable = Higher of (ITC availed on those goods) or (output tax applicable on such goods). Tax payable is the amount that must be reversed/paid.</div>
      <StockTable title="(a) Inputs / Raw Materials" rows={t5_inputs} setter={setT5inputs}/>
      <StockTable title="(b) Semi-finished Goods / Work in Progress" rows={t5_semi} setter={setT5semi}/>
      <StockTable title="(c) Finished Goods" rows={t5_finished} setter={setT5finished}/>
      <StockTable title="(d) Capital Goods" rows={t5_cg} setter={setT5cg}/>
    </div>

    {/* Grand Total */}
    <div style={{...S.card,background:"#2d1b00",border:"1px solid #9e6a03"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}>
        <span>Total Tax Payable (Table 5)</span>
        <span style={{color:"#e3b341"}}>{fR(grandTotal())}</span>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:6}}>This amount must be paid via cash ledger before filing GSTR-10 on the GST portal.</div>
    </div>

    {/* Verification */}
    <div style={S.card}>
      <div style={{fontWeight:700,color:C.text,marginBottom:6}}>Verification</div>
      <div style={{fontSize:12,color:C.sub}}>I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief and nothing has been concealed therefrom.</div>
    </div>

    {ret&&<div style={{...S.card,background:"#0d2818"}}><span style={{fontSize:12,color:"#3fb950"}}>Status: {ret.status==="filed"?`Filed — ARN: ${ret.arn}`:"Draft"}</span></div>}

    <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
      <GSTDownloadBar disabled={!f.cancellation_date}
        onJson={()=>downloadJSON({gstin:company.gstin,cancellation_date:f.cancellation_date,effective_cancellation_date:f.effective_cancellation_date,reason:f.reason_for_cancellation,table5_inputs:t5_inputs,table5_semi_finished:t5_semi,table5_finished:t5_finished,table5_capital_goods:t5_cg,total_tax_payable:grandTotal()},`GSTR10_${company.gstin||"GSTIN"}.json`)}
        onPdf={()=>{
          const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});
          const stockHTML=(title,rows)=>rows.length?`<h3>${title}</h3><table><tr><th>Description</th><th>Unit</th><th>Qty</th><th>Taxable (₹)</th><th>ITC Availed (₹)</th><th>Tax Payable (₹)</th></tr>${rows.map(r=>`<tr><td>${r.description||"—"}</td><td>${r.unit}</td><td>${r.qty}</td><td>${n(r.taxable_value)}</td><td>${n(r.itc_availed)}</td><td><b>${n(r.tax_payable)}</b></td></tr>`).join("")}</table>`:"";
          const body=`<p><b>Cancellation Date:</b> ${f.cancellation_date||"—"} | <b>Effective Date:</b> ${f.effective_cancellation_date||"—"}</p><p><b>Reason:</b> ${f.reason_for_cancellation||"—"}</p>${stockHTML("(a) Inputs",t5_inputs)}${stockHTML("(b) Semi-Finished",t5_semi)}${stockHTML("(c) Finished Goods",t5_finished)}${stockHTML("(d) Capital Goods",t5_cg)}<h3>Total Tax Payable</h3><table><tr><th>Amount (₹)</th></tr><tr><td><b>${n(grandTotal())}</b></td></tr></table>`;
          openPrintWindow(buildPrintHTML("FORM GSTR-10 — Final Return",company.gstin||"",company.name,"Cancellation",body),`GSTR10_${company.gstin}.pdf`);
        }}
      />
            <button onClick={save} disabled={saving} style={S.btn}>{saving?"Saving...":"💾 Save Draft"}</button>
      {ret?.status!=="filed"&&<button onClick={markFiled} style={S.btnG}>Mark as Filed</button>}
      <button onClick={()=>window.open("https://services.gst.gov.in/services/auth/fowelcome","_blank")} style={S.btnO}>🌐 File on GST Portal</button>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════════════════
// GST RETURN DOWNLOAD UTILITY
// Formats: JSON (GST portal), Excel (SheetJS), PDF/Word (HTML print)
// JSON structure follows GSTN API schema (same as portal offline tool)
// ════════════════════════════════════════════════════════════════════════

// XLSX used for GST downloads - imported from the recharts bundle globals

// ── Shared Download Button Bar ───────────────────────────────────────────────
function GSTDownloadBar({onJson,onExcel,onPdf,onWord,returnType,period,disabled}){
  const[open,setOpen]=useState(false);const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  if(disabled)return null;
  return(
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{...S.btnG,display:"flex",alignItems:"center",gap:6}}>
        ⬇ Download {open?"▲":"▾"}
      </button>
      {open&&(
        <div style={{position:"absolute",right:0,bottom:"100%",marginBottom:4,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,zIndex:70,minWidth:200,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          <div style={{padding:"6px 12px",fontSize:10,color:C.muted,borderBottom:`1px solid ${C.border}`}}>DOWNLOAD AS</div>
          {onJson&&<DropItem icon="🌐" label="JSON — GST Portal Upload" sub="Compatible with GSTN offline tool" onClick={()=>{setOpen(false);onJson();}}/>}
          {onExcel&&<DropItem icon="📊" label="Excel (.xlsx)" sub="Multi-sheet workbook" onClick={()=>{setOpen(false);onExcel();}}/>}
          {onPdf&&<DropItem icon="📄" label="PDF" sub="Print-ready format" onClick={()=>{setOpen(false);onPdf();}}/>}
          {onWord&&<DropItem icon="📝" label="Word (.doc)" sub="Editable document" onClick={()=>{setOpen(false);onWord();}}/>}
        </div>
      )}
    </div>
  );
}

function DropItem({icon,label,sub,onClick}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:"9px 14px",cursor:"pointer",background:hov?"#1c2333":"transparent",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:13}}>{icon} {label}</div>
      <div style={{fontSize:10,color:C.muted}}>{sub}</div>
    </div>
  );
}

// ── JSON Generators (GSTN portal schema) ─────────────────────────────────────

function buildGSTR3B_JSON(data,company,period){
  const t=data.table3_1||{};const t4=data.table4||{};const t51=data.table5_1||{};const t6=data.table6_tax_payment||{};
  const n=v=>parseFloat(v)||0;
  return{
    gstin:company.gstin||"",ret_period:period?.replace("-",""),
    sup_details:{
      osup_det:{txval:n(t.a?.taxable),iamt:n(t.a?.igst),camt:n(t.a?.cgst),samt:n(t.a?.sgst),csamt:n(t.a?.cess)},
      osup_zero:{txval:n(t.b?.taxable),iamt:n(t.b?.igst),camt:0,samt:0,csamt:n(t.b?.cess)},
      osup_nil_exmp:{txval:n(t.c?.taxable),iamt:0,camt:0,samt:0,csamt:0},
      isup_rev:{txval:n(t.d?.taxable),iamt:n(t.d?.igst),camt:n(t.d?.cgst),samt:n(t.d?.sgst),csamt:n(t.d?.cess)},
      osup_nongst:{txval:n(t.e?.taxable),iamt:0,camt:0,samt:0,csamt:0},
    },
    inter_sup:{
      unreg_details:(data.table3_2||[]).map(r=>({pos:r.place_of_supply||"",txval:n(r.taxable),iamt:n(r.igst)})),
      comp_details:[],uin_details:[],
    },
    itc_elg:{
      itc_avl:[
        {ty:"IMPG",iamt:n(t4.itc_a1?.igst),camt:n(t4.itc_a1?.cgst),samt:n(t4.itc_a1?.sgst),csamt:n(t4.itc_a1?.cess)},
        {ty:"IMPS",iamt:n(t4.itc_a2?.igst),camt:n(t4.itc_a2?.cgst),samt:n(t4.itc_a2?.sgst),csamt:n(t4.itc_a2?.cess)},
        {ty:"ISRC",iamt:n(t4.itc_a3?.igst),camt:n(t4.itc_a3?.cgst),samt:n(t4.itc_a3?.sgst),csamt:n(t4.itc_a3?.cess)},
        {ty:"ISD",iamt:n(t4.itc_a4?.igst),camt:n(t4.itc_a4?.cgst),samt:n(t4.itc_a4?.sgst),csamt:n(t4.itc_a4?.cess)},
        {ty:"OTH",iamt:n(t4.itc_a5?.igst),camt:n(t4.itc_a5?.cgst),samt:n(t4.itc_a5?.sgst),csamt:n(t4.itc_a5?.cess)},
      ],
      itc_rev:[
        {ty:"RUL",iamt:n(t4.itc_b1?.igst),camt:n(t4.itc_b1?.cgst),samt:n(t4.itc_b1?.sgst),csamt:0},
        {ty:"OTH",iamt:n(t4.itc_b2?.igst),camt:n(t4.itc_b2?.cgst),samt:n(t4.itc_b2?.sgst),csamt:0},
      ],
      itc_net:{iamt:n(t4.itc_net?.igst),camt:n(t4.itc_net?.cgst),samt:n(t4.itc_net?.sgst),csamt:n(t4.itc_net?.cess)},
      itc_inelg:[
        {ty:"RUL",iamt:n(t4.itc_d1?.igst),camt:n(t4.itc_d1?.cgst),samt:n(t4.itc_d1?.sgst),csamt:0},
        {ty:"OTH",iamt:n(t4.itc_d2?.igst),camt:n(t4.itc_d2?.cgst),samt:n(t4.itc_d2?.sgst),csamt:0},
      ],
    },
    inward_sup:{isup_details:[{ty:"GST",inter:0,intra:0},{ty:"NONGST",inter:0,intra:0}]},
    intr_ltfee:{
      intr_details:[
        {ty:"Integrated Tax",iamt:n(t51.interest?.igst)},
        {ty:"Central Tax",camt:n(t51.interest?.cgst)},
        {ty:"State/UT Tax",samt:n(t51.interest?.sgst)},
      ],
    },
  };
}

function buildGSTR1_JSON(data,company,period){
  const n=v=>parseFloat(v)||0;
  const formatDate=d=>{
    if(!d)return"";
    const s=String(d).substring(0,10).split("-");
    return s.length===3?`${s[2]}-${s[1]}-${s[0]}`:"";
  };
  return{
    gstin:company.gstin||"",fp:period?.replace("-",""),
    b2b:(data.table4_b2b||[]).map(p=>({
      ctin:p.gstin,
      inv:p.invoices.map(i=>({inum:i.invoice_no,idt:formatDate(i.date),val:n(i.value),pos:i.place_of_supply||"",rchrg:"N",itms:[{num:1,itm_det:{rt:0,txval:n(i.taxable),iamt:n(i.igst),camt:n(i.cgst),samt:n(i.sgst),csamt:n(i.cess)}}]})),
    })),
    b2cl:(data.table5_b2cl||[]).map(r=>({pos:r.state,inv:[{inum:"B2CL",idt:"",val:n(r.taxable)+n(r.igst),pos:r.state,itms:[{num:1,itm_det:{rt:0,txval:n(r.taxable),iamt:n(r.igst),camt:0,samt:0,csamt:0}}]}]})),
    b2cs:(data.table7_b2cs?Object.values(data.table7_b2cs).map(r=>({sply_ty:r.igst>0?"INTER":"INTRA",pos:r.state,rt:0,txval:n(r.taxable),iamt:n(r.igst),camt:n(r.cgst),samt:n(r.sgst),csamt:0})):[]),
    hsn:{data:(data.table12_hsn||[]).map(h=>({num:1,hsn_sc:h.hsn_sac,desc:h.description,uqc:h.uqc,qty:h.qty,val:n(h.total_value),txval:n(h.taxable_value),iamt:n(h.igst),camt:n(h.cgst),samt:n(h.sgst),csamt:0}))},
  };
}

function buildCMP08_JSON(ret,company,fy,quarter){
  return{
    gstin:company.gstin||"",fy,qtr:quarter,
    table3:{
      "3.1":{txval:parseFloat(ret.outward_taxable)||0,camt:parseFloat(ret.outward_cgst)||0,samt:parseFloat(ret.outward_sgst)||0,csamt:parseFloat(ret.outward_cess)||0},
      "3.2":{txval:parseFloat(ret.inward_rcm_taxable)||0,iamt:parseFloat(ret.inward_rcm_igst)||0,camt:parseFloat(ret.inward_rcm_cgst)||0,samt:parseFloat(ret.inward_rcm_sgst)||0,csamt:parseFloat(ret.inward_rcm_cess)||0},
      interest:{iamt:parseFloat(ret.interest_igst)||0,camt:parseFloat(ret.interest_cgst)||0,samt:parseFloat(ret.interest_sgst)||0,csamt:parseFloat(ret.interest_cess)||0},
    },
  };
}

// ── Excel Generators ──────────────────────────────────────────────────────────

function downloadGSTR3B_Excel(data,company,period){
  const XLSX=window.XLSX||null;if(!XLSX)return alert("Excel export requires the XLSX library. Please reload the page.");
  const n=v=>parseFloat(v)||0;const t=data.table3_1||{};const t4=data.table4||{};const t6=data.table6_tax_payment||{};
  const wb=XLSX.utils.book_new();
  // Sheet 1: Summary
  const sum=[
    ["FORM GSTR-3B"],[""],
    ["GSTIN:",company.gstin||"","Period:",period],
    ["Legal Name:",company.name],[""],
    ["3.1 OUTWARD SUPPLIES","Taxable Value","IGST","CGST","SGST/UTGST","Cess"],
    ["(a) Taxable (other than zero/nil/exempt)",n(t.a?.taxable),n(t.a?.igst),n(t.a?.cgst),n(t.a?.sgst),n(t.a?.cess)],
    ["(b) Zero-rated",n(t.b?.taxable),n(t.b?.igst),0,0,n(t.b?.cess)],
    ["(c) Nil/Exempt",n(t.c?.taxable),0,0,0,0],
    ["(d) Inward supplies (RCM)",n(t.d?.taxable),n(t.d?.igst),n(t.d?.cgst),n(t.d?.sgst),n(t.d?.cess)],
    ["(e) Non-GST",n(t.e?.taxable),0,0,0,0],[""],
    ["4 ITC (AVAILED/REVERSED)","","IGST","CGST","SGST","Cess"],
    ["4A(5) All other ITC","",n(t4.itc_a5?.igst),n(t4.itc_a5?.cgst),n(t4.itc_a5?.sgst),n(t4.itc_a5?.cess)],
    ["4(C) Net ITC Available","",n(t4.itc_net?.igst),n(t4.itc_net?.cgst),n(t4.itc_net?.sgst),n(t4.itc_net?.cess)],[""],
    ["6 TAX PAYMENT","","IGST","CGST","SGST","Cess"],
    ["Tax Payable","",n(t6.payable?.igst),n(t6.payable?.cgst),n(t6.payable?.sgst),n(t6.payable?.cess)],
    ["Paid through ITC","",n(t6.itc_used?.igst),n(t6.itc_used?.cgst),n(t6.itc_used?.sgst),n(t6.itc_used?.cess)],
    ["Paid through Cash","",n(t6.cash_used?.igst),n(t6.cash_used?.cgst),n(t6.cash_used?.sgst),n(t6.cash_used?.cess)],
  ];
  const ws=XLSX.utils.aoa_to_sheet(sum);ws["!cols"]=[{wch:45},{wch:16},{wch:14},{wch:14},{wch:14},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws,"GSTR-3B Summary");
  // Sheet 2: 3.2 Inter-state
  if(data.table3_2?.length>0){
    const rows=[["3.2 Inter-State Supplies to Unregistered/Composition"],["Place of Supply","Taxable Value","IGST"],...data.table3_2.map(r=>[r.place_of_supply,n(r.taxable),n(r.igst)])];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),"3.2 Inter-State");
  }
  const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  const blob=new Blob([buf],{type:"application/octet-stream"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GSTR3B_${company.gstin||"GSTIN"}_${period}.xlsx`;a.click();
}

function downloadGSTR1_Excel(data,company,period){
  const XLSX=window.XLSX||null;if(!XLSX)return alert("Excel export requires the XLSX library. Please reload the page.");
  const n=v=>parseFloat(v)||0;const wb=XLSX.utils.book_new();
  const s=data.summary||{};
  const cover=[["FORM GSTR-1 — Return for Outward Supplies"],[""],["GSTIN:",company.gstin||"","Period:",period],["Legal Name:",company.name],[""],["Summary"],["Total Invoices:",s.total_invoices||0],["Total Taxable:",s.total_taxable||0],["Total IGST:",s.total_igst||0],["Total CGST:",s.total_cgst||0],["Total SGST:",s.total_sgst||0]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cover),"Cover");
  // Table 4 B2B
  const b2bRows=[["Table 4 — B2B Invoices"],["GSTIN","Party Name","Invoice No","Date","Invoice Value","Taxable Value","IGST","CGST","SGST","Cess","Place of Supply"]];
  (data.table4_b2b||[]).forEach(p=>p.invoices.forEach(i=>b2bRows.push([p.gstin,p.name,i.invoice_no,String(i.date).substring(0,10),n(i.value),n(i.taxable),n(i.igst),n(i.cgst),n(i.sgst),n(i.cess),i.place_of_supply||""])));
  const wsB2B=XLSX.utils.aoa_to_sheet(b2bRows);wsB2B["!cols"]=[{wch:18},{wch:28},{wch:16},{wch:12},{wch:14},{wch:14},{wch:12},{wch:12},{wch:12},{wch:8},{wch:14}];
  XLSX.utils.book_append_sheet(wb,wsB2B,"4 B2B");
  // Table 5 B2CL
  const b2clRows=[["Table 5 — B2C Large"],["Place of Supply","Taxable Value","IGST","Cess"],...(data.table5_b2cl||[]).map(r=>[r.state,n(r.taxable),n(r.igst),0])];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(b2clRows),"5 B2C Large");
  // Table 7 B2CS
  const b2csRows=[["Table 7 — B2C Small"],["State","Taxable Value","IGST","CGST","SGST"],...Object.values(data.table7_b2cs||{}).map(r=>[r.state,n(r.taxable),n(r.igst),n(r.cgst),n(r.sgst)])];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(b2csRows),"7 B2C Small");
  // Table 12 HSN
  if(data.table12_hsn?.length>0){
    const hsnRows=[["Table 12 — HSN Summary"],["HSN Code","Description","UQC","Qty","Total Value","Taxable Value","IGST","CGST","SGST","Cess"],...data.table12_hsn.map(h=>[h.hsn_sac,h.description,h.uqc,h.qty,n(h.total_value),n(h.taxable_value),n(h.igst),n(h.cgst),n(h.sgst),0])];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(hsnRows),"12 HSN");
  }
  const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  const blob=new Blob([buf],{type:"application/octet-stream"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GSTR1_${company.gstin||"GSTIN"}_${period}.xlsx`;a.click();
}

function downloadGSTR2Recon_Excel(recon,company,source,period){
  const XLSX=window.XLSX||null;if(!XLSX)return alert("Excel export requires the XLSX library. Please reload the page.");
  const n=v=>parseFloat(v)||0;const wb=XLSX.utils.book_new();
  const s=recon.summary||{};
  const cover=[["GSTR-2A/2B Reconciliation Report"],[""],["GSTIN:",company.gstin||"","Period:",period],["Source:",`GSTR-${source}`],[""],["Summary"],["Total in "+source+":",s.total_2b],["Matched:",s.matched],["Mismatch:",s.mismatch],["Not in Books:",s.unmatched_2b],["Only in Books:",s.only_in_books]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cover),"Summary");
  const allRows=[["Supplier GSTIN","Supplier Name","Invoice No","Date","Taxable("+source+")","Tax("+source+")","Taxable(Books)","Tax(Books)","Status","Mismatch Details"],...(recon.reconciled||[]).map(r=>[r.supplier_gstin||"",r.supplier_name||"",r.invoice_no||"",String(r.invoice_date||"").substring(0,10),n(r.taxable_value),n(r.igst)+n(r.cgst)+n(r.sgst),r.matched_invoice?n(r.matched_invoice.taxable):"",r.matched_invoice?n(r.matched_invoice.total_tax):"",r.recon_status,r.mismatch_fields?.join(" | ")||""])];
  const wsAll=XLSX.utils.aoa_to_sheet(allRows);wsAll["!cols"]=[{wch:18},{wch:24},{wch:14},{wch:12},{wch:14},{wch:12},{wch:14},{wch:12},{wch:12},{wch:40}];
  XLSX.utils.book_append_sheet(wb,wsAll,"All Entries");
  const mismatch=allRows.filter(r=>r[8]==="mismatch");
  if(mismatch.length>0)XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([allRows[0],...mismatch]),"Mismatches Only");
  const booksOnly=[["Party Name","Invoice No","Date","Taxable","Total Tax"],...(recon.only_in_books||[]).map(r=>[r.party_name||"",r.invoice_no||"",String(r.invoice_date||"").substring(0,10),n(r.taxable_amount),n(r.total_tax)])];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(booksOnly),"Only in Books");
  const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  const blob=new Blob([buf],{type:"application/octet-stream"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GSTR${source}_Recon_${company.gstin||"GSTIN"}_${period}.xlsx`;a.click();
}

// ── PDF / Word HTML generator ─────────────────────────────────────────────────
function openPrintWindow(html,filename){
  const w=window.open("","_blank");
  if(!w)return alert("Pop-up blocked — allow pop-ups for this site");
  w.document.write(html);w.document.close();
  if(filename?.endsWith(".doc")){
    const a=document.createElement("a");a.href=`data:application/msword,${encodeURIComponent(html)}`;a.download=filename;a.click();
  }else{
    w.onload=()=>w.print();
  }
}

function buildPrintHTML(title,gstin,name,period,bodyHTML){
  return`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#000}
h2{text-align:center;font-size:13px}h3{font-size:11px;margin:14px 0 4px}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
td,th{border:1px solid #000;padding:3px 6px;font-size:10px}
th{background:#f0f0f0;font-weight:bold}.header{text-align:center;border:2px solid #000;padding:8px;margin-bottom:14px}
.kv{display:flex;gap:20px;margin-bottom:8px}.kv span{font-size:11px}
@media print{.no-print{display:none}}
</style></head><body>
<div class="header"><b>${title}</b></div>
<div class="kv"><span><b>GSTIN:</b> ${gstin||"—"}</span><span><b>Legal Name:</b> ${name}</span><span><b>Period:</b> ${period}</span></div>
${bodyHTML}
<br/><div style="font-size:9px;color:#666">Generated by TaxPro GST · ${new Date().toLocaleString("en-IN")}</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

function downloadGSTR3B_PDF(data,company,period){
  const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});
  const t=data.table3_1||{};const t4=data.table4||{};const t6=data.table6_tax_payment||{};
  const tRow=(label,row)=>`<tr><td>${label}</td><td>${n(row?.taxable)}</td><td>${n(row?.igst)}</td><td>${n(row?.cgst)}</td><td>${n(row?.sgst)}</td><td>${n(row?.cess)}</td></tr>`;
  const body=`
<h3>3.1 Outward Supplies</h3>
<table><tr><th>Particulars</th><th>Taxable Value</th><th>Integrated Tax</th><th>Central Tax</th><th>State/UT Tax</th><th>Cess</th></tr>
${tRow("(a) Taxable outward supplies",t.a)}${tRow("(b) Zero-rated supplies",t.b)}${tRow("(c) Nil/Exempt",{taxable:t.c?.taxable,igst:0,cgst:0,sgst:0,cess:0})}${tRow("(d) Inward RCM",t.d)}${tRow("(e) Non-GST",{taxable:t.e?.taxable,igst:0,cgst:0,sgst:0,cess:0})}</table>
${data.table3_2?.length>0?`<h3>3.2 Inter-State to Unregistered</h3><table><tr><th>Place of Supply</th><th>Taxable Value</th><th>IGST</th></tr>${data.table3_2.map(r=>`<tr><td>${r.place_of_supply}</td><td>${n(r.taxable)}</td><td>${n(r.igst)}</td></tr>`).join("")}</table>`:""}
<h3>4 Eligible ITC</h3>
<table><tr><th>Particulars</th><th>IGST</th><th>CGST</th><th>SGST</th><th>Cess</th></tr>
<tr><td>4A(5) All other ITC</td><td>${n(t4.itc_a5?.igst)}</td><td>${n(t4.itc_a5?.cgst)}</td><td>${n(t4.itc_a5?.sgst)}</td><td>${n(t4.itc_a5?.cess)}</td></tr>
<tr><td><b>4(C) Net ITC Available</b></td><td><b>${n(t4.itc_net?.igst)}</b></td><td><b>${n(t4.itc_net?.cgst)}</b></td><td><b>${n(t4.itc_net?.sgst)}</b></td><td>${n(t4.itc_net?.cess)}</td></tr></table>
<h3>6 Tax Payment</h3>
<table><tr><th>Particulars</th><th>IGST</th><th>CGST</th><th>SGST</th><th>Cess</th></tr>
<tr><td>Tax payable</td><td>${n(t6.payable?.igst)}</td><td>${n(t6.payable?.cgst)}</td><td>${n(t6.payable?.sgst)}</td><td>${n(t6.payable?.cess)}</td></tr>
<tr><td>Paid through ITC</td><td>${n(t6.itc_used?.igst)}</td><td>${n(t6.itc_used?.cgst)}</td><td>${n(t6.itc_used?.sgst)}</td><td>${n(t6.itc_used?.cess)}</td></tr>
<tr><td>Paid through Cash</td><td>${n(t6.cash_used?.igst)}</td><td>${n(t6.cash_used?.cgst)}</td><td>${n(t6.cash_used?.sgst)}</td><td>${n(t6.cash_used?.cess)}</td></tr>
<tr><td>Interest</td><td>${n(t6.interest?.igst)}</td><td>${n(t6.interest?.cgst)}</td><td>${n(t6.interest?.sgst)}</td><td>—</td></tr>
<tr><td>Late fee</td><td>—</td><td>${n(t6.late_fee?.cgst)}</td><td>${n(t6.late_fee?.sgst)}</td><td>—</td></tr>
</table>`;
  openPrintWindow(buildPrintHTML("FORM GSTR-3B",company.gstin||"",company.name,period||"",body),`GSTR3B_${company.gstin}_${period}.pdf`);
}

function downloadGSTR1_PDF(data,company,period){
  const n=v=>Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2});
  const s=data.summary||{};
  const body=`
<h3>Summary</h3>
<table><tr><th>Particulars</th><th>Count/Value</th></tr>
<tr><td>B2B Invoices</td><td>${s.b2b_count||0}</td></tr><tr><td>B2C Large Invoices</td><td>${s.b2c_large_count||0}</td></tr>
<tr><td>B2C Small Invoices</td><td>${s.b2c_small_count||0}</td></tr><tr><td>Total Invoices</td><td>${s.total_invoices||0}</td></tr>
<tr><td>Total Taxable Value</td><td>₹${n(s.total_taxable)}</td></tr><tr><td>Total IGST</td><td>₹${n(s.total_igst)}</td></tr>
<tr><td>Total CGST</td><td>₹${n(s.total_cgst)}</td></tr><tr><td>Total SGST</td><td>₹${n(s.total_sgst)}</td></tr></table>
<h3>Table 4 — B2B Invoices</h3>
<table><tr><th>GSTIN</th><th>Party</th><th>Invoice No</th><th>Date</th><th>Value</th><th>Taxable</th><th>IGST</th><th>CGST</th><th>SGST</th></tr>
${(data.table4_b2b||[]).flatMap(p=>p.invoices.map(i=>`<tr><td>${p.gstin}</td><td>${p.name}</td><td>${i.invoice_no}</td><td>${String(i.date).substring(0,10)}</td><td>₹${n(i.value)}</td><td>₹${n(i.taxable)}</td><td>₹${n(i.igst)}</td><td>₹${n(i.cgst)}</td><td>₹${n(i.sgst)}</td></tr>`)).join("")}
</table>
${data.table12_hsn?.length>0?`<h3>Table 12 — HSN Summary</h3><table><tr><th>HSN</th><th>Description</th><th>UQC</th><th>Qty</th><th>Taxable</th><th>IGST</th><th>CGST</th><th>SGST</th></tr>${data.table12_hsn.map(h=>`<tr><td>${h.hsn_sac}</td><td>${h.description}</td><td>${h.uqc}</td><td>${h.qty}</td><td>₹${n(h.taxable_value)}</td><td>₹${n(h.igst)}</td><td>₹${n(h.cgst)}</td><td>₹${n(h.sgst)}</td></tr>`).join("")}</table>`:""}`;
  openPrintWindow(buildPrintHTML("FORM GSTR-1 — Return for Outward Supplies",company.gstin||"",company.name,period||"",body),`GSTR1_${company.gstin}_${period}.pdf`);
}

// ── Generic JSON downloader ───────────────────────────────────────────────────
function downloadJSON(obj,filename){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}