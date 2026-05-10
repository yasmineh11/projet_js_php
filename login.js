// =============================================
//  login.js — Logique page Login / Sign Up
//  Make Up Online
// =============================================

const AUTH_ENDPOINT = "/api/auth.php";

// ─────────────────────────────────────────────
//  1. NAVIGATION ENTRE LES ONGLETS
// ─────────────────────────────────────────────
function switchTab(tab) {
    ["login", "signup"].forEach(t => {
        document.getElementById("tab-"  + t).classList.toggle("active", t === tab);
        document.getElementById("form-" + t).classList.toggle("active", t === tab);
    });
    clearAllErrors();
}

// ─────────────────────────────────────────────
//  2. AFFICHER / CACHER LE MOT DE PASSE
// ─────────────────────────────────────────────
function togglePw(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!input || !icon) return;
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    icon.classList.toggle("fa-eye",       !hidden);
    icon.classList.toggle("fa-eye-slash",  hidden);
}

// ─────────────────────────────────────────────
//  3. BARRE DE FORCE DU MOT DE PASSE
// ─────────────────────────────────────────────
function checkStrength(value) {
    const wrap  = document.getElementById("strength-bar-wrap");
    const fill  = document.getElementById("strength-fill");
    const label = document.getElementById("strength-label");
    if (!wrap) return;

    if (!value) { wrap.style.display = "none"; return; }
    wrap.style.display = "block";

    let score = 0;
    if (value.length >= 8)           score++;
    if (/[A-Z]/.test(value))         score++;
    if (/[0-9]/.test(value))         score++;
    if (/[^A-Za-z0-9]/.test(value))  score++;

    const levels = [
        { label: "Too short",  color: "#e91e63", width: "15%"  },
        { label: "Weak",       color: "#ff5722", width: "35%"  },
        { label: "Fair",       color: "#ff9800", width: "60%"  },
        { label: "Good",       color: "#8bc34a", width: "80%"  },
        { label: "Strong ✓",   color: "#4caf50", width: "100%" },
    ];

    const lvl = levels[Math.min(score, 4)];
    fill.style.width      = lvl.width;
    fill.style.background = lvl.color;
    label.textContent     = lvl.label;
    label.style.color     = lvl.color;
}

// ─────────────────────────────────────────────
//  4. GESTION DES ERREURS DE FORMULAIRE
// ─────────────────────────────────────────────
function setError(groupId, errorId, show) {
    const group = document.getElementById(groupId);
    const error = document.getElementById(errorId);
    if (!group || !error) return;
    group.classList.toggle("has-error", show);
    group.classList.toggle("is-valid",  !show);
    error.style.display = show ? "block" : "none";
}

function clearAllErrors() {
    document.querySelectorAll(".input-group").forEach(g => {
        g.classList.remove("has-error", "is-valid");
    });
    document.querySelectorAll(".field-error").forEach(e => e.style.display = "none");
    hideAlert("login-alert");
    hideAlert("signup-alert");
}

// ─────────────────────────────────────────────
//  5. ALERTES (bandeau vert / rouge)
// ─────────────────────────────────────────────
function showAlert(id, type, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "auth-alert " + type + " show";
    el.textContent = (type === "success" ? "✓  " : "⚠  ") + msg;
}

function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.className = "auth-alert";
}

// ─────────────────────────────────────────────
//  6. ÉTAT CHARGEMENT DU BOUTON
// ─────────────────────────────────────────────
function setLoading(btnId, spinnerId, loading) {
    const btn     = document.getElementById(btnId);
    const spinner = document.getElementById(spinnerId);
    if (!btn || !spinner) return;
    btn.disabled          = loading;
    spinner.style.display = loading ? "block" : "none";
}

// ─────────────────────────────────────────────
//  7. VALIDATION EMAIL
// ─────────────────────────────────────────────
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─────────────────────────────────────────────
//  8. CONNEXION (LOGIN)
// ─────────────────────────────────────────────
async function handleLogin() {
    hideAlert("login-alert");
    let valid = true;

    const email = document.getElementById("login-email")?.value.trim() || "";
    const pw    = document.getElementById("login-pw")?.value            || "";

    if (!isValidEmail(email)) {
        setError("ig-login-email", "err-login-email", true);
        valid = false;
    } else {
        setError("ig-login-email", "err-login-email", false);
    }

    if (!pw) {
        setError("ig-login-pw", "err-login-pw", true);
        valid = false;
    } else {
        setError("ig-login-pw", "err-login-pw", false);
    }

    if (!valid) return;

    setLoading("btn-login", "spinner-login", true);

    try {
        const res  = await fetch(AUTH_ENDPOINT + "?action=login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: email, password: pw })
        });

        const data = await res.json();
        console.log("Login response:", data);

        if (data.success) {
            localStorage.setItem("makeup_user", JSON.stringify({
                id:    data.user.id,
                name:  data.user.name,
                email: data.user.email
            }));
            showAlert("login-alert", "success", "Welcome back, " + data.user.name + "! Redirecting…");
            setTimeout(() => { window.location.href = "html_page.html"; }, 1400);
        } else {
            showAlert("login-alert", "error", data.error || "Invalid email or password.");
        }

    } catch (err) {
        console.error("Login error:", err);
        showAlert("login-alert", "error", "Connection error. Please try again.");
    } finally {
        setLoading("btn-login", "spinner-login", false);
    }
}

// ─────────────────────────────────────────────
//  9. INSCRIPTION (SIGNUP)
// ─────────────────────────────────────────────
async function handleSignup() {
    hideAlert("signup-alert");
    let valid = true;

    const firstname = document.getElementById("signup-firstname")?.value.trim() || "";
    const lastname  = document.getElementById("signup-lastname")?.value.trim()  || "";
    const email     = document.getElementById("signup-email")?.value.trim()     || "";
    const pw        = document.getElementById("signup-pw")?.value               || "";
    const pw2       = document.getElementById("signup-pw2")?.value              || "";
    const terms     = document.getElementById("signup-terms")?.checked;

    if (!firstname) { setError("ig-firstname",    "err-firstname",    true);  valid = false; }
    else            { setError("ig-firstname",    "err-firstname",    false); }

    if (!lastname)  { setError("ig-lastname",     "err-lastname",     true);  valid = false; }
    else            { setError("ig-lastname",     "err-lastname",     false); }

    if (!isValidEmail(email)) { setError("ig-signup-email", "err-signup-email", true);  valid = false; }
    else                       { setError("ig-signup-email", "err-signup-email", false); }

    if (!pw || pw.length < 6) { setError("ig-signup-pw", "err-signup-pw", true);  valid = false; }
    else                       { setError("ig-signup-pw", "err-signup-pw", false); }

    if (!pw2 || pw !== pw2)   { setError("ig-signup-pw2", "err-signup-pw2", true);  valid = false; }
    else                       { setError("ig-signup-pw2", "err-signup-pw2", false); }

    const termsErr = document.getElementById("err-terms");
    if (!terms) {
        if (termsErr) termsErr.style.display = "block";
        valid = false;
    } else {
        if (termsErr) termsErr.style.display = "none";
    }

    if (!valid) return;

    setLoading("btn-signup", "spinner-signup", true);

    try {
        const res  = await fetch(AUTH_ENDPOINT + "?action=register", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                name:     firstname + " " + lastname,
                email:    email,
                password: pw
            })
        });

        const data = await res.json();
        console.log("Register response:", data);

        if (data.success) {
            localStorage.setItem("makeup_user", JSON.stringify({
                id:    data.user.id,
                name:  data.user.name,
                email: data.user.email
            }));
            showAlert("signup-alert", "success", "Account created! Redirecting…");
            setTimeout(() => { window.location.href = "html_page.html"; }, 1800);
        } else {
            showAlert("signup-alert", "error", data.error || "Registration failed.");
        }

    } catch (err) {
        console.error("Signup error:", err);
        showAlert("signup-alert", "error", "Connection error. Please try again.");
    } finally {
        setLoading("btn-signup", "spinner-signup", false);
    }
}

// ─────────────────────────────────────────────
//  10. CONNEXION SOCIALE (stub)
// ─────────────────────────────────────────────
function socialLogin(provider) {
    showAlert("login-alert", "success", provider + " login coming soon…");
}

// ─────────────────────────────────────────────
//  11. INITIALISATION
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        const active = document.querySelector(".auth-form.active");
        if (!active) return;
        if (active.id === "form-login")  handleLogin();
        if (active.id === "form-signup") handleSignup();
    });
});