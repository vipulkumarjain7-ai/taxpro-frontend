import { useState, useRef, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API || "https://taxpro-backend-xi90.onrender.com/api";

const api = async (path, method="GET", body=null, token=null) => {
  const headers = {"Content-Type":"application/json"};
  if(token) headers["Authorization"] = `Bearer ${token}`;
  const opts = {method, headers};
  if(body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if(!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const fmtM = n => `Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const todayStr = () => new Date().toISOString().split("T")[0];

const S = {
  app:{display:"flex",minHeight:"100vh",fontFamily:"'Inter',sans-serif",fontSize:13,background:"#0D1117",color:"#C9D1D9"},
  sidebar:{width:220,minWidth:220,background:"#161B22",borderRight:"1px solid #21262D",display:"flex",flexDirection:"column",overflowY:"auto"},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  topbar:{padding:"12px 20px",background:"#161B22",borderBottom:"1px solid #21262D",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0},
  content:{flex:1,overflowY:"auto",padding:18,background:"#0D1117"},
  card:{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:16,marginBottom:12},
  kpi:{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:"14px 16px"},
  kpiLabel:{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.6,marginBottom:6},
  kpiVal:{fontSize:22,fontWeight:700,lineHeight:1,color:"#E6EDF3"},
  tbl:{width:"100%",borderCollapse:"collapse",fontSize:12},
  th:{textAlign:"left",padding:"8px 10px",color:"#8B949E",borderBottom:"1px solid #21262D",fontWeight:500,fontSize:11},
  td:{padding:"8px 10px",borderBottom:"1px solid #21262D",color:"#C9D1D9",verticalAlign:"middle"},
  tdL:{padding:"8px 10px",color:"#C9D1D9",verticalAlign:"middle"},
  mono:{fontFamily:"monospace",fontSize:11,color:"#8B949E"},
  twoCol:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  input:{padding:"9px 12px",borderRadius:8,border:"1px solid #30363D",background:"#0D1117",color:"#C9D1D9",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"},
  select:{padding:"7px 10px",borderRadius:8,border:"1px solid #30363D",background:"#161B22",color:"#C9D1D9",fontSize:12,fontFamily:"inherit",width:"100%"},
  btn:{padding:"9px 18px",borderRadius:8,border:"none",background:"#1F6FEB",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"},
  btnG:{padding:"9px 18px",borderRadius:8,border:"none",background:"#238636",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"},
  btnGhost:{padding:"7px 14px",borderRadius:8,border:"1px solid #30363D",background:"transparent",color:"#8B949E",cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  btnDanger:{padding:"7px 14px",borderRadius:8,border:"1px solid #6e1c1c",background:"transparent",color:"#f85149",cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  btnAmber:{padding:"7px 14px",borderRadius:8,border:"1px solid #9e6a03",background:"transparent",color:"#e3b341",cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  label:{fontSize:12,color:"#8B949E",display:"block",marginBottom:5},
  fg:{marginBottom:14},
  aiWrap:{display:"flex",flexDirection:"column",height:"calc(100vh - 100px)"},
  aiMsgs:{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10},
  bubU:{background:"#1F6FEB",color:"#fff",padding:"9px 13px",borderRadius:"16px 16px 4px 16px",maxWidth:"75%",marginLeft:"auto",lineHeight:1.6,whiteSpace:"pre-wrap"},
  bubA:{background:"#21262D",border:"1px solid #30363D",color:"#C9D1D9",padding:"9px 13px",borderRadius:"16px 16px 16px 4px",maxWidth:"80%",lineHeight:1.6,whiteSpace:"pre-wrap"},
};

const badge = (txt, color) => {
  const map={green:{bg:"#0d2818",color:"#3fb950",border:"#238636"},amber:{bg:"#2d1b00",color:"#e3b341",border:"#9e6a03"},red:{bg:"#2d0e0e",color:"#f85149",border:"#6e1c1c"},blue:{bg:"#0c1d2e",color:"#58a6ff",border:"#1f4872"},gray:{bg:"#21262D",color:"#8b949e",border:"#30363D"},purple:{bg:"#1a0a2e",color:"#bf91f3",border:"#6e40c9"},teal:{bg:"#002d2d",color:"#39d0d0",border:"#006666"}};
  const c = map[color]||map.gray;
  return <span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{txt}</span>;
};

const SBadge = ({s}) => {
  const m={compliant:["Compliant","green"],pending:["Pending","amber"],notice:["Notice","red"],overdue:["Overdue","red"],paid:["Paid","green"],unpaid:["Unpaid","red"],partial:["Partial","amber"],filed:["Filed","green"],"not-filed":["Not Filed","red"]};
  const [l,c] = m[s]||[s,"gray"];
  return badge(l,c);
};

const Spinner = () => (<div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:28,height:28,border:"3px solid #21262D",borderTop:"3px solid #1F6FEB",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);

const Toast = ({msg,type,onClose}) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#2d0e0e":"#0d2818",border:`1px solid ${type==="error"?"#6e1c1c":"#238636"}`,color:type==="error"?"#f85149":"#3fb950",padding:"12px 18px",borderRadius:10,fontSize:13,maxWidth:380,display:"flex",alignItems:"center",gap:10}}>
    <span>{msg}</span><button onClick={onClose} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16,marginLeft:"auto"}}>✕</button>
  </div>
);

const Modal = ({title,onClose,children,wide}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:30,overflowY:"auto"}}>
    <div style={{background:"#161B22",border:"1px solid #30363D",borderRadius:12,padding:24,width:wide?"min(880px,96vw)":"min(560px,92vw)",maxHeight:"90vh",overflowY:"auto",margin:"0 auto 30px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <span style={{fontSize:15,fontWeight:600,color:"#E6EDF3"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:22}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);


// ── GSTIN INPUT COMPONENT with validation + auto-populate ─────────────────
function GSTINInput({value,onChange,token,onVerified,disabled}){
  const[status,setStatus]=useState(null); // null | "checking" | "valid" | "invalid"
  const[msg,setMsg]=useState("");
  const inputRef=useRef(null);

  const verify=async(gstin)=>{
    if(!gstin||gstin.length<15){setStatus(null);setMsg("");return;}
    if(gstin.length!==15){setStatus("invalid");setMsg("GSTIN must be exactly 15 characters");return;}
    setStatus("checking");setMsg("Verifying...");
    try{
      const data=await api(`/gstin/lookup/${gstin}`,"GET",null,token);
      if(data.valid){
        setStatus("valid");
        setMsg(data.message||"✅ Valid GSTIN");
        if(onVerified)onVerified({
          gstin:data.gstin,
          state:data.state,
          state_code:data.state_code,
          pan:data.pan,
          business_name:data.business_name||"",
          address:data.address||"",
          city:data.city||"",
          pincode:data.pincode||"",
          entity_type:data.entity_type||""
        });
      }else{
        setStatus("invalid");
        setMsg(data.message||"❌ Invalid GSTIN");
        if(onVerified)onVerified(null);
      }
    }catch(e){
      setStatus("invalid");
      setMsg("Verification failed. Check connection.");
      if(onVerified)onVerified(null);
    }
  };

  const handleChange=e=>{
    const val=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").substring(0,15);
    onChange(val);
    setStatus(null);setMsg("");
    if(val.length===15)verify(val);
  };

  const borderColor=status==="valid"?"#238636":status==="invalid"?"#c0392b":"#30363D";
  const bgColor=status==="valid"?"#0a1a0a":status==="invalid"?"#1a0a0a":"#0D1117";

  return(<div>
    <div style={{position:"relative"}}>
      <input
        ref={inputRef}
        style={{...S.input,border:`1px solid ${borderColor}`,background:bgColor,paddingRight:40,letterSpacing:1,fontFamily:"monospace",fontSize:13,textTransform:"uppercase"}}
        placeholder="e.g. 29AABCS1429B1Z5"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={15}
      />
      <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:16}}>
        {status==="checking"&&<span style={{color:"#e3b341"}}>⏳</span>}
        {status==="valid"&&<span style={{color:"#3fb950"}}>✅</span>}
        {status==="invalid"&&<span style={{color:"#f85149"}}>❌</span>}
        {!status&&value.length===15&&<span style={{color:"#8B949E",cursor:"pointer"}} onClick={()=>verify(value)}>🔍</span>}
      </div>
    </div>
    {msg&&<div style={{fontSize:11,marginTop:4,color:status==="valid"?"#3fb950":status==="invalid"?"#f85149":"#e3b341",padding:"4px 8px",borderRadius:6,background:status==="valid"?"#0a1a0a":status==="invalid"?"#1a0a0a":"#1a1500"}}>{msg}</div>}
    <div style={{fontSize:10,color:"#8B949E",marginTop:3}}>Enter 15-character GSTIN — auto-validates and fetches business details</div>
  </div>);
}

function AuthScreen({onAuth}){
  const[tab,setTab]=useState("login");
  const[form,setForm]=useState({name:"",email:"",password:"",firm_name:"",frn:""});
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
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
          <div style={{fontSize:32,marginBottom:6}}>🛡️</div>
          <div style={{fontSize:26,fontWeight:800,color:"#E6EDF3"}}>TaxPro GST</div>
          <div style={{fontSize:13,color:"#8B949E",marginTop:4}}>Complete Accounting + GST Software</div>
        </div>
        <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:28}}>
          <div style={{display:"flex",gap:4,marginBottom:22,background:"#0D1117",borderRadius:10,padding:4}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:tab===t?"#1F6FEB":"transparent",color:tab===t?"#fff":"#8B949E"}}>{t==="login"?"Sign In":"Register"}</button>
            ))}
          </div>
          {tab==="register"&&<>
            <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} placeholder="CA Rahul Prakash" value={form.name} onChange={set("name")}/></div>
            <div style={S.fg}><label style={S.label}>Firm Name *</label><input style={S.input} placeholder="Prakash & Associates" value={form.firm_name} onChange={set("firm_name")}/></div>
            <div style={S.fg}><label style={S.label}>FRN (optional)</label><input style={S.input} placeholder="001234N" value={form.frn} onChange={set("frn")}/></div>
          </>}
          <div style={S.fg}><label style={S.label}>Email *</label><input style={S.input} type="email" placeholder="you@firm.com" value={form.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div style={S.fg}><label style={S.label}>Password *</label><input style={S.input} type="password" placeholder="min 6 characters" value={form.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          {error&&<div style={{background:"#2d0e0e",border:"1px solid #6e1c1c",color:"#f85149",padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:14}}>⚠️ {error}</div>}
          <button onClick={submit} disabled={loading} style={{...S.btn,width:"100%",padding:"12px",opacity:loading?0.6:1}}>{loading?"Please wait...":tab==="login"?"Sign In →":"Create Account"}</button>
          {tab==="login"&&<div style={{textAlign:"center",marginTop:14,fontSize:12,color:"#8B949E"}}>New user? <span style={{color:"#58a6ff",cursor:"pointer"}} onClick={()=>setTab("register")}>Register here</span></div>}
        </div>
      </div>
    </div>
  );
}

function Dashboard({token}){
  const[gst,setGst]=useState(null);const[inv,setInv]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([api("/dashboard","GET",null,token).catch(()=>null),api("/invoices/stats/summary","GET",null,token).catch(()=>null)]).then(([g,i])=>{setGst(g?.dashboard);setInv(i?.stats);setLoading(false);});},[token]);
  if(loading)return<Spinner/>;
  return(<div>
    <div style={{marginBottom:10}}>{badge("Live Dashboard","blue")}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
      {[{label:"Monthly Sales",val:fmtM(inv?.monthly_sales||0),color:"#3fb950"},{label:"Monthly Purchases",val:fmtM(inv?.monthly_purchases||0),color:"#58a6ff"},{label:"Outstanding",val:fmtM(inv?.total_outstanding||0),color:"#e3b341"},{label:"Overdue",val:fmtM(inv?.overdue_amount||0),color:"#f85149"}].map(k=>(
        <div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{fontSize:15,fontWeight:700,color:k.color}}>{k.val}</div></div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
      {[{label:"GST Clients",val:gst?.clients?.total||0,color:"#E6EDF3"},{label:"Compliant",val:gst?.clients?.compliant||0,color:"#3fb950"},{label:"Open Notices",val:gst?.notices?.open||0,color:"#f85149"},{label:"Due in 30 Days",val:gst?.notices?.due_in_30_days||0,color:"#e3b341"}].map(k=>(
        <div key={k.label} style={S.kpi}><div style={S.kpiLabel}>{k.label}</div><div style={{...S.kpiVal,color:k.color}}>{k.val}</div></div>
      ))}
    </div>
    <div style={S.twoCol}>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Upcoming Notice Due Dates</div>
        {!gst?.upcoming_notices?.length?<div style={{color:"#3fb950",fontSize:12}}>No notices due soon ✓</div>:gst.upcoming_notices.map(n=>(
          <div key={n.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D"}}>
            <div><div style={{fontWeight:500,color:"#E6EDF3",fontSize:12}}>{n.client_name}</div><div style={{fontSize:11,color:"#8B949E"}}>{n.type}</div></div>
            {badge(n.due_date,"amber")}
          </div>
        ))}
      </div>
      {gst?.returns_summary&&(
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Filing — {gst.returns_summary.period}</div>
          <table style={S.tbl}><thead><tr>{["Return","Filed","Pending","Not Filed"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{[["GSTR-1","gstr1"],["GSTR-3B","gstr3b"],["GSTR-9","gstr9"]].map(([lbl,key])=>(
            <tr key={key}><td style={S.td}>{lbl}</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{gst.returns_summary[key].filed}</td><td style={{...S.td,color:"#e3b341",fontWeight:600}}>{gst.returns_summary[key].pending}</td><td style={{...S.tdL,color:"#f85149",fontWeight:600}}>{gst.returns_summary[key].not_filed}</td></tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  </div>);
}

function InvoiceForm({token,toast,type,onClose,onSave}){
  const[parties,setParties]=useState([]);const[products,setProducts]=useState([]);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({invoice_type:type||"SALES",party_id:"",party_name:"",party_gstin:"",party_address:"",party_state:"",invoice_date:todayStr(),due_date:"",place_of_supply:"",is_igst:false,notes:"",terms:"Payment due within 30 days."});
  const[items,setItems]=useState([{name:"",hsn_sac:"",unit:"PCS",qty:"1",rate:"0",discount_pct:"0",gst_rate:"18",product_id:""}]);
  useEffect(()=>{Promise.all([api("/parties","GET",null,token).catch(()=>({parties:[]})),api("/products","GET",null,token).catch(()=>({products:[]}))]).then(([p,pr])=>{setParties(p.parties||[]);setProducts(pr.products||[]);});},[token]);
  const selectParty=id=>{const p=parties.find(x=>x.id===id);if(p)setForm(f=>({...f,party_id:p.id,party_name:p.name,party_gstin:p.gstin||"",party_address:[p.address,p.city,p.state,p.pincode].filter(Boolean).join(", "),party_state:p.state||""}));};
  const selectProduct=(idx,pid)=>{const p=products.find(x=>x.id===pid);if(p){const n=[...items];n[idx]={...n[idx],product_id:p.id,name:p.name,hsn_sac:p.hsn_sac||"",unit:p.unit||"PCS",rate:type==="SALES"?String(p.sale_price||0):String(p.purchase_price||0),gst_rate:String(p.gst_rate||18)};setItems(n);}};
  const setItem=(i,k,v)=>{const n=[...items];n[i]={...n[i],[k]:v};setItems(n);};
  const addItem=()=>setItems(p=>[...p,{name:"",hsn_sac:"",unit:"PCS",qty:"1",rate:"0",discount_pct:"0",gst_rate:"18",product_id:""}]);
  const removeItem=i=>{if(items.length===1)return;setItems(p=>p.filter((_,idx)=>idx!==i));};
  const calcItem=item=>{const qty=parseFloat(item.qty)||0,rate=parseFloat(item.rate)||0,disc=parseFloat(item.discount_pct)||0,gr=parseFloat(item.gst_rate)||0;const gross=qty*rate,ta=gross-gross*disc/100;const igst=form.is_igst?ta*gr/100:0,cgst=!form.is_igst?ta*(gr/2)/100:0,sgst=!form.is_igst?ta*(gr/2)/100:0;return{taxable:ta,igst,cgst,sgst,total:ta+igst+cgst+sgst};};
  const totals=items.reduce((acc,item)=>{const c=calcItem(item);return{taxable:acc.taxable+c.taxable,igst:acc.igst+c.igst,cgst:acc.cgst+c.cgst,sgst:acc.sgst+c.sgst,total:acc.total+c.total};},{taxable:0,igst:0,cgst:0,sgst:0,total:0});
  const save=async()=>{
    if(!form.party_name)return toast("Party name required","error");
    if(items.some(i=>!i.name))return toast("All items need a name","error");
    setSaving(true);
    try{await api("/invoices","POST",{...form,items:items.map(item=>{const c=calcItem(item);return{...item,...c};})},token);toast(`${type==="SALES"?"Invoice":"Bill"} created!`,"success");onSave();}
    catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  return(
    <Modal title={`New ${type==="SALES"?"Sales Invoice":"Purchase Bill"}`} onClose={onClose} wide>
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Select Party</label><select style={S.select} onChange={e=>selectParty(e.target.value)}><option value="">-- Select from list --</option>{parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} placeholder="Customer/Supplier name" value={form.party_name} onChange={e=>setForm(f=>({...f,party_name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} value={form.party_gstin} onChange={e=>setForm(f=>({...f,party_gstin:e.target.value.toUpperCase()}))}/></div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,resize:"vertical",minHeight:50}} value={form.party_address} onChange={e=>setForm(f=>({...f,party_address:e.target.value}))}/></div>
        </div>
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Invoice Date *</label><input style={S.input} type="date" value={form.invoice_date} onChange={e=>setForm(f=>({...f,invoice_date:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Due Date</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/></div>
          </div>
          <div style={S.fg}><label style={S.label}>Place of Supply</label><input style={S.input} value={form.place_of_supply} onChange={e=>setForm(f=>({...f,place_of_supply:e.target.value}))}/></div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <input type="checkbox" id="isIgst" checked={form.is_igst} onChange={e=>setForm(f=>({...f,is_igst:e.target.checked}))}/>
            <label htmlFor="isIgst" style={{...S.label,marginBottom:0,cursor:"pointer"}}>Inter-State (IGST)</label>
          </div>
          <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,resize:"vertical",minHeight:50}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
        </div>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>Items</div>
      <div style={{overflowX:"auto"}}>
        <table style={{...S.tbl,minWidth:700}}>
          <thead><tr>{["Product","HSN","Qty","Unit","Rate","Disc%","GST%","Amount",""].map(h=><th key={h} style={{...S.th,fontSize:10}}>{h}</th>)}</tr></thead>
          <tbody>{items.map((item,i)=>{const c=calcItem(item);return(
            <tr key={i}>
              <td style={S.td}><select style={{...S.select,fontSize:11,marginBottom:4}} onChange={e=>selectProduct(i,e.target.value)}><option value="">-- Select --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input style={{...S.input,fontSize:11}} placeholder="Item name *" value={item.name} onChange={e=>setItem(i,"name",e.target.value)}/></td>
              <td style={S.td}><input style={{...S.input,width:70,fontSize:11}} value={item.hsn_sac} onChange={e=>setItem(i,"hsn_sac",e.target.value)}/></td>
              <td style={S.td}><input style={{...S.input,width:60,fontSize:11}} type="number" value={item.qty} onChange={e=>setItem(i,"qty",e.target.value)}/></td>
              <td style={S.td}><select style={{...S.select,fontSize:11,width:70}} value={item.unit} onChange={e=>setItem(i,"unit",e.target.value)}>{["PCS","KG","LTR","MTR","BOX","NOS"].map(u=><option key={u}>{u}</option>)}</select></td>
              <td style={S.td}><input style={{...S.input,width:80,fontSize:11}} type="number" value={item.rate} onChange={e=>setItem(i,"rate",e.target.value)}/></td>
              <td style={S.td}><input style={{...S.input,width:50,fontSize:11}} type="number" value={item.discount_pct} onChange={e=>setItem(i,"discount_pct",e.target.value)}/></td>
              <td style={S.td}><select style={{...S.select,fontSize:11,width:70}} value={item.gst_rate} onChange={e=>setItem(i,"gst_rate",e.target.value)}>{["0","5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
              <td style={{...S.td,fontWeight:600,color:"#3fb950"}}>{fmtM(c.total)}</td>
              <td style={S.tdL}><button onClick={()=>removeItem(i)} style={{...S.btnDanger,padding:"3px 8px",fontSize:11}}>✕</button></td>
            </tr>
          );})}</tbody>
        </table>
      </div>
      <button onClick={addItem} style={{...S.btnGhost,fontSize:12,marginTop:8,marginBottom:16}}>+ Add Item</button>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <div style={{background:"#0D1117",borderRadius:8,padding:14,width:280}}>
          {[["Taxable",totals.taxable],...(form.is_igst?[["IGST",totals.igst]]:[["CGST",totals.cgst],["SGST",totals.sgst]]),["Total Tax",totals.igst+totals.cgst+totals.sgst]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E",fontSize:12}}>{l}</span><span style={{color:"#C9D1D9",fontSize:12}}>{fmtM(v)}</span></div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{color:"#E6EDF3",fontWeight:700}}>TOTAL</span><span style={{color:"#3fb950",fontWeight:700,fontSize:16}}>{fmtM(totals.total)}</span></div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        <button onClick={save} disabled={saving} style={{...S.btnG,opacity:saving?0.6:1}}>{saving?"Creating...":"Create "+(type==="SALES"?"Invoice":"Bill")}</button>
      </div>
    </Modal>
  );
}

function Parties({token,toast}){
  const[parties,setParties]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState("");const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);const[ledger,setLedger]=useState(null);
  const[form,setForm]=useState({name:"",gstin:"",state:"",type:"Customer",phone:"",email:"",address:"",city:"",pincode:"",pan:"",credit_limit:"0"});
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Goa","Other"];
  const load=useCallback(()=>{setLoading(true);api(`/parties${search?`?search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setParties(d.parties||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,search]);
  useEffect(()=>{load();},[load]);
  const openAdd=()=>{setEditing(null);setForm({name:"",gstin:"",state:"",type:"Customer",phone:"",email:"",address:"",city:"",pincode:"",pan:"",credit_limit:"0"});setShowModal(true);};
  const openEdit=p=>{setEditing(p);setForm({name:p.name,gstin:p.gstin||"",state:p.state||"",type:p.type||"Customer",phone:p.phone||"",email:p.email||"",address:p.address||"",city:p.city||"",pincode:p.pincode||"",pan:p.pan||"",credit_limit:p.credit_limit||"0"});setShowModal(true);};
  const save=async()=>{if(!form.name)return toast("Party name required","error");setSaving(true);try{if(editing){await api(`/parties/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api("/parties","POST",form,token);toast("Party added","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/parties/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const viewLedger=async id=>{try{const d=await api(`/parties/${id}/ledger`,"GET",null,token);setLedger(d);}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search parties..." style={{...S.input,width:280}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={openAdd} style={{...S.btn,marginLeft:"auto"}}>+ Add Party</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>{parties.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No parties yet.</div>:(
        <table style={S.tbl}><thead><tr>{["Name","GSTIN","Type","Phone","City","Outstanding","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{parties.map(p=>(
          <tr key={p.id}>
            <td style={{...S.td,fontWeight:600,color:"#58a6ff",cursor:"pointer"}} onClick={()=>viewLedger(p.id)}>{p.name}</td>
            <td style={S.td}><span style={S.mono}>{p.gstin||"—"}</span></td>
            <td style={S.td}>{badge(p.type,p.type==="Customer"?"green":p.type==="Supplier"?"blue":"gray")}</td>
            <td style={S.td}>{p.phone||"—"}</td><td style={S.td}>{p.city||"—"}</td>
            <td style={{...S.td,color:parseFloat(p.outstanding||0)>0?"#e3b341":"#3fb950",fontWeight:600}}>{fmtM(p.outstanding||0)}</td>
            <td style={S.tdL}><div style={{display:"flex",gap:4}}>
              <button onClick={()=>viewLedger(p.id)} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Ledger</button>
              <button onClick={()=>openEdit(p)} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button>
              <button onClick={()=>del(p.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button>
            </div></td>
          </tr>
        ))}</tbody></table>
      )}</div>
    )}
    {showModal&&(<Modal title={editing?"Edit Party":"Add Party"} onClose={()=>setShowModal(false)} wide>
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} placeholder="Company or person name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{["Customer","Supplier","Both","Sundry Debtors","Sundry Creditors"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>GSTIN</label><GSTINInput value={form.gstin} onChange={v=>setForm(p=>({...p,gstin:v}))} token={token} onVerified={info=>{if(info){setForm(p=>({...p,gstin:info.gstin,state:info.state||p.state,address:p.address||info.address,city:p.city||info.city,pincode:p.pincode||info.pincode,name:p.name||info.business_name}));}}}/></div>
          <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={form.pan} onChange={e=>setForm(p=>({...p,pan:e.target.value.toUpperCase()}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          </div>
        </div>
        <div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>City</label><input style={S.input} value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Pincode</label><input style={S.input} value={form.pincode} onChange={e=>setForm(p=>({...p,pincode:e.target.value}))}/></div>
          </div>
          <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Credit Limit (Rs.)</label><input style={S.input} type="number" value={form.credit_limit} onChange={e=>setForm(p=>({...p,credit_limit:e.target.value}))}/></div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
    {ledger&&(<Modal title={`Ledger — ${ledger.party?.name}`} onClose={()=>setLedger(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {[{l:"Total Sales",v:fmtM(ledger.summary?.total_sales||0),c:"#3fb950"},{l:"Total Purchases",v:fmtM(ledger.summary?.total_purchases||0),c:"#58a6ff"},{l:"Outstanding",v:fmtM(ledger.summary?.outstanding||0),c:"#f85149"}].map(k=>(
          <div key={k.l} style={S.kpi}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div></div>
        ))}
      </div>
      <table style={S.tbl}><thead><tr>{["Date","Invoice No","Type","Amount","Paid","Balance"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{(ledger.invoices||[]).map(inv=>(
        <tr key={inv.id}><td style={S.td}>{inv.invoice_date}</td><td style={{...S.td,color:"#58a6ff"}}>{inv.invoice_no}</td><td style={S.td}>{badge(inv.invoice_type,inv.invoice_type==="SALES"?"green":"blue")}</td><td style={{...S.td,fontWeight:600}}>{fmtM(inv.total_amount)}</td><td style={{...S.td,color:"#3fb950"}}>{fmtM(inv.paid_amount)}</td><td style={{...S.tdL,color:parseFloat(inv.balance_due||0)>0?"#f85149":"#3fb950",fontWeight:600}}>{fmtM(inv.balance_due)}</td></tr>
      ))}{!ledger.invoices?.length&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No transactions</td></tr>}</tbody></table>
    </Modal>)}
  </div>);
}

function InvoiceForm({token,toast,type,onClose,onSave}){
  const[parties,setParties]=useState([]);const[products,setProducts]=useState([]);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({invoice_type:type||"SALES",party_id:"",party_name:"",party_gstin:"",party_address:"",party_state:"",invoice_date:todayStr(),due_date:"",place_of_supply:"",is_igst:false,notes:"",terms:"Payment due within 30 days."});
  const[items,setItems]=useState([{name:"",hsn_sac:"",unit:"PCS",qty:"1",rate:"0",discount_pct:"0",gst_rate:"18",product_id:""}]);
  useEffect(()=>{Promise.all([api("/parties","GET",null,token).catch(()=>({parties:[]})),api("/products","GET",null,token).catch(()=>({products:[]}))]).then(([p,pr])=>{setParties(p.parties||[]);setProducts(pr.products||[]);});},[token]);
  const selectParty=id=>{const p=parties.find(x=>x.id===id);if(p)setForm(f=>({...f,party_id:p.id,party_name:p.name,party_gstin:p.gstin||"",party_address:[p.address,p.city,p.state,p.pincode].filter(Boolean).join(", "),party_state:p.state||""}));};
  const selectProduct=(idx,pid)=>{const p=products.find(x=>x.id===pid);if(p){const n=[...items];n[idx]={...n[idx],product_id:p.id,name:p.name,hsn_sac:p.hsn_sac||"",unit:p.unit||"PCS",rate:type==="SALES"?String(p.sale_price||0):String(p.purchase_price||0),gst_rate:String(p.gst_rate||18)};setItems(n);}};
  const setItem=(i,k,v)=>{const n=[...items];n[i]={...n[i],[k]:v};setItems(n);};
  const addItem=()=>setItems(p=>[...p,{name:"",hsn_sac:"",unit:"PCS",qty:"1",rate:"0",discount_pct:"0",gst_rate:"18",product_id:""}]);
  const removeItem=i=>{if(items.length===1)return;setItems(p=>p.filter((_,idx)=>idx!==i));};
  const calcItem=item=>{const qty=parseFloat(item.qty)||0,rate=parseFloat(item.rate)||0,disc=parseFloat(item.discount_pct)||0,gr=parseFloat(item.gst_rate)||0;const gross=qty*rate,ta=gross-gross*disc/100;const igst=form.is_igst?ta*gr/100:0,cgst=!form.is_igst?ta*(gr/2)/100:0,sgst=!form.is_igst?ta*(gr/2)/100:0;return{taxable:ta,igst,cgst,sgst,total:ta+igst+cgst+sgst};};
  const totals=items.reduce((acc,item)=>{const c=calcItem(item);return{taxable:acc.taxable+c.taxable,igst:acc.igst+c.igst,cgst:acc.cgst+c.cgst,sgst:acc.sgst+c.sgst,total:acc.total+c.total};},{taxable:0,igst:0,cgst:0,sgst:0,total:0});
  const save=async()=>{if(!form.party_name)return toast("Party name required","error");if(items.some(i=>!i.name))return toast("All items need a name","error");setSaving(true);try{await api("/invoices","POST",{...form,items:items.map(item=>{const c=calcItem(item);return{...item,...c};})},token);toast(`${type==="SALES"?"Invoice":"Bill"} created!`,"success");onSave();}catch(e){toast(e.message,"error");}setSaving(false);};
  return(<Modal title={`New ${type==="SALES"?"Sales Invoice":"Purchase Bill"}`} onClose={onClose} wide>
    <div style={S.twoCol}>
      <div>
        <div style={S.fg}><label style={S.label}>Select Party</label><select style={S.select} onChange={e=>selectParty(e.target.value)}><option value="">-- Select from list --</option>{parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} placeholder="Customer/Supplier name" value={form.party_name} onChange={e=>setForm(f=>({...f,party_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} value={form.party_gstin} onChange={e=>setForm(f=>({...f,party_gstin:e.target.value.toUpperCase()}))}/></div>
        <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,resize:"vertical",minHeight:50}} value={form.party_address} onChange={e=>setForm(f=>({...f,party_address:e.target.value}))}/></div>
      </div>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={S.fg}><label style={S.label}>Invoice Date *</label><input style={S.input} type="date" value={form.invoice_date} onChange={e=>setForm(f=>({...f,invoice_date:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Due Date</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/></div>
        </div>
        <div style={S.fg}><label style={S.label}>Place of Supply</label><input style={S.input} value={form.place_of_supply} onChange={e=>setForm(f=>({...f,place_of_supply:e.target.value}))}/></div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><input type="checkbox" id="isIgst" checked={form.is_igst} onChange={e=>setForm(f=>({...f,is_igst:e.target.checked}))}/><label htmlFor="isIgst" style={{...S.label,marginBottom:0,cursor:"pointer"}}>Inter-State (IGST applicable)</label></div>
        <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,resize:"vertical",minHeight:50}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>Items</div>
    <div style={{overflowX:"auto"}}><table style={{...S.tbl,minWidth:700}}><thead><tr>{["Product","HSN","Qty","Unit","Rate","Disc%","GST%","Amount",""].map(h=><th key={h} style={{...S.th,fontSize:10}}>{h}</th>)}</tr></thead>
    <tbody>{items.map((item,i)=>{const c=calcItem(item);return(<tr key={i}>
      <td style={S.td}><select style={{...S.select,fontSize:11,marginBottom:4}} onChange={e=>selectProduct(i,e.target.value)}><option value="">-- Select --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input style={{...S.input,fontSize:11}} placeholder="Item name *" value={item.name} onChange={e=>setItem(i,"name",e.target.value)}/></td>
      <td style={S.td}><input style={{...S.input,width:65,fontSize:11}} value={item.hsn_sac} onChange={e=>setItem(i,"hsn_sac",e.target.value)}/></td>
      <td style={S.td}><input style={{...S.input,width:55,fontSize:11}} type="number" value={item.qty} onChange={e=>setItem(i,"qty",e.target.value)}/></td>
      <td style={S.td}><select style={{...S.select,fontSize:11,width:65}} value={item.unit} onChange={e=>setItem(i,"unit",e.target.value)}>{["PCS","KG","LTR","MTR","BOX","NOS"].map(u=><option key={u}>{u}</option>)}</select></td>
      <td style={S.td}><input style={{...S.input,width:80,fontSize:11}} type="number" value={item.rate} onChange={e=>setItem(i,"rate",e.target.value)}/></td>
      <td style={S.td}><input style={{...S.input,width:50,fontSize:11}} type="number" value={item.discount_pct} onChange={e=>setItem(i,"discount_pct",e.target.value)}/></td>
      <td style={S.td}><select style={{...S.select,fontSize:11,width:65}} value={item.gst_rate} onChange={e=>setItem(i,"gst_rate",e.target.value)}>{["0","5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
      <td style={{...S.td,fontWeight:600,color:"#3fb950"}}>{fmtM(c.total)}</td>
      <td style={S.tdL}><button onClick={()=>removeItem(i)} style={{...S.btnDanger,padding:"3px 8px",fontSize:11}}>✕</button></td>
    </tr>);})}</tbody></table></div>
    <button onClick={addItem} style={{...S.btnGhost,fontSize:12,marginTop:8,marginBottom:16}}>+ Add Item</button>
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <div style={{background:"#0D1117",borderRadius:8,padding:14,width:280}}>
        {[["Taxable",totals.taxable],...(form.is_igst?[["IGST",totals.igst]]:[["CGST",totals.cgst],["SGST",totals.sgst]]),["Total Tax",totals.igst+totals.cgst+totals.sgst]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E",fontSize:12}}>{l}</span><span style={{color:"#C9D1D9",fontSize:12}}>{fmtM(v)}</span></div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{color:"#E6EDF3",fontWeight:700}}>TOTAL</span><span style={{color:"#3fb950",fontWeight:700,fontSize:16}}>{fmtM(totals.total)}</span></div>
      </div>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
      <button onClick={onClose} style={S.btnGhost}>Cancel</button>
      <button onClick={save} disabled={saving} style={{...S.btnG,opacity:saving?0.6:1}}>{saving?"Creating...":"Create "+(type==="SALES"?"Invoice":"Bill")}</button>
    </div>
  </Modal>);
}

function InvoiceList({token,toast,type}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState("");const[showForm,setShowForm]=useState(false);const[viewing,setViewing]=useState(null);const[payModal,setPayModal]=useState(null);const[payForm,setPayForm]=useState({amount:"",method:"CASH",reference_no:"",payment_date:todayStr()});
  const load=useCallback(()=>{setLoading(true);api(`/invoices?type=${type}${search?`&search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,type,search]);
  useEffect(()=>{load();},[load]);
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/invoices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const viewInv=async id=>{try{const d=await api(`/invoices/${id}`,"GET",null,token);setViewing(d.invoice);}catch(e){toast(e.message,"error");}};
  const recordPay=async()=>{try{await api(`/invoices/${payModal.id}/payment`,"POST",payForm,token);toast("Payment recorded","success");setPayModal(null);load();}catch(e){toast(e.message,"error");}};
  const printInv=inv=>{const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><title>${inv.invoice_no}</title><style>body{font-family:Arial;margin:20px;font-size:12px;}h1{color:#1F6FEB;font-size:18px;}table{width:100%;border-collapse:collapse;margin:10px 0;}th{background:#1F6FEB;color:white;padding:7px;text-align:left;}td{padding:6px;border-bottom:1px solid #eee;}.right{text-align:right;}.bold{font-weight:bold;font-size:14px;}</style></head><body><h1>🛡️ TaxPro GST — ${type==="SALES"?"TAX INVOICE":"PURCHASE BILL"}</h1><p><strong>${inv.invoice_no}</strong> | Date: ${inv.invoice_date}${inv.due_date?" | Due: "+inv.due_date:""}</p><p><strong>Party:</strong> ${inv.party_name} ${inv.party_gstin?"| GSTIN: "+inv.party_gstin:""}</p>${inv.party_address?`<p>${inv.party_address}</p>`:""}<table><thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>Tax</th><th>Total</th></tr></thead><tbody>${(inv.items||[]).map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td>${it.hsn_sac||""}</td><td>${it.qty} ${it.unit}</td><td>${fmtM(it.rate)}</td><td>${fmtM(it.taxable_value)}</td><td>${it.gst_rate}%</td><td>${fmtM((it.igst_amount||0)+(it.cgst_amount||0)+(it.sgst_amount||0))}</td><td><b>${fmtM(it.total_amount)}</b></td></tr>`).join("")}</tbody></table><div class="right"><p>Taxable: ${fmtM(inv.taxable_amount)}</p>${inv.is_igst?`<p>IGST: ${fmtM(inv.igst_amount)}</p>`:`<p>CGST: ${fmtM(inv.cgst_amount)} | SGST: ${fmtM(inv.sgst_amount)}</p>`}<p class="bold">TOTAL: ${fmtM(inv.total_amount)}</p><p>Paid: ${fmtM(inv.paid_amount)} | Balance: <span style="color:${parseFloat(inv.balance_due||0)>0?"red":"green"}">${fmtM(inv.balance_due)}</span></p></div>${inv.notes?`<p><em>Notes: ${inv.notes}</em></p>`:""}</body></html>`);w.document.close();w.print();};
  const label=type==="SALES"?"Invoice":"Bill";
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
      {[{l:"Total "+label+"s",v:invoices.length,c:"#58a6ff"},{l:"Total Amount",v:fmtM(invoices.reduce((a,i)=>a+parseFloat(i.total_amount||0),0)),c:"#3fb950"},{l:"Outstanding",v:fmtM(invoices.reduce((a,i)=>a+parseFloat(i.balance_due||0),0)),c:"#e3b341"}].map(k=>(
        <div key={k.l} style={S.kpi}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l.includes(label)? 22:14,fontWeight:700,color:k.c}}>{k.v}</div></div>
      ))}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder={`Search ${label.toLowerCase()}s...`} style={{...S.input,width:280}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={()=>setShowForm(true)} style={{...S.btn,marginLeft:"auto"}}>+ New {label}</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>{invoices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No {label.toLowerCase()}s yet.</div>:(
        <table style={S.tbl}><thead><tr>{["Invoice No","Party","Date","Due","Amount","Tax","Paid","Balance","Status","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{invoices.map(inv=>(
          <tr key={inv.id}>
            <td style={{...S.td,color:"#58a6ff",cursor:"pointer",fontWeight:600}} onClick={()=>viewInv(inv.id)}>{inv.invoice_no}</td>
            <td style={S.td}><div style={{fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</div>{inv.party_gstin&&<div style={S.mono}>{inv.party_gstin}</div>}</td>
            <td style={S.td}>{inv.invoice_date}</td>
            <td style={{...S.td,color:inv.due_date&&inv.due_date<todayStr()&&inv.status!=="paid"?"#f85149":"#C9D1D9"}}>{inv.due_date||"—"}</td>
            <td style={{...S.td,fontWeight:600}}>{fmtM(inv.total_amount)}</td>
            <td style={{...S.td,color:"#e3b341"}}>{fmtM(inv.total_tax)}</td>
            <td style={{...S.td,color:"#3fb950"}}>{fmtM(inv.paid_amount)}</td>
            <td style={{...S.td,color:parseFloat(inv.balance_due||0)>0?"#f85149":"#3fb950",fontWeight:600}}>{fmtM(inv.balance_due)}</td>
            <td style={S.td}><SBadge s={inv.status}/></td>
            <td style={S.tdL}><div style={{display:"flex",gap:4}}>
              <button onClick={()=>viewInv(inv.id)} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>View</button>
              {inv.status!=="paid"&&<button onClick={()=>{setPayModal(inv);setPayForm({amount:String(inv.balance_due||0),method:"CASH",reference_no:"",payment_date:todayStr()});}} style={{...S.btnG,fontSize:11,padding:"4px 8px"}}>Pay</button>}
              <button onClick={()=>del(inv.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button>
            </div></td>
          </tr>
        ))}</tbody></table>
      )}</div>
    )}
    {showForm&&<InvoiceForm token={token} toast={toast} type={type} onClose={()=>setShowForm(false)} onSave={()=>{setShowForm(false);load();}}/>}
    {viewing&&(<Modal title={`${label}: ${viewing.invoice_no}`} onClose={()=>setViewing(null)} wide>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <button onClick={()=>printInv(viewing)} style={S.btnG}>🖨 Print/PDF</button>
        <SBadge s={viewing.status}/>
        {viewing.status!=="paid"&&<div style={{marginLeft:"auto",color:"#f85149",fontWeight:600}}>Balance: {fmtM(viewing.balance_due)}</div>}
      </div>
      <div style={S.twoCol}>
        <div style={{...S.card,margin:0}}><div style={{fontSize:11,color:"#8B949E",marginBottom:4}}>Bill To</div><div style={{fontWeight:600,color:"#E6EDF3"}}>{viewing.party_name}</div>{viewing.party_gstin&&<div style={S.mono}>{viewing.party_gstin}</div>}{viewing.party_address&&<div style={{fontSize:11,color:"#8B949E",marginTop:4}}>{viewing.party_address}</div>}</div>
        <div style={{...S.card,margin:0,fontSize:12,lineHeight:1.9}}><div><span style={{color:"#8B949E"}}>Date: </span>{viewing.invoice_date}</div>{viewing.due_date&&<div><span style={{color:"#8B949E"}}>Due: </span>{viewing.due_date}</div>}<div><span style={{color:"#8B949E"}}>Tax: </span>{viewing.is_igst?"IGST":"CGST+SGST"}</div></div>
      </div>
      <table style={{...S.tbl,marginTop:12}}><thead><tr>{["Item","HSN","Qty","Rate","Taxable","GST%","Tax","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{(viewing.items||[]).map((item,i)=>(
        <tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{item.name}</td><td style={S.td}>{item.hsn_sac||"—"}</td><td style={S.td}>{item.qty} {item.unit}</td><td style={S.td}>{fmtM(item.rate)}</td><td style={S.td}>{fmtM(item.taxable_value)}</td><td style={S.td}>{item.gst_rate}%</td><td style={S.td}>{fmtM((item.igst_amount||0)+(item.cgst_amount||0)+(item.sgst_amount||0))}</td><td style={{...S.tdL,fontWeight:700}}>{fmtM(item.total_amount)}</td></tr>
      ))}</tbody></table>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
        <div style={{background:"#0D1117",borderRadius:8,padding:12,width:270}}>
          {[["Taxable",viewing.taxable_amount],...(viewing.is_igst?[["IGST",viewing.igst_amount]]:[["CGST",viewing.cgst_amount],["SGST",viewing.sgst_amount]]),["Total Tax",viewing.total_tax],["TOTAL",viewing.total_amount,true,"#3fb950"],["Paid",viewing.paid_amount,false,"#3fb950"],["Balance Due",viewing.balance_due,true,parseFloat(viewing.balance_due||0)>0?"#f85149":"#3fb950"]].map(([l,v,bold,color])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E",fontSize:12}}>{l}</span><span style={{color:color||"#E6EDF3",fontWeight:bold?700:400,fontSize:bold?13:12}}>{fmtM(v)}</span></div>
          ))}
        </div>
      </div>
    </Modal>)}
    {payModal&&(<Modal title={`Record Payment — ${payModal.invoice_no}`} onClose={()=>setPayModal(null)}>
      <div style={{...S.kpi,textAlign:"center",marginBottom:16}}><div style={S.kpiLabel}>Balance Due</div><div style={{fontSize:24,fontWeight:800,color:"#f85149"}}>{fmtM(payModal.balance_due)}</div></div>
      {[{l:"Amount (Rs.) *",k:"amount",t:"number"},{l:"Payment Date *",k:"payment_date",t:"date"},{l:"Reference No",k:"reference_no",t:"text"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t} value={payForm[f.k]} onChange={e=>setPayForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={S.fg}><label style={S.label}>Method</label><select style={S.select} value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>{["CASH","CHEQUE","NEFT","RTGS","IMPS","UPI","CARD"].map(m=><option key={m}>{m}</option>)}</select></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setPayModal(null)} style={S.btnGhost}>Cancel</button><button onClick={recordPay} style={S.btnG}>Record Payment</button></div>
    </Modal>)}
  </div>);
}

function Products({token,toast}){
  const[products,setProducts]=useState([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState("");const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);const[stockModal,setStockModal]=useState(null);const[stockForm,setStockForm]=useState({type:"IN",qty:"",rate:"",notes:""});
  const[form,setForm]=useState({name:"",code:"",hsn_sac:"",unit:"PCS",category:"",gst_rate:"18",purchase_price:"0",sale_price:"0",stock_qty:"0",min_stock:"0",description:"",is_service:false});
  const UNITS=["PCS","KG","LTR","MTR","BOX","NOS","SET","DZ","PACK","TON"];
  const load=useCallback(()=>{setLoading(true);api(`/products${search?`?search=${encodeURIComponent(search)}`:""}`, "GET",null,token).then(d=>{setProducts(d.products||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,search]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{if(!form.name)return toast("Name required","error");setSaving(true);try{if(editing){await api(`/products/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api("/products","POST",form,token);toast("Added","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/products/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const adjustStock=async()=>{try{await api(`/products/${stockModal.id}/stock`,"POST",stockForm,token);toast("Stock updated","success");setStockModal(null);load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search products..." style={{...S.input,width:260}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={()=>{setEditing(null);setForm({name:"",code:"",hsn_sac:"",unit:"PCS",category:"",gst_rate:"18",purchase_price:"0",sale_price:"0",stock_qty:"0",min_stock:"0",description:"",is_service:false});setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Product</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>{products.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No products yet.</div>:(
        <table style={S.tbl}><thead><tr>{["Name","Code","HSN","GST%","Purchase","Sale","Stock","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{products.map(p=>(
          <tr key={p.id}>
            <td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{p.name}{p.is_service&&<span style={{fontSize:9,color:"#bf91f3",marginLeft:6}}>SVC</span>}</td>
            <td style={S.td}><span style={S.mono}>{p.code||"—"}</span></td>
            <td style={S.td}>{p.hsn_sac||"—"}</td>
            <td style={{...S.td,color:"#e3b341"}}>{p.gst_rate}%</td>
            <td style={S.td}>{fmtM(p.purchase_price)}</td>
            <td style={{...S.td,color:"#3fb950",fontWeight:600}}>{fmtM(p.sale_price)}</td>
            <td style={{...S.td,color:parseFloat(p.stock_qty||0)<=parseFloat(p.min_stock||0)?"#f85149":"#3fb950",fontWeight:600}}>{p.stock_qty} {p.unit}</td>
            <td style={S.tdL}><div style={{display:"flex",gap:4}}>
              <button onClick={()=>{setStockModal(p);setStockForm({type:"IN",qty:"",rate:"",notes:""}); }} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Stock</button>
              <button onClick={()=>{setEditing(p);setForm({name:p.name,code:p.code||"",hsn_sac:p.hsn_sac||"",unit:p.unit||"PCS",category:p.category||"",gst_rate:p.gst_rate||"18",purchase_price:p.purchase_price||"0",sale_price:p.sale_price||"0",stock_qty:p.stock_qty||"0",min_stock:p.min_stock||"0",description:p.description||"",is_service:!!p.is_service});setShowModal(true);}} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button>
              <button onClick={()=>del(p.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button>
            </div></td>
          </tr>
        ))}</tbody></table>
      )}</div>
    )}
    {showModal&&(<Modal title={editing?"Edit Product":"Add Product"} onClose={()=>setShowModal(false)} wide>
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Code</label><input style={S.input} value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>HSN/SAC</label><input style={S.input} value={form.hsn_sac} onChange={e=>setForm(p=>({...p,hsn_sac:e.target.value}))}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Unit</label><select style={S.select} value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            <div style={S.fg}><label style={S.label}>GST Rate</label><select style={S.select} value={form.gst_rate} onChange={e=>setForm(p=>({...p,gst_rate:e.target.value}))}>{["0","5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><input type="checkbox" id="isSvc" checked={form.is_service} onChange={e=>setForm(p=>({...p,is_service:e.target.checked}))}/><label htmlFor="isSvc" style={{...S.label,marginBottom:0,cursor:"pointer"}}>Service (no stock tracking)</label></div>
        </div>
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Purchase Price</label><input style={S.input} type="number" value={form.purchase_price} onChange={e=>setForm(p=>({...p,purchase_price:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Sale Price</label><input style={S.input} type="number" value={form.sale_price} onChange={e=>setForm(p=>({...p,sale_price:e.target.value}))}/></div>
          </div>
          {!editing&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Opening Stock</label><input style={S.input} type="number" value={form.stock_qty} onChange={e=>setForm(p=>({...p,stock_qty:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Min Stock Alert</label><input style={S.input} type="number" value={form.min_stock} onChange={e=>setForm(p=>({...p,min_stock:e.target.value}))}/></div>
          </div>}
          <div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:80}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
    {stockModal&&(<Modal title={`Adjust Stock — ${stockModal.name}`} onClose={()=>setStockModal(null)}>
      <div style={{textAlign:"center",padding:"10px 0 20px"}}><div style={{fontSize:36,fontWeight:800,color:"#E6EDF3"}}>{stockModal.stock_qty}</div><div style={{fontSize:12,color:"#8B949E"}}>Current Stock ({stockModal.unit})</div></div>
      <div style={S.fg}><div style={{display:"flex",gap:8}}>{["IN","OUT"].map(t=>(<button key={t} onClick={()=>setStockForm(f=>({...f,type:t}))} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,borderColor:stockForm.type===t?"#238636":"#30363D",background:stockForm.type===t?"#0d2818":"transparent",color:stockForm.type===t?"#3fb950":"#8B949E"}}>{t==="IN"?"📦 Stock IN":"📤 Stock OUT"}</button>))}</div></div>
      {[{l:"Quantity *",k:"qty",t:"number"},{l:"Rate",k:"rate",t:"number"},{l:"Notes",k:"notes",t:"text"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t} value={stockForm[f.k]} onChange={e=>setStockForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setStockModal(null)} style={S.btnGhost}>Cancel</button><button onClick={adjustStock} style={S.btnG}>Update Stock</button></div>
    </Modal>)}
  </div>);
}

function GSTClients({token,toast}){
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);const[q,setQ]=useState("");const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Goa","Other"];
  const load=useCallback(()=>{setLoading(true);api(`/clients${q?`?search=${encodeURIComponent(q)}`:""}`, "GET",null,token).then(d=>{setClients(d.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,q]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{if(editing){await api(`/clients/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api("/clients","POST",form,token);toast("Added","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/clients/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search GST clients..." style={{...S.input,width:280}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={()=>{setEditing(null);setForm({name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant"});setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Client</button>
    </div>
    {loading?<Spinner/>:(
      <div style={S.card}>{clients.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No GST clients yet.</div>:(
        <table style={S.tbl}><thead><tr>{["Name","GSTIN","State","Type","Status","Notices","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{clients.map(c=>(
          <tr key={c.id}>
            <td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{c.name}</td>
            <td style={S.td}><span style={S.mono}>{c.gstin}</span></td>
            <td style={S.td}>{c.state}</td>
            <td style={S.td}>{badge(c.type,"gray")}</td>
            <td style={S.td}><SBadge s={c.status}/></td>
            <td style={S.td}>{c.notice_count>0?<span style={{color:"#f85149",fontWeight:700}}>{c.notice_count}</span>:<span style={{color:"#3fb950"}}>0</span>}</td>
            <td style={S.tdL}><div style={{display:"flex",gap:4}}>
              <button onClick={()=>{setEditing(c);setForm({name:c.name,gstin:c.gstin||"",state:c.state||"",type:c.type||"Trader",turnover:c.turnover||"",notes:c.notes||"",status:c.status||"compliant"});setShowModal(true);}} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button>
              <button onClick={()=>del(c.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button>
            </div></td>
          </tr>
        ))}</tbody></table>
      )}</div>
    )}
    {showModal&&(<Modal title={editing?"Edit GST Client":"Add GST Client"} onClose={()=>setShowModal(false)}>
      {[{l:"Name *",k:"name",ph:"Sharma Textiles"},{l:"GSTIN *",k:"gstin",ph:"09AABCS1429B1Z7"},{l:"Turnover",k:"turnover",ph:"2.4 Cr"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label>{f.k==="gstin"?(<GSTINInput value={form[f.k]} onChange={v=>setForm(p=>({...p,gstin:v,state:p.state}))} token={token} onVerified={info=>{if(info)setForm(p=>({...p,gstin:info.gstin,state:info.state||p.state}));}}/>):(<input style={S.input} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>)}</div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{["Manufacturer","Trader","Exporter","Importer","Service","Composition"].map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      {editing&&<div style={S.fg}><label style={S.label}>Status</label><select style={S.select} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{["compliant","pending","notice","overdue"].map(s=><option key={s}>{s}</option>)}</select></div>}
      <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
  </div>);
}

function Notices({token,toast}){
  const[notices,setNotices]=useState([]);const[clients,setClients]=useState([]);const[filter,setFilter]=useState("all");const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({client_id:"",ref_no:"",type:"",issued_date:todayStr(),due_date:"",amount:"",priority:"medium",description:""});
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/notices${filter!=="all"?`?status=${filter}`:""}`, "GET",null,token),api("/clients","GET",null,token)]).then(([nd,cd])=>{setNotices(nd.notices||[]);setClients(cd.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,filter]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/notices","POST",{...form,amount:parseFloat(form.amount)||0},token);toast("Notice added","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateStatus=async(id,status)=>{try{await api(`/notices/${id}/status`,"PATCH",{status},token);load();}catch(e){toast(e.message,"error");}};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/notices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {["all","pending","in-progress","overdue","replied","closed"].map(t=>(<button key={t} onClick={()=>setFilter(t)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:filter===t?"#58a6ff":"#30363D",background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t==="in-progress"?"In Progress":t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto",padding:"5px 14px"}}>+ Add Notice</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{notices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No notices.</div>:(
      <table style={S.tbl}><thead><tr>{["Ref No","Client","Type","Due","Amount","Priority","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{notices.map(n=>(
        <tr key={n.id}>
          <td style={S.td}><span style={S.mono}>{n.ref_no}</span></td>
          <td style={S.td}><div style={{fontWeight:500,color:"#E6EDF3"}}>{n.client_name}</div></td>
          <td style={S.td}>{n.type}</td>
          <td style={{...S.td,color:n.status==="overdue"?"#f85149":"#C9D1D9",fontWeight:n.status==="overdue"?700:400}}>{n.due_date}</td>
          <td style={{...S.td,fontWeight:600}}>Rs.{Number(n.amount).toLocaleString("en-IN")}</td>
          <td style={S.td}>{badge(n.priority,n.priority==="critical"||n.priority==="high"?"red":n.priority==="medium"?"blue":"gray")}</td>
          <td style={S.td}><select value={n.status} onChange={e=>updateStatus(n.id,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{["pending","in-progress","replied","closed","overdue"].map(s=><option key={s}>{s}</option>)}</select></td>
          <td style={S.tdL}><button onClick={()=>del(n.id)} style={S.btnDanger}>Del</button></td>
        </tr>
      ))}</tbody></table>
    )}</div>)}
    {showModal&&(<Modal title="Add Notice" onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {[{l:"Ref No *",k:"ref_no",ph:"ZD071125006543C"},{l:"Notice Type *",k:"type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Amount",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={S.fg}><label style={S.label}>Issued</label><input style={S.input} type="date" value={form.issued_date} onChange={e=>setForm(p=>({...p,issued_date:e.target.value}))}/></div><div style={S.fg}><label style={S.label}>Due Date *</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/></div></div>
      <div style={S.fg}><label style={S.label}>Priority</label><select style={S.select} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["critical","high","medium","low"].map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div>
    </Modal>)}
  </div>);
}

function Returns({token,toast}){
  const[returns,setReturns]=useState([]);const[clients,setClients]=useState([]);const[period,setPeriod]=useState("FY 2024-25");const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({client_id:"",period:"FY 2024-25",gstr1_status:"not-filed",gstr3b_status:"not-filed",gstr9_status:"not-filed"});
  const PERIODS=["FY 2024-25","FY 2023-24","FY 2022-23"];
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/returns?period=${encodeURIComponent(period)}`,"GET",null,token),api("/clients","GET",null,token)]).then(([rd,cd])=>{setReturns(rd.returns||[]);setClients(cd.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/returns","POST",form,token);toast("Saved","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateField=async(id,key,val)=>{const rec=returns.find(r=>r.id===id);if(!rec)return;try{await api(`/returns/${id}`,"PUT",{...rec,[key]:val},token);load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}><span style={{fontSize:12,color:"#8B949E"}}>FY:</span><select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select><button onClick={()=>{setForm(f=>({...f,period}));setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Record</button></div>
    {loading?<Spinner/>:(<div style={S.card}>{returns.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No records for {period}.</div>:(
      <table style={S.tbl}><thead><tr>{["Client","GSTIN","GSTR-1","GSTR-3B","GSTR-9","Overall"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{returns.map(r=>{const ov=["gstr1_status","gstr3b_status","gstr9_status"].map(k=>r[k]);const overall=ov.every(s=>s==="filed")?"compliant":ov.some(s=>s==="not-filed")?"overdue":"pending";return(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.client_name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td>{[["gstr1_status"],["gstr3b_status"],["gstr9_status"]].map(([key])=>(<td key={key} style={S.td}><select value={r[key]} onChange={e=>updateField(r.id,key,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{["filed","pending","not-filed"].map(s=><option key={s}>{s}</option>)}</select></td>))}<td style={S.tdL}><SBadge s={overall}/></td></tr>);})}</tbody></table>
    )}</div>)}
    {showModal&&(<Modal title="Add Return Record" onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Period</label><select style={S.select} value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
      {[["gstr1_status","GSTR-1"],["gstr3b_status","GSTR-3B"],["gstr9_status","GSTR-9"]].map(([key,lbl])=>(<div key={key} style={S.fg}><label style={S.label}>{lbl}</label><select style={S.select} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>{["not-filed","pending","filed"].map(s=><option key={s}>{s}</option>)}</select></div>))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
  </div>);
}

function Reconciliation({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[period,setPeriod]=useState("FY 2024-25");const[data,setData]=useState(null);const[loading,setLoading]=useState(false);const[showModal,setShowModal]=useState(false);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:""});
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN")}`;
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients||[]);if(d.clients[0])setClientId(d.clients[0].id);});},[token]);
  const load=useCallback(()=>{if(!clientId)return;setLoading(true);api(`/reconciliation?client_id=${clientId}&period=${encodeURIComponent(period)}`,"GET",null,token).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));},[token,clientId,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/reconciliation","POST",{...form,client_id:clientId,period,invoice_count:parseInt(form.invoice_count)||0,gstr2a_amount:parseFloat(form.gstr2a_amount)||0,gstr2b_amount:parseFloat(form.gstr2b_amount)||0,books_amount:parseFloat(form.books_amount)||0},token);toast("Added","success");setShowModal(false);setForm({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:""});load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{try{await api(`/reconciliation/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <select style={{...S.select,width:"auto"}} value={clientId} onChange={e=>setClientId(e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Entry</button>
    </div>
    {data?.summary&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Matched",v:data.summary.matched,c:"#3fb950"},{l:"Mismatch",v:data.summary.mismatch,c:"#e3b341"},{l:"Missing",v:data.summary.missing,c:"#f85149"},{l:"ITC Risk",v:fR(data.summary.total_itc_risk),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>}
    {loading?<Spinner/>:(<div style={S.card}>{!data||data.rows.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No entries yet.</div>:(
      <table style={S.tbl}><thead><tr>{["Vendor","GSTIN","Inv","GSTR-2A","GSTR-2B","Books","Diff","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{data.rows.map(r=>(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.vendor_name}</td><td style={S.td}><span style={S.mono}>{r.vendor_gstin}</span></td><td style={S.td}>{r.invoice_count}</td><td style={S.td}>{fR(r.gstr2a_amount)}</td><td style={S.td}>{fR(r.gstr2b_amount)}</td><td style={S.td}>{fR(r.books_amount)}</td><td style={{...S.td,fontWeight:r.difference!==0?700:400,color:r.difference<0?"#f85149":r.difference>0?"#e3b341":"#3fb950"}}>{r.difference===0?"—":fR(r.difference)}</td><td style={S.td}>{r.status==="matched"?badge("Matched","green"):r.status==="mismatch"?badge("Mismatch","amber"):badge("Missing","red")}</td><td style={S.tdL}><button onClick={()=>del(r.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody></table>
    )}</div>)}
    {showModal&&(<Modal title="Add Entry" onClose={()=>setShowModal(false)}>{[{l:"Vendor Name *",k:"vendor_name",ph:"ABC Suppliers"},{l:"Vendor GSTIN *",k:"vendor_gstin",ph:"07AABCA1234B1Z5"},{l:"Invoice Count",k:"invoice_count",ph:"12",t:"number"},{l:"GSTR-2A Amount",k:"gstr2a_amount",ph:"145000",t:"number"},{l:"GSTR-2B Amount",k:"gstr2b_amount",ph:"143000",t:"number"},{l:"Books Amount *",k:"books_amount",ph:"147000",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div></Modal>)}
  </div>);
}

function GSTR2AImport({token,toast}){
  const[clients,setClients]=useState([]);const[clientId,setClientId]=useState("");const[period,setPeriod]=useState("FY 2024-25");const[file,setFile]=useState(null);const[preview,setPreview]=useState(null);const[step,setStep]=useState(1);const[loading,setLoading]=useState(false);const[importing,setImporting]=useState(false);
  const fG=n=>`Rs.${Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients||[]);if(d.clients[0])setClientId(d.clients[0].id);});},[token]);
  const previewFile=async()=>{if(!file)return toast("Select file","error");setLoading(true);try{const fd=new FormData();fd.append("file",file);const res=await fetch(`${API}/gstr2a/preview`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){setPreview(data.preview);setStep(2);}else toast(data.message,"error");}catch(e){toast("Preview failed","error");}setLoading(false);};
  const importData=async()=>{if(!file||!clientId)return toast("Select client","error");setImporting(true);try{const fd=new FormData();fd.append("file",file);fd.append("client_id",clientId);fd.append("period",period);const res=await fetch(`${API}/gstr2a/import`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){toast(data.message,"success");setStep(3);}else toast(data.message,"error");}catch(e){toast("Import failed","error");}setImporting(false);};
  return(<div>
    <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,l:"Upload"},{n:2,l:"Preview"},{n:3,l:"Done"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.l}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:18}}/>}</div>))}</div>
    {step===1&&(<div><div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:8}}>How to download GSTR-2A</div>{["Login to gst.gov.in","Services → Returns → Returns Dashboard","Select FY and Period","GSTR-2A → Download → Generate File","Download Excel and upload below"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"3px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700}}>{i+1}.</span><span>{s}</span></div>))}</div>
    <div style={S.card}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}><div><label style={S.label}>Client *</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label style={S.label}>Period *</label><select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select></div></div>
    <div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>{file?(<div><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:36,marginBottom:8}}>📁</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:12}}>GSTR-2A Excel / JSON file</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose File<input type="file" accept=".xlsx,.xls,.json,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}</div>
    <button onClick={previewFile} disabled={!file||loading} style={{...S.btn,width:"100%",opacity:!file||loading?0.5:1}}>{loading?"Reading...":"Preview →"}</button></div></div>)}
    {step===2&&preview&&(<div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>{[{l:"Invoices",v:preview.total_invoices,c:"#58a6ff"},{l:"Suppliers",v:preview.total_suppliers,c:"#e3b341"},{l:"Total ITC",v:fG(preview.total_itc),c:"#3fb950"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l==="Total ITC"?14:22,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div><div style={S.card}><table style={S.tbl}><thead><tr>{["Supplier","GSTIN","Invoices","Total ITC"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{(preview.suppliers||[]).slice(0,30).map((s,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{s.name||"Unknown"}</td><td style={S.td}><span style={S.mono}>{s.gstin}</span></td><td style={S.td}>{s.invoices}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fG(s.itc)}</td></tr>))}</tbody></table></div><div style={{display:"flex",gap:10}}><button onClick={()=>{setStep(1);setPreview(null);}} style={{...S.btnGhost,flex:1}}>Back</button><button onClick={importData} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing...":"Import to Reconciliation"}</button></div></div>)}
    {step===3&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:56,marginBottom:12}}>🎉</div><div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>GSTR-2A Imported!</div><button onClick={()=>{setFile(null);setPreview(null);setStep(1);}} style={S.btn}>Import Another</button></div>)}
  </div>);
}

function BankStatement({token,toast}){
  const[step,setStep]=useState(1);const[file,setFile]=useState(null);const[bankName,setBankName]=useState("");const[preview,setPreview]=useState(null);const[uploading,setUploading]=useState(false);const[importing,setImporting]=useState(false);const[transactions,setTransactions]=useState([]);const[viewMode,setViewMode]=useState("upload");const[filterType,setFilterType]=useState("all");
  const TYPES=["INCOME","EXPENSE","PURCHASE","TAX","BANK","TRANSFER","UNKNOWN"];
  const CATS=["Salary","Rent","Tax Payment","Utilities","Fund Transfer","Cash","Loan Payment","Interest","Bank Charges","Insurance","Purchase","Sales Receipt","Online Purchase","Fuel","Travel","Medical","Uncategorized"];
  const loadTxns=useCallback(()=>{api(`/bank/transactions${filterType!=="all"?`?type=${filterType}`:""}`, "GET",null,token).then(d=>setTransactions(d.transactions||[])).catch(()=>{});},[token,filterType]);
  useEffect(()=>{if(viewMode==="history")loadTxns();},[viewMode,loadTxns]);
  const uploadPDF=async()=>{if(!file)return toast("Select PDF","error");setUploading(true);try{const fd=new FormData();fd.append("file",file);if(bankName)fd.append("bank_name",bankName);const res=await fetch(`${API}/bank/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){setPreview(data.preview);setStep(2);}else toast(data.message,"error");}catch(e){toast("Upload failed","error");}setUploading(false);};
  const importDB=async()=>{if(!preview)return;setImporting(true);try{const data=await api("/bank/import","POST",{bank_name:bankName||preview.bank_name,account_no:"",transactions:preview.transactions},token);if(data.success){toast(data.message,"success");setStep(3);}else toast(data.message,"error");}catch(e){toast(e.message,"error");}setImporting(false);};
  const updateCat=async(id,category,type)=>{try{await api(`/bank/transactions/${id}`,"PATCH",{category,type},token);loadTxns();}catch(e){}};
  const reset=()=>{setFile(null);setPreview(null);setStep(1);};
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>{[{k:"upload",l:"📁 Import PDF"},{k:"history",l:"📊 Transactions"}].map(t=>(<button key={t.k} onClick={()=>setViewMode(t.k)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:viewMode===t.k?"#1F6FEB":"#30363D",background:viewMode===t.k?"#0c1d2e":"transparent",color:viewMode===t.k?"#58a6ff":"#8B949E",fontWeight:viewMode===t.k?600:400}}>{t.l}</button>))}</div>
    {viewMode==="upload"&&(<div>
      <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,l:"Upload"},{n:2,l:"Preview"},{n:3,l:"Done"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.l}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:18}}/>}</div>))}</div>
      {step===1&&(<div><div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:8}}>How to download Bank Statement PDF</div>{["Login to your bank's net banking","Go to Account Statement / e-Statement","Select date range","Download as PDF","Upload below — AI will auto-categorize!"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"3px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700}}>{i+1}.</span><span>{s}</span></div>))}</div>
      <div style={S.card}><div style={S.fg}><label style={S.label}>Bank Name</label><input style={S.input} placeholder="SBI, HDFC, ICICI..." value={bankName} onChange={e=>setBankName(e.target.value)}/></div><div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>{file?(<div><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:40,marginBottom:8}}>🏦</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:12}}>Drop Bank Statement PDF here</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose PDF<input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}</div><button onClick={uploadPDF} disabled={!file||uploading} style={{...S.btn,width:"100%",opacity:!file||uploading?0.5:1}}>{uploading?"Reading PDF...":"Upload & Analyze →"}</button></div></div>)}
      {step===2&&preview&&(<div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>{[{l:"Transactions",v:preview.total_txns,c:"#58a6ff"},{l:"Total Debit",v:fmtM(preview.total_debit),c:"#f85149"},{l:"Total Credit",v:fmtM(preview.total_credit),c:"#3fb950"},{l:"Net",v:fmtM(preview.total_credit-preview.total_debit),c:preview.total_credit>=preview.total_debit?"#3fb950":"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l==="Transactions"?22:13,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div><div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:12}}><div style={{fontSize:12,color:"#3fb950"}}>✅ AI auto-categorized {preview.total_txns} transactions</div></div><div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:10}}>Preview (first 50)</div><table style={S.tbl}><thead><tr>{["Date","Description","Debit","Credit","Category"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{(preview.transactions||[]).slice(0,50).map((t,i)=>(<tr key={i}><td style={S.td}>{t.txn_date}</td><td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div></td><td style={{...S.td,color:"#f85149"}}>{t.debit>0?fmtM(t.debit):"—"}</td><td style={{...S.td,color:"#3fb950"}}>{t.credit>0?fmtM(t.credit):"—"}</td><td style={S.tdL}>{badge(t.category||"Uncategorized","gray")}</td></tr>))}</tbody></table></div><div style={{display:"flex",gap:10}}><button onClick={reset} style={{...S.btnGhost,flex:1}}>Back</button><button onClick={importDB} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing...":"Import All"}</button></div></div>)}
      {step===3&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:56,marginBottom:12}}>🎉</div><div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>Bank Statement Imported!</div><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={reset} style={S.btn}>Import Another</button><button onClick={()=>setViewMode("history")} style={S.btnG}>View Transactions →</button></div></div>)}
    </div>)}
    {viewMode==="history"&&(<div><div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:12,color:"#8B949E"}}>Filter:</span>{["all",...TYPES].map(t=>(<button key={t} onClick={()=>setFilterType(t)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderColor:filterType===t?"#58a6ff":"#30363D",background:filterType===t?"#0c1d2e":"transparent",color:filterType===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t}</button>))}<button onClick={loadTxns} style={{...S.btnGhost,marginLeft:"auto",fontSize:11}}>Refresh</button></div>
    <div style={S.card}>{transactions.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No transactions. Import first.</div>:(
      <table style={S.tbl}><thead><tr>{["Date","Description","Debit","Credit","Category","Type"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{transactions.map(t=>(<tr key={t.id}><td style={S.td}>{t.txn_date}</td><td style={{...S.td,maxWidth:220}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</div></td><td style={{...S.td,color:"#f85149",fontWeight:t.debit>0?600:400}}>{t.debit>0?fmtM(t.debit):"—"}</td><td style={{...S.td,color:"#3fb950",fontWeight:t.credit>0?600:400}}>{t.credit>0?fmtM(t.credit):"—"}</td><td style={S.td}><select value={t.category||"Uncategorized"} onChange={e=>updateCat(t.id,e.target.value,t.type)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{CATS.map(c=><option key={c}>{c}</option>)}</select></td><td style={S.tdL}><select value={t.type||"UNKNOWN"} onChange={e=>updateCat(t.id,t.category,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{TYPES.map(tp=><option key={tp}>{tp}</option>)}</select></td></tr>))}</tbody></table>
    )}</div></div>)}
  </div>);
}

function Reports({token}){
  const[rtype,setRtype]=useState("gst-summary");const[from,setFrom]=useState(new Date(new Date().getFullYear(),3,1).toISOString().split("T")[0]);const[to,setTo]=useState(todayStr());const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const load=async()=>{setLoading(true);setData(null);try{const d=await api(`/reports/${rtype}?from_date=${from}&to_date=${to}`,"GET",null,token);setData(d);}catch(e){setData({error:e.message});}setLoading(false);};
  const printReport=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>TaxPro Report</title><style>body{font-family:Arial;margin:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:7px;}th{background:#1F6FEB;color:white;}</style></head><body><h2>TaxPro — ${rtype}</h2><p>Period: ${from} to ${to}</p>${document.getElementById("rpt-area")?.innerHTML||""}</body></html>`);w.document.close();w.print();};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <select style={{...S.select,width:"auto"}} value={rtype} onChange={e=>setRtype(e.target.value)}>{[{k:"gst-summary",l:"GST Summary"},{k:"sales-register",l:"Sales Register"},{k:"purchase-register",l:"Purchase Register"},{k:"outstanding",l:"Outstanding"},{k:"profit-loss",l:"Profit & Loss"},{k:"day-book",l:"Day Book"}].map(r=><option key={r.k} value={r.k}>{r.l}</option>)}</select>
      <input type="date" style={{...S.input,width:150}} value={from} onChange={e=>setFrom(e.target.value)}/><span style={{color:"#8B949E"}}>to</span>
      <input type="date" style={{...S.input,width:150}} value={to} onChange={e=>setTo(e.target.value)}/>
      <button onClick={load} style={S.btn}>Generate</button>
      {data&&!data.error&&<button onClick={printReport} style={S.btnG}>🖨 Print</button>}
    </div>
    {loading&&<Spinner/>}{data?.error&&<div style={{color:"#f85149",padding:20}}>Error: {data.error}</div>}
    <div id="rpt-area">
      {data&&!data.error&&rtype==="gst-summary"&&data.report&&(<div><div style={S.twoCol}><div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#3fb950",marginBottom:12}}>Output Tax (Sales)</div>{[["Taxable",data.report.sales?.taxable],["IGST",data.report.sales?.igst],["CGST",data.report.sales?.cgst],["SGST",data.report.sales?.sgst],["Total",data.report.sales?.total]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{l}</span><span style={{color:"#E6EDF3",fontWeight:600}}>{fR(v)}</span></div>))}</div><div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:12}}>Input Tax (Purchases)</div>{[["Taxable",data.report.purchase?.taxable],["IGST",data.report.purchase?.igst],["CGST",data.report.purchase?.cgst],["SGST",data.report.purchase?.sgst],["Total",data.report.purchase?.total]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{l}</span><span style={{color:"#E6EDF3",fontWeight:600}}>{fR(v)}</span></div>))}</div></div><div style={{...S.card,textAlign:"center",background:data.report.net_gst_payable>0?"#2d0e0e":"#0d2818"}}><div style={S.kpiLabel}>Net GST Payable</div><div style={{fontSize:28,fontWeight:800,color:data.report.net_gst_payable>0?"#f85149":"#3fb950"}}>{fR(data.report.net_gst_payable)}</div></div></div>)}
      {data&&!data.error&&(rtype==="sales-register"||rtype==="purchase-register")&&data.invoices&&(<div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Invoices",v:data.summary?.total_invoices},{l:"Taxable",v:fR(data.summary?.total_taxable)},{l:"Total Tax",v:fR((data.summary?.total_igst||0)+(data.summary?.total_cgst||0)+(data.summary?.total_sgst||0))},{l:"Total Amount",v:fR(data.summary?.total_amount)}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:14,fontWeight:700,color:"#E6EDF3"}}>{k.v}</div></div>))}</div><div style={S.card}><table style={S.tbl}><thead><tr>{["Date","Invoice No","Party","GSTIN","Taxable","IGST","CGST","SGST","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{data.invoices.map(inv=>(<tr key={inv.id}><td style={S.td}>{inv.invoice_date}</td><td style={{...S.td,color:"#58a6ff"}}>{inv.invoice_no}</td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</td><td style={S.td}><span style={S.mono}>{inv.party_gstin||"—"}</span></td><td style={S.td}>{fR(inv.taxable_amount)}</td><td style={S.td}>{fR(inv.igst_amount)}</td><td style={S.td}>{fR(inv.cgst_amount)}</td><td style={S.td}>{fR(inv.sgst_amount)}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fR(inv.total_amount)}</td></tr>))}</tbody></table></div></div>)}
      {data&&!data.error&&rtype==="outstanding"&&(<div><div style={{...S.card,textAlign:"center",background:"#2d0e0e",border:"1px solid #6e1c1c",marginBottom:12}}><div style={S.kpiLabel}>Total Outstanding</div><div style={{fontSize:28,fontWeight:800,color:"#f85149"}}>{fR(data.total_outstanding)}</div></div><div style={S.card}><table style={S.tbl}><thead><tr>{["Party","GSTIN","Invoices","Billed","Paid","Outstanding","Oldest Due"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{(data.parties||[]).map((p,i)=>(<tr key={i}><td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{p.party_name}</td><td style={S.td}><span style={S.mono}>{p.party_gstin||"—"}</span></td><td style={S.td}>{p.invoice_count}</td><td style={S.td}>{fR(p.total_billed)}</td><td style={{...S.td,color:"#3fb950"}}>{fR(p.total_paid)}</td><td style={{...S.td,color:"#f85149",fontWeight:700}}>{fR(p.outstanding)}</td><td style={S.tdL}>{p.oldest_due||"—"}</td></tr>))}</tbody></table></div></div>)}
      {data&&!data.error&&rtype==="profit-loss"&&data.pl&&(<div style={{maxWidth:500,margin:"0 auto"}}><div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#3fb950",marginBottom:8}}>INCOME</div><div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>Sales</span><span style={{color:"#3fb950",fontWeight:600}}>{fR(data.pl.income.sales)}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontWeight:700}}><span>Total</span><span style={{color:"#3fb950"}}>{fR(data.pl.income.total)}</span></div></div><div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#f85149",marginBottom:8}}>EXPENSES</div><div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>Purchases</span><span style={{color:"#f85149",fontWeight:600}}>{fR(data.pl.expenses.purchases)}</span></div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontWeight:700}}><span>Total</span><span style={{color:"#f85149"}}>{fR(data.pl.expenses.total)}</span></div></div><div style={{...S.card,textAlign:"center",background:data.pl.net_profit>0?"#0d2818":"#2d0e0e"}}><div style={S.kpiLabel}>Net Profit / Loss</div><div style={{fontSize:28,fontWeight:800,color:data.pl.net_profit>0?"#3fb950":"#f85149"}}>{fR(data.pl.net_profit)}</div></div></div>)}
    </div>
  </div>);
}

function GSTCalculator(){
  const[amount,setAmount]=useState("");const[rate,setRate]=useState("18");const[type,setType]=useState("exclusive");const[txn,setTxn]=useState("inter");
  const amt=parseFloat(amount)||0,r=parseFloat(rate)||0;
  let base,gst,total;
  if(type==="exclusive"){base=amt;gst=amt*r/100;total=amt+gst;}else{total=amt;base=amt/(1+r/100);gst=total-base;}
  const igst=txn==="inter"?gst:0,cgst=txn==="intra"?gst/2:0,sgst=txn==="intra"?gst/2:0;
  const f=n=>n.toFixed(2);
  return(<div style={{maxWidth:520}}><div style={S.card}><div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>GST Calculator</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}><div><label style={S.label}>Amount (Rs.)</label><input style={S.input} type="number" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/></div><div><label style={S.label}>GST Rate</label><select style={S.select} value={rate} onChange={e=>setRate(e.target.value)}>{["0","0.1","0.25","1","1.5","3","5","6","7.5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></div><div><label style={S.label}>Type</label><select style={S.select} value={type} onChange={e=>setType(e.target.value)}><option value="exclusive">Exclusive (Add GST)</option><option value="inclusive">Inclusive (Remove GST)</option></select></div><div><label style={S.label}>Transaction</label><select style={S.select} value={txn} onChange={e=>setTxn(e.target.value)}><option value="inter">Inter-State (IGST)</option><option value="intra">Intra-State (CGST+SGST)</option></select></div></div>
  {amt>0&&<div style={{background:"#0D1117",borderRadius:8,padding:14}}>{[{l:"Base Amount",v:`Rs. ${f(base)}`,c:"#C9D1D9"},...(txn==="intra"?[{l:`CGST @ ${r/2}%`,v:`Rs. ${f(cgst)}`,c:"#e3b341"},{l:`SGST @ ${r/2}%`,v:`Rs. ${f(sgst)}`,c:"#e3b341"}]:[{l:`IGST @ ${r}%`,v:`Rs. ${f(igst)}`,c:"#e3b341"}]),{l:"Total GST",v:`Rs. ${f(gst)}`,c:"#f85149"},{l:"TOTAL AMOUNT",v:`Rs. ${f(total)}`,c:"#3fb950"}].map(row=>(<div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{row.l}</span><span style={{fontWeight:700,color:row.c}}>{row.v}</span></div>))}</div>}
  </div></div>);
}

function ComplianceCalendar(){
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now=new Date();const[sm,setSm]=useState(now.getMonth());const[sy,setSy]=useState(now.getFullYear());
  const getDD=(month,year)=>{const m=String(month+1).padStart(2,"0");return[{date:`${year}-${m}-11`,form:"GSTR-1",desc:`Outward supplies — ${months[month===0?11:month-1]} ${month===0?year-1:year}`,color:"blue"},{date:`${year}-${m}-20`,form:"GSTR-3B",desc:"Summary return + tax payment",color:"amber"},{date:`${year}-${m}-22`,form:"GSTR-3B Cat-1",desc:"Category 1 states",color:"amber"},{date:`${year}-${m}-24`,form:"GSTR-3B Cat-2",desc:"Category 2 states",color:"amber"}].sort((a,b)=>new Date(a.date)-new Date(b.date));};
  const td=now.toISOString().split("T")[0];
  return(<div><div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}><select style={{...S.select,width:"auto"}} value={sm} onChange={e=>setSm(parseInt(e.target.value))}>{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select style={{...S.select,width:"auto"}} value={sy} onChange={e=>setSy(parseInt(e.target.value))}>{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select></div>
  <div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Due Dates — {months[sm]} {sy}</div>{getDD(sm,sy).map((d,i)=>{const isPast=d.date<td,isToday=d.date===td;return(<div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:"1px solid #21262D",opacity:isPast?0.6:1}}><div style={{minWidth:50,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:isToday?"#f85149":isPast?"#8B949E":"#e3b341"}}>{d.date.split("-")[2]}</div><div style={{fontSize:10,color:"#8B949E"}}>{months[sm]}</div></div><div><div style={{display:"flex",gap:8,marginBottom:4}}>{badge(d.form,d.color)}{isToday&&badge("TODAY","red")}{isPast&&badge("Past","gray")}</div><div style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</div></div></div>);})}</div>
  <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872"}}><div style={{fontSize:12,color:"#58a6ff",fontWeight:600,marginBottom:8}}>Key Dates</div><div style={{fontSize:12,color:"#8B949E",lineHeight:1.9}}>• GSTR-1: 11th every month<br/>• GSTR-3B: 20th/22nd/24th by state<br/>• Late fee: Rs.50/day (Rs.20 for nil)<br/>• Interest @18% p.a. on late tax<br/>• Annual GSTR-9: 31st December</div></div></div>);
}

function NoticeReply({token}){
  const[clients,setClients]=useState([]);const[notices,setNotices]=useState([]);const[form,setForm]=useState({client_id:"",notice_type:"",ref_no:"",amount:"",description:""});const[reply,setReply]=useState("");const[loading,setLoading]=useState(false);
  useEffect(()=>{api("/clients","GET",null,token).then(d=>setClients(d.clients||[]));},[token]);
  useEffect(()=>{if(form.client_id)api(`/notices?client_id=${form.client_id}`,"GET",null,token).then(d=>setNotices(d.notices||[]));},[form.client_id,token]);
  const selectNotice=id=>{const n=notices.find(x=>x.id===id);if(n)setForm(f=>({...f,notice_type:n.type,ref_no:n.ref_no,amount:n.amount,description:n.description||""}));};
  const generate=async()=>{setLoading(true);setReply("");try{const client=clients.find(c=>c.id===form.client_id);const data=await api("/ai/generate-reply","POST",{client_name:client?.name||"",gstin:client?.gstin||"",notice_type:form.notice_type,ref_no:form.ref_no,amount:form.amount,description:form.description},token);setReply(data.reply||"");}catch(e){setReply("Error generating.");}setLoading(false);};
  return(<div style={S.twoCol}><div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Notice Details</div><div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{form.client_id&&<div style={S.fg}><label style={S.label}>Select Notice</label><select style={S.select} onChange={e=>selectNotice(e.target.value)}><option value="">Manual entry</option>{notices.map(n=><option key={n.id} value={n.id}>{n.ref_no} — {n.type}</option>)}</select></div>}{[{l:"Notice Type *",k:"notice_type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Ref No *",k:"ref_no",ph:"ZD071125006543C"},{l:"Amount",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}<div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:70}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div><button onClick={generate} disabled={loading||!form.client_id||!form.notice_type} style={{...S.btn,width:"100%",opacity:loading||!form.client_id||!form.notice_type?0.5:1}}>{loading?"Generating...":"Generate AI Reply"}</button></div>
  <div style={{...S.card,minHeight:300}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>Generated Reply</div>{reply&&<div style={{display:"flex",gap:8}}><button onClick={()=>navigator.clipboard.writeText(reply)} style={S.btnGhost}>Copy</button><button onClick={()=>{const w=window.open("","_blank");w.document.write(`<html><body style="font-family:Arial;padding:30px;font-size:14px;line-height:1.8"><pre style="white-space:pre-wrap">${reply}</pre></body></html>`);w.document.close();w.print();}} style={S.btnG}>Print</button></div>}</div>{loading?<div style={{color:"#8B949E",textAlign:"center",padding:30}}>AI generating...</div>:reply?<div style={{fontSize:12,color:"#C9D1D9",whiteSpace:"pre-wrap",lineHeight:1.8,background:"#0D1117",padding:14,borderRadius:8}}>{reply}</div>:<div style={{color:"#8B949E",fontSize:13,padding:20,textAlign:"center"}}>Fill details and click Generate.</div>}</div>
  </div>);
}

function AIAssistant({token}){
  const[msgs,setMsgs]=useState([{role:"assistant",content:"Namaste! I am TaxPro AI.\n\nI can help with:\n• GST (DRC-01, ITC, returns, reconciliation)\n• Accounting (vouchers, ledgers, trial balance)\n• Tax planning & compliance\n\nAsk me anything!"}]);
  const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async text=>{const msg=text||input.trim();if(!msg||loading)return;setInput("");setMsgs(prev=>[...prev,{role:"user",content:msg}]);setLoading(true);try{const history=msgs.map(m=>({role:m.role,content:m.content}));const data=await api("/ai/chat","POST",{messages:[...history,{role:"user",content:msg}]},token);setMsgs(prev=>[...prev,{role:"assistant",content:data.reply||"Sorry."}]);}catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"Error. Try again."}]);}setLoading(false);};
  const chips=["How to respond to DRC-01?","GSTR-2B vs 2A difference","ITC reversal Rule 42","Section 16(4) time limit","Journal entry for GST payment","What is trial balance?"];
  return(<div style={S.aiWrap}><div style={S.aiMsgs}>{msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>{m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,marginRight:8,flexShrink:0,marginTop:2,color:"#fff",fontWeight:700}}>AI</div>}<div style={m.role==="user"?S.bubU:S.bubA}>{m.content}</div></div>))}{loading&&<div style={{display:"flex",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"#1F6FEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>AI</div><div style={{...S.bubA,color:"#8B949E"}}>Thinking...</div></div>}<div ref={endRef}/></div><div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"8px 14px"}}>{chips.map(c=><button key={c} onClick={()=>send(c)} disabled={loading} style={{padding:"4px 10px",borderRadius:20,border:"1px solid #30363D",background:"transparent",color:"#8B949E",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div><div style={{display:"flex",gap:8,padding:"12px 14px",borderTop:"1px solid #21262D"}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about GST or accounting..." disabled={loading} style={{...S.input,flex:1}}/><button onClick={()=>send()} disabled={loading||!input.trim()} style={{...S.btn,opacity:loading||!input.trim()?0.5:1}}>Send</button></div></div>);
}

function Settings({token,user,toast,onLogout,accentColor,setAccentColor}){
  const[profile,setProfile]=useState({name:user.name||"",firm_name:user.firm_name||"",frn:user.frn||"",phone:"",gstin:""});
  const[saving,setSaving]=useState(false);
  const COLORS=[{label:"Blue",val:"#1F6FEB"},{label:"Green",val:"#238636"},{label:"Purple",val:"#6e40c9"},{label:"Teal",val:"#0e9182"},{label:"Orange",val:"#d06b2d"},{label:"Red",val:"#c0392b"}];
  const saveProfile=async()=>{setSaving(true);try{await api("/auth/profile","PUT",profile,token);toast("Profile updated!","success");}catch(e){toast(e.message,"error");}setSaving(false);};
  return(<div style={{maxWidth:700}}><div style={S.twoCol}>
    <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:16}}>👤 Profile Settings</div>
      {[{l:"Full Name *",k:"name",ph:"CA Rahul Prakash"},{l:"Firm Name *",k:"firm_name",ph:"Prakash & Associates"},{l:"FRN",k:"frn",ph:"001234N"},{l:"Phone",k:"phone",ph:"9876543210"},{l:"GSTIN (Firm)",k:"gstin",ph:"09AABCS1429B1Z7"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} placeholder={f.ph} value={profile[f.k]} onChange={e=>setProfile(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={S.fg}><label style={S.label}>Email (cannot change)</label><input style={{...S.input,opacity:0.5}} value={user.email} disabled/></div>
      <button onClick={saveProfile} disabled={saving} style={{...S.btn,width:"100%",opacity:saving?0.6:1}}>{saving?"Saving...":"💾 Save Profile"}</button>
    </div>
    <div>
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:14}}>🎨 Theme — Accent Color</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
          {COLORS.map(c=>(<button key={c.val} onClick={()=>setAccentColor(c.val)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 14px",borderRadius:10,border:`2px solid ${accentColor===c.val?"#fff":"transparent"}`,background:accentColor===c.val?"#21262D":"transparent",cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:c.val,boxShadow:accentColor===c.val?"0 0 0 3px rgba(255,255,255,0.3)":"none"}}/>
            <span style={{fontSize:11,color:accentColor===c.val?"#E6EDF3":"#8B949E"}}>{c.label}</span>
          </button>))}
        </div>
        <div style={{padding:12,borderRadius:8,background:accentColor,color:"#fff",fontSize:12,textAlign:"center",fontWeight:600}}>Preview: {accentColor}</div>
      </div>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:14}}>⚙️ Account Info</div>
        {[["Email",user.email],["Firm",user.firm_name||"—"],["Role",user.role||"CA"],["App Version","TaxPro v4.0"],["Database","PostgreSQL"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{fontSize:12,color:"#8B949E"}}>{l}</span><span style={{fontSize:12,color:"#E6EDF3",fontWeight:500}}>{v}</span></div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",marginBottom:14}}><span style={{fontSize:12,color:"#8B949E"}}>Status</span>{badge("Live ✓","green")}</div>
        <button onClick={onLogout} style={{width:"100%",padding:"11px",borderRadius:8,border:"1px solid #6e1c1c",background:"#2d0e0e",color:"#f85149",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>🚪 Logout</button>
      </div>
    </div>
  </div></div>);
}

function GSTR3B({token,toast}){
  const[period,setPeriod]=useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`);
  const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const load=async()=>{setLoading(true);try{const d=await api(`/gstr3b/${period}`,"GET",null,token);setData(d);}catch(e){toast(e.message,"error");}setLoading(false);};
  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const periodOptions=[];for(let m=0;m<12;m++){const yr=new Date().getFullYear();periodOptions.push(`${yr}-${String(m+1).padStart(2,"0")}`);}
  const printForm=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>GSTR-3B</title><style>body{font-family:Arial;margin:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #000;padding:7px;}th{background:#ccc;}</style></head><body><h2>FORM GSTR-3B — ${period}</h2><p>Generated: ${new Date().toLocaleDateString("en-IN")}</p>${document.getElementById("g3b")?.innerHTML||""}</body></html>`);w.document.close();w.print();};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>GSTR-3B Summary Return</span>
      <select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{periodOptions.map(p=>{const[y,m]=p.split("-");return<option key={p} value={p}>{MONTHS[parseInt(m)-1]} {y}</option>;})}</select>
      <button onClick={load} style={S.btn}>{loading?"Loading...":"Auto-Fill from Invoices"}</button>
      {data&&<button onClick={printForm} style={S.btnG}>🖨 Print / PDF</button>}
    </div>
    {loading&&<Spinner/>}
    {!data&&!loading&&<div style={{...S.card,textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>📋</div><div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>GSTR-3B Auto-Fill</div><div style={{color:"#8B949E",fontSize:13}}>Select period and click Auto-Fill to populate from your invoice data.</div></div>}
    {data&&(<div id="g3b">
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:12}}>3.1 — Outward Supplies</div>
        <table style={S.tbl}><thead><tr>{["Nature of Supplies","Taxable Value","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody><tr><td style={S.td}>(a) Outward taxable supplies (other than zero rated, nil and exempted)</td><td style={{...S.td,color:"#E6EDF3",fontWeight:600}}>{fR(data.table31.outward_taxable_supplies)}</td><td style={{...S.td,color:"#e3b341"}}>{fR(data.table31.igst)}</td><td style={{...S.td,color:"#e3b341"}}>{fR(data.table31.cgst)}</td><td style={{...S.tdL,color:"#e3b341"}}>{fR(data.table31.sgst)}</td></tr>
        <tr><td style={S.td}>(b) Zero rated supplies</td><td style={S.td}>0.00</td><td style={S.td}>0.00</td><td style={S.td}>0.00</td><td style={S.tdL}>0.00</td></tr>
        <tr><td style={S.td}>(c) Nil rated / Exempted</td><td style={S.td}>0.00</td><td style={S.td}>0.00</td><td style={S.td}>0.00</td><td style={S.tdL}>0.00</td></tr></tbody></table>
      </div>
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:12}}>4 — Eligible ITC</div>
        <table style={S.tbl}><thead><tr>{["Details","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody><tr><td style={S.td}>(A) ITC Available (Purchases)</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{fR(data.table4.itc_igst)}</td><td style={{...S.td,color:"#3fb950",fontWeight:600}}>{fR(data.table4.itc_cgst)}</td><td style={{...S.tdL,color:"#3fb950",fontWeight:600}}>{fR(data.table4.itc_sgst)}</td></tr>
        <tr><td style={S.td}>(B) ITC Reversed</td><td style={S.td}>0.00</td><td style={S.td}>0.00</td><td style={S.tdL}>0.00</td></tr>
        <tr style={{fontWeight:700}}><td style={S.td}>Net ITC Available (A-B)</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR(data.table4.itc_igst)}</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR(data.table4.itc_cgst)}</td><td style={{...S.tdL,color:"#3fb950",fontWeight:700}}>{fR(data.table4.itc_sgst)}</td></tr></tbody></table>
      </div>
      <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#E6EDF3",marginBottom:12}}>6 — Payment of Tax</div>
        <table style={S.tbl}><thead><tr>{["Description","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody><tr><td style={S.td}>Output Tax Payable</td><td style={{...S.td,color:"#e3b341"}}>{fR(data.table31.igst)}</td><td style={{...S.td,color:"#e3b341"}}>{fR(data.table31.cgst)}</td><td style={{...S.tdL,color:"#e3b341"}}>{fR(data.table31.sgst)}</td></tr>
        <tr><td style={S.td}>Less: ITC Available</td><td style={{...S.td,color:"#3fb950"}}>{fR(data.table4.itc_igst)}</td><td style={{...S.td,color:"#3fb950"}}>{fR(data.table4.itc_cgst)}</td><td style={{...S.tdL,color:"#3fb950"}}>{fR(data.table4.itc_sgst)}</td></tr>
        <tr><td style={{...S.td,fontWeight:700}}>Net GST Payable in Cash</td><td style={{...S.td,fontWeight:700,color:data.table6.igst_payable>0?"#f85149":"#3fb950"}}>{fR(data.table6.igst_payable)}</td><td style={{...S.td,fontWeight:700,color:data.table6.cgst_payable>0?"#f85149":"#3fb950"}}>{fR(data.table6.cgst_payable)}</td><td style={{...S.tdL,fontWeight:700,color:data.table6.sgst_payable>0?"#f85149":"#3fb950"}}>{fR(data.table6.sgst_payable)}</td></tr></tbody></table>
        <div style={{...S.card,textAlign:"center",background:data.table6.total_payable>0?"#2d0e0e":"#0d2818",border:`1px solid ${data.table6.total_payable>0?"#6e1c1c":"#238636"}`,marginBottom:0,marginTop:12}}><div style={S.kpiLabel}>Total Cash GST Payable</div><div style={{fontSize:28,fontWeight:800,color:data.table6.total_payable>0?"#f85149":"#3fb950"}}>{fR(data.table6.total_payable)}</div></div>
      </div>
    </div>)}
  </div>);
}

function GSTR1({token,toast}){
  const[period,setPeriod]=useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`);
  const[data,setData]=useState(null);const[loading,setLoading]=useState(false);const[tab,setTab]=useState("b2b");
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const load=async()=>{setLoading(true);try{const d=await api(`/gstr1/${period}`,"GET",null,token);setData(d);}catch(e){toast(e.message,"error");}setLoading(false);};
  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const periodOptions=[];for(let m=0;m<12;m++){const yr=new Date().getFullYear();periodOptions.push(`${yr}-${String(m+1).padStart(2,"0")}`);}
  const print=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>GSTR-1</title><style>body{font-family:Arial;margin:20px;font-size:11px;}table{width:100%;border-collapse:collapse;margin:10px 0;}th,td{border:1px solid #000;padding:6px;}th{background:#ddd;}</style></head><body><h2>FORM GSTR-1 — ${period}</h2>${document.getElementById("g1-body")?.innerHTML||""}</body></html>`);w.document.close();w.print();};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>GSTR-1 — Outward Supplies Return</span>
      <select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{periodOptions.map(p=>{const[y,m]=p.split("-");return<option key={p} value={p}>{MONTHS[parseInt(m)-1]} {y}</option>;})}</select>
      <button onClick={load} style={S.btn}>{loading?"Loading...":"Auto-Fill from Invoices"}</button>
      {data&&<button onClick={print} style={S.btnG}>🖨 Print</button>}
    </div>
    {loading&&<Spinner/>}
    {data&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>{[{l:"Total Invoices",v:data.summary.total_invoices,c:"#58a6ff"},{l:"B2B (Registered)",v:data.summary.b2b_count,c:"#e3b341"},{l:"B2C (Unregistered)",v:data.summary.b2c_count,c:"#bf91f3"},{l:"Total Tax",v:fR(data.summary.total_tax),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l.includes("Tax")?13:22,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>}
    {data&&<div style={{display:"flex",gap:4,marginBottom:12}}>{[{k:"b2b",l:"B2B Invoices"},{k:"b2c",l:"B2C Summary"},{k:"hsn",l:"HSN Summary"}].map(t=>(<button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderColor:tab===t.k?"#1F6FEB":"#30363D",background:tab===t.k?"#0c1d2e":"transparent",color:tab===t.k?"#58a6ff":"#8B949E",fontWeight:tab===t.k?600:400}}>{t.l}</button>))}</div>}
    <div id="g1-body">
      {data&&tab==="b2b"&&(<div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:10}}>B2B — GST Registered Customers</div><table style={S.tbl}><thead><tr>{["Invoice No","Date","GSTIN","Party Name","Taxable","IGST","CGST","SGST","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{data.b2b.map(inv=>(<tr key={inv.id}><td style={{...S.td,color:"#58a6ff"}}>{inv.invoice_no}</td><td style={S.td}>{inv.invoice_date}</td><td style={S.td}><span style={S.mono}>{inv.party_gstin}</span></td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</td><td style={S.td}>{fR(inv.taxable_amount)}</td><td style={S.td}>{fR(inv.igst_amount)}</td><td style={S.td}>{fR(inv.cgst_amount)}</td><td style={S.td}>{fR(inv.sgst_amount)}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fR(inv.total_amount)}</td></tr>))}{!data.b2b.length&&<tr><td colSpan={9} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No B2B invoices for this period</td></tr>}</tbody></table></div>)}
      {data&&tab==="b2c"&&(<div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:10}}>B2C — Unregistered Customers</div><table style={S.tbl}><thead><tr>{["Invoice No","Date","Party Name","Taxable","IGST","CGST","SGST","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{data.b2c.map(inv=>(<tr key={inv.id}><td style={{...S.td,color:"#58a6ff"}}>{inv.invoice_no}</td><td style={S.td}>{inv.invoice_date}</td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</td><td style={S.td}>{fR(inv.taxable_amount)}</td><td style={S.td}>{fR(inv.igst_amount)}</td><td style={S.td}>{fR(inv.cgst_amount)}</td><td style={S.td}>{fR(inv.sgst_amount)}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fR(inv.total_amount)}</td></tr>))}{!data.b2c.length&&<tr><td colSpan={8} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No B2C invoices</td></tr>}</tbody></table></div>)}
      {data&&tab==="hsn"&&(<div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:10}}>HSN-wise Summary</div><table style={S.tbl}><thead><tr>{["HSN/SAC","UQC","Total Qty","Total Value","Taxable","IGST","CGST","SGST"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{data.hsn_summary.map((h,i)=>(<tr key={i}><td style={{...S.td,fontWeight:600}}>{h.hsn_sc}</td><td style={S.td}>{h.uqc}</td><td style={S.td}>{parseFloat(h.total_qty||0).toFixed(2)}</td><td style={S.td}>{fR(h.total_val)}</td><td style={S.td}>{fR(h.taxable_val)}</td><td style={S.td}>{fR(h.igst)}</td><td style={S.td}>{fR(h.cgst)}</td><td style={{...S.tdL,fontWeight:700,color:"#e3b341"}}>{fR(h.sgst)}</td></tr>))}{!data.hsn_summary.length&&<tr><td colSpan={8} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No HSN data</td></tr>}</tbody></table></div>)}
    </div>
    {!data&&!loading&&<div style={{...S.card,textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>📤</div><div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>GSTR-1 Auto-Fill</div><div style={{color:"#8B949E",fontSize:13}}>Select period and click Auto-Fill to generate GSTR-1 from your Sales Invoices.</div></div>}
  </div>);
}

function EInvoice({token,toast}){
  const[invoices,setInvoices]=useState([]);const[loading,setLoading]=useState(true);const[generating,setGenerating]=useState(null);const[result,setResult]=useState(null);const[search,setSearch]=useState("");
  const load=useCallback(()=>{setLoading(true);api("/einvoice","GET",null,token).then(d=>{setInvoices(d.invoices||[]);setLoading(false);}).catch(()=>setLoading(false));},[token]);
  useEffect(()=>{load();},[load]);
  const generate=async id=>{setGenerating(id);try{const d=await api("/einvoice/generate","POST",{invoice_id:id},token);setResult(d);toast("E-Invoice Generated!","success");load();}catch(e){toast(e.message,"error");}setGenerating(null);};
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const filtered=invoices.filter(i=>i.party_name.toLowerCase().includes(search.toLowerCase())||i.invoice_no.toLowerCase().includes(search.toLowerCase()));
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:6}}>📋 E-Invoice (IRN Generation)</div><div style={{fontSize:12,color:"#C9D1D9",lineHeight:1.8}}>• Mandatory for turnover &gt; Rs.5 Crore<br/>• IRN (Invoice Reference Number) from NIC portal<br/>• QR code printed on invoice automatically</div></div>
    {result&&(<div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:"#3fb950",marginBottom:10}}>✅ E-Invoice Generated!</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>{[["IRN",result.irn],["Ack No",result.ack_no],["Ack Date",result.ack_date],["Invoice No",result.invoice_no]].map(([l,v])=>(<div key={l}><span style={{color:"#8B949E"}}>{l}: </span><span style={{color:"#E6EDF3",fontWeight:600,fontFamily:"monospace",fontSize:11}}>{v}</span></div>))}</div><button onClick={()=>setResult(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Dismiss</button></div>)}
    <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices..." style={{...S.input,width:280}}/></div>
    {loading?<Spinner/>:(<div style={S.card}><table style={S.tbl}><thead><tr>{["Invoice No","Date","Party","GSTIN","Amount","IRN Status","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{filtered.map(inv=>(<tr key={inv.id}><td style={{...S.td,color:"#58a6ff",fontWeight:600}}>{inv.invoice_no}</td><td style={S.td}>{inv.invoice_date}</td><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{inv.party_name}</td><td style={S.td}><span style={S.mono}>{inv.party_gstin||"—"}</span></td><td style={{...S.td,fontWeight:600}}>{fR(inv.total_amount)}</td><td style={S.td}>{inv.einvoice_irn?(<div>{badge("Generated","green")}<div style={{...S.mono,fontSize:9,marginTop:2}}>{inv.einvoice_irn.substring(0,20)}...</div></div>):badge("Not Generated","gray")}</td><td style={S.tdL}>{!inv.einvoice_irn?<button onClick={()=>generate(inv.id)} disabled={generating===inv.id} style={{...S.btn,fontSize:11,padding:"5px 12px",opacity:generating===inv.id?0.5:1}}>{generating===inv.id?"Generating...":"Generate IRN"}</button>:<button onClick={()=>toast("IRN: "+inv.einvoice_irn,"success")} style={{...S.btnGhost,fontSize:11,padding:"5px 10px"}}>View IRN</button>}</td></tr>))}{!filtered.length&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No invoices found</td></tr>}</tbody></table></div>)}
  </div>);
}

function EWayBill({token,toast}){
  const[invoices,setInvoices]=useState([]);const[form,setForm]=useState({invoice_id:"",transporter_name:"",transporter_id:"",vehicle_no:"",vehicle_type:"Regular",distance:"100",supply_type:"Outward",sub_type:"Supply",from_place:"",from_state:"",to_place:"",to_state:""});
  const[result,setResult]=useState(null);const[saving,setSaving]=useState(false);
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Goa","Other"];
  useEffect(()=>{api("/einvoice","GET",null,token).then(d=>setInvoices(d.invoices||[]));},[token]);
  const generate=async()=>{if(!form.invoice_id)return toast("Select invoice","error");setSaving(true);try{const d=await api("/ewaybill/generate","POST",form,token);setResult(d);toast("E-Way Bill Generated!","success");}catch(e){toast(e.message,"error");}setSaving(false);};
  const printEWB=()=>{const inv=invoices.find(i=>i.id===form.invoice_id);const w=window.open("","_blank");w.document.write(`<html><head><title>E-Way Bill</title><style>body{font-family:Arial;margin:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}td{border:1px solid #ccc;padding:7px;}.title{background:#1F6FEB;color:white;font-size:16px;font-weight:bold;padding:10px;text-align:center;}.section{background:#eee;font-weight:bold;padding:6px;margin-top:10px;}</style></head><body><div class="title">E-WAY BILL</div><br><table><tr><td><b>EWB No:</b> ${result?.ewb_no}</td><td><b>Valid Till:</b> ${result?.valid_till}</td><td><b>Generated:</b> ${new Date().toLocaleDateString("en-IN")}</td></tr></table><div class="section">Invoice Details</div><table><tr><td><b>Invoice No:</b> ${inv?.invoice_no}</td><td><b>Date:</b> ${inv?.invoice_date}</td><td><b>Value:</b> Rs.${Number(inv?.total_amount||0).toLocaleString("en-IN")}</td></tr></table><div class="section">Party Details</div><table><tr><td><b>From:</b> ${form.from_place}, ${form.from_state}</td><td><b>To:</b> ${form.to_place}, ${form.to_state}</td></tr><tr><td><b>Consignee:</b> ${inv?.party_name}</td><td><b>GSTIN:</b> ${inv?.party_gstin||"—"}</td></tr></table><div class="section">Transport Details</div><table><tr><td><b>Vehicle No:</b> ${result?.vehicle_no||"—"}</td><td><b>Distance:</b> ${result?.distance} km</td><td><b>Transporter:</b> ${result?.transporter_name}</td></tr></table></body></html>`);w.document.close();w.print();};
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:6}}>📦 E-Way Bill</div><div style={{fontSize:12,color:"#C9D1D9",lineHeight:1.8}}>• Required for goods movement &gt; Rs.50,000<br/>• Valid: 1 day per 100 km (min 1 day)<br/>• Fill invoice, transporter and vehicle details below</div></div>
    {result&&(<div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:"#3fb950",marginBottom:10}}>✅ E-Way Bill Generated!</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>{[{l:"EWB Number",v:result.ewb_no,c:"#58a6ff"},{l:"Valid Till",v:result.valid_till,c:"#e3b341"},{l:"Distance",v:`${result.distance} km`,c:"#8B949E"},{l:"Transporter",v:result.transporter_name,c:"#C9D1D9"}].map(k=>(<div key={k.l} style={{textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:12,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div><button onClick={printEWB} style={S.btnG}>🖨 Print E-Way Bill</button><button onClick={()=>setResult(null)} style={{...S.btnGhost,marginLeft:8,fontSize:11}}>New</button></div>)}
    <div style={S.twoCol}>
      <div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Supply Details</div>
        <div style={S.fg}><label style={S.label}>Select Invoice *</label><select style={S.select} value={form.invoice_id} onChange={e=>setForm(p=>({...p,invoice_id:e.target.value}))}><option value="">Select</option>{invoices.map(i=><option key={i.id} value={i.id}>{i.invoice_no} — {i.party_name}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={S.fg}><label style={S.label}>Supply Type</label><select style={S.select} value={form.supply_type} onChange={e=>setForm(p=>({...p,supply_type:e.target.value}))}>{["Outward","Inward"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Sub Type</label><select style={S.select} value={form.sub_type} onChange={e=>setForm(p=>({...p,sub_type:e.target.value}))}>{["Supply","Export","Job Work","For Own Use","Others"].map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={S.fg}><label style={S.label}>From Place</label><input style={S.input} placeholder="City" value={form.from_place} onChange={e=>setForm(p=>({...p,from_place:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>From State</label><select style={S.select} value={form.from_state} onChange={e=>setForm(p=>({...p,from_state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={S.fg}><label style={S.label}>To Place</label><input style={S.input} placeholder="City" value={form.to_place} onChange={e=>setForm(p=>({...p,to_place:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>To State</label><select style={S.select} value={form.to_state} onChange={e=>setForm(p=>({...p,to_state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
      </div>
      <div style={S.card}><div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Transport Details</div>
        <div style={S.fg}><label style={S.label}>Transporter Name</label><input style={S.input} placeholder="Transport Co. or Self" value={form.transporter_name} onChange={e=>setForm(p=>({...p,transporter_name:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Transporter ID / GSTIN</label><input style={S.input} placeholder="GSTIN of transporter" value={form.transporter_id} onChange={e=>setForm(p=>({...p,transporter_id:e.target.value}))}/></div>
        <div style={S.fg}><label style={S.label}>Vehicle Number</label><input style={S.input} placeholder="UP14AB1234" value={form.vehicle_no} onChange={e=>setForm(p=>({...p,vehicle_no:e.target.value.toUpperCase()}))}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={S.fg}><label style={S.label}>Vehicle Type</label><select style={S.select} value={form.vehicle_type} onChange={e=>setForm(p=>({...p,vehicle_type:e.target.value}))}>{["Regular","Over Dimensional Cargo"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={S.fg}><label style={S.label}>Distance (km)</label><input style={S.input} type="number" value={form.distance} onChange={e=>setForm(p=>({...p,distance:e.target.value}))}/></div>
        </div>
        <button onClick={generate} disabled={saving||!form.invoice_id} style={{...S.btnG,width:"100%",marginTop:8,opacity:saving||!form.invoice_id?0.5:1}}>{saving?"Generating...":"Generate E-Way Bill"}</button>
      </div>
    </div>
  </div>);
}

function CompanyManager({token,toast,onSelect,selectedCompany}){
  const[companies,setCompanies]=useState([]);const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({name:"",legal_name:"",gstin:"",pan:"",address:"",city:"",state:"",pincode:"",phone:"",email:"",fy_start:"2024-04-01",fy_end:"2025-03-31"});
  const STATES=["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Goa","Other"];
  const load=()=>{setLoading(true);api("/accounting/companies","GET",null,token).then(d=>{setCompanies(d.companies||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const openAdd=()=>{setEditing(null);setForm({name:"",legal_name:"",gstin:"",pan:"",address:"",city:"",state:"",pincode:"",phone:"",email:"",fy_start:"2024-04-01",fy_end:"2025-03-31"});setShowModal(true);};
  const save=async()=>{if(!form.name)return toast("Company name required","error");setSaving(true);try{if(editing){await api(`/accounting/companies/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api("/accounting/companies","POST",form,token);toast("Company created with Chart of Accounts!","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async(e,id)=>{e.stopPropagation();if(!window.confirm("Delete company and all its data?"))return;try{await api(`/accounting/companies/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:"#E6EDF3"}}>Companies</div><button onClick={openAdd} style={{...S.btn,marginLeft:"auto"}}>+ New Company</button></div>
    {loading?<Spinner/>:companies.length===0?(<div style={{...S.card,textAlign:"center",padding:50}}><div style={{fontSize:48,marginBottom:12}}>🏢</div><div style={{fontSize:15,fontWeight:600,color:"#E6EDF3",marginBottom:8}}>No Companies Yet</div><div style={{color:"#8B949E",fontSize:13,marginBottom:20}}>Create a company to start Tally-like accounting with Chart of Accounts, Ledgers and Vouchers.</div><button onClick={openAdd} style={S.btn}>+ Create First Company</button></div>):(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {companies.map(c=>(<div key={c.id} onClick={()=>onSelect(c)} style={{...S.card,cursor:"pointer",border:`1px solid ${selectedCompany?.id===c.id?"#1F6FEB":"#21262D"}`,background:selectedCompany?.id===c.id?"#0c1d2e":"#161B22",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:"#E6EDF3"}}>{c.name}</div>
            {selectedCompany?.id===c.id&&badge("Active","green")}
          </div>
          {c.legal_name&&<div style={{fontSize:12,color:"#8B949E",marginBottom:4}}>{c.legal_name}</div>}
          {c.gstin&&<div style={{...S.mono,marginBottom:4,fontSize:11}}>{c.gstin}</div>}
          <div style={{fontSize:11,color:"#8B949E",marginBottom:10}}>{c.city&&`${c.city}, `}{c.state}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:"#8B949E"}}>FY: {c.fy_start?.substring(0,4)}–{c.fy_end?.substring(0,4)}</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={e=>{e.stopPropagation();setEditing(c);setForm({name:c.name,legal_name:c.legal_name||"",gstin:c.gstin||"",pan:c.pan||"",address:c.address||"",city:c.city||"",state:c.state||"",pincode:c.pincode||"",phone:c.phone||"",email:c.email||"",fy_start:c.fy_start||"2024-04-01",fy_end:c.fy_end||"2025-03-31"});setShowModal(true);}} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button>
              <button onClick={e=>del(e,c.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button>
            </div>
          </div>
        </div>))}
      </div>
    )}
    {showModal&&(<Modal title={editing?"Edit Company":"Create Company"} onClose={()=>setShowModal(false)} wide>
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Company Name *</label><input style={S.input} placeholder="My Business Pvt Ltd" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Legal Name</label><input style={S.input} value={form.legal_name} onChange={e=>setForm(p=>({...p,legal_name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} value={form.gstin} onChange={e=>setForm(p=>({...p,gstin:e.target.value.toUpperCase()}))}/></div>
          <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={form.pan} onChange={e=>setForm(p=>({...p,pan:e.target.value.toUpperCase()}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          </div>
        </div>
        <div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>City</label><input style={S.input} value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Pincode</label><input style={S.input} value={form.pincode} onChange={e=>setForm(p=>({...p,pincode:e.target.value}))}/></div>
          </div>
          <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>FY Start</label><input style={S.input} type="date" value={form.fy_start} onChange={e=>setForm(p=>({...p,fy_start:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>FY End</label><input style={S.input} type="date" value={form.fy_end} onChange={e=>setForm(p=>({...p,fy_end:e.target.value}))}/></div>
          </div>
        </div>
      </div>
      {!editing&&<div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:12}}><div style={{fontSize:12,color:"#58a6ff"}}>✨ Auto-creates: Capital, Sundry Debtors/Creditors, Cash, Bank, Sales, Purchase, GST ledgers and full Chart of Accounts</div></div>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Creating...":"Save Company"}</button></div>
    </Modal>)}
  </div>);
}

function LedgerGroups({token,toast,companyId}){
  const[groups,setGroups]=useState([]);const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({name:"",parent_id:"",nature:"Asset",affects_gross:false});
  const load=()=>{setLoading(true);api(`/accounting/companies/${companyId}/groups`,"GET",null,token).then(d=>{setGroups(d.groups||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[companyId]);
  const save=async()=>{if(!form.name)return toast("Name required","error");setSaving(true);try{if(editing){await api(`/accounting/companies/${companyId}/groups/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api(`/accounting/companies/${companyId}/groups`,"POST",form,token);toast("Group created","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{if(!window.confirm("Delete group?"))return;try{await api(`/accounting/companies/${companyId}/groups/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const byNature=["Asset","Liability","Income","Expense"].reduce((acc,n)=>{acc[n]=groups.filter(g=>g.nature===n);return acc;},{});
  const NC={Asset:"green",Liability:"red",Income:"teal",Expense:"amber"};
  return(<div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:"#E6EDF3"}}>Chart of Accounts</div><button onClick={()=>{setEditing(null);setForm({name:"",parent_id:"",nature:"Asset",affects_gross:false});setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ New Group</button></div>
    {loading?<Spinner/>:(<div style={S.twoCol}>{Object.entries(byNature).map(([nature,grps])=>(<div key={nature} style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{badge(nature,NC[nature])}</div>{grps.length===0?<div style={{color:"#8B949E",fontSize:12}}>No custom groups</div>:grps.map(g=>(<div key={g.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D"}}><div><div style={{fontSize:12,fontWeight:g.is_default?600:400,color:"#C9D1D9"}}>{g.name}{g.is_default&&<span style={{fontSize:9,color:"#8B949E",marginLeft:6}}>DEFAULT</span>}</div>{g.parent_id&&<div style={{fontSize:10,color:"#8B949E"}}>Sub-group</div>}</div><div style={{display:"flex",gap:4,alignItems:"center"}}>{g.affects_gross&&badge("Gross","purple")}{!g.is_default&&<><button onClick={()=>{setEditing(g);setForm({name:g.name,parent_id:g.parent_id||"",nature:g.nature,affects_gross:g.affects_gross||false});setShowModal(true);}} style={{...S.btnGhost,fontSize:10,padding:"3px 6px"}}>Edit</button><button onClick={()=>del(g.id)} style={{...S.btnDanger,fontSize:10,padding:"3px 6px"}}>Del</button></>}</div></div>))}</div>))}</div>)}
    {showModal&&(<Modal title={editing?"Edit Group":"New Group"} onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Group Name *</label><input style={S.input} placeholder="e.g. Bank Accounts" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
      <div style={S.fg}><label style={S.label}>Nature *</label><select style={S.select} value={form.nature} onChange={e=>setForm(p=>({...p,nature:e.target.value}))}>{["Asset","Liability","Income","Expense"].map(n=><option key={n}>{n}</option>)}</select></div>
      <div style={S.fg}><label style={S.label}>Parent Group</label><select style={S.select} value={form.parent_id} onChange={e=>setForm(p=>({...p,parent_id:e.target.value}))}><option value="">None (Top Level)</option>{groups.filter(g=>g.nature===form.nature).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><input type="checkbox" id="ag" checked={form.affects_gross} onChange={e=>setForm(p=>({...p,affects_gross:e.target.checked}))}/><label htmlFor="ag" style={{...S.label,marginBottom:0,cursor:"pointer"}}>Affects Gross Profit</label></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div>
    </Modal>)}
  </div>);
}

function LedgerManager({token,toast,companyId}){
  const[ledgers,setLedgers]=useState([]);const[groups,setGroups]=useState([]);const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);const[saving,setSaving]=useState(false);const[statement,setStatement]=useState(null);const[filterNature,setFilterNature]=useState("all");const[search,setSearch]=useState("");
  const[form,setForm]=useState({name:"",group_id:"",opening_balance:"0",opening_type:"Dr",alias:"",gstin:"",pan:"",address:"",phone:"",email:"",bank_account:"",bank_name:"",ifsc_code:"",credit_limit:"0",credit_days:"0",notes:""});
  const load=()=>{setLoading(true);Promise.all([api(`/accounting/companies/${companyId}/ledgers${search?`?search=${encodeURIComponent(search)}`:(filterNature!=="all"?`?nature=${filterNature}`:"")}`,"GET",null,token),api(`/accounting/companies/${companyId}/groups`,"GET",null,token)]).then(([ld,gd])=>{setLedgers(ld.ledgers||[]);setGroups(gd.groups||[]);setLoading(false);}).catch(()=>setLoading(false));};
  useEffect(()=>{load();},[companyId,filterNature]);
  const save=async()=>{if(!form.name||!form.group_id)return toast("Name and group required","error");setSaving(true);try{if(editing){await api(`/accounting/companies/${companyId}/ledgers/${editing.id}`,"PUT",form,token);toast("Updated","success");}else{await api(`/accounting/companies/${companyId}/ledgers`,"POST",form,token);toast("Ledger created","success");}setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/accounting/companies/${companyId}/ledgers/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const viewStatement=async l=>{try{const d=await api(`/accounting/companies/${companyId}/ledgers/${l.id}/statement`,"GET",null,token);setStatement({...d,ledger_name:l.name});}catch(e){toast(e.message,"error");}};
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const NC={Asset:"green",Liability:"red",Income:"teal",Expense:"amber"};
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:4}}>
        {["all","Asset","Liability","Income","Expense"].map(n=>(<button key={n} onClick={()=>setFilterNature(n)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderColor:filterNature===n?"#58a6ff":"#30363D",background:filterNature===n?"#0c1d2e":"transparent",color:filterNature===n?"#58a6ff":"#8B949E"}}>{n==="all"?"All":n}</button>))}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search ledgers..." style={{...S.input,width:200}}/>
      <button onClick={load} style={S.btnGhost}>Search</button>
      <button onClick={()=>{setEditing(null);setForm({name:"",group_id:"",opening_balance:"0",opening_type:"Dr",alias:"",gstin:"",pan:"",address:"",phone:"",email:"",bank_account:"",bank_name:"",ifsc_code:"",credit_limit:"0",credit_days:"0",notes:""});setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ New Ledger</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{ledgers.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No ledgers found.</div>:(
      <table style={S.tbl}><thead><tr>{["Ledger Name","Group","Nature","Opening Balance","Current Balance","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{ledgers.map(l=>(<tr key={l.id}>
        <td style={{...S.td,fontWeight:600,color:"#E6EDF3",cursor:"pointer"}} onClick={()=>viewStatement(l)}>{l.name}{l.is_default&&<span style={{fontSize:9,color:"#8B949E",marginLeft:6}}>DEFAULT</span>}</td>
        <td style={S.td}>{l.group_name}</td>
        <td style={S.td}>{badge(l.nature,NC[l.nature]||"gray")}</td>
        <td style={S.td}>{fR(l.opening_balance)} <span style={{fontSize:10,color:"#8B949E"}}>{l.opening_type}</span></td>
        <td style={{...S.td,fontWeight:700,color:l.balance_type==="Dr"?"#3fb950":"#f85149"}}>{fR(l.balance)} <span style={{fontSize:10}}>{l.balance_type}</span></td>
        <td style={S.tdL}><div style={{display:"flex",gap:4}}>
          <button onClick={()=>viewStatement(l)} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Statement</button>
          {!l.is_default&&<><button onClick={()=>{setEditing(l);setForm({name:l.name,group_id:l.group_id,opening_balance:l.opening_balance||"0",opening_type:l.opening_type||"Dr",alias:l.alias||"",gstin:l.gstin||"",pan:l.pan||"",address:l.address||"",phone:l.phone||"",email:l.email||"",bank_account:l.bank_account||"",bank_name:l.bank_name||"",ifsc_code:l.ifsc_code||"",credit_limit:l.credit_limit||"0",credit_days:l.credit_days||"0",notes:l.notes||""});setShowModal(true);}} style={{...S.btnGhost,fontSize:11,padding:"4px 8px"}}>Edit</button><button onClick={()=>del(l.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button></>}
        </div></td>
      </tr>))}</tbody></table>
    )}</div>)}
    {showModal&&(<Modal title={editing?"Edit Ledger":"Create Ledger"} onClose={()=>setShowModal(false)} wide>
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Ledger Name *</label><input style={S.input} placeholder="e.g. HDFC Bank A/c" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div style={S.fg}><label style={S.label}>Under Group *</label><select style={S.select} value={form.group_id} onChange={e=>setForm(p=>({...p,group_id:e.target.value}))}><option value="">Select Group</option>{["Asset","Liability","Income","Expense"].map(n=>(<optgroup key={n} label={n}>{groups.filter(g=>g.nature===n).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>))}</select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Opening Balance</label><input style={S.input} type="number" value={form.opening_balance} onChange={e=>setForm(p=>({...p,opening_balance:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Dr / Cr</label><select style={S.select} value={form.opening_type} onChange={e=>setForm(p=>({...p,opening_type:e.target.value}))}><option value="Dr">Dr (Debit)</option><option value="Cr">Cr (Credit)</option></select></div>
          </div>
          <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} value={form.gstin} onChange={e=>setForm(p=>({...p,gstin:e.target.value.toUpperCase()}))}/></div>
          <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} value={form.pan} onChange={e=>setForm(p=>({...p,pan:e.target.value.toUpperCase()}))}/></div>
        </div>
        <div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{...S.input,resize:"vertical",minHeight:60}} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          </div>
          <div style={S.fg}><label style={S.label}>Bank Account No</label><input style={S.input} value={form.bank_account} onChange={e=>setForm(p=>({...p,bank_account:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={S.fg}><label style={S.label}>Bank Name</label><input style={S.input} value={form.bank_name} onChange={e=>setForm(p=>({...p,bank_name:e.target.value}))}/></div>
            <div style={S.fg}><label style={S.label}>IFSC</label><input style={S.input} value={form.ifsc_code} onChange={e=>setForm(p=>({...p,ifsc_code:e.target.value.toUpperCase()}))}/></div>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save Ledger"}</button></div>
    </Modal>)}
    {statement&&(<Modal title={`Ledger Statement — ${statement.ledger_name}`} onClose={()=>setStatement(null)} wide>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Opening",v:`${fR(statement.summary?.opening_balance)} ${statement.summary?.opening_type}`,c:"#8B949E"},{l:"Total Dr",v:fR(statement.summary?.total_dr),c:"#3fb950"},{l:"Total Cr",v:fR(statement.summary?.total_cr),c:"#f85149"},{l:"Closing",v:`${fR(statement.summary?.closing_balance)} ${statement.summary?.closing_type}`,c:"#e3b341"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:12,fontWeight:700,color:k.c}}>{k.v}</div></div>))}
      </div>
      <table style={S.tbl}><thead><tr>{["Date","Voucher No","Type","Narration","Dr Amount","Cr Amount","Balance"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>
        <tr><td colSpan={4} style={{...S.td,color:"#8B949E",fontStyle:"italic"}}>Opening Balance</td><td style={S.td}>{statement.ledger?.opening_type==="Dr"?fR(statement.ledger?.opening_balance):"—"}</td><td style={S.td}>{statement.ledger?.opening_type==="Cr"?fR(statement.ledger?.opening_balance):"—"}</td><td style={{...S.tdL,fontWeight:600}}>{fR(statement.summary?.opening_balance)} {statement.summary?.opening_type}</td></tr>
        {(statement.transactions||[]).map((t,i)=>(<tr key={i}><td style={S.td}>{t.date}</td><td style={{...S.td,color:"#58a6ff"}}>{t.voucher_no}</td><td style={S.td}>{badge(t.voucher_type,"gray")}</td><td style={{...S.td,maxWidth:150,color:"#8B949E"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.narration||t.v_narration||"—"}</div></td><td style={{...S.td,color:"#3fb950"}}>{t.dr_amount>0?fR(t.dr_amount):"—"}</td><td style={{...S.td,color:"#f85149"}}>{t.cr_amount>0?fR(t.cr_amount):"—"}</td><td style={{...S.tdL,fontWeight:600,color:t.balance_type==="Dr"?"#3fb950":"#f85149"}}>{fR(t.running_balance)} {t.balance_type}</td></tr>))}
        {!statement.transactions?.length&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No transactions yet</td></tr>}
      </tbody></table>
    </Modal>)}
  </div>);
}

function VoucherEntry({token,toast,companyId}){
  const VTYPES=[{key:"CONTRA",label:"F4: Contra",desc:"Cash/Bank transfers",color:"purple"},{key:"PAYMENT",label:"F5: Payment",desc:"Expenses, vendor payments",color:"red"},{key:"RECEIPT",label:"F6: Receipt",desc:"Customer payments",color:"green"},{key:"JOURNAL",label:"F7: Journal",desc:"Adjustments, depreciation",color:"blue"},{key:"SALES",label:"F8: Sales",desc:"Sales entries",color:"teal"},{key:"PURCHASE",label:"F9: Purchase",desc:"Purchase entries",color:"amber"}];
  const[vtype,setVtype]=useState("RECEIPT");const[ledgers,setLedgers]=useState([]);const[vouchers,setVouchers]=useState([]);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[viewMode,setViewMode]=useState("entry");const[viewing,setViewing]=useState(null);const[filterType,setFilterType]=useState("all");
  const[form,setForm]=useState({date:todayStr(),ref_no:"",narration:"",party_name:""});
  const[rows,setRows]=useState([{ledger_id:"",amount:"",entry_type:"Dr",narration:""},{ledger_id:"",amount:"",entry_type:"Cr",narration:""}]);
  useEffect(()=>{api(`/accounting/companies/${companyId}/ledgers`,"GET",null,token).then(d=>setLedgers(d.ledgers||[])).catch(()=>{});},[companyId,token]);
  const loadVouchers=useCallback(()=>{setLoading(true);api(`/accounting/companies/${companyId}/vouchers${filterType!=="all"?`?type=${filterType}`:""}`, "GET",null,token).then(d=>{setVouchers(d.vouchers||[]);setLoading(false);}).catch(()=>setLoading(false));},[companyId,token,filterType]);
  useEffect(()=>{if(viewMode==="list")loadVouchers();},[viewMode,loadVouchers]);
  const setRow=(i,k,v)=>{const n=[...rows];n[i]={...n[i],[k]:v};setRows(n);};
  const addRow=()=>setRows(p=>[...p,{ledger_id:"",amount:"",entry_type:"Cr",narration:""}]);
  const removeRow=i=>{if(rows.length<=2)return;setRows(p=>p.filter((_,idx)=>idx!==i));};
  const handleVtypeChange=vt=>{setVtype(vt);setRows(prev=>prev.map((row,i)=>({...row,entry_type:(vt==="PAYMENT"&&i===0)?"Cr":(vt==="PAYMENT"&&i===1)?"Dr":i===0?"Dr":"Cr"})));};
  const totalDr=rows.filter(r=>r.entry_type==="Dr").reduce((a,r)=>a+(parseFloat(r.amount)||0),0);
  const totalCr=rows.filter(r=>r.entry_type==="Cr").reduce((a,r)=>a+(parseFloat(r.amount)||0),0);
  const diff=Math.abs(totalDr-totalCr);
  const balanced=diff<0.01&&totalDr>0;
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const save=async()=>{
    const items=rows.filter(r=>r.ledger_id&&parseFloat(r.amount||0)>0).map(r=>({ledger_id:r.ledger_id,dr_amount:r.entry_type==="Dr"?parseFloat(r.amount||0):0,cr_amount:r.entry_type==="Cr"?parseFloat(r.amount||0):0,narration:r.narration}));
    if(items.length<2)return toast("At least 2 entries required","error");
    if(!balanced)return toast(`Not balanced! Dr:${fR(totalDr)}, Cr:${fR(totalCr)}, Diff:${fR(diff)}`,"error");
    setSaving(true);
    try{const res=await api(`/accounting/companies/${companyId}/vouchers`,"POST",{voucher_type:vtype,date:form.date,ref_no:form.ref_no,narration:form.narration,party_name:form.party_name||null,items},token);toast(`✅ ${res.voucher?.voucher_no} saved!`,"success");setForm({date:todayStr(),ref_no:"",narration:"",party_name:""});setRows([{ledger_id:"",amount:"",entry_type:"Dr",narration:""},{ledger_id:"",amount:"",entry_type:"Cr",narration:""}]);}catch(e){toast(e.message,"error");}
    setSaving(false);
  };
  const cancelVoucher=async id=>{if(!window.confirm("Cancel?"))return;try{await api(`/accounting/companies/${companyId}/vouchers/${id}/cancel`,"PATCH",{},token);toast("Cancelled","success");loadVouchers();}catch(e){toast(e.message,"error");}};
  const deleteVoucher=async id=>{if(!window.confirm("Delete?"))return;try{await api(`/accounting/companies/${companyId}/vouchers/${id}`,"DELETE",null,token);toast("Deleted","success");loadVouchers();}catch(e){toast(e.message,"error");}};
  const vtypeInfo=VTYPES.find(v=>v.key===vtype)||VTYPES[0];
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:14}}>{[{k:"entry",l:"📝 New Entry"},{k:"list",l:"📋 Voucher List"}].map(t=>(<button key={t.k} onClick={()=>setViewMode(t.k)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:viewMode===t.k?"#1F6FEB":"#30363D",background:viewMode===t.k?"#0c1d2e":"transparent",color:viewMode===t.k?"#58a6ff":"#8B949E",fontWeight:viewMode===t.k?600:400}}>{t.l}</button>))}</div>
    {viewMode==="entry"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:14}}>
        {VTYPES.map(v=>(<button key={v.key} onClick={()=>handleVtypeChange(v.key)} style={{padding:"10px 6px",borderRadius:10,border:`2px solid ${vtype===v.key?"#1F6FEB":"#30363D"}`,background:vtype===v.key?"#0c1d2e":"#161B22",color:vtype===v.key?"#58a6ff":"#8B949E",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}>
          <div style={{fontSize:12,fontWeight:700,color:vtype===v.key?"#1F6FEB":"#8B949E"}}>{v.label.split(":")[0]}:</div>
          <div style={{fontSize:13,fontWeight:700,color:vtype===v.key?"#E6EDF3":"#C9D1D9",margin:"3px 0"}}>{v.label.split(": ")[1]||v.label}</div>
          <div style={{fontSize:10,color:"#8B949E"}}>{v.desc}</div>
        </button>))}
      </div>
      <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14,padding:"10px 14px"}}>
        <span style={{fontSize:12,color:"#58a6ff",fontWeight:600}}>{vtypeInfo.label} — </span>
        <span style={{fontSize:11,color:"#8B949E"}}>{vtype==="RECEIPT"?"Dr = Cash/Bank received, Cr = Income/Party":vtype==="PAYMENT"?"Cr = Cash/Bank paid from, Dr = Expense/Vendor":vtype==="CONTRA"?"Dr = Account receiving cash, Cr = Account giving cash":"Dr and Cr must balance. Enter amount once and select Dr or Cr."}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={S.label}>Date *</label><input style={S.input} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
        <div><label style={S.label}>Ref / Cheque No</label><input style={S.input} placeholder="Optional" value={form.ref_no} onChange={e=>setForm(p=>({...p,ref_no:e.target.value}))}/></div>
        <div><label style={S.label}>Party Name</label><input style={S.input} placeholder="Customer / Vendor" value={form.party_name} onChange={e=>setForm(p=>({...p,party_name:e.target.value}))}/></div>
        <div><label style={S.label}>Narration</label><input style={S.input} placeholder="Brief description" value={form.narration} onChange={e=>setForm(p=>({...p,narration:e.target.value}))}/></div>
      </div>
      <div style={{background:"#0D1117",borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <span style={{color:"#8B949E",fontSize:12}}>Total Dr:</span><span style={{color:"#3fb950",fontWeight:700,fontSize:14}}>{fR(totalDr)}</span>
        <span style={{color:"#8B949E",fontSize:12}}>Total Cr:</span><span style={{color:"#f85149",fontWeight:700,fontSize:14}}>{fR(totalCr)}</span>
        <span style={{color:"#8B949E",fontSize:12}}>Difference:</span><span style={{color:balanced?"#3fb950":"#f85149",fontWeight:700,fontSize:14}}>{balanced?"✅ Balanced":fR(diff)+" ⚠"}</span>
        {!balanced&&totalDr>0&&<span style={{fontSize:11,color:"#e3b341",marginLeft:"auto"}}>Add <b>{fR(diff)}</b> more to <b>{totalDr<totalCr?"Dr":"Cr"}</b> side</span>}
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={S.tbl}><thead><tr>
          <th style={{...S.th,width:30}}>#</th>
          <th style={S.th}>Ledger Account</th>
          <th style={{...S.th,width:130}}>Amount (Rs.)</th>
          <th style={{...S.th,width:140,textAlign:"center"}}>Dr / Cr</th>
          <th style={S.th}>Narration</th>
          <th style={{...S.th,width:40}}></th>
        </tr></thead>
        <tbody>{rows.map((row,i)=>(<tr key={i} style={{background:row.entry_type==="Dr"?"rgba(63,185,80,0.04)":"rgba(248,81,73,0.04)"}}>
          <td style={{...S.td,color:"#8B949E",fontWeight:700,textAlign:"center"}}>{i+1}</td>
          <td style={S.td}><select value={row.ledger_id} onChange={e=>setRow(i,"ledger_id",e.target.value)} style={{...S.select,fontSize:12}}>
            <option value="">— Select Ledger Account —</option>
            {["Asset","Liability","Income","Expense"].map(n=>(<optgroup key={n} label={`── ${n} ──`}>{ledgers.filter(l=>l.nature===n).map(l=>(<option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>))}</optgroup>))}
          </select></td>
          <td style={S.td}><input style={{...S.input,textAlign:"right",fontWeight:600,fontSize:14,color:row.entry_type==="Dr"?"#3fb950":"#f85149"}} type="number" placeholder="0.00" value={row.amount} onChange={e=>setRow(i,"amount",e.target.value)}/></td>
          <td style={{...S.td,textAlign:"center"}}><div style={{display:"flex",gap:6,justifyContent:"center"}}>
            {["Dr","Cr"].map(t=>(<button key={t} onClick={()=>setRow(i,"entry_type",t)} style={{padding:"6px 18px",borderRadius:8,border:"2px solid",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,minWidth:52,borderColor:row.entry_type===t?(t==="Dr"?"#238636":"#c0392b"):"#30363D",background:row.entry_type===t?(t==="Dr"?"#0d2818":"#2d0e0e"):"transparent",color:row.entry_type===t?(t==="Dr"?"#3fb950":"#f85149"):"#8B949E"}}>{t}</button>))}
          </div></td>
          <td style={S.td}><input style={{...S.input,fontSize:11}} placeholder="Line narration" value={row.narration} onChange={e=>setRow(i,"narration",e.target.value)}/></td>
          <td style={{...S.tdL,textAlign:"center"}}><button onClick={()=>removeRow(i)} disabled={rows.length<=2} style={{background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:18,opacity:rows.length<=2?0.3:1}}>✕</button></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:"flex",gap:10,marginTop:12,alignItems:"center"}}>
        <button onClick={addRow} style={S.btnGhost}>+ Add Row</button>
        <button onClick={()=>{setForm({date:todayStr(),ref_no:"",narration:"",party_name:""});setRows([{ledger_id:"",amount:"",entry_type:"Dr",narration:""},{ledger_id:"",amount:"",entry_type:"Cr",narration:""}]);}} style={S.btnGhost}>Clear</button>
        <div style={{flex:1}}/>
        <button onClick={save} disabled={saving||!balanced} style={{...S.btnG,minWidth:180,padding:"11px 24px",fontSize:14,opacity:saving||!balanced?0.5:1,cursor:!balanced?"not-allowed":"pointer"}}>
          {saving?"💾 Saving...":balanced?`💾 Save ${vtypeInfo.label.split(": ")[1]||vtypeInfo.label}`:`Balance First (${fR(diff)})`}
        </button>
      </div>
    </div>)}
    {viewMode==="list"&&(<div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {["all","CONTRA","PAYMENT","RECEIPT","JOURNAL","SALES","PURCHASE"].map(t=>(<button key={t} onClick={()=>setFilterType(t)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderColor:filterType===t?"#58a6ff":"#30363D",background:filterType===t?"#0c1d2e":"transparent",color:filterType===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t}</button>))}
        <button onClick={loadVouchers} style={{...S.btnGhost,marginLeft:"auto",fontSize:11}}>🔄 Refresh</button>
      </div>
      {loading?<Spinner/>:(<div style={S.card}>{vouchers.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No vouchers yet.</div>:(
        <table style={S.tbl}><thead><tr>{["Voucher No","Date","Type","Party","Narration","Amount","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{vouchers.map(v=>(<tr key={v.id}>
          <td style={{...S.td,color:"#58a6ff",cursor:"pointer",fontWeight:600}} onClick={async()=>{try{const d=await api(`/accounting/companies/${companyId}/vouchers/${v.id}`,"GET",null,token);setViewing(d.voucher);}catch(e){toast(e.message,"error");}}}>{v.voucher_no}</td>
          <td style={S.td}>{v.date}</td><td style={S.td}>{badge(v.voucher_type,"gray")}</td>
          <td style={{...S.td,maxWidth:130}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.party_name||"—"}</div></td>
          <td style={{...S.td,color:"#8B949E",maxWidth:160}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.narration||"—"}</div></td>
          <td style={{...S.td,fontWeight:600,color:"#3fb950"}}>{fR(v.total_amount)}</td>
          <td style={S.tdL}><div style={{display:"flex",gap:4}}><button onClick={()=>cancelVoucher(v.id)} style={{...S.btnAmber,fontSize:11,padding:"4px 8px"}}>Cancel</button><button onClick={()=>deleteVoucher(v.id)} style={{...S.btnDanger,fontSize:11,padding:"4px 8px"}}>Del</button></div></td>
        </tr>))}</tbody></table>
      )}</div>)}
    </div>)}
    {viewing&&(<Modal title={`Voucher — ${viewing.voucher_no}`} onClose={()=>setViewing(null)} wide>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>{badge(viewing.voucher_type,"blue")} {badge(viewing.date,"gray")}{viewing.party_name&&badge(viewing.party_name,"gray")}<span style={{marginLeft:"auto",color:"#E6EDF3",fontWeight:700,fontSize:15}}>{fR(viewing.total_amount)}</span></div>
      {viewing.narration&&<div style={{fontSize:12,color:"#8B949E",marginBottom:12,padding:"8px 12px",background:"#0D1117",borderRadius:6}}>📝 {viewing.narration}</div>}
      <table style={S.tbl}><thead><tr>{["#","Ledger Account","Group","Dr Amount","Cr Amount"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{(viewing.items||[]).map((item,i)=>(<tr key={i}><td style={{...S.td,color:"#8B949E",textAlign:"center"}}>{i+1}</td><td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{item.ledger_name}</td><td style={S.td}>{item.group_name}</td><td style={{...S.td,color:"#3fb950",fontWeight:item.dr_amount>0?700:400}}>{item.dr_amount>0?fR(item.dr_amount):"—"}</td><td style={{...S.tdL,color:"#f85149",fontWeight:item.cr_amount>0?700:400}}>{item.cr_amount>0?fR(item.cr_amount):"—"}</td></tr>))}</tbody>
      <tfoot><tr><td colSpan={3} style={{...S.td,fontWeight:700,textAlign:"right"}}>Total</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR((viewing.items||[]).reduce((a,i)=>a+parseFloat(i.dr_amount||0),0))}</td><td style={{...S.tdL,color:"#f85149",fontWeight:700}}>{fR((viewing.items||[]).reduce((a,i)=>a+parseFloat(i.cr_amount||0),0))}</td></tr></tfoot>
      </table>
    </Modal>)}
  </div>);
}

function AccountingReports({token,toast,companyId}){
  const[rtype,setRtype]=useState("trial-balance");const[fromDate,setFromDate]=useState(new Date(new Date().getFullYear(),3,1).toISOString().split("T")[0]);const[toDate,setToDate]=useState(todayStr());const[asOnDate,setAsOnDate]=useState(todayStr());const[data,setData]=useState(null);const[loading,setLoading]=useState(false);
  const fR=n=>`Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;
  const NC={Asset:"green",Liability:"red",Income:"teal",Expense:"amber"};
  const load=async()=>{setLoading(true);setData(null);try{let url=`/accounting/companies/${companyId}/reports/${rtype}`;if(rtype==="balance-sheet")url+=`?as_on_date=${asOnDate}`;else if(rtype==="day-book")url+=`?date=${asOnDate}`;else url+=`?from_date=${fromDate}&to_date=${toDate}`;const d=await api(url,"GET",null,token);setData(d);}catch(e){toast(e.message,"error");}setLoading(false);};
  const printR=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>${rtype}</title><style>body{font-family:Arial;margin:20px;font-size:12px;}h2{color:#1F6FEB;}table{width:100%;border-collapse:collapse;margin:10px 0;}th,td{border:1px solid #ddd;padding:7px;}th{background:#1F6FEB;color:white;}.green{color:green;}.red{color:red;}.total{font-weight:bold;background:#f5f5f5;}</style></head><body><h2>TaxPro — ${rtype.replace(/-/g," ").toUpperCase()}</h2><p>Period: ${fromDate} to ${toDate}</p>${document.getElementById("acc-rpt")?.innerHTML||""}</body></html>`);w.document.close();w.print();};
  const REPORTS=[{k:"trial-balance",l:"Trial Balance"},{k:"profit-loss",l:"Profit & Loss"},{k:"balance-sheet",l:"Balance Sheet"},{k:"day-book",l:"Day Book"},{k:"cash-book",l:"Cash Book"}];
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <select style={{...S.select,width:"auto"}} value={rtype} onChange={e=>setRtype(e.target.value)}>{REPORTS.map(r=><option key={r.k} value={r.k}>{r.l}</option>)}</select>
      {(rtype==="balance-sheet"||rtype==="day-book")?(<><label style={{...S.label,marginBottom:0,color:"#8B949E"}}>As on:</label><input type="date" style={{...S.input,width:160}} value={asOnDate} onChange={e=>setAsOnDate(e.target.value)}/></>):(<><input type="date" style={{...S.input,width:150}} value={fromDate} onChange={e=>setFromDate(e.target.value)}/><span style={{color:"#8B949E"}}>to</span><input type="date" style={{...S.input,width:150}} value={toDate} onChange={e=>setToDate(e.target.value)}/></>)}
      <button onClick={load} style={S.btn}>Generate</button>{data&&<button onClick={printR} style={S.btnG}>🖨 Print</button>}
    </div>
    {loading&&<Spinner/>}
    <div id="acc-rpt">
      {data&&rtype==="trial-balance"&&(<div>
        <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>{badge(data.totals?.balanced?"Balanced ✓":"Not Balanced ⚠",data.totals?.balanced?"green":"red")}<span style={{color:"#8B949E",fontSize:12}}>Dr: <span style={{color:"#3fb950",fontWeight:700}}>{fR(data.totals?.dr)}</span> &nbsp; Cr: <span style={{color:"#f85149",fontWeight:700}}>{fR(data.totals?.cr)}</span></span></div>
        <div style={S.card}><table style={S.tbl}><thead><tr>{["Ledger","Group","Nature","Dr Amount","Cr Amount"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(data.rows||[]).map((r,i)=>(<tr key={i}><td style={{...S.td,fontWeight:600,color:"#E6EDF3"}}>{r.name}</td><td style={S.td}>{r.group}</td><td style={S.td}>{badge(r.nature,NC[r.nature]||"gray")}</td><td style={{...S.td,color:"#3fb950",fontWeight:r.dr_amount>0?700:400}}>{r.dr_amount>0?fR(r.dr_amount):"—"}</td><td style={{...S.tdL,color:"#f85149",fontWeight:r.cr_amount>0?700:400}}>{r.cr_amount>0?fR(r.cr_amount):"—"}</td></tr>))}</tbody>
        <tfoot><tr><td colSpan={3} style={{...S.td,fontWeight:700}}>TOTAL</td><td style={{...S.td,color:"#3fb950",fontWeight:700}}>{fR(data.totals?.dr)}</td><td style={{...S.tdL,color:"#f85149",fontWeight:700}}>{fR(data.totals?.cr)}</td></tr></tfoot></table></div>
      </div>)}
      {data&&rtype==="profit-loss"&&data.report&&(<div>
        <div style={S.twoCol}>
          <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#3fb950",marginBottom:10}}>INCOME / REVENUE</div>
            {data.report.sales?.length>0&&<><div style={{fontSize:11,color:"#8B949E",marginBottom:4,fontWeight:600}}>Sales Accounts</div>{data.report.sales.map((s,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#C9D1D9",fontSize:12}}>{s.name}</span><span style={{color:"#3fb950",fontWeight:600}}>{fR(s.amount)}</span></div>))}</>}
            {data.report.indirect_income?.length>0&&<><div style={{fontSize:11,color:"#8B949E",marginTop:8,marginBottom:4,fontWeight:600}}>Other Income</div>{data.report.indirect_income.map((s,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#C9D1D9",fontSize:12}}>{s.name}</span><span style={{color:"#3fb950",fontWeight:600}}>{fR(s.amount)}</span></div>))}</>}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,borderTop:"2px solid #30363D",marginTop:4}}><span>Total Income</span><span style={{color:"#3fb950"}}>{fR(data.report.total_income)}</span></div>
          </div>
          <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#f85149",marginBottom:10}}>EXPENSES</div>
            {data.report.purchase?.length>0&&<><div style={{fontSize:11,color:"#8B949E",marginBottom:4,fontWeight:600}}>Purchase Accounts</div>{data.report.purchase.map((s,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#C9D1D9",fontSize:12}}>{s.name}</span><span style={{color:"#f85149",fontWeight:600}}>{fR(s.amount)}</span></div>))}</>}
            {data.report.indirect_expenses?.length>0&&<><div style={{fontSize:11,color:"#8B949E",marginTop:8,marginBottom:4,fontWeight:600}}>Other Expenses</div>{data.report.indirect_expenses.map((s,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#C9D1D9",fontSize:12}}>{s.name}</span><span style={{color:"#f85149",fontWeight:600}}>{fR(s.amount)}</span></div>))}</>}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,borderTop:"2px solid #30363D",marginTop:4}}><span>Total Expense</span><span style={{color:"#f85149"}}>{fR(data.report.total_expense)}</span></div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-around",padding:20,...S.card,background:data.report.net_profit>=0?"#0d2818":"#2d0e0e",border:`1px solid ${data.report.net_profit>=0?"#238636":"#6e1c1c"}`}}>
          <div style={{textAlign:"center"}}><div style={S.kpiLabel}>Gross Profit</div><div style={{fontSize:22,fontWeight:800,color:data.report.gross_profit>=0?"#3fb950":"#f85149"}}>{fR(data.report.gross_profit)}</div></div>
          <div style={{borderLeft:"1px solid #30363D"}}/>
          <div style={{textAlign:"center"}}><div style={S.kpiLabel}>Net Profit / Loss</div><div style={{fontSize:28,fontWeight:800,color:data.report.net_profit>=0?"#3fb950":"#f85149"}}>{fR(data.report.net_profit)}</div></div>
        </div>
      </div>)}
      {data&&rtype==="balance-sheet"&&(<div>
        <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>{badge(`As on: ${data.as_on_date}`,"blue")}{badge(Math.abs(data.difference||0)<0.01?"Balanced ✓":"Check Balance",Math.abs(data.difference||0)<0.01?"green":"red")}</div>
        <div style={S.twoCol}>
          <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#58a6ff",marginBottom:10}}>ASSETS</div>
            {(data.assets||[]).map((a,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D"}}><div><div style={{fontSize:12,fontWeight:500,color:"#E6EDF3"}}>{a.name}</div><div style={{fontSize:10,color:"#8B949E"}}>{a.group}</div></div><span style={{color:"#58a6ff",fontWeight:600}}>{fR(a.balance)} <span style={{fontSize:10}}>{a.balance_type}</span></span></div>))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,borderTop:"2px solid #30363D",marginTop:4}}><span>Total Assets</span><span style={{color:"#58a6ff"}}>{fR(data.total_assets)}</span></div>
          </div>
          <div style={S.card}><div style={{fontSize:13,fontWeight:700,color:"#f85149",marginBottom:10}}>LIABILITIES</div>
            {(data.liabilities||[]).map((l,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D"}}><div><div style={{fontSize:12,fontWeight:500,color:"#E6EDF3"}}>{l.name}</div><div style={{fontSize:10,color:"#8B949E"}}>{l.group}</div></div><span style={{color:"#f85149",fontWeight:600}}>{fR(l.balance)} <span style={{fontSize:10}}>{l.balance_type}</span></span></div>))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,borderTop:"2px solid #30363D",marginTop:4}}><span>Total Liabilities</span><span style={{color:"#f85149"}}>{fR(data.total_liabilities)}</span></div>
          </div>
        </div>
      </div>)}
      {data&&rtype==="day-book"&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>{[{l:"Vouchers",v:data.summary?.total_vouchers,c:"#58a6ff"},{l:"Total Dr",v:fR(data.summary?.total_dr),c:"#3fb950"},{l:"Total Cr",v:fR(data.summary?.total_cr),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l==="Vouchers"?22:14,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>
        <div style={S.card}>{data.vouchers?.length===0?<div style={{textAlign:"center",padding:30,color:"#8B949E"}}>No vouchers on {asOnDate}</div>:data.vouchers?.map(v=>(<div key={v.id} style={{marginBottom:14,paddingBottom:12,borderBottom:"1px solid #21262D"}}><div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{color:"#58a6ff",fontWeight:700}}>{v.voucher_no}</span>{badge(v.voucher_type,"gray")}{v.party_name&&<span style={{color:"#8B949E",fontSize:11}}>{v.party_name}</span>}{v.narration&&<span style={{color:"#8B949E",fontSize:11,marginLeft:"auto"}}>{v.narration}</span>}</div><table style={S.tbl}><tbody>{(v.items||[]).map((item,i)=>(<tr key={i}><td style={S.td}>{item.ledger_name}</td><td style={{...S.td,color:"#3fb950"}}>{item.dr_amount>0?fR(item.dr_amount):"—"}</td><td style={{...S.tdL,color:"#f85149"}}>{item.cr_amount>0?fR(item.cr_amount):"—"}</td></tr>))}</tbody></table></div>))}</div>
      </div>)}
      {data&&rtype==="cash-book"&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Opening",v:fR(data.summary?.opening),c:"#8B949E"},{l:"Total Receipts (Dr)",v:fR(data.summary?.total_receipts),c:"#3fb950"},{l:"Total Payments (Cr)",v:fR(data.summary?.total_payments),c:"#f85149"},{l:"Closing Balance",v:`${fR(data.summary?.closing)} ${data.summary?.closing_type}`,c:"#e3b341"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:13,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>
        <div style={S.card}><table style={S.tbl}><thead><tr>{["Date","Voucher No","Type","Narration/Party","Receipt (Dr)","Payment (Cr)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(data.transactions||[]).map((t,i)=>(<tr key={i}><td style={S.td}>{t.date}</td><td style={{...S.td,color:"#58a6ff"}}>{t.voucher_no}</td><td style={S.td}>{badge(t.voucher_type,"gray")}</td><td style={{...S.td,color:"#8B949E"}}>{t.v_narration||t.party_name||"—"}</td><td style={{...S.td,color:"#3fb950",fontWeight:t.dr_amount>0?700:400}}>{t.dr_amount>0?fR(t.dr_amount):"—"}</td><td style={{...S.tdL,color:"#f85149",fontWeight:t.cr_amount>0?700:400}}>{t.cr_amount>0?fR(t.cr_amount):"—"}</td></tr>))}{!data.transactions?.length&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#8B949E",padding:20}}>No cash transactions</td></tr>}</tbody></table></div>
      </div>)}
    </div>
  </div>);
}

function AccountingShell({token,toast,activeView}){
  const[company,setCompany]=useState(()=>{try{return JSON.parse(localStorage.getItem("taxpro_company"));}catch{return null;}});
  const selectCompany=c=>{setCompany(c);localStorage.setItem("taxpro_company",JSON.stringify(c));};
  if(activeView==="acc-companies")return<CompanyManager token={token} toast={toast} onSelect={selectCompany} selectedCompany={company}/>;
  if(!company)return(<div style={{...S.card,textAlign:"center",padding:50}}><div style={{fontSize:48,marginBottom:12}}>🏢</div><div style={{fontSize:16,fontWeight:700,color:"#E6EDF3",marginBottom:8}}>No Company Selected</div><div style={{color:"#8B949E",fontSize:13,marginBottom:20}}>Go to "Companies" in the sidebar to create or select a company.</div></div>);
  return(<div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>📊 {company.name}</span>
      <span style={{fontSize:11,color:"#8B949E"}}>FY: {company.fy_start?.substring(0,4)}–{company.fy_end?.substring(0,4)}</span>
      {company.gstin&&<span style={{fontFamily:"monospace",fontSize:11,color:"#8B949E"}}>{company.gstin}</span>}
      <button onClick={()=>{setCompany(null);localStorage.removeItem("taxpro_company");}} style={{...S.btnGhost,fontSize:11,padding:"4px 10px",marginLeft:"auto"}}>Change Company</button>
    </div>
    {activeView==="acc-groups"   &&<LedgerGroups      token={token} toast={toast} companyId={company.id}/>}
    {activeView==="acc-ledgers"  &&<LedgerManager     token={token} toast={toast} companyId={company.id}/>}
    {activeView==="acc-vouchers" &&<VoucherEntry      token={token} toast={toast} companyId={company.id}/>}
    {activeView==="acc-reports"  &&<AccountingReports token={token} toast={toast} companyId={company.id}/>}
  </div>);
}

const NAV=[
  {key:"dashboard",    icon:"🏠",label:"Dashboard",           group:"MAIN"},
  {key:"sales",        icon:"📄",label:"Sales Invoices",       group:"ACCOUNTING"},
  {key:"purchases",    icon:"🧾",label:"Purchase Bills",       group:"ACCOUNTING"},
  {key:"parties",      icon:"👥",label:"Parties",              group:"ACCOUNTING"},
  {key:"products",     icon:"📦",label:"Products & Stock",     group:"ACCOUNTING"},
  {key:"bank",         icon:"🏦",label:"Bank Statement",       group:"ACCOUNTING"},
  {key:"reports",      icon:"📈",label:"Reports",              group:"ACCOUNTING"},
  {key:"gst-clients",  icon:"🏢",label:"GST Clients",          group:"GST"},
  {key:"notices",      icon:"🔔",label:"Notice Manager",       group:"GST"},
  {key:"returns",      icon:"📋",label:"Return Tracker",       group:"GST"},
  {key:"reconcile",    icon:"⇄", label:"Reconciliation",       group:"GST"},
  {key:"gstr2a",       icon:"📥",label:"GSTR-2A Import",       group:"GST"},
  {key:"gstr3b",       icon:"📑",label:"GSTR-3B",              group:"GST FILING"},
  {key:"gstr1",        icon:"📤",label:"GSTR-1",               group:"GST FILING"},
  {key:"einvoice",     icon:"🔖",label:"E-Invoice",            group:"GST FILING"},
  {key:"ewaybill",     icon:"🚛",label:"E-Way Bill",           group:"GST FILING"},
  {key:"acc-companies",icon:"🏗", label:"Companies",           group:"TALLY"},
  {key:"acc-groups",   icon:"🗂", label:"Chart of Accounts",   group:"TALLY"},
  {key:"acc-ledgers",  icon:"📒",label:"Ledgers",              group:"TALLY"},
  {key:"acc-vouchers", icon:"✏", label:"Voucher Entry",        group:"TALLY"},
  {key:"acc-reports",  icon:"📊",label:"Accounting Reports",   group:"TALLY"},
  {key:"calculator",   icon:"🧮",label:"GST Calculator",       group:"TOOLS"},
  {key:"calendar",     icon:"📅",label:"Due Date Calendar",    group:"TOOLS"},
  {key:"reply",        icon:"✍", label:"Notice Reply AI",      group:"TOOLS"},
  {key:"ai",           icon:"✦", label:"AI Assistant",         group:"TOOLS"},
  {key:"settings",     icon:"⚙", label:"Settings",             group:"ACCOUNT"},
];

const TITLES={
  dashboard:"Dashboard",
  sales:"Sales Invoices",purchases:"Purchase Bills",parties:"Parties & Customers",
  products:"Products & Stock",bank:"Bank Statement Import",reports:"Reports & Analytics",
  "gst-clients":"GST Clients",notices:"Notice Manager",returns:"Return Filing Tracker",
  reconcile:"GST Reconciliation",gstr2a:"GSTR-2A Import",
  gstr3b:"GSTR-3B Summary Return",gstr1:"GSTR-1 Outward Supplies",
  einvoice:"E-Invoice Generation",ewaybill:"E-Way Bill",
  "acc-companies":"Companies","acc-groups":"Chart of Accounts",
  "acc-ledgers":"Ledger Manager","acc-vouchers":"Voucher Entry (F4–F9)",
  "acc-reports":"Accounting Reports",
  calculator:"GST Calculator",calendar:"Compliance Calendar",
  reply:"Notice Reply Generator",ai:"AI Assistant",settings:"Settings",
};

export default function App(){
  const[user,setUser]   =useState(()=>{try{return JSON.parse(localStorage.getItem("taxpro_user"));}catch{return null;}});
  const[token,setToken] =useState(()=>localStorage.getItem("taxpro_token")||"");
  const[view,setView]   =useState("dashboard");
  const[toast,setToast] =useState(null);
  const[collapsed,setCollapsed]=useState(false);
  const[accentColor,setAccentColor]=useState(()=>localStorage.getItem("taxpro_accent")||"#1F6FEB");

  useEffect(()=>{localStorage.setItem("taxpro_accent",accentColor);},[accentColor]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4500);};
  const logout=()=>{localStorage.removeItem("taxpro_token");localStorage.removeItem("taxpro_user");localStorage.removeItem("taxpro_company");setUser(null);setToken("");};
  const onAuth=(u,t)=>{setUser(u);setToken(t);};

  if(!user||!token) return <AuthScreen onAuth={onAuth}/>;

  const ACC_VIEWS=["acc-companies","acc-groups","acc-ledgers","acc-vouchers","acc-reports"];
  const isAcc=ACC_VIEWS.includes(view);

  return(
    <div style={S.app}>
      {/* ── SIDEBAR ── */}
      <aside style={{...S.sidebar,width:collapsed?58:220,minWidth:collapsed?58:220,transition:"width 0.2s"}}>
        <div style={{padding:"12px",borderBottom:"1px solid #21262D",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {!collapsed&&<div><div style={{fontSize:15,fontWeight:800,color:"#E6EDF3"}}>🛡️ TaxPro</div><div style={{fontSize:10,color:"#8B949E"}}>Complete Suite v4.0</div></div>}
          <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:18,padding:4,marginLeft:collapsed?"auto":0}}>{collapsed?"▶":"◀"}</button>
        </div>
        <nav style={{flex:1,padding:"4px 0",overflowY:"auto"}}>
          {["MAIN","ACCOUNTING","GST","GST FILING","TALLY","TOOLS","ACCOUNT"].map(g=>(
            <div key={g}>
              {!collapsed&&<div style={{fontSize:9,color:"#444C56",padding:"8px 12px 2px",letterSpacing:1,fontWeight:600}}>
                {g==="TALLY"?"TALLY ACCOUNTING":g==="GST FILING"?"GST FILING":g==="ACCOUNT"?"MY ACCOUNT":g}
              </div>}
              {NAV.filter(n=>n.group===g).map(n=>(
                <button key={n.key} onClick={()=>setView(n.key)} title={collapsed?n.label:""} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:collapsed?"8px 0":"7px 12px",border:"none",background:view===n.key?"rgba(31,111,235,0.12)":"transparent",borderLeft:view===n.key?`2px solid ${accentColor}`:"2px solid transparent",color:view===n.key?"#58a6ff":"#8B949E",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:view===n.key?600:400,textAlign:"left",justifyContent:collapsed?"center":"flex-start",transition:"all 0.15s"}}>
                  <span style={{fontSize:15,flexShrink:0}}>{n.icon}</span>
                  {!collapsed&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed&&(
          <div style={{padding:"10px 12px",borderTop:"1px solid #21262D"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#E6EDF3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.firm_name||user.name}</div>
            <div style={{fontSize:10,color:"#8B949E",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button onClick={()=>setView("settings")} style={{...S.btnGhost,flex:1,fontSize:11,padding:"5px"}}>⚙ Settings</button>
              <button onClick={logout} style={{...S.btnDanger,flex:1,fontSize:11,padding:"5px"}}>Logout</button>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div style={S.main}>
        <div style={S.topbar}>
          <span style={{fontSize:14,fontWeight:600,color:"#E6EDF3"}}>{TITLES[view]||view}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#8B949E"}}>Welcome, {user.name}</span>
            {badge("Live","green")}
            <button onClick={()=>setView("settings")} title="Settings" style={{background:"none",border:"none",color:"#8B949E",cursor:"pointer",fontSize:16,padding:"2px 6px"}}>⚙</button>
          </div>
        </div>
        <div style={S.content}>
          {view==="dashboard"   &&<Dashboard       token={token}/>}
          {view==="sales"       &&<InvoiceList     token={token} toast={showToast} type="SALES"/>}
          {view==="purchases"   &&<InvoiceList     token={token} toast={showToast} type="PURCHASE"/>}
          {view==="parties"     &&<Parties         token={token} toast={showToast}/>}
          {view==="products"    &&<Products        token={token} toast={showToast}/>}
          {view==="bank"        &&<BankStatement   token={token} toast={showToast}/>}
          {view==="reports"     &&<Reports         token={token}/>}
          {view==="gst-clients" &&<GSTClients      token={token} toast={showToast}/>}
          {view==="notices"     &&<Notices         token={token} toast={showToast}/>}
          {view==="returns"     &&<Returns         token={token} toast={showToast}/>}
          {view==="reconcile"   &&<Reconciliation  token={token} toast={showToast}/>}
          {view==="gstr2a"      &&<GSTR2AImport    token={token} toast={showToast}/>}
          {view==="gstr3b"      &&<GSTR3B          token={token} toast={showToast}/>}
          {view==="gstr1"       &&<GSTR1           token={token} toast={showToast}/>}
          {view==="einvoice"    &&<EInvoice        token={token} toast={showToast}/>}
          {view==="ewaybill"    &&<EWayBill        token={token} toast={showToast}/>}
          {isAcc                &&<AccountingShell token={token} toast={showToast} activeView={view}/>}
          {view==="calculator"  &&<GSTCalculator/>}
          {view==="calendar"    &&<ComplianceCalendar/>}
          {view==="reply"       &&<NoticeReply     token={token}/>}
          {view==="ai"          &&<AIAssistant     token={token}/>}
          {view==="settings"    &&<Settings        token={token} user={user} toast={showToast} onLogout={logout} accentColor={accentColor} setAccentColor={setAccentColor}/>}
        </div>
      </div>

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}