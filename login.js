// =============================================
//  login.js — Logique page Login / Sign Up
//  Make Up Online
// =============================================

const AUTH_ENDPOINT = "auth.php"; // Chemin vers le backend PHP

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

    // Calcul du score (0 à 4)
    let score = 0;
    if (value.length >= 8)           score++; // longueur suffisante
    if (/[A-Z]/.test(value))         score++; // majuscule
    if (/[0-9]/.test(value))         score++; // chiffre
    if (/[^A-Za-z0-9]/.test(value))  score++; // caractère spécial

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
    group.classList.toggle("error",   show);
    group.classList.toggle("success", !show);
    error.style.display = show ? "block" : "none";
}

function clearAllErrors() {
    document.querySelectorAll(".input-group").forEach(g => {
        g.classList.remove("error", "success");
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
    el.className = "auth-alert " + type + " show"; // ← ajoute "show"
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

    // Validation côté client
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
        // Envoi vers auth.php
        const form = new FormData();
        form.append("action",      "login");
        form.append("email",       email);
        form.append("password",    pw);
        form.append("remember_me", document.getElementById("remember-me")?.checked ? "1" : "0");

        const res = await fetch(AUTH_ENDPOINT, { method: "POST", body: form });
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
            throw new Error("auth.php not available");
        }
        const data = await res.json();

        if (data.success) {
            // Stocker l'utilisateur dans localStorage
            localStorage.setItem("makeup_user", JSON.stringify({
                id: data.id, name: data.name, email: data.email
            }));
            showAlert("login-alert", "success", "Welcome back, " + data.name + "! Redirecting…");
            setTimeout(() => { window.location.href = "html_page.html"; }, 1400);
        } else {
            showAlert("login-alert", "error", data.message || "Invalid email or password.");
        }

    } catch (err) {
        // auth.php inaccessible → mode démo localStorage
        console.warn("auth.php not reachable — demo mode:", err);
        demoLogin(email, pw);
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

    // Validation de chaque champ
    if (!firstname) { setError("ig-firstname",    "err-firstname",    true);  valid = false; }
    else            { setError("ig-firstname",    "err-firstname",    false); }

    if (!lastname)  { setError("ig-lastname",     "err-lastname",     true);  valid = false; }
    else            { setError("ig-lastname",     "err-lastname",     false); }

    if (!isValidEmail(email)) { setError("ig-signup-email", "err-signup-email", true);  valid = false; }
    else                       { setError("ig-signup-email", "err-signup-email", false); }

    if (!pw || pw.length < 8) { setError("ig-signup-pw",    "err-signup-pw",    true);  valid = false; }
    else                       { setError("ig-signup-pw",    "err-signup-pw",    false); }

    if (!pw2 || pw !== pw2)   { setError("ig-signup-pw2",   "err-signup-pw2",   true);  valid = false; }
    else                       { setError("ig-signup-pw2",   "err-signup-pw2",   false); }

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
        const form = new FormData();
        form.append("action",    "signup");
        form.append("firstname", firstname);
        form.append("lastname",  lastname);
        form.append("email",     email);
        form.append("password",  pw);

        const res = await fetch(AUTH_ENDPOINT, { method: "POST", body: form });
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
            throw new Error("auth.php not available");
        }
        const data = await res.json();

        if (data.success) {
            showAlert("signup-alert", "success", "Account created! Redirecting to login…");
            setTimeout(() => switchTab("login"), 2000);
        } else {
            showAlert("signup-alert", "error", data.message || "Registration failed.");
        }

    } catch (err) {
        console.warn("auth.php not reachable — demo mode:", err);
        demoSignup(firstname, email, pw);
    } finally {
        setLoading("btn-signup", "spinner-signup", false);
    }
}

// ─────────────────────────────────────────────
//  10. CONNEXION SOCIALE (stub)
// ─────────────────────────────────────────────
function socialLogin(provider) {
    showAlert("login-alert", "success", "Connexion via " + provider + "… (Demo)");
    localStorage.setItem("makeup_user", JSON.stringify({
        id: Date.now(),
        name: provider + "User",
        email: provider.toLowerCase() + "@demo.com"
    }));
    setTimeout(() => { window.location.href = "html_page.html"; }, 1400);
}

// ─────────────────────────────────────────────
//  11. MODE DÉMO (sans PHP / Oracle)
//  Stocke les comptes dans localStorage
// ─────────────────────────────────────────────
function demoLogin(email, pw) {
    const accounts = JSON.parse(localStorage.getItem("makeup_accounts") || "[]");
    const account  = accounts.find(a => a.email === email && a.pw === btoa(pw));

    if (account) {
        localStorage.setItem("makeup_user", JSON.stringify({
            id: account.id, name: account.name, email: account.email
        }));
        showAlert("login-alert", "success", "Welcome back, " + account.name + "! (Demo) Redirecting…");
    } else {
        // Accepter n'importe quel identifiant en mode démo
        const name = email.split("@")[0];
        localStorage.setItem("makeup_user", JSON.stringify({ id: Date.now(), name, email }));
        showAlert("login-alert", "success", "Welcome, " + name + "! (Demo mode) Redirecting…");
    }
    setTimeout(() => { window.location.href = "html_page.html"; }, 1400);
}

function demoSignup(firstname, email, pw) {
    const accounts = JSON.parse(localStorage.getItem("makeup_accounts") || "[]");
    if (accounts.find(a => a.email === email)) {
        showAlert("signup-alert", "error", "This email is already registered.");
        return;
    }
    accounts.push({ id: Date.now(), name: firstname, email, pw: btoa(pw) });
    localStorage.setItem("makeup_accounts", JSON.stringify(accounts));
    showAlert("signup-alert", "success", "Account created! (Demo mode) Redirecting to login…");
    setTimeout(() => switchTab("login"), 2000);
}

// ─────────────────────────────────────────────
//  12. INITIALISATION
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

    // Touche Entrée pour soumettre
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        const active = document.querySelector(".auth-form.active");
        if (!active) return;
        if (active.id === "form-login")  handleLogin();
        if (active.id === "form-signup") handleSignup();
    });
});
