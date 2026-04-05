import { useState, useEffect } from “react”;

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// 1. Go to console.cloud.google.com
// 2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
// 3. Set Authorized JS origins to your domain (or http://localhost:3000)
// 4. Paste your Client ID below
const GOOGLE_CLIENT_ID = “507329417569-6r0btfrbv0aik9jg08krenh0nhimkatm.apps.googleusercontent.com”;

// ─── DATA ────────────────────────────────────────────────────────────────────
const DEALS = [
{ id:1,  brand:“Nike”,        logo:“👟”, cashback:“8%”,  cat:“Fashion”,     deal:“Up to 8% back on all shoes”,      badge:“HOT”,     color:”#FF4D00” },
{ id:2,  brand:“Amazon”,      logo:“📦”, cashback:“3%”,  cat:“Everything”,  deal:“3% back on all purchases”,        badge:“POPULAR”, color:”#FF9900” },
{ id:3,  brand:“Sephora”,     logo:“💄”, cashback:“10%”, cat:“Beauty”,      deal:“10% back sitewide — today only”,  badge:“LIMITED”, color:”#FF2D55” },
{ id:4,  brand:“Best Buy”,    logo:“📺”, cashback:“5%”,  cat:“Electronics”, deal:“5% back on electronics”,          badge:“NEW”,     color:”#0046BE” },
{ id:5,  brand:“Airbnb”,      logo:“🏠”, cashback:“6%”,  cat:“Travel”,      deal:“6% back on stays”,                badge:“HOT”,     color:”#FF5A5F” },
{ id:6,  brand:“Uber Eats”,   logo:“🍔”, cashback:“12%”, cat:“Food”,        deal:“12% back on food orders”,         badge:“LIMITED”, color:”#06C167” },
{ id:7,  brand:“Walmart”,     logo:“🛒”, cashback:“2%”,  cat:“Everything”,  deal:“2% back on groceries & more”,     badge:””,        color:”#0071CE” },
{ id:8,  brand:“H&M”,         logo:“👗”, cashback:“7%”,  cat:“Fashion”,     deal:“7% back on clothing”,             badge:“NEW”,     color:”#E50010” },
{ id:9,  brand:“Apple”,       logo:“🍎”, cashback:“4%”,  cat:“Electronics”, deal:“4% back on Apple.com orders”,     badge:“HOT”,     color:”#888888” },
{ id:10, brand:“Booking.com”, logo:“🏨”, cashback:“9%”,  cat:“Travel”,      deal:“9% back on hotel bookings”,       badge:“LIMITED”, color:”#003580” },
{ id:11, brand:“Starbucks”,   logo:“☕”, cashback:“5%”,  cat:“Food”,        deal:“5% back on Starbucks orders”,     badge:””,        color:”#00704A” },
{ id:12, brand:“ASOS”,        logo:“🧥”, cashback:“11%”, cat:“Fashion”,     deal:“11% back sitewide”,               badge:“HOT”,     color:”#2A6EBB” },
{ id:13, brand:“Target”,      logo:“🎯”, cashback:“3%”,  cat:“Everything”,  deal:“3% back on Target orders”,        badge:””,        color:”#CC0000” },
{ id:14, brand:“Expedia”,     logo:“✈️”, cashback:“8%”,  cat:“Travel”,      deal:“8% back on flights & hotels”,     badge:“NEW”,     color:”#FFC72C” },
{ id:15, brand:“DoorDash”,    logo:“🚗”, cashback:“10%”, cat:“Food”,        deal:“10% back on DoorDash orders”,     badge:“LIMITED”, color:”#FF3008” },
{ id:16, brand:“Samsung”,     logo:“📱”, cashback:“6%”,  cat:“Electronics”, deal:“6% back on Samsung.com”,          badge:””,        color:”#1428A0” },
];

const CATS = [“All”,“Fashion”,“Electronics”,“Beauty”,“Travel”,“Food”,“Everything”];
const PRO_PRICE = “$4.99/mo”;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function saveUser(u) { try { localStorage.setItem(“cd_user”, JSON.stringify(u)); } catch(e){} }
function loadUser()  { try { var s=localStorage.getItem(“cd_user”); return s?JSON.parse(s):null; } catch(e){return null;} }
function clearUser() { try { localStorage.removeItem(“cd_user”); } catch(e){} }

function Glow({ color, top, left, size, opacity }) {
color=color||”#00ffaa”; top=top||-80; left=left||“50%”; size=size||300; opacity=opacity||0.07;
var hex=Math.round(opacity*255).toString(16).padStart(2,“0”);
return (
<div style={{ position:“absolute”, top:top, left:left, transform:“translateX(-50%)”,
width:size, height:size, borderRadius:“50%”, pointerEvents:“none”,
background:“radial-gradient(circle,”+color+hex+” 0%,transparent 70%)” }} />
);
}

function Badge({ label }) {
if (!label) return null;
var c={HOT:”#ff4d00”,LIMITED:”#ff2d55”,POPULAR:”#00ffaa”,NEW:”#c9a84c”};
var b={HOT:”#ff4d0020”,LIMITED:”#ff2d5520”,POPULAR:”#00ffaa20”,NEW:”#c9a84c20”};
return <span style={{ background:b[label]||”#222”,color:c[label]||”#aaa”,fontSize:9,fontWeight:800,padding:“2px 7px”,borderRadius:6,letterSpacing:.5 }}>{label}</span>;
}

// ─── FAKE USER STORE (email auth, no backend needed) ─────────────────────────
// In production, swap this with your real API calls
function getUsers() {
try { return JSON.parse(localStorage.getItem(“cd_users”) || “{}”); } catch(e) { return {}; }
}
function saveUsers(users) {
try { localStorage.setItem(“cd_users”, JSON.stringify(users)); } catch(e) {}
}

// ─── AUTH SCREEN (Google + Email) ────────────────────────────────────────────
function AuthScreen({ onAuth }) {
var [mode, setMode]         = useState(“login”);   // “login” | “signup” | “forgot”
var [email, setEmail]       = useState(””);
var [password, setPassword] = useState(””);
var [name, setName]         = useState(””);
var [loading, setLoading]   = useState(false);
var [err, setErr]           = useState(””);
var [resetSent, setResetSent] = useState(false);
var [showPass, setShowPass] = useState(false);

// Load Google Sign-In script
useEffect(function() {
if (document.getElementById(“google-gsi”)) { initGoogleButton(); return; }
var s = document.createElement(“script”);
s.id = “google-gsi”;
s.src = “https://accounts.google.com/gsi/client”;
s.async = true;
s.onload = function() { setTimeout(initGoogleButton, 300); };
document.head.appendChild(s);
}, []);

function initGoogleButton() {
if (!window.google || !window.google.accounts) { setTimeout(initGoogleButton, 400); return; }
window.google.accounts.id.initialize({
client_id: GOOGLE_CLIENT_ID,
callback: handleGoogleResponse,
});
var el = document.getElementById(“google-btn”);
if (el) {
window.google.accounts.id.renderButton(el,
{ theme:“outline”, size:“large”, width:el.offsetWidth||320, text:“continue_with”, shape:“rectangular” }
);
}
}

function handleGoogleResponse(response) {
setLoading(true); setErr(””);
try {
var parts   = response.credential.split(”.”);
var payload = JSON.parse(atob(parts[1].replace(/-/g,”+”).replace(/_/g,”/”)));
var user    = { id:“g-”+payload.sub, name:payload.name, email:payload.email, avatar:payload.picture, plan:“free” };
saveUser(user);
setLoading(false);
onAuth(user);
} catch(e) {
setErr(“Google sign-in failed. Try email instead.”);
setLoading(false);
}
}

function handleEmailSubmit() {
setErr(””);
if (!email) { setErr(“Enter your email”); return; }
if (mode !== “forgot” && password.length < 6) { setErr(“Password must be 6+ characters”); return; }
if (mode === “signup” && !name.trim()) { setErr(“Enter your name”); return; }
setLoading(true);

```
// Simulate network delay
setTimeout(function() {
  var users = getUsers();

  if (mode === "signup") {
    if (users[email]) { setErr("Account already exists. Please log in."); setLoading(false); return; }
    var newUser = { id:"u-"+Date.now(), name:name.trim(), email:email, avatar:"", plan:"free", password:password };
    users[email] = newUser;
    saveUsers(users);
    var authUser = { id:newUser.id, name:newUser.name, email:newUser.email, avatar:"", plan:"free" };
    saveUser(authUser);
    setLoading(false);
    onAuth(authUser);

  } else if (mode === "login") {
    var found = users[email];
    if (!found) { setErr("No account found. Sign up first."); setLoading(false); return; }
    if (found.password !== password) { setErr("Incorrect password."); setLoading(false); return; }
    var authUser = { id:found.id, name:found.name, email:found.email, avatar:"", plan:found.plan||"free" };
    saveUser(authUser);
    setLoading(false);
    onAuth(authUser);

  } else if (mode === "forgot") {
    // In production: call your email API here
    setResetSent(true);
    setLoading(false);
  }
}, 700);
```

}

var INP = {
width:“100%”, background:”#111”, border:“1px solid #222”, borderRadius:12,
padding:“13px 16px”, color:”#fff”, fontSize:15, outline:“none”,
boxSizing:“border-box”, marginBottom:10,
};

return (
<div style={{ minHeight:“100vh”, background:”#070710”, color:”#fff”,
display:“flex”, flexDirection:“column”, alignItems:“center”,
justifyContent:“center”, padding:“28px 24px”, position:“relative”, overflow:“hidden” }}>
<Glow color="#00ffaa" top={-80} size={420} opacity={0.09} />
<Glow color="#c9a84c" top={600} left="80%" size={260} opacity={0.06} />

```
  <div style={{ width:"100%", maxWidth:360, position:"relative", zIndex:2 }}>

    {/* Logo */}
    <div style={{ textAlign:"center", marginBottom:32 }}>
      <div style={{ fontSize:34, fontWeight:900, letterSpacing:-2 }}>
        Cash<span style={{ color:"#00ffaa" }}>Drop</span>
      </div>
      <div style={{ fontSize:13, color:"#555", marginTop:4 }}>Earn cashback. Automatically.</div>
    </div>

    {/* Mode toggle */}
    {mode !== "forgot" && (
      <div style={{ display:"flex", background:"#0f0f18", borderRadius:14, padding:4, marginBottom:20 }}>
        {["login","signup"].map(function(m) {
          return (
            <button key={m} onClick={function() { setMode(m); setErr(""); }} style={{
              flex:1, padding:"10px 0", borderRadius:11, border:"none",
              background: mode===m ? "#00ffaa" : "transparent",
              color: mode===m ? "#000" : "#444",
              fontWeight:800, fontSize:13, cursor:"pointer" }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          );
        })}
      </div>
    )}

    {/* Forgot password view */}
    {mode === "forgot" && (
      <div style={{ marginBottom:20 }}>
        <button onClick={function() { setMode("login"); setErr(""); setResetSent(false); }}
          style={{ background:"none", border:"none", color:"#555",
            fontSize:13, cursor:"pointer", marginBottom:16, padding:0 }}>
          ← Back to login
        </button>
        <div style={{ fontWeight:900, fontSize:20, marginBottom:6 }}>Reset Password</div>
        <div style={{ fontSize:13, color:"#555", marginBottom:20 }}>
          We'll send a reset link to your email.
        </div>
      </div>
    )}

    {resetSent ? (
      <div style={{ background:"#00ffaa15", border:"1px solid #00ffaa40",
        borderRadius:14, padding:"20px 16px", textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:28, marginBottom:8 }}>📬</div>
        <div style={{ fontWeight:800, color:"#00ffaa" }}>Reset link sent!</div>
        <div style={{ fontSize:13, color:"#555", marginTop:6 }}>Check your inbox for {email}</div>
        <button onClick={function() { setMode("login"); setResetSent(false); }}
          style={{ marginTop:14, background:"#00ffaa", color:"#000", border:"none",
            borderRadius:10, padding:"9px 20px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
          Back to Login
        </button>
      </div>
    ) : (
      <>
        {/* Email fields */}
        {mode === "signup" && (
          <input placeholder="Full name" value={name}
            onChange={function(e) { setName(e.target.value); }} style={INP} />
        )}
        <input placeholder="Email address" value={email} type="email"
          onChange={function(e) { setEmail(e.target.value); }} style={INP} />

        {mode !== "forgot" && (
          <div style={{ position:"relative", marginBottom:mode==="login"?6:10 }}>
            <input placeholder="Password (6+ characters)" value={password}
              type={showPass ? "text" : "password"}
              onChange={function(e) { setPassword(e.target.value); }}
              style={{ ...INP, marginBottom:0, paddingRight:48 }} />
            <button onClick={function() { setShowPass(!showPass); }} style={{
              position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", color:"#555",
              fontSize:16, cursor:"pointer", padding:0 }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        )}

        {mode === "login" && (
          <div style={{ textAlign:"right", marginBottom:14 }}>
            <span onClick={function() { setMode("forgot"); setErr(""); }}
              style={{ color:"#00ffaa", fontSize:12, cursor:"pointer", fontWeight:600 }}>
              Forgot password?
            </span>
          </div>
        )}

        {err && (
          <div style={{ color:"#ff2d55", fontSize:13, marginBottom:12, textAlign:"center",
            background:"#ff2d5510", borderRadius:10, padding:"10px" }}>
            {err}
          </div>
        )}

        {/* Email submit button */}
        <button onClick={handleEmailSubmit} disabled={loading} style={{
          width:"100%", background: loading ? "#1a1a1a" : "#00ffaa",
          color: loading ? "#444" : "#000", border:"none",
          borderRadius:14, padding:"14px", fontWeight:900,
          fontSize:15, cursor: loading ? "default" : "pointer", marginBottom:16 }}>
          {loading ? "Please wait…"
            : mode === "signup" ? "Create Account →"
            : mode === "forgot" ? "Send Reset Link"
            : "Log In →"}
        </button>

        {/* Divider */}
        {mode !== "forgot" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:"#1a1a1a" }} />
              <span style={{ fontSize:12, color:"#333" }}>or continue with</span>
              <div style={{ flex:1, height:1, background:"#1a1a1a" }} />
            </div>

            {/* Google button */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
              <div id="google-btn" style={{ width:"100%", minHeight:44 }}></div>
            </div>

            {loading && (
              <div style={{ color:"#00ffaa", fontSize:13, fontWeight:700,
                textAlign:"center", marginTop:8 }}>Signing you in…</div>
            )}
          </>
        )}
      </>
    )}

    <div style={{ marginTop:20, fontSize:11, color:"#2a2a2a", textAlign:"center", lineHeight:1.7 }}>
      By continuing you agree to our Terms & Privacy Policy.
    </div>
  </div>

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    input::placeholder { color:#333; }
  `}</style>
</div>
```

);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function AppMain({ user, onLogout }) {
var [tab, setTab]           = useState(“deals”);
var [cat, setCat]           = useState(“All”);
var [balance, setBalance]   = useState(47.32);
var [activated, setActivated] = useState([]);
var [showPro, setShowPro]   = useState(false);
var [isPro, setIsPro]       = useState(user.plan === “pro”);
var [toast, setToast]       = useState(null);
var [search, setSearch]     = useState(””);
var [showAdmin, setShowAdmin] = useState(false);
var [txns, setTxns]         = useState([
{ brand:“Amazon”,  amount:1.24, date:“2 days ago” },
{ brand:“Nike”,    amount:3.80, date:“4 days ago” },
{ brand:“Sephora”, amount:6.50, date:“1 week ago” },
]);

function showToast(msg) { setToast(msg); setTimeout(function() { setToast(null); }, 3000); }

function activateDeal(deal) {
if (activated.indexOf(deal.id) > -1) return;
setActivated(function(p) { return p.concat([deal.id]); });
var earned = parseFloat((Math.random() * 2.5 + 0.5).toFixed(2));
setBalance(function(p) { return parseFloat((p + earned).toFixed(2)); });
setTxns(function(p) { return [{ brand:deal.brand, amount:earned, date:“Just now” }].concat(p); });
showToast(”+$” + earned.toFixed(2) + “ from “ + deal.brand + “ 🎉”);
}

function handleLogout() {
if (window.google && window.google.accounts) {
window.google.accounts.id.disableAutoSelect();
}
clearUser();
onLogout();
}

var filtered = DEALS.filter(function(d) {
var matchCat    = cat === “All” || d.cat === cat;
var matchSearch = d.brand.toLowerCase().indexOf(search.toLowerCase()) > -1;
return matchCat && matchSearch;
});

var firstName = user.name ? user.name.split(” “)[0] : “there”;
var isAdmin   = user.email === “admin@cashdrop.com” || user.email === “toussaintshelton6@gmail.com”;

if (showAdmin) return <AdminDash onBack={function() { setShowAdmin(false); }} />;

return (
<div style={{ fontFamily:”‘Syne’,‘DM Sans’,sans-serif”, background:”#070710”,
minHeight:“100vh”, color:”#fff”, maxWidth:430, margin:“0 auto”, position:“relative” }}>

```
  {toast && (
    <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
      background:"#00ffaa", color:"#000", fontWeight:800,
      padding:"12px 24px", borderRadius:40, zIndex:999, fontSize:13,
      boxShadow:"0 0 30px rgba(0,255,170,0.4)", whiteSpace:"nowrap",
      animation:"fadeUp .3s ease" }}>
      {toast}
    </div>
  )}

  {/* Header */}
  <div style={{ padding:"52px 24px 16px",
    background:"linear-gradient(180deg,rgba(0,255,170,0.05) 0%,transparent 100%)",
    position:"relative" }}>
    <Glow color="#00ffaa" top={-60} size={350} opacity={0.07} />
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", zIndex:1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {user.avatar ? (
          <img src={user.avatar} style={{ width:34, height:34, borderRadius:"50%",
            border:"2px solid #00ffaa40" }} alt="avatar" />
        ) : (
          <div style={{ width:34, height:34, borderRadius:"50%",
            background:"#00ffaa30", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:16, border:"2px solid #00ffaa40" }}>
            {firstName[0]}
          </div>
        )}
        <div>
          <div style={{ fontSize:15, fontWeight:900, letterSpacing:-.5 }}>
            Hi, {firstName} 👋
          </div>
          <div style={{ fontSize:10, color:"#444" }}>
            {isPro ? "⭐ Pro Member" : "Free Member"}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {isAdmin && (
          <button onClick={function() { setShowAdmin(true); }} style={{
            background:"#c9a84c20", color:"#c9a84c",
            border:"1px solid #c9a84c40", borderRadius:10,
            padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer" }}>
            Admin
          </button>
        )}
        {!isPro && (
          <button onClick={function() { setShowPro(true); }} style={{
            background:"linear-gradient(135deg,#c9a84c,#f5d78e)",
            color:"#000", fontSize:11, fontWeight:900,
            padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer" }}>
            Go Pro
          </button>
        )}
        {isPro && (
          <div style={{ background:"linear-gradient(135deg,#c9a84c,#f5d78e)",
            color:"#000", fontSize:11, fontWeight:900,
            padding:"6px 14px", borderRadius:20 }}>⭐ PRO</div>
        )}
        <button onClick={handleLogout} style={{ background:"#111", color:"#555",
          border:"1px solid #1a1a1a", borderRadius:10, padding:"6px 10px",
          fontSize:13, cursor:"pointer" }}>↩</button>
      </div>
    </div>

    {/* Wallet */}
    <div style={{ marginTop:18, background:"linear-gradient(135deg,#00ffaa12,#00ffaa04)",
      border:"1px solid #00ffaa25", borderRadius:20, padding:"18px 20px",
      display:"flex", justifyContent:"space-between", alignItems:"center",
      position:"relative", zIndex:1 }}>
      <div>
        <div style={{ fontSize:11, color:"#444", fontWeight:700, letterSpacing:.5 }}>YOUR CASHBACK</div>
        <div style={{ fontSize:38, fontWeight:900, color:"#00ffaa", letterSpacing:-2, lineHeight:1.1 }}>
          ${balance.toFixed(2)}
        </div>
        <div style={{ fontSize:12, color:"#333", marginTop:4 }}>
          {activated.length} deals active · {isPro ? "2× PRO" : "Standard"}
        </div>
      </div>
      <button onClick={function() { showToast("Cash out coming soon! 💳"); }} style={{
        background:"#00ffaa", color:"#000", fontWeight:900, border:"none",
        borderRadius:14, padding:"12px 16px", fontSize:13, cursor:"pointer",
        boxShadow:"0 0 20px rgba(0,255,170,0.25)" }}>
        Cash Out
      </button>
    </div>
  </div>

  {/* Tabs */}
  <div style={{ display:"flex", margin:"12px 24px 16px",
    background:"#0f0f18", borderRadius:14, padding:4 }}>
    {[["deals","🔥 Deals"],["wallet","💳 Wallet"],["refer","👥 Refer"]].map(function(item) {
      return (
        <button key={item[0]} onClick={function() { setTab(item[0]); }} style={{
          flex:1, padding:"10px 0", borderRadius:11, border:"none",
          background: tab === item[0] ? "#00ffaa" : "transparent",
          color: tab === item[0] ? "#000" : "#444",
          fontWeight:800, fontSize:12, cursor:"pointer" }}>
          {item[1]}
        </button>
      );
    })}
  </div>

  {/* DEALS TAB */}
  {tab === "deals" && (
    <div>
      <div style={{ margin:"0 24px 12px" }}>
        <input placeholder="🔍  Search brands…" value={search}
          onChange={function(e) { setSearch(e.target.value); }}
          style={{ width:"100%", background:"#0f0f18", border:"1px solid #1a1a1a",
            borderRadius:12, padding:"11px 16px", color:"#fff",
            fontSize:14, outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* Ad slot */}
      <div style={{ margin:"0 24px 14px", background:"linear-gradient(135deg,#1a1a2e,#16213e)",
        border:"1px solid #c9a84c35", borderRadius:18, padding:"14px 18px" }}>
        <div style={{ fontSize:9, color:"#c9a84c", fontWeight:700, letterSpacing:1, marginBottom:6 }}>SPONSORED</div>
        <div style={{ fontWeight:800, fontSize:15 }}>Chase Sapphire Preferred®</div>
        <div style={{ color:"#888", fontSize:12, marginTop:3 }}>60,000 bonus points — $750 in travel</div>
        <button style={{ marginTop:10, background:"#c9a84c", color:"#000", border:"none",
          borderRadius:9, padding:"7px 14px", fontWeight:800, fontSize:11, cursor:"pointer" }}>
          Apply Now →
        </button>
      </div>

      {/* Categories */}
      <div style={{ display:"flex", gap:8, padding:"0 24px 12px", overflowX:"auto", scrollbarWidth:"none" }}>
        {CATS.map(function(c) {
          return (
            <button key={c} onClick={function() { setCat(c); }} style={{
              padding:"7px 16px", borderRadius:20, border:"none",
              background: cat === c ? "#00ffaa" : "#0f0f18",
              color: cat === c ? "#000" : "#444",
              fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Deal cards */}
      <div style={{ padding:"0 24px 120px", display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(function(d) {
          var on  = activated.indexOf(d.id) > -1;
          var pct = isPro ? (parseInt(d.cashback) * 2) + "%" : d.cashback;
          return (
            <div key={d.id} style={{ background: on ? "#00ffaa08" : "#0f0f18",
              border: on ? "1px solid #00ffaa35" : "1px solid #1a1a1a",
              borderRadius:18, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:14,
                background:d.color+"22", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:24, flexShrink:0,
                border:"1px solid "+d.color+"33" }}>{d.logo}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontWeight:800, fontSize:14 }}>{d.brand}</span>
                  <Badge label={d.badge} />
                </div>
                <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{d.deal}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:20, fontWeight:900, color:"#00ffaa", lineHeight:1 }}>{pct}</div>
                <div style={{ fontSize:10, color:"#333", marginBottom:6 }}>back</div>
                <button onClick={function() { activateDeal(d); }} style={{
                  background: on ? "#00ffaa15" : "#00ffaa",
                  color: on ? "#00ffaa" : "#000",
                  border: on ? "1px solid #00ffaa35" : "none",
                  borderRadius:10, padding:"6px 12px",
                  fontWeight:800, fontSize:11, cursor: on ? "default" : "pointer" }}>
                  {on ? "✓ Active" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", color:"#444", padding:"40px 0" }}>
            <div style={{ fontSize:32 }}>🔍</div>
            <div style={{ marginTop:10 }}>No deals found for "{search}"</div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* WALLET TAB */}
  {tab === "wallet" && (
    <div style={{ padding:"0 24px 100px" }}>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:16 }}>Transaction History</div>
      {txns.map(function(t, i) {
        return (
          <div key={i} style={{ background:"#0f0f18", border:"1px solid #1a1a1a",
            borderRadius:14, padding:"14px 16px", marginBottom:10,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700 }}>{t.brand}</div>
              <div style={{ fontSize:12, color:"#444", marginTop:2 }}>{t.date}</div>
            </div>
            <div style={{ color:"#00ffaa", fontWeight:900, fontSize:16 }}>+${t.amount.toFixed(2)}</div>
          </div>
        );
      })}
      <div style={{ marginTop:16, background:"#0f0f18", border:"1px solid #1a1a1a", borderRadius:18, padding:20 }}>
        <div style={{ fontWeight:800, marginBottom:4 }}>Cash Out</div>
        <div style={{ fontSize:12, color:"#555", marginBottom:16 }}>Min. $10 to withdraw</div>
        {["PayPal","Venmo","Gift Card","Bank Transfer"].map(function(o) {
          return (
            <div key={o} style={{ padding:"12px 0", borderBottom:"1px solid #1a1a1a",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14 }}>{o}</span>
              <button onClick={function() { showToast("Cash out coming soon! 💳"); }} style={{
                background: balance >= 10 ? "#00ffaa" : "#1a1a1a",
                color: balance >= 10 ? "#000" : "#333",
                border:"none", borderRadius:9, padding:"7px 16px",
                fontWeight:800, fontSize:12, cursor:"pointer" }}>
                Withdraw
              </button>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* REFER TAB */}
  {tab === "refer" && (
    <div style={{ padding:"0 24px 100px" }}>
      <div style={{ background:"linear-gradient(135deg,#00ffaa15,#00ffaa05)",
        border:"1px solid #00ffaa35", borderRadius:20, padding:24,
        textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:40 }}>🎁</div>
        <div style={{ fontSize:22, fontWeight:900, marginTop:12 }}>Refer & Earn $5</div>
        <div style={{ fontSize:13, color:"#555", marginTop:8, lineHeight:1.6 }}>
          For every friend who signs up and activates their first deal, you get{" "}
          <span style={{ color:"#00ffaa", fontWeight:700 }}>$5 cash</span>
        </div>
        <div style={{ marginTop:20, background:"#0f0f18", borderRadius:12,
          padding:"13px 16px", fontSize:16, fontWeight:900, letterSpacing:2, color:"#00ffaa" }}>
          CASH-{firstName.toUpperCase()}
        </div>
        <button onClick={function() { showToast("Link copied! Share with friends 🔗"); }} style={{
          marginTop:12, background:"#00ffaa", color:"#000", border:"none",
          borderRadius:12, padding:"13px 32px", fontWeight:900,
          fontSize:14, cursor:"pointer", width:"100%" }}>
          📤 Share My Link
        </button>
      </div>
      {[
        { name:"Marcus T.", earned:"$5.00", status:"Paid"    },
        { name:"Priya K.",  earned:"$5.00", status:"Pending" },
      ].map(function(r) {
        return (
          <div key={r.name} style={{ background:"#0f0f18", border:"1px solid #1a1a1a",
            borderRadius:14, padding:"14px 16px", marginBottom:10,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700 }}>{r.name}</div>
              <div style={{ fontSize:12, color: r.status === "Paid" ? "#00ffaa" : "#555", marginTop:2 }}>{r.status}</div>
            </div>
            <div style={{ color:"#00ffaa", fontWeight:900 }}>{r.earned}</div>
          </div>
        );
      })}
    </div>
  )}

  {/* PRO MODAL */}
  {showPro && (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)",
      display:"flex", alignItems:"flex-end", zIndex:200 }}
      onClick={function() { setShowPro(false); }}>
      <div style={{ background:"#0e0e18", borderRadius:"24px 24px 0 0",
        padding:"32px 24px 52px", width:"100%",
        border:"1px solid #c9a84c35" }}
        onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:40 }}>⭐</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#c9a84c", marginTop:8 }}>CashDrop Pro</div>
          <div style={{ color:"#555", fontSize:13, marginTop:6 }}>Supercharge your earnings</div>
        </div>
        {["2× cashback on ALL deals","Priority same-day cash out","Early access to limited deals","Ad-free experience","Exclusive brand partnerships"].map(function(f) {
          return (
            <div key={f} style={{ display:"flex", gap:12, marginBottom:14, alignItems:"center" }}>
              <span style={{ color:"#c9a84c", fontSize:16 }}>✦</span>
              <span style={{ fontSize:14 }}>{f}</span>
            </div>
          );
        })}
        <button onClick={function() {
          
          window.location.href = "https://buy.stripe.com/9B628tddM78CcoE1Vlgw008";
          showToast("Welcome to Pro! 2× cashback is live 🚀");
        }} style={{ width:"100%", background:"linear-gradient(135deg,#c9a84c,#f5d78e)",
          color:"#000", border:"none", borderRadius:16,
          padding:"16px", fontWeight:900, fontSize:16, cursor:"pointer" }}>
          Upgrade to Pro — {PRO_PRICE}
        </button>
        <button onClick={function() { setShowPro(false); }} style={{ width:"100%", marginTop:10,
          background:"transparent", color:"#444", border:"none",
          fontSize:13, cursor:"pointer", padding:8 }}>Maybe later</button>
      </div>
    </div>
  )}

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { display:none; }
    @keyframes fadeUp {
      from { opacity:0; transform:translateX(-50%) translateY(-16px); }
      to   { opacity:1; transform:translateX(-50%) translateY(0); }
    }
    input::placeholder { color:#333; }
  `}</style>
</div>
```

);
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminDash({ onBack }) {
var stats = [
{ label:“Total Revenue”,     value:”$12,847”, icon:“💰”, color:”#00ffaa” },
{ label:“Total Users”,       value:“1,243”,   icon:“👥”, color:”#c9a84c” },
{ label:“Pro Subscribers”,   value:“187”,     icon:“⭐”, color:”#ff9900” },
{ label:“Commission Earned”, value:”$3,429”,  icon:“📈”, color:”#00ffaa” },
{ label:“Pending Payouts”,   value:”$892”,    icon:“⏳”, color:”#ff2d55” },
{ label:“Top Deal”,          value:“Uber Eats”,icon:“🔥”,color:”#ff4d00” },
];
return (
<div style={{ fontFamily:”‘Syne’,‘DM Sans’,sans-serif”, background:”#070710”,
minHeight:“100vh”, color:”#fff”, maxWidth:430, margin:“0 auto” }}>
<div style={{ padding:“52px 24px 20px”,
background:“linear-gradient(180deg,rgba(201,168,76,0.08) 0%,transparent 100%)” }}>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center” }}>
<div>
<div style={{ fontSize:11, color:”#c9a84c”, fontWeight:700, letterSpacing:1, marginBottom:4 }}>ADMIN</div>
<div style={{ fontSize:22, fontWeight:900 }}>Dashboard</div>
</div>
<button onClick={onBack} style={{ background:”#1a1a1a”, color:”#666”,
border:“none”, borderRadius:10, padding:“8px 16px”,
fontSize:12, fontWeight:700, cursor:“pointer” }}>← Back</button>
</div>
</div>
<div style={{ padding:“0 24px 80px” }}>
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:10, marginBottom:24 }}>
{stats.map(function(c) {
return (
<div key={c.label} style={{ background:”#0f0f18”, border:“1px solid #1a1a1a”, borderRadius:16, padding:“16px” }}>
<div style={{ fontSize:20 }}>{c.icon}</div>
<div style={{ fontSize:22, fontWeight:900, color:c.color, marginTop:6, letterSpacing:-1 }}>{c.value}</div>
<div style={{ fontSize:11, color:”#444”, marginTop:2 }}>{c.label}</div>
</div>
);
})}
</div>
<div style={{ background:”#0f0f18”, border:“1px solid #1a1a1a”, borderRadius:18, padding:20, marginBottom:20 }}>
<div style={{ fontWeight:800, marginBottom:16 }}>Revenue Breakdown</div>
{[
{ src:“Pro Subscriptions”,    val:”$933”,  pct:73, color:”#c9a84c” },
{ src:“Affiliate Commission”, val:”$3,429”, pct:22, color:”#00ffaa” },
{ src:“Ad Revenue”,           val:”$420”,  pct:5,  color:”#ff9900” },
].map(function(r) {
return (
<div key={r.src} style={{ marginBottom:14 }}>
<div style={{ display:“flex”, justifyContent:“space-between”, marginBottom:6 }}>
<span style={{ fontSize:13 }}>{r.src}</span>
<span style={{ fontWeight:800, color:r.color }}>{r.val}</span>
</div>
<div style={{ background:”#1a1a1a”, borderRadius:6, height:6 }}>
<div style={{ width:r.pct+”%”, height:6, borderRadius:6, background:r.color }} />
</div>
</div>
);
})}
</div>
</div>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;600;700;800&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
</div>
);
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CashDrop() {
var [screen, setScreen] = useState(“loading”);
var [user, setUser]     = useState(null);

useEffect(function() {
var saved = loadUser();
if (saved && saved.id) {
setUser(saved);
setScreen(“app”);
} else {
setScreen(“auth”);
}
}, []);

if (screen === “loading”) {
return (
<div style={{ minHeight:“100vh”, background:”#070710”, display:“flex”,
alignItems:“center”, justifyContent:“center”,
fontFamily:”‘Syne’,sans-serif”, color:”#00ffaa”, fontSize:28, fontWeight:900 }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@900&display=swap');`}</style>
Cash<span style={{ color:”#fff” }}>Drop</span>
</div>
);
}

if (screen === “auth”) {
return <AuthScreen onAuth={function(u) { setUser(u); setScreen(“app”); }} />;
}

return <AppMain user={user} onLogout={function() { setUser(null); setScreen(“auth”); }} />;
}
