import { useState, useRef, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API || "https://taxpro-backend-xi90.onrender.com/api";

const api = async (path, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const fmtMoney = (n) => `Rs.${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split("T")[0];

// ── Styles ─────────────────────────────────────────────────────────────────
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
  kpiVal:   { fontSize:22, fontWeight:700, lineHeight:1, color:"#E6EDF3" },
  tbl:      { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:       { textAlign:"left", padding:"8px 10px", color:"#8B949E", borderBottom:"1px solid #21262D", fontWeight:500, fontSize:11 },
  td:       { padding:"8px 10px", borderBottom:"1px solid #21262D", color:"#C9D1D9", verticalAlign:"middle" },
  tdL:      { padding:"8px 10px", color:"#C9D1D9", verticalAlign:"middle" },
  mono:     { fontFamily:"monospace", fontSize:11, color:"#8B949E" },
  twoCol:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  input:    { padding:"9px 12px", borderRadius:8, border:"1px solid #30363D", background:"#0D1117", color:"#C9D1D9", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
  select:   { padding:"7px 10px", borderRadius:8, border:"1px solid #30363D", background:"#161B22", color:"#C9D1D9", fontSize:12, fontFamily:"inherit", width:"100%" },
  btn:      { padding:"9px 18px", borderRadius:8, border:"none", background:"#1F6FEB", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" },
  btnG:     { padding:"9px 18px", borderRadius:8, border:"none", background:"#238636", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" },
  btnGhost: { padding:"7px 14px", borderRadius:8, border:"1px solid #30363D", background:"transparent", color:"#8B949E", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  btnDanger:{ padding:"7px 14px", borderRadius:8, border:"1px solid #6e1c1c", background:"transparent", color:"#f85149", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  label:    { fontSize:12, color:"#8B949E", display:"block", marginBottom:5 },
  fg:       { marginBottom:14 },
  aiWrap:   { display:"flex", flexDirection:"column", height:"calc(100vh - 100px)" },
  aiMsgs:   { flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10 },
  bubU:     { background:"#1F6FEB", color:"#fff", padding:"9px 13px", borderRadius:"16px 16px 4px 16px", maxWidth:"75%", marginLeft:"auto", lineHeight:1.6, whiteSpace:"pre-wrap" },
  bubA:     { background:"#21262D", border:"1px solid #30363D", color:"#C9D1D9", padding:"9px 13px", borderRadius:"16px 16px 16px 4px", maxWidth:"80%", lineHeight:1.6, whiteSpace:"pre-wrap" },
};

const badge = (txt, color) => {
  const map = { green:{bg:"#0d2818",color:"#3fb950",border:"#238636"}, amber:{bg:"#2d1b00",color:"#e3b341",border:"#9e6a03"}, red:{bg:"#2d0e0e",color:"#f85149",border:"#6e1c1c"}, blue:{bg:"#0c1d2e",color:"#58a6ff",border:"#1f4872"}, gray:{bg:"#21262D",color:"#8b949e",border:"#30363D"}, purple:{bg:"#1a0a2e",color:"#bf91f3",border:"#6e40c9"} };
  const c = map[color] || map.gray;
  return <span style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{txt}</span>;
};

const StatusBadge = ({ s }) => {
  const m = { compliant:["Compliant","green"], pending:["Pending","amber"], notice:["Notice","red"], overdue:["Overdue","red"], paid:["Paid","green"], unpaid:["Unpaid","red"], partial:["Partial","amber"], filed:["Filed","green"], "not-filed":["Not Filed","red"] };
  const [l, c] = m[s] || [s, "gray"];
  return badge(l, c);
};

const Spinner = () => (<div style={{ display:"flex", justifyContent:"center", padding:40 }}><div style={{ width:28, height:28, border:"3px solid #21262D", borderTop:"3px solid #1F6FEB", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Toast = ({ msg, type, onClose }) => (<div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:type==="error"?"#2d0e0e":"#0d2818", border:`1px solid ${type==="error"?"#6e1c1c":"#238636"}`, color:type==="error"?"#f85149":"#3fb950", padding:"12px 18px", borderRadius:10, fontSize:13, maxWidth:340, display:"flex", alignItems:"center", gap:10 }}><span>{msg}</span><button onClick={onClose} style={{ background:"none", border:"none", color:"inherit", cursor:"pointer", fontSize:16, marginLeft:"auto" }}>✕</button></div>);
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:30, overflowY:"auto" }}>
    <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:12, padding:24, width:wide ? "min(860px,96vw)" : "min(560px,92vw)", maxHeight:"90vh", overflowY:"auto", margin:"0 auto 30px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <span style={{ fontSize:15, fontWeight:600, color:"#E6EDF3" }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#8B949E", cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── AUTH ───────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", firm_name:"", frn:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const body = tab === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, firm_name: form.firm_name, frn: form.frn };
      const data = await api(endpoint, "POST", body);
      localStorage.setItem("taxpro_token", data.token);
      localStorage.setItem("taxpro_user", JSON.stringify(data.user));
      onAuth(data.user, data.token);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0D1117", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:"min(420px,92vw)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:6 }}>🛡️</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#E6EDF3" }}>TaxPro GST</div>
          <div style={{ fontSize:13, color:"#8B949E", marginTop:4 }}>Complete Accounting + GST Software for CAs</div>
        </div>
        <div style={{ background:"#161B22", border:"1px solid #21262D", borderRadius:14, padding:28 }}>
          <div style={{ display:"flex", gap:4, marginBottom:22, background:"#0D1117", borderRadius:10, padding:4 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"9px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, background:tab===t?"#1F6FEB":"transparent", color:tab===t?"#fff":"#8B949E" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          {tab === "register" && <>
            <div style={S.fg}><label style={S.label}>Full Name *</label><input style={S.input} placeholder="CA Rahul Prakash" value={form.name} onChange={set("name")} /></div>
            <div style={S.fg}><label style={S.label}>Firm Name *</label><input style={S.input} placeholder="Prakash & Associates" value={form.firm_name} onChange={set("firm_name")} /></div>
            <div style={S.fg}><label style={S.label}>FRN (optional)</label><input style={S.input} placeholder="001234N" value={form.frn} onChange={set("frn")} /></div>
          </>}
          <div style={S.fg}><label style={S.label}>Email *</label><input style={S.input} type="email" placeholder="you@firm.com" value={form.email} onChange={set("email")} onKeyDown={e => e.key==="Enter" && submit()} /></div>
          <div style={S.fg}><label style={S.label}>Password *</label><input style={S.input} type="password" placeholder="min 6 characters" value={form.password} onChange={set("password")} onKeyDown={e => e.key==="Enter" && submit()} /></div>
          {error && <div style={{ background:"#2d0e0e", border:"1px solid #6e1c1c", color:"#f85149", padding:"10px 14px", borderRadius:8, fontSize:12, marginBottom:14 }}>⚠️ {error}</div>}
          <button onClick={submit} disabled={loading} style={{ ...S.btn, width:"100%", padding:"12px", opacity:loading?0.6:1 }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In →" : "Create Account"}
          </button>
          {tab === "login" && <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#8B949E" }}>New user? Click <span style={{ color:"#58a6ff", cursor:"pointer" }} onClick={() => setTab("register")}>Register</span></div>}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ token }) {
  const [gst, setGst] = useState(null);
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/dashboard", "GET", null, token).catch(() => null),
      api("/invoices/stats/summary", "GET", null, token).catch(() => null),
    ]).then(([g, i]) => { setGst(g?.dashboard); setInv(i?.stats); setLoading(false); });
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom:10 }}>{badge("Accounting + GST Live Dashboard", "blue")}</div>
      <div style={S.kpiGrid}>
        {[
          { label:"Monthly Sales",    val:fmtMoney(inv?.monthly_sales||0),      color:"#3fb950" },
          { label:"Monthly Purchases",val:fmtMoney(inv?.monthly_purchases||0),  color:"#58a6ff" },
          { label:"Outstanding",      val:fmtMoney(inv?.total_outstanding||0),  color:"#e3b341" },
          { label:"Overdue",          val:fmtMoney(inv?.overdue_amount||0),     color:"#f85149" },
        ].map(k => (
          <div key={k.label} style={S.kpi}>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={{ ...S.kpiVal, fontSize:15, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={S.kpiGrid}>
        {[
          { label:"Total GST Clients",  val:gst?.clients?.total||0,         color:"#E6EDF3" },
          { label:"Compliant",          val:gst?.clients?.compliant||0,     color:"#3fb950" },
          { label:"Open Notices",       val:gst?.notices?.open||0,          color:"#f85149" },
          { label:"Due in 30 Days",     val:gst?.notices?.due_in_30_days||0,color:"#e3b341" },
        ].map(k => (
          <div key={k.label} style={S.kpi}>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={{ ...S.kpiVal, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:600, color:"#E6EDF3", marginBottom:12 }}>Recent Notices Due</div>
          {!gst?.upcoming_notices?.length
            ? <div style={{ color:"#3fb950", fontSize:12 }}>No notices due in 30 days ✓</div>
            : gst.upcoming_notices.map(n => (
              <div key={n.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #21262D" }}>
                <div><div style={{ fontWeight:500, color:"#E6EDF3", fontSize:12 }}>{n.client_name}</div><div style={{ fontSize:11, color:"#8B949E" }}>{n.type}</div></div>
                {badge(n.due_date, "amber")}
              </div>
            ))
          }
        </div>
        {gst?.returns_summary && (
          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:600, color:"#E6EDF3", marginBottom:12 }}>GST Filing — {gst.returns_summary.period}</div>
            <table style={S.tbl}>
              <thead><tr>{["Return","Filed","Pending","Not Filed"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {[["GSTR-1","gstr1"],["GSTR-3B","gstr3b"],["GSTR-9","gstr9"]].map(([lbl, key]) => (
                  <tr key={key}>
                    <td style={S.td}>{lbl}</td>
                    <td style={{ ...S.td, color:"#3fb950", fontWeight:600 }}>{gst.returns_summary[key].filed}</td>
                    <td style={{ ...S.td, color:"#e3b341", fontWeight:600 }}>{gst.returns_summary[key].pending}</td>
                    <td style={{ ...S.tdL, color:"#f85149", fontWeight:600 }}>{gst.returns_summary[key].not_filed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PARTIES (Customer/Supplier) ────────────────────────────────────────────
function Parties({ token, toast }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [form, setForm] = useState({ name:"", gstin:"", state:"", type:"Customer", phone:"", email:"", address:"", city:"", pincode:"", pan:"", credit_limit:"0" });

  const STATES = ["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Jharkhand","Chhattisgarh","Uttarakhand","Goa","Other"];

  const load = useCallback(() => {
    setLoading(true);
    api(`/parties${search ? `?search=${encodeURIComponent(search)}` : ""}`, "GET", null, token)
      .then(d => { setParties(d.parties || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name:"", gstin:"", state:"", type:"Customer", phone:"", email:"", address:"", city:"", pincode:"", pan:"", credit_limit:"0" }); setShowModal(true); };
  const openEdit = p => { setEditing(p); setForm({ name:p.name, gstin:p.gstin||"", state:p.state||"", type:p.type||"Customer", phone:p.phone||"", email:p.email||"", address:p.address||"", city:p.city||"", pincode:p.pincode||"", pan:p.pan||"", credit_limit:p.credit_limit||"0" }); setShowModal(true); };

  const save = async () => {
    if (!form.name) return toast("Party name required", "error");
    setSaving(true);
    try {
      if (editing) { await api(`/parties/${editing.id}`, "PUT", form, token); toast("Updated", "success"); }
      else { await api("/parties", "POST", form, token); toast("Party added", "success"); }
      setShowModal(false); load();
    } catch(e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this party?")) return;
    try { await api(`/parties/${id}`, "DELETE", null, token); toast("Deleted", "success"); load(); }
    catch(e) { toast(e.message, "error"); }
  };

  const viewLedger = async (id) => {
    try { const d = await api(`/parties/${id}/ledger`, "GET", null, token); setLedger(d); }
    catch(e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==="Enter" && load()} placeholder="Search parties by name or GSTIN..." style={{ ...S.input, width:280 }} />
        <button onClick={load} style={S.btnGhost}>Search</button>
        <button onClick={openAdd} style={{ ...S.btn, marginLeft:"auto" }}>+ Add Party</button>
      </div>

      {loading ? <Spinner /> : (
        <div style={S.card}>
          {parties.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:"#8B949E" }}>No parties yet. Add customers and suppliers here.</div>
            : (
              <table style={S.tbl}>
                <thead><tr>{["Name","GSTIN","Type","Phone","City","Outstanding","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {parties.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...S.td, fontWeight:600, color:"#E6EDF3", cursor:"pointer" }} onClick={() => viewLedger(p.id)}>{p.name}</td>
                      <td style={S.td}><span style={S.mono}>{p.gstin || "—"}</span></td>
                      <td style={S.td}>{badge(p.type, p.type==="Customer"?"green":p.type==="Supplier"?"blue":"gray")}</td>
                      <td style={S.td}>{p.phone || "—"}</td>
                      <td style={S.td}>{p.city || "—"}</td>
                      <td style={{ ...S.td, color:parseFloat(p.outstanding||0)>0?"#e3b341":"#3fb950", fontWeight:600 }}>{fmtMoney(p.outstanding||0)}</td>
                      <td style={S.tdL}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => viewLedger(p.id)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 8px" }}>Ledger</button>
                          <button onClick={() => openEdit(p)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 8px" }}>Edit</button>
                          <button onClick={() => del(p.id)} style={{ ...S.btnDanger, fontSize:11, padding:"4px 8px" }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Party" : "Add Party"} onClose={() => setShowModal(false)} wide>
          <div style={S.twoCol}>
            <div>
              <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} placeholder="Company or person name" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} /></div>
              <div style={S.fg}><label style={S.label}>Type *</label>
                <select style={S.select} value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}>
                  {["Customer","Supplier","Both"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} placeholder="15 character GSTIN" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin:e.target.value.toUpperCase() }))} /></div>
              <div style={S.fg}><label style={S.label}>PAN</label><input style={S.input} placeholder="ABCDE1234F" value={form.pan} onChange={e => setForm(p => ({ ...p, pan:e.target.value.toUpperCase() }))} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={S.fg}><label style={S.label}>Phone</label><input style={S.input} placeholder="9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone:e.target.value }))} /></div>
                <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} placeholder="email@co.com" value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} /></div>
              </div>
            </div>
            <div>
              <div style={S.fg}><label style={S.label}>Address</label><textarea style={{ ...S.input, resize:"vertical", minHeight:60 }} value={form.address} onChange={e => setForm(p => ({ ...p, address:e.target.value }))} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={S.fg}><label style={S.label}>City</label><input style={S.input} placeholder="Mumbai" value={form.city} onChange={e => setForm(p => ({ ...p, city:e.target.value }))} /></div>
                <div style={S.fg}><label style={S.label}>Pincode</label><input style={S.input} placeholder="400001" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode:e.target.value }))} /></div>
              </div>
              <div style={S.fg}><label style={S.label}>State</label>
                <select style={S.select} value={form.state} onChange={e => setForm(p => ({ ...p, state:e.target.value }))}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={S.fg}><label style={S.label}>Credit Limit (Rs.)</label><input style={S.input} type="number" placeholder="0" value={form.credit_limit} onChange={e => setForm(p => ({ ...p, credit_limit:e.target.value }))} /></div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={S.btnGhost}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...S.btn, opacity:saving?0.6:1 }}>{saving?"Saving...":"Save Party"}</button>
          </div>
        </Modal>
      )}

      {ledger && (
        <Modal title={`Ledger — ${ledger.party?.name}`} onClose={() => setLedger(null)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {[
              { l:"Total Sales",     v:fmtMoney(ledger.summary?.total_sales||0),     c:"#3fb950" },
              { l:"Total Purchases", v:fmtMoney(ledger.summary?.total_purchases||0), c:"#58a6ff" },
              { l:"Outstanding",     v:fmtMoney(ledger.summary?.outstanding||0),     c:"#f85149" },
            ].map(k => (
              <div key={k.l} style={S.kpi}>
                <div style={S.kpiLabel}>{k.l}</div>
                <div style={{ fontSize:15, fontWeight:700, color:k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:"#E6EDF3", marginBottom:8 }}>Party Details</div>
          <div style={{ ...S.card, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["GSTIN",ledger.party?.gstin],["Phone",ledger.party?.phone],["Email",ledger.party?.email],["City",ledger.party?.city]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l}><span style={{ color:"#8B949E", fontSize:11 }}>{l}: </span><span style={{ color:"#E6EDF3", fontSize:12 }}>{v}</span></div>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:"#E6EDF3", marginBottom:8 }}>All Transactions</div>
          <table style={S.tbl}>
            <thead><tr>{["Date","Invoice No","Type","Amount","Paid","Balance"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {(ledger.invoices || []).map(inv => (
                <tr key={inv.id}>
                  <td style={S.td}>{inv.invoice_date}</td>
                  <td style={{ ...S.td, color:"#58a6ff" }}>{inv.invoice_no}</td>
                  <td style={S.td}>{badge(inv.invoice_type, inv.invoice_type==="SALES"?"green":"blue")}</td>
                  <td style={{ ...S.td, fontWeight:600 }}>{fmtMoney(inv.total_amount)}</td>
                  <td style={{ ...S.td, color:"#3fb950" }}>{fmtMoney(inv.paid_amount)}</td>
                  <td style={{ ...S.tdL, color:parseFloat(inv.balance_due||0)>0?"#f85149":"#3fb950", fontWeight:600 }}>{fmtMoney(inv.balance_due)}</td>
                </tr>
              ))}
              {(ledger.invoices || []).length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign:"center", color:"#8B949E", padding:20 }}>No transactions yet</td></tr>}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}

// ── PRODUCTS / STOCK ───────────────────────────────────────────────────────
function Products({ token, toast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [form, setForm] = useState({ name:"", code:"", hsn_sac:"", unit:"PCS", category:"", gst_rate:"18", purchase_price:"0", sale_price:"0", stock_qty:"0", min_stock:"0", description:"", is_service:false });
  const [stockForm, setStockForm] = useState({ type:"IN", qty:"", rate:"", notes:"" });
  const UNITS = ["PCS","KG","LTR","MTR","BOX","NOS","SET","DZ","PACK","TON"];

  const load = useCallback(() => {
    setLoading(true);
    api(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`, "GET", null, token)
      .then(d => { setProducts(d.products || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name:"", code:"", hsn_sac:"", unit:"PCS", category:"", gst_rate:"18", purchase_price:"0", sale_price:"0", stock_qty:"0", min_stock:"0", description:"", is_service:false }); setShowModal(true); };
  const openEdit = p => { setEditing(p); setForm({ name:p.name, code:p.code||"", hsn_sac:p.hsn_sac||"", unit:p.unit||"PCS", category:p.category||"", gst_rate:p.gst_rate||"18", purchase_price:p.purchase_price||"0", sale_price:p.sale_price||"0", stock_qty:p.stock_qty||"0", min_stock:p.min_stock||"0", description:p.description||"", is_service:!!p.is_service }); setShowModal(true); };

  const save = async () => {
    if (!form.name) return toast("Product name required", "error");
    setSaving(true);
    try {
      if (editing) { await api(`/products/${editing.id}`, "PUT", form, token); toast("Updated", "success"); }
      else { await api("/products", "POST", form, token); toast("Product added", "success"); }
      setShowModal(false); load();
    } catch(e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try { await api(`/products/${id}`, "DELETE", null, token); toast("Deleted", "success"); load(); }
    catch(e) { toast(e.message, "error"); }
  };

  const adjustStock = async () => {
    try {
      await api(`/products/${stockModal.id}/stock`, "POST", stockForm, token);
      toast("Stock updated", "success"); setStockModal(null); load();
    } catch(e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==="Enter" && load()} placeholder="Search products..." style={{ ...S.input, width:260 }} />
        <button onClick={load} style={S.btnGhost}>Search</button>
        <button onClick={openAdd} style={{ ...S.btn, marginLeft:"auto" }}>+ Add Product</button>
      </div>

      {loading ? <Spinner /> : (
        <div style={S.card}>
          {products.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:"#8B949E" }}>No products yet.</div>
            : (
              <table style={S.tbl}>
                <thead><tr>{["Name","Code","HSN","GST%","Purchase Rate","Sale Rate","Stock","Min Stock","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...S.td, fontWeight:600, color:"#E6EDF3" }}>{p.name}{p.is_service?<span style={{ fontSize:10, color:"#bf91f3", marginLeft:6 }}>SVC</span>:null}</td>
                      <td style={S.td}><span style={S.mono}>{p.code||"—"}</span></td>
                      <td style={S.td}>{p.hsn_sac||"—"}</td>
                      <td style={{ ...S.td, color:"#e3b341" }}>{p.gst_rate}%</td>
                      <td style={S.td}>{fmtMoney(p.purchase_price)}</td>
                      <td style={{ ...S.td, color:"#3fb950", fontWeight:600 }}>{fmtMoney(p.sale_price)}</td>
                      <td style={{ ...S.td, color:parseFloat(p.stock_qty||0)<=parseFloat(p.min_stock||0)?"#f85149":"#3fb950", fontWeight:600 }}>{p.stock_qty} {p.unit}</td>
                      <td style={S.td}>{p.min_stock}</td>
                      <td style={S.tdL}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => { setStockModal(p); setStockForm({ type:"IN", qty:"", rate:"", notes:"" }); }} style={{ ...S.btnGhost, fontSize:11, padding:"4px 8px" }}>Stock</button>
                          <button onClick={() => openEdit(p)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 8px" }}>Edit</button>
                          <button onClick={() => del(p.id)} style={{ ...S.btnDanger, fontSize:11, padding:"4px 8px" }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Product" : "Add Product / Service"} onClose={() => setShowModal(false)} wide>
          <div style={S.twoCol}>
            <div>
              <div style={S.fg}><label style={S.label}>Product / Service Name *</label><input style={S.input} placeholder="Product name" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={S.fg}><label style={S.label}>Code / SKU</label><input style={S.input} placeholder="P001" value={form.code} onChange={e => setForm(p => ({ ...p, code:e.target.value }))} /></div>
                <div style={S.fg}><label style={S.label}>HSN / SAC Code</label><input style={S.input} placeholder="1234" value={form.hsn_sac} onChange={e => setForm(p => ({ ...p, hsn_sac:e.target.value }))} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={S.fg}><label style={S.label}>Unit</label><select style={S.select} value={form.unit} onChange={e => setForm(p => ({ ...p, unit:e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                <div style={S.fg}><label style={S.label}>GST Rate %</label>
                  <select style={S.select} value={form.gst_rate} onChange={e => setForm(p => ({ ...p, gst_rate:e.target.value }))}>
                    {["0","0.25","1","1.5","3","5","6","7.5","12","18","28"].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
              <div style={S.fg}><label style={S.label}>Category</label><input style={S.input} placeholder="Electronics, Clothing..." value={form.category} onChange={e => setForm(p => ({ ...p, category:e.target.value }))} /></div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <input type="checkbox" id="isService" checked={form.is_service} onChange={e => setForm(p => ({ ...p, is_service:e.target.checked }))} style={{ width:16, height:16, cursor:"pointer" }} />
                <label htmlFor="isService" style={{ ...S.label, marginBottom:0, cursor:"pointer" }}>This is a Service (no stock tracking)</label>
              </div>
            </div>
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={S.fg}><label style={S.label}>Purchase Price (Rs.)</label><input style={S.input} type="number" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price:e.target.value }))} /></div>
                <div style={S.fg}><label style={S.label}>Sale Price (Rs.)</label><input style={S.input} type="number" value={form.sale_price} onChange={e => setForm(p => ({ ...p, sale_price:e.target.value }))} /></div>
              </div>
              {!editing && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={S.fg}><label style={S.label}>Opening Stock</label><input style={S.input} type="number" value={form.stock_qty} onChange={e => setForm(p => ({ ...p, stock_qty:e.target.value }))} /></div>
                  <div style={S.fg}><label style={S.label}>Min Stock Alert</label><input style={S.input} type="number" value={form.min_stock} onChange={e => setForm(p => ({ ...p, min_stock:e.target.value }))} /></div>
                </div>
              )}
              <div style={S.fg}><label style={S.label}>Description</label><textarea style={{ ...S.input, resize:"vertical", minHeight:80 }} value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} /></div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={S.btnGhost}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...S.btn, opacity:saving?0.6:1 }}>{saving?"Saving...":"Save"}</button>
          </div>
        </Modal>
      )}

      {stockModal && (
        <Modal title={`Adjust Stock — ${stockModal.name}`} onClose={() => setStockModal(null)}>
          <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
            <div style={{ fontSize:36, fontWeight:800, color:"#E6EDF3" }}>{stockModal.stock_qty}</div>
            <div style={{ fontSize:12, color:"#8B949E" }}>Current Stock ({stockModal.unit})</div>
          </div>
          <div style={S.fg}><label style={S.label}>Adjustment Type</label>
            <div style={{ display:"flex", gap:8 }}>
              {["IN","OUT"].map(t => (
                <button key={t} onClick={() => setStockForm(f => ({ ...f, type:t }))} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, borderColor:stockForm.type===t?"#238636":"#30363D", background:stockForm.type===t?"#0d2818":"transparent", color:stockForm.type===t?"#3fb950":"#8B949E" }}>
                  {t === "IN" ? "📦 Stock IN" : "📤 Stock OUT"}
                </button>
              ))}
            </div>
          </div>
          {[{ l:"Quantity *", k:"qty", t:"number", ph:"Enter quantity" }, { l:"Rate per unit", k:"rate", t:"number", ph:"Optional" }, { l:"Notes / Reason", k:"notes", t:"text", ph:"Purchase, sale, adjustment..." }].map(f => (
            <div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t} placeholder={f.ph} value={stockForm[f.k]} onChange={e => setStockForm(p => ({ ...p, [f.k]:e.target.value }))} /></div>
          ))}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={() => setStockModal(null)} style={S.btnGhost}>Cancel</button>
            <button onClick={adjustStock} style={S.btnG}>Update Stock</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── INVOICE FORM (Sales + Purchase) ────────────────────────────────────────
function InvoiceForm({ token, toast, type, onClose, onSave }) {
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    invoice_type: type || "SALES",
    party_id:"", party_name:"", party_gstin:"", party_address:"", party_state:"",
    invoice_date: today(), due_date:"", place_of_supply:"", is_igst:false,
    notes:"", terms:"Payment due within 30 days."
  });
  const [items, setItems] = useState([{ name:"", hsn_sac:"", unit:"PCS", qty:"1", rate:"0", discount_pct:"0", gst_rate:"18", product_id:"" }]);

  useEffect(() => {
    Promise.all([
      api("/parties", "GET", null, token).catch(() => ({ parties:[] })),
      api("/products", "GET", null, token).catch(() => ({ products:[] })),
    ]).then(([p, pr]) => { setParties(p.parties||[]); setProducts(pr.products||[]); });
  }, [token]);

  const selectParty = (id) => {
    const p = parties.find(x => x.id === id);
    if (p) setForm(f => ({ ...f, party_id:p.id, party_name:p.name, party_gstin:p.gstin||"", party_address:[p.address,p.city,p.state,p.pincode].filter(Boolean).join(", "), party_state:p.state||"" }));
  };

  const selectProduct = (idx, pid) => {
    const p = products.find(x => x.id === pid);
    if (p) {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], product_id:p.id, name:p.name, hsn_sac:p.hsn_sac||"", unit:p.unit||"PCS", rate:type==="SALES"?String(p.sale_price||0):String(p.purchase_price||0), gst_rate:String(p.gst_rate||18) };
      setItems(newItems);
    }
  };

  const setItem = (i, k, v) => { const n=[...items]; n[i]={...n[i],[k]:v}; setItems(n); };
  const addItem = () => setItems(p => [...p, { name:"", hsn_sac:"", unit:"PCS", qty:"1", rate:"0", discount_pct:"0", gst_rate:"18", product_id:"" }]);
  const removeItem = (i) => { if (items.length===1) return; setItems(p => p.filter((_,idx) => idx!==i)); };

  const calcItem = (item) => {
    const qty=parseFloat(item.qty)||0, rate=parseFloat(item.rate)||0, disc=parseFloat(item.discount_pct)||0, gstRate=parseFloat(item.gst_rate)||0;
    const gross=qty*rate, discAmt=gross*disc/100, taxable=gross-discAmt;
    const igst=form.is_igst?taxable*gstRate/100:0;
    const cgst=!form.is_igst?taxable*(gstRate/2)/100:0;
    const sgst=!form.is_igst?taxable*(gstRate/2)/100:0;
    return { taxable, igst, cgst, sgst, total:taxable+igst+cgst+sgst };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    return { taxable:acc.taxable+c.taxable, igst:acc.igst+c.igst, cgst:acc.cgst+c.cgst, sgst:acc.sgst+c.sgst, total:acc.total+c.total };
  }, { taxable:0, igst:0, cgst:0, sgst:0, total:0 });

  const save = async () => {
    if (!form.party_name) return toast("Party name required", "error");
    if (items.some(i => !i.name)) return toast("All items need a name", "error");
    setSaving(true);
    try {
      const payload = { ...form, items: items.map(item => { const c=calcItem(item); return { ...item, ...c }; }) };
      await api("/invoices", "POST", payload, token);
      toast(`${type==="SALES"?"Invoice":"Bill"} created!`, "success");
      onSave();
    } catch(e) { toast(e.message, "error"); }
    setSaving(false);
  };

  return (
    <Modal title={`New ${type==="SALES"?"Sales Invoice":"Purchase Bill"}`} onClose={onClose} wide>
      {/* Party + Invoice Details */}
      <div style={S.twoCol}>
        <div>
          <div style={S.fg}><label style={S.label}>Select Party</label>
            <select style={S.select} onChange={e => selectParty(e.target.value)}>
              <option value="">-- Select from list --</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={S.fg}><label style={S.label}>Party Name *</label><input style={S.input} placeholder="Customer / Supplier name" value={form.party_name} onChange={e => setForm(f => ({ ...f, party_name:e.target.value }))} /></div>
          <div style={S.fg}><label style={S.label}>GSTIN</label><input style={S.input} placeholder="15 character GSTIN" value={form.party_gstin} onChange={e => setForm(f => ({ ...f, party_gstin:e.target.value.toUpperCase() }))} /></div>
          <div style={S.fg}><label style={S.label}>Address</label><textarea style={{ ...S.input, resize:"vertical", minHeight:50 }} value={form.party_address} onChange={e => setForm(f => ({ ...f, party_address:e.target.value }))} /></div>
        </div>
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={S.fg}><label style={S.label}>Invoice Date *</label><input style={S.input} type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date:e.target.value }))} /></div>
            <div style={S.fg}><label style={S.label}>Due Date</label><input style={S.input} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date:e.target.value }))} /></div>
          </div>
          <div style={S.fg}><label style={S.label}>Place of Supply</label><input style={S.input} placeholder="State name" value={form.place_of_supply} onChange={e => setForm(f => ({ ...f, place_of_supply:e.target.value }))} /></div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <input type="checkbox" id="isIgst" checked={form.is_igst} onChange={e => setForm(f => ({ ...f, is_igst:e.target.checked }))} style={{ width:16, height:16 }} />
            <label htmlFor="isIgst" style={{ ...S.label, marginBottom:0, cursor:"pointer" }}>Inter-State (IGST applicable)</label>
          </div>
          <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{ ...S.input, resize:"vertical", minHeight:50 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} /></div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ fontSize:13, fontWeight:600, color:"#E6EDF3", marginBottom:8 }}>Items / Products</div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ ...S.tbl, minWidth:700 }}>
          <thead>
            <tr>{["Product","HSN","Qty","Unit","Rate","Disc%","GST%","Amount",""].map(h => <th key={h} style={{ ...S.th, fontSize:10 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const c = calcItem(item);
              return (
                <tr key={i}>
                  <td style={S.td}>
                    <select style={{ ...S.select, fontSize:11, marginBottom:4 }} onChange={e => selectProduct(i, e.target.value)}>
                      <option value="">-- Select --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input style={{ ...S.input, fontSize:11 }} placeholder="Item name *" value={item.name} onChange={e => setItem(i,"name",e.target.value)} />
                  </td>
                  <td style={S.td}><input style={{ ...S.input, width:70, fontSize:11 }} placeholder="HSN" value={item.hsn_sac} onChange={e => setItem(i,"hsn_sac",e.target.value)} /></td>
                  <td style={S.td}><input style={{ ...S.input, width:60, fontSize:11 }} type="number" value={item.qty} onChange={e => setItem(i,"qty",e.target.value)} /></td>
                  <td style={S.td}><select style={{ ...S.select, fontSize:11, width:70 }} value={item.unit} onChange={e => setItem(i,"unit",e.target.value)}>{["PCS","KG","LTR","MTR","BOX","NOS","SET"].map(u => <option key={u}>{u}</option>)}</select></td>
                  <td style={S.td}><input style={{ ...S.input, width:80, fontSize:11 }} type="number" value={item.rate} onChange={e => setItem(i,"rate",e.target.value)} /></td>
                  <td style={S.td}><input style={{ ...S.input, width:50, fontSize:11 }} type="number" value={item.discount_pct} onChange={e => setItem(i,"discount_pct",e.target.value)} /></td>
                  <td style={S.td}><select style={{ ...S.select, fontSize:11, width:70 }} value={item.gst_rate} onChange={e => setItem(i,"gst_rate",e.target.value)}>{["0","5","12","18","28"].map(r => <option key={r} value={r}>{r}%</option>)}</select></td>
                  <td style={{ ...S.td, fontWeight:600, color:"#3fb950" }}>{fmtMoney(c.total)}</td>
                  <td style={S.tdL}><button onClick={() => removeItem(i)} style={{ ...S.btnDanger, padding:"3px 8px", fontSize:11 }}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addItem} style={{ ...S.btnGhost, fontSize:12, marginTop:8, marginBottom:16 }}>+ Add Item</button>

      {/* Totals */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <div style={{ background:"#0D1117", borderRadius:8, padding:14, width:280 }}>
          {[
            ["Taxable Amount", totals.taxable],
            ...(form.is_igst ? [["IGST", totals.igst]] : [["CGST", totals.cgst], ["SGST", totals.sgst]]),
            ["Total Tax", totals.igst+totals.cgst+totals.sgst],
          ].map(([l,v]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #21262D" }}>
              <span style={{ color:"#8B949E", fontSize:12 }}>{l}</span>
              <span style={{ color:"#C9D1D9", fontSize:12 }}>{fmtMoney(v)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", marginTop:4 }}>
            <span style={{ color:"#E6EDF3", fontWeight:700 }}>TOTAL</span>
            <span style={{ color:"#3fb950", fontWeight:700, fontSize:16 }}>{fmtMoney(totals.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ ...S.btnG, opacity:saving?0.6:1 }}>{saving?"Creating...":"Create " + (type==="SALES"?"Invoice":"Bill")}</button>
      </div>
    </Modal>
  );
}

// ── INVOICE LIST ───────────────────────────────────────────────────────────
function InvoiceList({ token, toast, type }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount:"", method:"CASH", reference_no:"", payment_date:today() });

  const load = useCallback(() => {
    setLoading(true);
    api(`/invoices?type=${type}${search ? `&search=${encodeURIComponent(search)}` : ""}`, "GET", null, token)
      .then(d => { setInvoices(d.invoices||[]); setLoading(false); }).catch(() => setLoading(false));
  }, [token, type, search]);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm("Delete invoice?")) return;
    try { await api(`/invoices/${id}`, "DELETE", null, token); toast("Deleted","success"); load(); }
    catch(e) { toast(e.message,"error"); }
  };

  const viewInvoice = async (id) => {
    try { const d = await api(`/invoices/${id}`, "GET", null, token); setViewing(d.invoice); }
    catch(e) { toast(e.message,"error"); }
  };

  const recordPayment = async () => {
    try {
      await api(`/invoices/${payModal.id}/payment`, "POST", payForm, token);
      toast("Payment recorded","success"); setPayModal(null); load();
    } catch(e) { toast(e.message,"error"); }
  };

  const printInvoice = (inv) => {
    const w = window.open("","_blank");
    const items = inv.items||[];
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.invoice_no}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;font-size:12px;color:#333;padding:20px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:15px;border-bottom:3px solid #1F6FEB;margin-bottom:15px;}
      .company{font-size:22px;font-weight:800;color:#1F6FEB;}
      .inv-title{font-size:20px;font-weight:700;text-align:right;color:#333;}
      .inv-meta{text-align:right;font-size:11px;color:#666;margin-top:4px;}
      .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;}
      .box{background:#f8f9fa;padding:12px;border-radius:6px;border-left:3px solid #1F6FEB;}
      .box-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:6px;letter-spacing:0.5px;}
      .box-name{font-size:14px;font-weight:700;margin-bottom:3px;}
      .box-info{font-size:11px;color:#666;}
      table{width:100%;border-collapse:collapse;margin-bottom:15px;}
      th{background:#1F6FEB;color:white;padding:8px;font-size:11px;text-align:left;}
      td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px;}
      tr:nth-child(even){background:#f9f9f9;}
      .totals{float:right;width:280px;background:#f8f9fa;padding:12px;border-radius:6px;}
      .tot-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;}
      .tot-final{background:#1F6FEB;color:white;margin:8px -12px -12px;padding:10px 12px;font-size:14px;font-weight:700;display:flex;justify-content:space-between;border-radius:0 0 6px 6px;}
      .footer{margin-top:30px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px;}
      .status{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;}
      .paid{background:#d4edda;color:#155724;}.unpaid{background:#f8d7da;color:#721c24;}.partial{background:#fff3cd;color:#856404;}
      @media print{body{padding:10px;}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="company"> TaxPro GST</div>
        <div style="font-size:11px;color:#666;margin-top:2px;">Complete Accounting + GST Software</div>
      </div>
      <div>
        <div class="inv-title">${type==="SALES"?"TAX INVOICE":"PURCHASE BILL"}</div>
        <div class="inv-meta"><strong>${inv.invoice_no}</strong></div>
        <div class="inv-meta">Date: ${inv.invoice_date}</div>
        ${inv.due_date?`<div class="inv-meta">Due: ${inv.due_date}</div>`:""}
        <div class="inv-meta"><span class="status ${inv.status}">${inv.status?.toUpperCase()}</span></div>
      </div>
    </div>
    <div class="party-grid">
      <div class="box">
        <div class="box-title">Bill To</div>
        <div class="box-name">${inv.party_name}</div>
        ${inv.party_gstin?`<div class="box-info">GSTIN: <strong>${inv.party_gstin}</strong></div>`:""}
        ${inv.party_address?`<div class="box-info">${inv.party_address}</div>`:""}
      </div>
      <div class="box">
        <div class="box-title">Invoice Details</div>
        <div class="box-info">Place of Supply: ${inv.place_of_supply||inv.party_state||"—"}</div>
        <div class="box-info">Tax Type: ${inv.is_igst?"IGST (Inter-State)":"CGST+SGST (Intra-State)"}</div>
        <div class="box-info">Payment Status: ${inv.status?.toUpperCase()}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item / Description</th><th>HSN/SAC</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Disc%</th><th>Taxable</th><th>GST%</th><th>Tax Amt</th><th>Total</th></tr></thead>
      <tbody>
        ${items.map((item,i)=>`<tr>
          <td>${i+1}</td><td><strong>${item.name}</strong></td><td>${item.hsn_sac||"—"}</td>
          <td>${item.qty}</td><td>${item.unit||"PCS"}</td>
          <td>${fmtMoney(item.rate)}</td><td>${item.discount_pct||0}%</td>
          <td>${fmtMoney(item.taxable_value)}</td><td>${item.gst_rate}%</td>
          <td>${fmtMoney((item.igst_amount||0)+(item.cgst_amount||0)+(item.sgst_amount||0))}</td>
          <td><strong>${fmtMoney(item.total_amount)}</strong></td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div class="totals">
      <div class="tot-row"><span>Taxable Amount</span><span>${fmtMoney(inv.taxable_amount)}</span></div>
      ${inv.is_igst
        ?`<div class="tot-row"><span>IGST</span><span>${fmtMoney(inv.igst_amount)}</span></div>`
        :`<div class="tot-row"><span>CGST</span><span>${fmtMoney(inv.cgst_amount)}</span></div>
          <div class="tot-row"><span>SGST</span><span>${fmtMoney(inv.sgst_amount)}</span></div>`}
      <div class="tot-row" style="border-top:1px solid #ddd;margin-top:4px;padding-top:8px;"><span><strong>Total Tax</strong></span><span><strong>${fmtMoney(inv.total_tax)}</strong></span></div>
      <div class="tot-final"><span>TOTAL AMOUNT</span><span>${fmtMoney(inv.total_amount)}</span></div>
    </div>
    <div style="clear:both;padding-top:10px;">
      <div class="tot-row"><span>Amount Paid</span><span style="color:green;">${fmtMoney(inv.paid_amount)}</span></div>
      <div class="tot-row" style="font-weight:700;font-size:13px;"><span>Balance Due</span><span style="color:${parseFloat(inv.balance_due||0)>0?"red":"green"}">${fmtMoney(inv.balance_due)}</span></div>
    </div>
    ${inv.notes?`<div style="margin-top:15px;padding:10px;background:#f8f9fa;border-radius:6px;font-size:11px;"><strong>Notes:</strong> ${inv.notes}</div>`:""}
    ${inv.terms?`<div style="margin-top:8px;padding:10px;background:#f8f9fa;border-radius:6px;font-size:11px;"><strong>Terms:</strong> ${inv.terms}</div>`:""}
    <div class="footer">Generated by TaxPro GST | Thank you for your business!</div>
    </body></html>`);
    w.document.close(); w.print();
  };

  const label = type==="SALES" ? "Invoice" : "Bill";
  const totalAmt = invoices.reduce((a,i)=>a+parseFloat(i.total_amount||0),0);
  const totalOut = invoices.reduce((a,i)=>a+parseFloat(i.balance_due||0),0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
        {[{ l:"Total "+label+"s", v:invoices.length, c:"#58a6ff" },{ l:"Total Amount", v:fmtMoney(totalAmt), c:"#3fb950" },{ l:"Outstanding", v:fmtMoney(totalOut), c:"#e3b341" }].map(k=>(
          <div key={k.l} style={S.kpi}><div style={S.kpiLabel}>{k.l}</div><div style={{ fontSize:k.l.includes("Amount")||k.l.includes("Out")?14:22, fontWeight:700, color:k.c }}>{k.v}</div></div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder={`Search ${label.toLowerCase()}s...`} style={{ ...S.input, width:280 }} />
        <button onClick={load} style={S.btnGhost}>Search</button>
        <button onClick={()=>setShowForm(true)} style={{ ...S.btn, marginLeft:"auto" }}>+ New {label}</button>
      </div>

      {loading ? <Spinner /> : (
        <div style={S.card}>
          {invoices.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:"#8B949E" }}>No {label.toLowerCase()}s yet. Create your first one!</div>
            : (
              <table style={S.tbl}>
                <thead><tr>{["Invoice No","Party","Date","Due Date","Amount","Tax","Paid","Balance","Status","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ ...S.td, color:"#58a6ff", cursor:"pointer", fontWeight:600 }} onClick={() => viewInvoice(inv.id)}>{inv.invoice_no}</td>
                      <td style={S.td}><div style={{ fontWeight:500, color:"#E6EDF3" }}>{inv.party_name}</div>{inv.party_gstin&&<div style={S.mono}>{inv.party_gstin}</div>}</td>
                      <td style={S.td}>{inv.invoice_date}</td>
                      <td style={{ ...S.td, color:inv.due_date&&inv.due_date<today()&&inv.status!=="paid"?"#f85149":"#C9D1D9" }}>{inv.due_date||"—"}</td>
                      <td style={{ ...S.td, fontWeight:600 }}>{fmtMoney(inv.total_amount)}</td>
                      <td style={{ ...S.td, color:"#e3b341" }}>{fmtMoney(inv.total_tax)}</td>
                      <td style={{ ...S.td, color:"#3fb950" }}>{fmtMoney(inv.paid_amount)}</td>
                      <td style={{ ...S.td, color:parseFloat(inv.balance_due||0)>0?"#f85149":"#3fb950", fontWeight:600 }}>{fmtMoney(inv.balance_due)}</td>
                      <td style={S.td}><StatusBadge s={inv.status} /></td>
                      <td style={S.tdL}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => viewInvoice(inv.id)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 8px" }}>View</button>
                          {inv.status!=="paid"&&<button onClick={() => { setPayModal(inv); setPayForm({ amount:String(inv.balance_due||0), method:"CASH", reference_no:"", payment_date:today() }); }} style={{ ...S.btnG, fontSize:11, padding:"4px 8px" }}>Pay</button>}
                          <button onClick={() => del(inv.id)} style={{ ...S.btnDanger, fontSize:11, padding:"4px 8px" }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {showForm && <InvoiceForm token={token} toast={toast} type={type} onClose={()=>setShowForm(false)} onSave={()=>{setShowForm(false);load();}} />}

      {viewing && (
        <Modal title={`${type==="SALES"?"Invoice":"Bill"}: ${viewing.invoice_no}`} onClose={()=>setViewing(null)} wide>
          <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
            <button onClick={() => printInvoice(viewing)} style={S.btnG}>🖨 Print / PDF</button>
            <StatusBadge s={viewing.status} />
            {viewing.status!=="paid" && <div style={{ marginLeft:"auto", color:"#f85149", fontWeight:600 }}>Balance: {fmtMoney(viewing.balance_due)}</div>}
          </div>
          <div style={S.twoCol}>
            <div style={{ ...S.card, margin:0 }}>
              <div style={{ fontSize:11, color:"#8B949E", marginBottom:4 }}>Bill To</div>
              <div style={{ fontWeight:600, color:"#E6EDF3" }}>{viewing.party_name}</div>
              {viewing.party_gstin&&<div style={S.mono}>{viewing.party_gstin}</div>}
              {viewing.party_address&&<div style={{ fontSize:11, color:"#8B949E", marginTop:4 }}>{viewing.party_address}</div>}
            </div>
            <div style={{ ...S.card, margin:0, fontSize:12, lineHeight:1.9 }}>
              <div><span style={{ color:"#8B949E" }}>Date: </span>{viewing.invoice_date}</div>
              {viewing.due_date&&<div><span style={{ color:"#8B949E" }}>Due: </span>{viewing.due_date}</div>}
              <div><span style={{ color:"#8B949E" }}>Tax: </span>{viewing.is_igst?"IGST":"CGST+SGST"}</div>
            </div>
          </div>
          <table style={{ ...S.tbl, marginTop:12 }}>
            <thead><tr>{["Item","HSN","Qty","Rate","Taxable","GST%","Tax","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {(viewing.items||[]).map((item,i)=>(
                <tr key={i}>
                  <td style={{ ...S.td, fontWeight:500, color:"#E6EDF3" }}>{item.name}</td>
                  <td style={S.td}>{item.hsn_sac||"—"}</td>
                  <td style={S.td}>{item.qty} {item.unit}</td>
                  <td style={S.td}>{fmtMoney(item.rate)}</td>
                  <td style={S.td}>{fmtMoney(item.taxable_value)}</td>
                  <td style={S.td}>{item.gst_rate}%</td>
                  <td style={S.td}>{fmtMoney((item.igst_amount||0)+(item.cgst_amount||0)+(item.sgst_amount||0))}</td>
                  <td style={{ ...S.tdL, fontWeight:700 }}>{fmtMoney(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
            <div style={{ background:"#0D1117", borderRadius:8, padding:12, width:270 }}>
              {[["Taxable", viewing.taxable_amount], ...(viewing.is_igst?[["IGST",viewing.igst_amount]]:[["CGST",viewing.cgst_amount],["SGST",viewing.sgst_amount]]), ["Total Tax",viewing.total_tax], ["TOTAL",viewing.total_amount,true,"#3fb950"], ["Paid",viewing.paid_amount,false,"#3fb950"], ["Balance Due",viewing.balance_due,true,parseFloat(viewing.balance_due||0)>0?"#f85149":"#3fb950"]].map(([l,v,bold,color])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #21262D" }}>
                  <span style={{ color:"#8B949E", fontSize:12 }}>{l}</span>
                  <span style={{ color:color||"#E6EDF3", fontWeight:bold?700:400, fontSize:bold?13:12 }}>{fmtMoney(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title={`Record Payment — ${payModal.invoice_no}`} onClose={()=>setPayModal(null)}>
          <div style={{ ...S.card, textAlign:"center", marginBottom:16 }}>
            <div style={S.kpiLabel}>Balance Due</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#f85149" }}>{fmtMoney(payModal.balance_due)}</div>
          </div>
          {[{ l:"Amount Received (Rs.) *", k:"amount", t:"number" }, { l:"Payment Date *", k:"payment_date", t:"date" }, { l:"Reference No / Cheque No", k:"reference_no", t:"text" }].map(f=>(
            <div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t} value={payForm[f.k]} onChange={e=>setPayForm(p=>({...p,[f.k]:e.target.value}))} /></div>
          ))}
          <div style={S.fg}><label style={S.label}>Payment Method</label>
            <select style={S.select} value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>
              {["CASH","CHEQUE","NEFT","RTGS","IMPS","UPI","CARD"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setPayModal(null)} style={S.btnGhost}>Cancel</button>
            <button onClick={recordPayment} style={S.btnG}>Record Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── REPORTS ────────────────────────────────────────────────────────────────
function Reports({ token }) {
  const [reportType, setReportType] = useState("gst-summary");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(),3,1).toISOString().split("T")[0]);
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setData(null);
    try {
      const d = await api(`/reports/${reportType}?from_date=${from}&to_date=${to}`, "GET", null, token);
      setData(d);
    } catch(e) { setData({ error: e.message }); }
    setLoading(false);
  };

  const printReport = () => {
    const w = window.open("","_blank");
    const content = document.getElementById("report-area");
    w.document.write(`<html><head><title>TaxPro Report</title><style>body{font-family:Arial;margin:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;}th{background:#1F6FEB;color:white;}.pos{color:green;}.neg{color:red;}</style></head><body><h2>TaxPro GST — ${reportType} Report</h2><p>Period: ${from} to ${to}</p>${content?.innerHTML||""}</body></html>`);
    w.document.close(); w.print();
  };

  const fmtR = n => `Rs.${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        <select style={{ ...S.select, width:"auto" }} value={reportType} onChange={e=>setReportType(e.target.value)}>
          {[{k:"gst-summary",l:"GST Summary"},{k:"sales-register",l:"Sales Register"},{k:"purchase-register",l:"Purchase Register"},{k:"outstanding",l:"Outstanding"},{k:"profit-loss",l:"Profit & Loss"},{k:"day-book",l:"Day Book"}].map(r=><option key={r.k} value={r.k}>{r.l}</option>)}
        </select>
        <input type="date" style={{ ...S.input, width:150 }} value={from} onChange={e=>setFrom(e.target.value)} />
        <span style={{ color:"#8B949E" }}>to</span>
        <input type="date" style={{ ...S.input, width:150 }} value={to} onChange={e=>setTo(e.target.value)} />
        <button onClick={load} style={S.btn}>Generate</button>
        {data&&!data.error&&<button onClick={printReport} style={S.btnG}>🖨 Print / PDF</button>}
      </div>

      {loading && <Spinner />}
      {data?.error && <div style={{ color:"#f85149", padding:20 }}>Error: {data.error}</div>}

      <div id="report-area">
        {data&&!data.error&&reportType==="gst-summary"&&data.report&&(
          <div>
            <div style={S.twoCol}>
              <div style={S.card}>
                <div style={{ fontSize:13, fontWeight:600, color:"#3fb950", marginBottom:12 }}>Output Tax (Sales)</div>
                {[["Taxable Amount",data.report.sales?.taxable],["IGST",data.report.sales?.igst],["CGST",data.report.sales?.cgst],["SGST",data.report.sales?.sgst],["Total Sales",data.report.sales?.total]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #21262D" }}>
                    <span style={{ color:"#8B949E" }}>{l}</span><span style={{ color:"#E6EDF3", fontWeight:600 }}>{fmtR(v)}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontSize:13, fontWeight:600, color:"#58a6ff", marginBottom:12 }}>Input Tax (Purchases)</div>
                {[["Taxable Amount",data.report.purchase?.taxable],["IGST",data.report.purchase?.igst],["CGST",data.report.purchase?.cgst],["SGST",data.report.purchase?.sgst],["Total Purchases",data.report.purchase?.total]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #21262D" }}>
                    <span style={{ color:"#8B949E" }}>{l}</span><span style={{ color:"#E6EDF3", fontWeight:600 }}>{fmtR(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...S.card, textAlign:"center", background:data.report.net_gst_payable>0?"#2d0e0e":"#0d2818", border:`1px solid ${data.report.net_gst_payable>0?"#6e1c1c":"#238636"}` }}>
              <div style={S.kpiLabel}>Net GST Payable (Output − Input)</div>
              <div style={{ fontSize:32, fontWeight:800, color:data.report.net_gst_payable>0?"#f85149":"#3fb950" }}>{fmtR(data.report.net_gst_payable)}</div>
            </div>
          </div>
        )}

        {data&&!data.error&&(reportType==="sales-register"||reportType==="purchase-register")&&data.invoices&&(
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
              {[{ l:"Total Invoices",v:data.summary?.total_invoices },{ l:"Total Taxable",v:fmtR(data.summary?.total_taxable) },{ l:"Total Tax",v:fmtR((data.summary?.total_igst||0)+(data.summary?.total_cgst||0)+(data.summary?.total_sgst||0)) },{ l:"Total Amount",v:fmtR(data.summary?.total_amount) }].map(k=>(
                <div key={k.l} style={{ ...S.kpi, textAlign:"center" }}><div style={S.kpiLabel}>{k.l}</div><div style={{ fontSize:14, fontWeight:700, color:"#E6EDF3" }}>{k.v}</div></div>
              ))}
            </div>
            <div style={S.card}>
              <table style={S.tbl}>
                <thead><tr>{["Date","Invoice No","Party","GSTIN","Taxable","IGST","CGST","SGST","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.invoices.map(inv=>(
                    <tr key={inv.id}>
                      <td style={S.td}>{inv.invoice_date}</td>
                      <td style={{ ...S.td, color:"#58a6ff" }}>{inv.invoice_no}</td>
                      <td style={{ ...S.td, fontWeight:500, color:"#E6EDF3" }}>{inv.party_name}</td>
                      <td style={S.td}><span style={S.mono}>{inv.party_gstin||"—"}</span></td>
                      <td style={{ ...S.td, textAlign:"right" }}>{fmtR(inv.taxable_amount)}</td>
                      <td style={{ ...S.td, textAlign:"right" }}>{fmtR(inv.igst_amount)}</td>
                      <td style={{ ...S.td, textAlign:"right" }}>{fmtR(inv.cgst_amount)}</td>
                      <td style={{ ...S.td, textAlign:"right" }}>{fmtR(inv.sgst_amount)}</td>
                      <td style={{ ...S.tdL, textAlign:"right", fontWeight:700, color:"#3fb950" }}>{fmtR(inv.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data&&!data.error&&reportType==="outstanding"&&(
          <div>
            <div style={{ ...S.card, textAlign:"center", background:"#2d0e0e", border:"1px solid #6e1c1c", marginBottom:12 }}>
              <div style={S.kpiLabel}>Total Outstanding</div>
              <div style={{ fontSize:28, fontWeight:800, color:"#f85149" }}>{fmtR(data.total_outstanding)}</div>
            </div>
            <div style={S.card}>
              <table style={S.tbl}>
                <thead><tr>{["Party Name","GSTIN","Invoices","Total Billed","Paid","Outstanding","Oldest Due"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(data.parties||[]).map((p,i)=>(
                    <tr key={i}>
                      <td style={{ ...S.td, fontWeight:600, color:"#E6EDF3" }}>{p.party_name}</td>
                      <td style={S.td}><span style={S.mono}>{p.party_gstin||"—"}</span></td>
                      <td style={S.td}>{p.invoice_count}</td>
                      <td style={S.td}>{fmtR(p.total_billed)}</td>
                      <td style={{ ...S.td, color:"#3fb950" }}>{fmtR(p.total_paid)}</td>
                      <td style={{ ...S.td, color:"#f85149", fontWeight:700 }}>{fmtR(p.outstanding)}</td>
                      <td style={S.tdL}>{p.oldest_due||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data&&!data.error&&reportType==="profit-loss"&&data.pl&&(
          <div style={{ maxWidth:500, margin:"0 auto" }}>
            <div style={S.card}><div style={{ fontSize:13, fontWeight:700, color:"#3fb950", marginBottom:12 }}>INCOME</div><div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #21262D" }}><span style={{ color:"#8B949E" }}>Sales Revenue</span><span style={{ color:"#3fb950", fontWeight:600 }}>{fmtR(data.pl.income.sales)}</span></div><div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", fontWeight:700 }}><span>Total Income</span><span style={{ color:"#3fb950" }}>{fmtR(data.pl.income.total)}</span></div></div>
            <div style={S.card}><div style={{ fontSize:13, fontWeight:700, color:"#f85149", marginBottom:12 }}>EXPENSES</div><div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #21262D" }}><span style={{ color:"#8B949E" }}>Purchases</span><span style={{ color:"#f85149", fontWeight:600 }}>{fmtR(data.pl.expenses.purchases)}</span></div><div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", fontWeight:700 }}><span>Total Expenses</span><span style={{ color:"#f85149" }}>{fmtR(data.pl.expenses.total)}</span></div></div>
            <div style={{ ...S.card, textAlign:"center", background:data.pl.net_profit>0?"#0d2818":"#2d0e0e", border:`1px solid ${data.pl.net_profit>0?"#238636":"#6e1c1c"}` }}>
              <div style={S.kpiLabel}>Net Profit / Loss</div>
              <div style={{ fontSize:32, fontWeight:800, color:data.pl.net_profit>0?"#3fb950":"#f85149" }}>{fmtR(data.pl.net_profit)}</div>
            </div>
          </div>
        )}

        {data&&!data.error&&reportType==="day-book"&&(
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
              {[{ l:"Sales",v:fmtR(data.summary?.total_sales),c:"#3fb950" },{ l:"Purchases",v:fmtR(data.summary?.total_purchases),c:"#58a6ff" },{ l:"Received",v:fmtR(data.summary?.total_received),c:"#e3b341" },{ l:"Paid",v:fmtR(data.summary?.total_paid),c:"#f85149" }].map(k=>(
                <div key={k.l} style={{ ...S.kpi, textAlign:"center" }}><div style={S.kpiLabel}>{k.l}</div><div style={{ fontSize:16, fontWeight:700, color:k.c }}>{k.v}</div></div>
              ))}
            </div>
            <div style={S.card}>
              <table style={S.tbl}>
                <thead><tr>{["Invoice No","Party","Type","Amount","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(data.invoices||[]).map(inv=>(
                    <tr key={inv.id}><td style={{ ...S.td, color:"#58a6ff" }}>{inv.invoice_no}</td><td style={S.td}>{inv.party_name}</td><td style={S.td}>{badge(inv.invoice_type,inv.invoice_type==="SALES"?"green":"blue")}</td><td style={{ ...S.td, fontWeight:600 }}>{fmtR(inv.total_amount)}</td><td style={S.tdL}><StatusBadge s={inv.status}/></td></tr>
                  ))}
                  {(data.invoices||[]).length===0&&<tr><td colSpan={5} style={{ ...S.td, textAlign:"center", color:"#8B949E", padding:20 }}>No transactions today</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── ACCOUNTING MODULE ───────────────────────────────────────────────────────
function Accounting({ token, toast }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setLoading(true);

    api(
      `/accounting/companies${q ? `?search=${encodeURIComponent(q)}` : ""}`,
      "GET",
      null,
      token
    )
      .then((d) => {
        setEntries(
          d.entries ||
          d.data ||
          d.records ||
          d.accounting ||
          []
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search accounting entries..."
          style={{ ...S.input, width: 280 }}
        />

        <button onClick={load} style={S.btnGhost}>
          Search
        </button>

        <button
          onClick={load}
          style={{ ...S.btn, marginLeft: "auto" }}
        >
          Refresh
        </button>
      </div>

      {/* Data */}
      {loading ? (
        <Spinner />
      ) : (
        <div style={S.card}>
          {entries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#8B949E",
              }}
            >
              No accounting records found.
            </div>
          ) : (
            <table style={S.tbl}>
              <thead>
                <tr>
                  {[
                    "Date",
                    "Voucher No",
                    "Account",
                    "Description",
                    "Debit",
                    "Credit",
                    "Balance",
                  ].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id || i}>
                    <td style={S.td}>
                      {e.date
                        ? new Date(e.date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={S.td}>
                      <span style={S.mono}>
                        {e.voucher_no || e.voucherNo || "-"}
                      </span>
                    </td>

                    <td
                      style={{
                        ...S.td,
                        fontWeight: 600,
                        color: "#E6EDF3",
                      }}
                    >
                      {e.account_name ||
                        e.account ||
                        e.ledger ||
                        "-"}
                    </td>

                    <td style={S.td}>
                      {e.description || e.narration || "-"}
                    </td>

                    <td style={S.td}>
                      ₹
                      {Number(
                        e.debit || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td style={S.td}>
                      ₹
                      {Number(
                        e.credit || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td
                      style={{
                        ...S.td,
                        fontWeight: 700,
                        color: "#3FB950",
                      }}
                    >
                      ₹
                      {Number(
                        e.balance ||
                          (e.debit || 0) - (e.credit || 0)
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── GST CLIENTS ────────────────────────────────────────────────────────────
function GSTClients({ token, toast }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", gstin:"", state:"", type:"Trader", turnover:"", notes:"", status:"compliant" });
  const STATES = ["Delhi","Maharashtra","Gujarat","Uttar Pradesh","Rajasthan","Karnataka","Tamil Nadu","West Bengal","Madhya Pradesh","Andhra Pradesh","Telangana","Kerala","Punjab","Haryana","Bihar","Odisha","Uttarakhand","Himachal Pradesh","Goa","Other"];
  const TYPES = ["Manufacturer","Trader","Exporter","Importer","Service","Composition"];

  const load = useCallback(() => {
    setLoading(true);
    api(`/clients${q ? `?search=${encodeURIComponent(q)}` : ""}`, "GET", null, token)
      .then(d => { setClients(d.clients||[]); setLoading(false); }).catch(() => setLoading(false));
  }, [token, q]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await api(`/clients/${editing.id}`, "PUT", form, token); toast("Updated","success"); }
      else { await api("/clients", "POST", form, token); toast("Added","success"); }
      setShowModal(false); load();
    } catch(e) { toast(e.message,"error"); }
    setSaving(false);
  };

  const del = async (id) => { if (!window.confirm("Delete?")) return; try { await api(`/clients/${id}`,"DELETE",null,token); toast("Deleted","success"); load(); } catch(e) { toast(e.message,"error"); } };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center" }}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search GST clients..." style={{ ...S.input, width:280 }} />
        <button onClick={load} style={S.btnGhost}>Search</button>
        <button onClick={()=>{ setEditing(null); setForm({ name:"",gstin:"",state:"",type:"Trader",turnover:"",notes:"",status:"compliant" }); setShowModal(true); }} style={{ ...S.btn, marginLeft:"auto" }}>+ Add GST Client</button>
      </div>
      {loading ? <Spinner /> : (
        <div style={S.card}>
          {clients.length===0 ? <div style={{ textAlign:"center", padding:40, color:"#8B949E" }}>No GST clients yet.</div> : (
            <table style={S.tbl}>
              <thead><tr>{["Name","GSTIN","State","Type","Status","Notices","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{clients.map(c=>(
                <tr key={c.id}>
                  <td style={{ ...S.td, fontWeight:600, color:"#E6EDF3" }}>{c.name}</td>
                  <td style={S.td}><span style={S.mono}>{c.gstin}</span></td>
                  <td style={S.td}>{c.state}</td>
                  <td style={S.td}>{badge(c.type,"gray")}</td>
                  <td style={S.td}><StatusBadge s={c.status} /></td>
                  <td style={S.td}>{c.notice_count>0?<span style={{ color:"#f85149",fontWeight:700 }}>{c.notice_count}</span>:<span style={{ color:"#3fb950" }}>0</span>}</td>
                  <td style={S.tdL}><div style={{ display:"flex", gap:4 }}><button onClick={()=>{ setEditing(c); setForm({ name:c.name,gstin:c.gstin||"",state:c.state||"",type:c.type||"Trader",turnover:c.turnover||"",notes:c.notes||"",status:c.status||"compliant" }); setShowModal(true); }} style={{ ...S.btnGhost,fontSize:11,padding:"4px 8px" }}>Edit</button><button onClick={()=>del(c.id)} style={{ ...S.btnDanger,fontSize:11,padding:"4px 8px" }}>Del</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
      {showModal && (
        <Modal title={editing?"Edit GST Client":"Add GST Client"} onClose={()=>setShowModal(false)}>
          {[{l:"Name *",k:"name",ph:"Sharma Textiles Pvt Ltd"},{l:"GSTIN *",k:"gstin",ph:"09AABCS1429B1Z7"},{l:"Turnover",k:"turnover",ph:"2.4 Cr"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={S.fg}><label style={S.label}>State</label><select style={S.select} value={form.state} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div style={S.fg}><label style={S.label}>Type</label><select style={S.select} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          {editing&&<div style={S.fg}><label style={S.label}>Status</label><select style={S.select} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{["compliant","pending","notice","overdue"].map(s=><option key={s}>{s}</option>)}</select></div>}
          <div style={S.fg}><label style={S.label}>Notes</label><textarea style={{ ...S.input, resize:"vertical", minHeight:60 }} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{ ...S.btn, opacity:saving?0.6:1 }}>{saving?"Saving...":"Save"}</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── NOTICES ────────────────────────────────────────────────────────────────
function Notices({ token, toast }) {
  const [notices,setNotices]=useState([]);const [clients,setClients]=useState([]);const [filter,setFilter]=useState("all");const [loading,setLoading]=useState(true);const [showModal,setShowModal]=useState(false);const [saving,setSaving]=useState(false);const [form,setForm]=useState({client_id:"",ref_no:"",type:"",issued_date:"",due_date:"",amount:"",priority:"medium",description:""});
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/notices${filter!=="all"?`?status=${filter}`:""}`, "GET",null,token),api("/clients","GET",null,token)]).then(([nd,cd])=>{setNotices(nd.notices||[]);setClients(cd.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,filter]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/notices","POST",{...form,amount:parseFloat(form.amount)||0},token);toast("Notice added","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateStatus=async(id,status)=>{try{await api(`/notices/${id}/status`,"PATCH",{status},token);load();}catch(e){toast(e.message,"error");}};
  const del=async(id)=>{if(!window.confirm("Delete?"))return;try{await api(`/notices/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {["all","pending","in-progress","overdue","replied","closed"].map(t=>(<button key={t} onClick={()=>setFilter(t)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:filter===t?"#58a6ff":"#30363D",background:filter===t?"#0c1d2e":"transparent",color:filter===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t==="in-progress"?"In Progress":t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto",padding:"5px 14px"}}>+ Add Notice</button>
    </div>
    {loading?<Spinner/>:(<div style={S.card}>{notices.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No notices found.</div>:(<table style={S.tbl}><thead><tr>{["Ref No","Client","Type","Due","Amount","Priority","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{notices.map(n=>(<tr key={n.id}><td style={S.td}><span style={S.mono}>{n.ref_no}</span></td><td style={S.td}><div style={{fontWeight:500,color:"#E6EDF3"}}>{n.client_name}</div></td><td style={S.td}>{n.type}</td><td style={{...S.td,color:n.status==="overdue"?"#f85149":"#C9D1D9",fontWeight:n.status==="overdue"?700:400}}>{n.due_date}</td><td style={{...S.td,fontWeight:600}}>Rs.{Number(n.amount).toLocaleString("en-IN")}</td><td style={S.td}>{badge(n.priority,n.priority==="critical"||n.priority==="high"?"red":n.priority==="medium"?"blue":"gray")}</td><td style={S.td}><select value={n.status} onChange={e=>updateStatus(n.id,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px"}}>{["pending","in-progress","replied","closed","overdue"].map(s=><option key={s}>{s}</option>)}</select></td><td style={S.tdL}><button onClick={()=>del(n.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Notice" onClose={()=>setShowModal(false)}>
      <div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {[{l:"Ref No *",k:"ref_no",ph:"ZD071125006543C"},{l:"Notice Type *",k:"type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Amount *",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={S.fg}><label style={S.label}>Issued Date</label><input style={S.input} type="date" value={form.issued_date} onChange={e=>setForm(p=>({...p,issued_date:e.target.value}))}/></div><div style={S.fg}><label style={S.label}>Due Date *</label><input style={S.input} type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/></div></div>
      <div style={S.fg}><label style={S.label}>Priority</label><select style={S.select} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["critical","high","medium","low"].map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div>
    </Modal>)}
  </div>);
}

// ── RETURNS ────────────────────────────────────────────────────────────────
function Returns({ token, toast }) {
  const [returns,setReturns]=useState([]);const [clients,setClients]=useState([]);const [period,setPeriod]=useState("FY 2024-25");const [loading,setLoading]=useState(true);const [showModal,setShowModal]=useState(false);const [saving,setSaving]=useState(false);const [form,setForm]=useState({client_id:"",period:"FY 2024-25",gstr1_status:"not-filed",gstr3b_status:"not-filed",gstr9_status:"not-filed"});
  const PERIODS=["FY 2024-25","FY 2023-24","FY 2022-23"];
  const load=useCallback(()=>{setLoading(true);Promise.all([api(`/returns?period=${encodeURIComponent(period)}`,"GET",null,token),api("/clients","GET",null,token)]).then(([rd,cd])=>{setReturns(rd.returns||[]);setClients(cd.clients||[]);setLoading(false);}).catch(()=>setLoading(false));},[token,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/returns","POST",form,token);toast("Saved","success");setShowModal(false);load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const updateField=async(id,key,val)=>{const rec=returns.find(r=>r.id===id);if(!rec)return;try{await api(`/returns/${id}`,"PUT",{...rec,[key]:val},token);load();}catch(e){toast(e.message,"error");}};
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}><span style={{fontSize:12,color:"#8B949E"}}>FY:</span><select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select><button onClick={()=>{setForm(f=>({...f,period}));setShowModal(true);}} style={{...S.btn,marginLeft:"auto"}}>+ Add Record</button></div>
    {loading?<Spinner/>:(<div style={S.card}>{returns.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No records for {period}.</div>:(<table style={S.tbl}><thead><tr>{["Client","GSTIN","GSTR-1","GSTR-3B","GSTR-9","Overall"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{returns.map(r=>{const all=[r.gstr1_status,r.gstr3b_status,r.gstr9_status];const ov=all.every(s=>s==="filed")?"compliant":all.some(s=>s==="not-filed")?"overdue":"pending";return(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.client_name}</td><td style={S.td}><span style={S.mono}>{r.gstin}</span></td>{[["gstr1_status"],["gstr3b_status"],["gstr9_status"]].map(([key])=>(<td key={key} style={S.td}><select value={r[key]} onChange={e=>updateField(r.id,key,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{["filed","pending","not-filed"].map(s=><option key={s}>{s}</option>)}</select></td>))}<td style={S.tdL}><StatusBadge s={ov}/></td></tr>);})}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Return Record" onClose={()=>setShowModal(false)}><div style={S.fg}><label style={S.label}>Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={S.fg}><label style={S.label}>Period</label><select style={S.select} value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>{[["gstr1_status","GSTR-1"],["gstr3b_status","GSTR-3B"],["gstr9_status","GSTR-9"]].map(([key,lbl])=>(<div key={key} style={S.fg}><label style={S.label}>{lbl} Status</label><select style={S.select} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}>{["not-filed","pending","filed"].map(s=><option key={s}>{s}</option>)}</select></div>))}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button></div></Modal>)}
  </div>);
}

// ── GST CALCULATOR ─────────────────────────────────────────────────────────
function GSTCalculator() {
  const [amount,setAmount]=useState("");const [rate,setRate]=useState("18");const [type,setType]=useState("exclusive");const [txn,setTxn]=useState("inter");
  const amt=parseFloat(amount)||0, r=parseFloat(rate)||0;
  let base,gst,total;
  if(type==="exclusive"){base=amt;gst=amt*r/100;total=amt+gst;}else{total=amt;base=amt/(1+r/100);gst=total-base;}
  const igst=txn==="inter"?gst:0, cgst=txn==="intra"?gst/2:0, sgst=txn==="intra"?gst/2:0;
  const f=n=>n.toFixed(2);
  return(<div style={{maxWidth:560}}>
    <div style={S.card}>
      <div style={{fontSize:14,fontWeight:600,color:"#E6EDF3",marginBottom:16}}>GST Calculator</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div><label style={S.label}>Amount (Rs.)</label><input style={S.input} type="number" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        <div><label style={S.label}>GST Rate</label><select style={S.select} value={rate} onChange={e=>setRate(e.target.value)}>{["0","0.1","0.25","1","1.5","3","5","6","7.5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}</select></div>
        <div><label style={S.label}>Calculation</label><select style={S.select} value={type} onChange={e=>setType(e.target.value)}><option value="exclusive">Exclusive (Add GST)</option><option value="inclusive">Inclusive (Remove GST)</option></select></div>
        <div><label style={S.label}>Transaction Type</label><select style={S.select} value={txn} onChange={e=>setTxn(e.target.value)}><option value="inter">Inter-State (IGST)</option><option value="intra">Intra-State (CGST+SGST)</option></select></div>
      </div>
      {amt>0&&(<div style={{background:"#0D1117",borderRadius:8,padding:14}}>
        {[{l:"Base Amount",v:`Rs. ${f(base)}`,c:"#C9D1D9"},...(txn==="intra"?[{l:`CGST @ ${r/2}%`,v:`Rs. ${f(cgst)}`,c:"#e3b341"},{l:`SGST @ ${r/2}%`,v:`Rs. ${f(sgst)}`,c:"#e3b341"}]:[{l:`IGST @ ${r}%`,v:`Rs. ${f(igst)}`,c:"#e3b341"}]),{l:"Total GST",v:`Rs. ${f(gst)}`,c:"#f85149"},{l:"TOTAL AMOUNT",v:`Rs. ${f(total)}`,c:"#3fb950"}].map(row=>(<div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262D"}}><span style={{color:"#8B949E"}}>{row.l}</span><span style={{fontWeight:700,color:row.c}}>{row.v}</span></div>))}
      </div>)}
    </div>
  </div>);
}

// ── COMPLIANCE CALENDAR ────────────────────────────────────────────────────
function ComplianceCalendar() {
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now=new Date(); const [sm,setSm]=useState(now.getMonth()); const [sy,setSy]=useState(now.getFullYear());
  const getDD=(month,year)=>{
    const m=String(month+1).padStart(2,"0");
    return [{date:`${year}-${m}-11`,form:"GSTR-1",desc:`Outward supplies — ${months[month===0?11:month-1]} ${month===0?year-1:year}`,color:"blue"},{date:`${year}-${m}-20`,form:"GSTR-3B",desc:"Summary return + tax payment (>5Cr)",color:"amber"},{date:`${year}-${m}-22`,form:"GSTR-3B Cat-1",desc:"Category 1 states",color:"amber"},{date:`${year}-${m}-24`,form:"GSTR-3B Cat-2",desc:"Category 2 states",color:"amber"}].sort((a,b)=>new Date(a.date)-new Date(b.date));
  };
  const td=now.toISOString().split("T")[0];
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
      <select style={{...S.select,width:"auto"}} value={sm} onChange={e=>setSm(parseInt(e.target.value))}>{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
      <select style={{...S.select,width:"auto"}} value={sy} onChange={e=>setSy(parseInt(e.target.value))}>{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
    </div>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>GST Due Dates — {months[sm]} {sy}</div>
      {getDD(sm,sy).map((d,i)=>{const isPast=d.date<td,isToday=d.date===td;return(<div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:"1px solid #21262D",opacity:isPast?0.6:1}}>
        <div style={{minWidth:50,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:isToday?"#f85149":isPast?"#8B949E":"#e3b341"}}>{d.date.split("-")[2]}</div><div style={{fontSize:10,color:"#8B949E"}}>{months[sm]}</div></div>
        <div><div style={{display:"flex",gap:8,marginBottom:4}}>{badge(d.form,d.color)}{isToday&&badge("TODAY","red")}{isPast&&badge("Past","gray")}</div><div style={{fontSize:12,color:"#C9D1D9"}}>{d.desc}</div></div>
      </div>);})}
    </div>
    <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872"}}>
      <div style={{fontSize:12,color:"#58a6ff",fontWeight:600,marginBottom:8}}>Key Points</div>
      <div style={{fontSize:12,color:"#8B949E",lineHeight:1.9}}>• GSTR-1: 11th of every month (previous month data)<br/>• GSTR-3B: 20th/22nd/24th based on state and turnover<br/>• Late filing: Rs.50/day (Rs.20 for nil)<br/>• Interest @18% p.a. on late tax payment<br/>• Annual GSTR-9: 31st December</div>
    </div>
  </div>);
}

// ── NOTICE REPLY AI ────────────────────────────────────────────────────────
function NoticeReply({ token }) {
  const [clients,setClients]=useState([]);const [notices,setNotices]=useState([]);const [form,setForm]=useState({client_id:"",notice_type:"",ref_no:"",amount:"",description:""});const [reply,setReply]=useState("");const [loading,setLoading]=useState(false);
  useEffect(()=>{api("/clients","GET",null,token).then(d=>setClients(d.clients||[]));},[token]);
  useEffect(()=>{if(form.client_id)api(`/notices?client_id=${form.client_id}`,"GET",null,token).then(d=>setNotices(d.notices||[]));},[form.client_id,token]);
  const selectNotice=(id)=>{const n=notices.find(x=>x.id===id);if(n)setForm(f=>({...f,notice_type:n.type,ref_no:n.ref_no,amount:n.amount,description:n.description||""}));};
  const generate=async()=>{setLoading(true);setReply("");try{const client=clients.find(c=>c.id===form.client_id);const data=await api("/ai/generate-reply","POST",{client_name:client?.name||"",gstin:client?.gstin||"",notice_type:form.notice_type,ref_no:form.ref_no,amount:form.amount,description:form.description},token);setReply(data.reply||"");}catch(e){setReply("Error generating reply.");}setLoading(false);};
  const printReply=()=>{const client=clients.find(c=>c.id===form.client_id);const w=window.open("","_blank");w.document.write(`<html><head><title>Notice Reply</title><style>body{font-family:Arial;margin:40px;line-height:1.8;font-size:14px;}pre{white-space:pre-wrap;font-family:Arial;}</style></head><body><h2>GST Notice Reply</h2><p><strong>Client:</strong> ${client?.name||""} | <strong>GSTIN:</strong> ${client?.gstin||""}</p><p><strong>Ref No:</strong> ${form.ref_no}</p><hr/><pre>${reply}</pre></body></html>`);w.document.close();w.print();};
  return(<div style={S.twoCol}>
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:14}}>Notice Details</div>
      <div style={S.fg}><label style={S.label}>Select Client *</label><select style={S.select} value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      {form.client_id&&<div style={S.fg}><label style={S.label}>Select Notice</label><select style={S.select} onChange={e=>selectNotice(e.target.value)}><option value="">Manual entry</option>{notices.map(n=><option key={n.id} value={n.id}>{n.ref_no} — {n.type}</option>)}</select></div>}
      {[{l:"Notice Type *",k:"notice_type",ph:"GSTR-1 vs 3B Mismatch"},{l:"Reference No *",k:"ref_no",ph:"ZD071125006543C"},{l:"Amount (Rs.)",k:"amount",ph:"124500",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}
      <div style={S.fg}><label style={S.label}>Description</label><textarea style={{...S.input,resize:"vertical",minHeight:70}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <button onClick={generate} disabled={loading||!form.client_id||!form.notice_type} style={{...S.btn,width:"100%",opacity:loading||!form.client_id||!form.notice_type?0.5:1}}>{loading?"Generating Reply...":"Generate AI Reply"}</button>
    </div>
    <div style={{...S.card,minHeight:300}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>Generated Reply</div>
        {reply&&<div style={{display:"flex",gap:8}}><button onClick={()=>navigator.clipboard.writeText(reply)} style={S.btnGhost}>Copy</button><button onClick={printReply} style={S.btnG}>Print</button></div>}
      </div>
      {loading?<div style={{color:"#8B949E",textAlign:"center",padding:30}}>AI generating reply...<br/>Please wait 10-20 seconds.</div>:reply?<div style={{fontSize:12,color:"#C9D1D9",whiteSpace:"pre-wrap",lineHeight:1.8,background:"#0D1117",padding:14,borderRadius:8}}>{reply}</div>:<div style={{color:"#8B949E",fontSize:13,padding:20,textAlign:"center"}}>Fill notice details and click Generate.</div>}
    </div>
  </div>);
}

// ── BANK STATEMENT ─────────────────────────────────────────────────────────
function BankStatement({ token, toast }) {
  const [step,setStep]=useState(1);const [file,setFile]=useState(null);const [bankName,setBankName]=useState("");const [preview,setPreview]=useState(null);const [uploading,setUploading]=useState(false);const [importing,setImporting]=useState(false);const [transactions,setTransactions]=useState([]);const [viewMode,setViewMode]=useState("upload");const [filterType,setFilterType]=useState("all");
  const TYPES=["INCOME","EXPENSE","PURCHASE","TAX","BANK","TRANSFER","UNKNOWN"];
  const TYPE_COLORS={"INCOME":"green","EXPENSE":"red","PURCHASE":"blue","TAX":"amber","BANK":"gray","TRANSFER":"purple","UNKNOWN":"gray"};
  const loadTxns=useCallback(()=>{api(`/bank/transactions${filterType!=="all"?`?type=${filterType}`:""}`, "GET",null,token).then(d=>setTransactions(d.transactions||[])).catch(()=>{});},[token,filterType]);
  useEffect(()=>{if(viewMode==="history")loadTxns();},[viewMode,loadTxns]);
  const uploadPDF=async()=>{if(!file)return toast("Select PDF","error");setUploading(true);try{const fd=new FormData();fd.append("file",file);if(bankName)fd.append("bank_name",bankName);const res=await fetch(`${API}/bank/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){setPreview(data.preview);setStep(2);}else toast(data.message,"error");}catch(e){toast("Upload failed","error");}setUploading(false);};
  const importDB=async()=>{if(!preview)return;setImporting(true);try{const data=await api("/bank/import","POST",{bank_name:bankName||preview.bank_name,account_no:"",transactions:preview.transactions},token);if(data.success){toast(data.message,"success");setStep(3);}else toast(data.message,"error");}catch(e){toast(e.message,"error");}setImporting(false);};
  const updateCat=async(id,category,type)=>{try{await api(`/bank/transactions/${id}`,"PATCH",{category,type},token);loadTxns();}catch(e){}};
  const reset=()=>{setFile(null);setPreview(null);setStep(1);};
  const CATS=["Salary","Rent","Tax Payment","Utilities","Fund Transfer","Cash","Loan Payment","Interest","Bank Charges","Insurance","Purchase","Sales Receipt","Investment","Food & Dining","Online Purchase","Fuel","Travel","Medical","Uncategorized"];
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>{[{k:"upload",l:"📁 Import PDF"},{k:"history",l:"📊 Transactions"}].map(t=>(<button key={t.k} onClick={()=>setViewMode(t.k)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontFamily:"inherit",borderColor:viewMode===t.k?"#1F6FEB":"#30363D",background:viewMode===t.k?"#0c1d2e":"transparent",color:viewMode===t.k?"#58a6ff":"#8B949E",fontWeight:viewMode===t.k?600:400}}>{t.l}</button>))}</div>
    {viewMode==="upload"&&(<div>
      {/* Steps */}
      <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,l:"Upload PDF"},{n:2,l:"Preview"},{n:3,l:"Done"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.l}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:18}}/>}</div>))}</div>
      {step===1&&(<div>
        <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:8}}>📋 How to download Bank Statement PDF</div>
          {["Login to your bank's net banking / mobile app","Go to Account Statement / e-Statement","Select date range (month or full year)","Download as PDF","Upload below — AI will auto-categorize!"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"3px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700,minWidth:18}}>{i+1}.</span><span>{s}</span></div>))}
        </div>
        <div style={S.card}>
          <div style={S.fg}><label style={S.label}>Bank Name</label><input style={S.input} placeholder="SBI, HDFC, ICICI, Axis, Kotak..." value={bankName} onChange={e=>setBankName(e.target.value)}/></div>
          <div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>
            {file?(<div><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:40,marginBottom:8}}>🏦</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:4}}>Drop Bank Statement PDF here</div><div style={{fontSize:11,color:"#8B949E",marginBottom:12}}>AI will read and categorize all transactions automatically</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose PDF<input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}
          </div>
          <button onClick={uploadPDF} disabled={!file||uploading} style={{...S.btn,width:"100%",opacity:!file||uploading?0.5:1}}>{uploading?"Reading PDF & AI Categorizing...":"Upload & Analyze →"}</button>
        </div>
      </div>)}
      {step===2&&preview&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
          {[{l:"Transactions",v:preview.total_txns,c:"#58a6ff"},{l:"Total Debit",v:fmtMoney(preview.total_debit),c:"#f85149"},{l:"Total Credit",v:fmtMoney(preview.total_credit),c:"#3fb950"},{l:"Net",v:fmtMoney(preview.total_credit-preview.total_debit),c:preview.total_credit>=preview.total_debit?"#3fb950":"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l==="Transactions"?22:13,fontWeight:700,color:k.c}}>{k.v}</div></div>))}
        </div>
        <div style={{...S.card,background:"#0d2818",border:"1px solid #238636",marginBottom:12}}>
          <div style={{fontSize:12,color:"#3fb950"}}>✅ AI has auto-categorized {preview.total_txns} transactions into: Salary, Rent, Tax, Purchases, etc.</div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginBottom:12}}>Preview (first 50)</div>
          <table style={S.tbl}><thead><tr>{["Date","Description","Debit","Credit","Category","Type"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{(preview.transactions||[]).slice(0,50).map((t,i)=>(<tr key={i}><td style={S.td}>{t.txn_date}</td><td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div></td><td style={{...S.td,color:"#f85149",fontWeight:t.debit>0?600:400}}>{t.debit>0?fmtMoney(t.debit):"—"}</td><td style={{...S.td,color:"#3fb950",fontWeight:t.credit>0?600:400}}>{t.credit>0?fmtMoney(t.credit):"—"}</td><td style={S.td}>{badge(t.category||"Uncategorized","gray")}</td><td style={S.tdL}>{t.type&&badge(t.type,TYPE_COLORS[t.type]||"gray")}</td></tr>))}</tbody></table>
        </div>
        <div style={{display:"flex",gap:10}}><button onClick={reset} style={{...S.btnGhost,flex:1}}>Back</button><button onClick={importDB} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing...":"Import All to Database"}</button></div>
      </div>)}
      {step===3&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:56,marginBottom:12}}>🎉</div><div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>Bank Statement Imported!</div><div style={{fontSize:13,color:"#8B949E",marginBottom:20}}>All transactions saved with categories</div><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={reset} style={S.btn}>Import Another</button><button onClick={()=>setViewMode("history")} style={S.btnG}>View Transactions →</button></div></div>)}
    </div>)}
    {viewMode==="history"&&(<div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#8B949E"}}>Filter:</span>
        {["all",...TYPES].map(t=>(<button key={t} onClick={()=>setFilterType(t)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderColor:filterType===t?"#58a6ff":"#30363D",background:filterType===t?"#0c1d2e":"transparent",color:filterType===t?"#58a6ff":"#8B949E"}}>{t==="all"?"All":t}</button>))}
        <button onClick={loadTxns} style={{...S.btnGhost,marginLeft:"auto",fontSize:11}}>Refresh</button>
      </div>
      <div style={S.card}>
        {transactions.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No transactions. Import a bank statement first.</div>:(
          <table style={S.tbl}>
            <thead><tr>{["Date","Description","Debit","Credit","Category","Type"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{transactions.map(t=>(<tr key={t.id}>
              <td style={S.td}>{t.txn_date}</td>
              <td style={{...S.td,maxWidth:220}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</div></td>
              <td style={{...S.td,color:"#f85149",fontWeight:t.debit>0?600:400}}>{t.debit>0?fmtMoney(t.debit):"—"}</td>
              <td style={{...S.td,color:"#3fb950",fontWeight:t.credit>0?600:400}}>{t.credit>0?fmtMoney(t.credit):"—"}</td>
              <td style={S.td}><select value={t.category||"Uncategorized"} onChange={e=>updateCat(t.id,e.target.value,t.type)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{CATS.map(c=><option key={c}>{c}</option>)}</select></td>
              <td style={S.tdL}><select value={t.type||"UNKNOWN"} onChange={e=>updateCat(t.id,t.category,e.target.value)} style={{...S.select,fontSize:11,padding:"3px 6px",width:"auto"}}>{TYPES.map(tp=><option key={tp}>{tp}</option>)}</select></td>
            </tr>))}</tbody>
          </table>
        )}
      </div>
    </div>)}
  </div>);
}

// ── RECONCILIATION ─────────────────────────────────────────────────────────
function Reconciliation({ token, toast }) {
  const [clients,setClients]=useState([]);const [clientId,setClientId]=useState("");const [period,setPeriod]=useState("FY 2024-25");const [data,setData]=useState(null);const [loading,setLoading]=useState(false);const [showModal,setShowModal]=useState(false);const [saving,setSaving]=useState(false);const [form,setForm]=useState({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:""});
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients||[]);if(d.clients[0])setClientId(d.clients[0].id);});},[token]);
  const load=useCallback(()=>{if(!clientId)return;setLoading(true);api(`/reconciliation?client_id=${clientId}&period=${encodeURIComponent(period)}`,"GET",null,token).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));},[token,clientId,period]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);try{await api("/reconciliation","POST",{...form,client_id:clientId,period,invoice_count:parseInt(form.invoice_count)||0,gstr2a_amount:parseFloat(form.gstr2a_amount)||0,gstr2b_amount:parseFloat(form.gstr2b_amount)||0,books_amount:parseFloat(form.books_amount)||0},token);toast("Added","success");setShowModal(false);setForm({vendor_name:"",vendor_gstin:"",invoice_count:"",gstr2a_amount:"",gstr2b_amount:"",books_amount:""});load();}catch(e){toast(e.message,"error");}setSaving(false);};
  const del=async(id)=>{try{await api(`/reconciliation/${id}`,"DELETE",null,token);toast("Deleted","success");load();}catch(e){toast(e.message,"error");}};
  const fmtR=n=>`Rs.${Number(n||0).toLocaleString("en-IN")}`;
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
      <select style={{...S.select,width:"auto"}} value={clientId} onChange={e=>setClientId(e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select style={{...S.select,width:"auto"}} value={period} onChange={e=>setPeriod(e.target.value)}>{["FY 2024-25","FY 2023-24","FY 2022-23"].map(p=><option key={p}>{p}</option>)}</select>
      <button onClick={()=>setShowModal(true)} style={{...S.btn,marginLeft:"auto"}}>+ Add Entry</button>
    </div>
    {data?.summary&&(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{[{l:"Matched",v:data.summary.matched,c:"#3fb950"},{l:"Mismatch",v:data.summary.mismatch,c:"#e3b341"},{l:"Missing",v:data.summary.missing,c:"#f85149"},{l:"ITC Risk",v:fmtR(data.summary.total_itc_risk),c:"#f85149"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>)}
    {loading?<Spinner/>:(<div style={S.card}>{!data||data.rows.length===0?<div style={{textAlign:"center",padding:40,color:"#8B949E"}}>No entries yet.</div>:(<table style={S.tbl}><thead><tr>{["Vendor","GSTIN","Inv","GSTR-2A","GSTR-2B","Books","Diff","Status",""].map((h,i)=><th key={i} style={{...S.th,textAlign:i>=3&&i<=6?"right":"left"}}>{h}</th>)}</tr></thead><tbody>{data.rows.map(r=>(<tr key={r.id}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{r.vendor_name}</td><td style={S.td}><span style={S.mono}>{r.vendor_gstin}</span></td><td style={S.td}>{r.invoice_count}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.gstr2a_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.gstr2b_amount)}</td><td style={{...S.td,textAlign:"right"}}>{fmtR(r.books_amount)}</td><td style={{...S.td,textAlign:"right",fontWeight:r.difference!==0?700:400,color:r.difference<0?"#f85149":r.difference>0?"#e3b341":"#3fb950"}}>{r.difference===0?"—":fmtR(r.difference)}</td><td style={S.td}>{r.status==="matched"?badge("Matched","green"):r.status==="mismatch"?badge("Mismatch","amber"):badge("Missing","red")}</td><td style={S.tdL}><button onClick={()=>del(r.id)} style={S.btnDanger}>Del</button></td></tr>))}</tbody></table>)}</div>)}
    {showModal&&(<Modal title="Add Entry" onClose={()=>setShowModal(false)}>{[{l:"Vendor Name *",k:"vendor_name",ph:"ABC Suppliers Pvt Ltd"},{l:"Vendor GSTIN *",k:"vendor_gstin",ph:"07AABCA1234B1Z5"},{l:"Invoice Count",k:"invoice_count",ph:"12",t:"number"},{l:"GSTR-2A Amount",k:"gstr2a_amount",ph:"145000",t:"number"},{l:"GSTR-2B Amount",k:"gstr2b_amount",ph:"143000",t:"number"},{l:"Books Amount *",k:"books_amount",ph:"147000",t:"number"}].map(f=>(<div key={f.k} style={S.fg}><label style={S.label}>{f.l}</label><input style={S.input} type={f.t||"text"} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/></div>))}<div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setShowModal(false)} style={S.btnGhost}>Cancel</button><button onClick={save} disabled={saving} style={{...S.btn,opacity:saving?0.6:1}}>{saving?"Saving...":"Add"}</button></div></Modal>)}
  </div>);
}

// ── GSTR-2A IMPORT ─────────────────────────────────────────────────────────
function GSTR2AImport({ token, toast }) {
  const [clients,setClients]=useState([]);const [clientId,setClientId]=useState("");const [period,setPeriod]=useState("FY 2024-25");const [file,setFile]=useState(null);const [preview,setPreview]=useState(null);const [step,setStep]=useState(1);const [loading,setLoading]=useState(false);const [importing,setImporting]=useState(false);
  const PERIODS=["FY 2024-25","FY 2023-24","FY 2022-23"];
  const fmtG=n=>`Rs.${Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;
  useEffect(()=>{api("/clients","GET",null,token).then(d=>{setClients(d.clients||[]);if(d.clients[0])setClientId(d.clients[0].id);});},[token]);
  const previewFile=async()=>{if(!file)return toast("Select file","error");setLoading(true);try{const fd=new FormData();fd.append("file",file);const res=await fetch(`${API}/gstr2a/preview`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){setPreview(data.preview);setStep(2);}else toast(data.message,"error");}catch(e){toast("Preview failed","error");}setLoading(false);};
  const importData=async()=>{if(!file||!clientId)return toast("Select client and file","error");setImporting(true);try{const fd=new FormData();fd.append("file",file);fd.append("client_id",clientId);fd.append("period",period);const res=await fetch(`${API}/gstr2a/import`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const data=await res.json();if(data.success){toast(data.message,"success");setStep(3);}else toast(data.message,"error");}catch(e){toast("Import failed","error");}setImporting(false);};
  return(<div>
    <div style={{display:"flex",gap:0,marginBottom:20}}>{[{n:1,l:"Upload"},{n:2,l:"Preview"},{n:3,l:"Done"}].map((s,i)=>(<div key={s.n} style={{display:"flex",alignItems:"center",flex:1}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}><div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,background:step>=s.n?"#1F6FEB":"#21262D",color:step>=s.n?"#fff":"#8B949E"}}>{step>s.n?"✓":s.n}</div><div style={{fontSize:11,color:step>=s.n?"#58a6ff":"#8B949E",marginTop:4}}>{s.l}</div></div>{i<2&&<div style={{height:2,flex:1,background:step>s.n?"#1F6FEB":"#21262D",marginBottom:18}}/>}</div>))}</div>
    {step===1&&(<div>
      <div style={{...S.card,background:"#0c1d2e",border:"1px solid #1f4872",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:"#58a6ff",marginBottom:8}}>How to download GSTR-2A</div>
        {["Login to gst.gov.in","Services → Returns → Returns Dashboard","Select FY and Period","GSTR-2A → View / Download → Generate File","Download Excel file and upload below"].map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"3px 0",fontSize:12,color:"#C9D1D9"}}><span style={{color:"#1F6FEB",fontWeight:700}}>{i+1}.</span><span>{s}</span></div>))}
      </div>
      <div style={S.card}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={S.label}>Client *</label><select style={S.select} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={S.label}>Financial Year *</label><select style={S.select} value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
        </div>
        <div style={{border:"2px dashed #30363D",borderRadius:10,padding:30,textAlign:"center",marginBottom:16,background:file?"#0d2818":"#0D1117",borderColor:file?"#238636":"#30363D"}}>
          {file?(<div><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:600,color:"#3fb950"}}>{file.name}</div><button onClick={()=>setFile(null)} style={{...S.btnGhost,marginTop:10,fontSize:11}}>Remove</button></div>):(<div><div style={{fontSize:36,marginBottom:8}}>📁</div><div style={{fontSize:13,color:"#C9D1D9",marginBottom:12}}>GSTR-2A Excel or JSON file</div><label style={{...S.btn,cursor:"pointer",display:"inline-block"}}>Choose File<input type="file" accept=".xlsx,.xls,.json,.csv" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/></label></div>)}
        </div>
        <button onClick={previewFile} disabled={!file||loading} style={{...S.btn,width:"100%",opacity:!file||loading?0.5:1}}>{loading?"Reading...":"Preview →"}</button>
      </div>
    </div>)}
    {step===2&&preview&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>{[{l:"Total Invoices",v:preview.total_invoices,c:"#58a6ff"},{l:"Total Suppliers",v:preview.total_suppliers,c:"#e3b341"},{l:"Total ITC",v:fmtG(preview.total_itc),c:"#3fb950"}].map(k=>(<div key={k.l} style={{...S.kpi,textAlign:"center"}}><div style={S.kpiLabel}>{k.l}</div><div style={{fontSize:k.l.includes("ITC")?14:22,fontWeight:700,color:k.c}}>{k.v}</div></div>))}</div>
      <div style={S.card}>
        <table style={S.tbl}><thead><tr>{["Supplier","GSTIN","Invoices","IGST","CGST","SGST","Total ITC"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{(preview.suppliers||[]).slice(0,30).map((s,i)=>(<tr key={i}><td style={{...S.td,fontWeight:500,color:"#E6EDF3"}}>{s.name||"Unknown"}</td><td style={S.td}><span style={S.mono}>{s.gstin}</span></td><td style={S.td}>{s.invoices}</td><td style={S.td}>{fmtG(s.igst)}</td><td style={S.td}>{fmtG(s.cgst)}</td><td style={S.td}>{fmtG(s.sgst)}</td><td style={{...S.tdL,fontWeight:700,color:"#3fb950"}}>{fmtG(s.itc)}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={()=>{setStep(1);setPreview(null);}} style={{...S.btnGhost,flex:1}}>Back</button><button onClick={importData} disabled={importing} style={{...S.btnG,flex:2,opacity:importing?0.5:1}}>{importing?"Importing...":"Import to Reconciliation"}</button></div>
    </div>)}
    {step===3&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:56,marginBottom:12}}>🎉</div><div style={{fontSize:20,fontWeight:700,color:"#3fb950",marginBottom:8}}>GSTR-2A Imported!</div><button onClick={()=>{setFile(null);setPreview(null);setStep(1);}} style={{...S.btn,marginRight:10}}>Import Another</button></div>)}
  </div>);
}

// ── AI ASSISTANT ───────────────────────────────────────────────────────────
function AIAssistant({ token }) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Namaste! I am TaxPro AI Assistant.\n\nI can help with:\n• GST queries (DRC-01, ITC, reconciliation, returns)\n• Accounting (invoices, stock, payments)\n• Bank statement analysis\n• Tax planning & compliance\n\nAsk me anything!"}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async(text)=>{const msg=text||input.trim();if(!msg||loading)return;setInput("");setMsgs(prev=>[...prev,{role:"user",content:msg}]);setLoading(true);try{const history=msgs.map(m=>({role:m.role,content:m.content}));const data=await api("/ai/chat","POST",{messages:[...history,{role:"user",content:msg}]},token);setMsgs(prev=>[...prev,{role:"assistant",content:data.reply||"Sorry, could not process."}]);}catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"Error. Try again."}]);}setLoading(false);};
  const chips=["How to respond to DRC-01?","GSTR-2B vs 2A difference","ITC reversal Rule 42","Section 16(4) time limit","GST on exports","Journal entry for GST payment"];
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
const NAV = [
  { key:"dashboard",  icon:"🏠", label:"Dashboard",          group:"MAIN" },
  { key:"accounting", icon:"🧾", label:"Accounts",           group:"ACCOUNTING" },
  { key:"sales",      icon:"📄", label:"Sales Invoices",     group:"ACCOUNTING" },
  { key:"purchases",  icon:"🧾", label:"Purchase Bills",     group:"ACCOUNTING" },
  { key:"parties",    icon:"👥", label:"Parties",            group:"ACCOUNTING" },
  { key:"products",   icon:"📦", label:"Products & Stock",   group:"ACCOUNTING" },
  { key:"bank",       icon:"🏦", label:"Bank Statement",     group:"ACCOUNTING" },
  { key:"reports",    icon:"📈", label:"Reports",            group:"ACCOUNTING" },
  { key:"gst",        icon:"🏢", label:"GST Clients",        group:"GST" },
  { key:"notices",    icon:"🔔", label:"Notice Manager",     group:"GST" },
  { key:"returns",    icon:"📋", label:"Return Tracker",     group:"GST" },
  { key:"reconcile",  icon:"⇄",  label:"Reconciliation",     group:"GST" },
  { key:"gstr2a",     icon:"📥", label:"GSTR-2A Import",     group:"GST" },
  { key:"calculator", icon:"🧮", label:"GST Calculator",     group:"TOOLS" },
  { key:"calendar",   icon:"📅", label:"Due Date Calendar",  group:"TOOLS" },
  { key:"reply",      icon:"✍",  label:"Notice Reply AI",   group:"TOOLS" },
  { key:"ai",         icon:"✨",  label:"AI Assistant",      group:"TOOLS" },
];

const TITLES = { dashboard:"Dashboard", sales:"Sales Invoices", purchases:"Purchase Bills", parties:"Parties & Customers", products:"Products & Stock", bank:"Bank Statement Import", reports:"Reports & Analytics", gst:"GST Clients", notices:"Notice Manager", returns:"Return Filing Tracker", reconcile:"GST Reconciliation", gstr2a:"GSTR-2A Import", calculator:"GST Calculator", calendar:"Compliance Calendar", reply:"Notice Reply Generator", ai:"AI Assistant" };

// ── APP SHELL ──────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem("taxpro_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("taxpro_token") || "");
  const [view, setView]   = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem("taxpro_token"); localStorage.removeItem("taxpro_user"); setUser(null); setToken(""); };
  const onAuth = (u, t) => { setUser(u); setToken(t); };

  if (!user || !token) return <AuthScreen onAuth={onAuth} />;

  const groups = ["MAIN","ACCOUNTING","GST","TOOLS"];

  return (
    <div style={S.app}>
      <aside style={{ ...S.sidebar, width:collapsed?58:220, minWidth:collapsed?58:220, transition:"width 0.2s" }}>
        <div style={{ padding:"12px", borderBottom:"1px solid #21262D", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {!collapsed && <div><div style={{ fontSize:15, fontWeight:800, color:"#E6EDF3" }}>🛡️ TaxPro</div><div style={{ fontSize:10, color:"#8B949E" }}>Complete Suite</div></div>}
          <button onClick={() => setCollapsed(c => !c)} style={{ background:"none", border:"none", color:"#8B949E", cursor:"pointer", fontSize:18, padding:4, marginLeft:collapsed?"auto":0 }}>{collapsed?"▶":"◀"}</button>
        </div>
        <nav style={{ flex:1, padding:"4px 0", overflowY:"auto" }}>
          {groups.map(g => (
            <div key={g}>
              {!collapsed && <div style={{ fontSize:9, color:"#444C56", padding:"8px 12px 2px", letterSpacing:1, fontWeight:600 }}>{g}</div>}
              {NAV.filter(n => n.group === g).map(n => (
                <button key={n.key} onClick={() => setView(n.key)} title={collapsed ? n.label : ""} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:collapsed?"8px 0":"7px 12px", border:"none", background:view===n.key?"#1F6FEB18":"transparent", borderLeft:view===n.key?"2px solid #1F6FEB":"2px solid transparent", color:view===n.key?"#58a6ff":"#8B949E", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:view===n.key?600:400, textAlign:"left", justifyContent:collapsed?"center":"flex-start" }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
                  {!collapsed && <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div style={{ padding:"10px 12px", borderTop:"1px solid #21262D" }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#E6EDF3", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.firm_name||user.name}</div>
            <div style={{ fontSize:10, color:"#8B949E", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
            <button onClick={logout} style={{ ...S.btnGhost, marginTop:8, width:"100%", fontSize:11, padding:"5px" }}>Logout</button>
          </div>
        )}
      </aside>

      <div style={S.main}>
        <div style={S.topbar}>
          <span style={{ fontSize:14, fontWeight:600, color:"#E6EDF3" }}>{TITLES[view] || view}</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#8B949E" }}>Welcome, {user.name}</span>
            {badge("Live", "green")}
          </div>
        </div>
        <div style={S.content}>
          {view==="dashboard"  && <Dashboard    token={token} />}
          {view==="accounting" && <Accounting     token={token} toast={showToast} />}
          {view==="sales"      && <InvoiceList  token={token} toast={showToast} type="SALES" />}
          {view==="purchases"  && <InvoiceList  token={token} toast={showToast} type="PURCHASE" />}
          {view==="parties"    && <Parties      token={token} toast={showToast} />}
          {view==="products"   && <Products     token={token} toast={showToast} />}
          {view==="bank"       && <BankStatement token={token} toast={showToast} />}
          {view==="reports"    && <Reports      token={token} />}
          {view==="gst"        && <GSTClients   token={token} toast={showToast} />}
          {view==="notices"    && <Notices      token={token} toast={showToast} />}
          {view==="returns"    && <Returns      token={token} toast={showToast} />}
          {view==="reconcile"  && <Reconciliation token={token} toast={showToast} />}
          {view==="gstr2a"     && <GSTR2AImport token={token} toast={showToast} />}
          {view==="calculator" && <GSTCalculator />}
          {view==="calendar"   && <ComplianceCalendar />}
          {view==="reply"      && <NoticeReply  token={token} />}
          {view==="ai"         && <AIAssistant  token={token} />}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}