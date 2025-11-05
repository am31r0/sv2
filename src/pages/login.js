import { showNav, showToast } from "../lib/utils.js";
import { warmupDataAndEngine } from "../lib/dataLoader.js";
const LS_KEY = "sms_user_session";



export function renderLoginPage(mount) {
  showNav(false);

  mount.innerHTML = `
    <section class="login-page">
      <img class="logo" src="./icons/schappie-logo.webp">
      <p style="opacity:0.99;">Log in om verder te gaan</p>

      <div class="login-buttons">
        <button id="google-login" class="btn-login">
          Log in met
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="G" style="height:1.1rem; vertical-align:middle; margin-right:8px;">
        </button>
        <button id="dev-login" class="btn-login btn-dev">
          Ik ben ontwikkelaar
        </button>
      </div>

      <p class="login-terms">
        Door verder te gaan, ga je akkoord<br>met onze
        <a href="about:blank" target="_blank">Gebruiksvoorwaarden</a> &
        <a href="about:blank" target="_blank">Privacyverklaring</a>.
      </p>
    </section>
  `;

  // Kleine helper om sessie te zetten en hard te refreshen
  function completeLogin(session, redirectHash = null, toastMsg = null) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(session));
    } catch (_) {
      /* noop */
    }
    if (toastMsg) showToast(toastMsg);
    if (redirectHash) window.location.hash = redirectHash;

    // heel korte delay zodat toast evt. nog even flitst
    setTimeout(() => {
      // Forceer een harde reload zodat de app-state opnieuw wordt ingelezen
      window.location.reload();
    }, 120);
  }

  async function onLoginSuccess(session) {
  // ... sla session op, navigeer naar home, etc.
  try {
    // laat aan de user weten dat we alvast alles klaarzetten
    showToast?.("Voorbereiden… aanbiedingen & prijzen laden");
    // start preload (niet verplicht om te awaiten)
    warmupDataAndEngine()
      .then(() => {
        showToast?.("Klaar! 🚀");
      })
      .catch(() => {
        // stil falen is oké; UI kan lazy fallbacken
        showToast?.("Kon niet alles vooraf laden");
      });
  } catch {}
}

  document.querySelector("#google-login").addEventListener("click", () => {
    // Gebruik "user" i.p.v. "method" zodat dit aansluit bij je saveSession-check
    completeLogin(
      { user: "google", ts: Date.now() },
      "#/home",
      "✅ Ingelogd met Google (placeholder)"
    );
  });

  document.querySelector("#dev-login").addEventListener("click", () => {
    completeLogin(
      { user: "developer", dev: true, ts: Date.now() },
      "#/home",
      "🧠 Ontwikkelaarsmodus geactiveerd"
    );
  });
}
