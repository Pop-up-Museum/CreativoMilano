/**
 * Creativo Milano — cookie consent banner
 * -------------------------------------------
 * Include on every page with:
 *   <script src="cookie-consent.js"></script>
 * right before </body> (or anywhere — it doesn't depend on load order).
 *
 * What it does:
 * - Shows a bottom banner on first visit asking to accept or reject
 *   non-essential cookies (Google Analytics).
 * - Google Analytics is NEVER loaded until the visitor accepts — this
 *   is a legal requirement (GDPR/ePrivacy), not just good manners.
 * - Remembers the choice (localStorage) so the banner doesn't reappear
 *   on every page/visit, until the visitor clears their browser data.
 * - Adds a small "Cookie settings" link handler (window.cmReopenCookieBanner)
 *   that any page can call to let visitors change their mind later —
 *   already wired to the "Cookie settings" link in the footer.
 *
 * SETUP — Google Analytics:
 * 1. Create a free GA4 property at https://analytics.google.com
 * 2. Admin → Data Streams → Web → copy your Measurement ID (looks like G-XXXXXXXXXX)
 * 3. Paste it below, replacing 'G-XXXXXXXXXX'.
 * Until you do, the banner still works correctly — it just has nothing to load on accept.
 */

(function () {
  // ================= CONFIG =================
  const GA_MEASUREMENT_ID = 'G-45VFXV61RX'; // real GA4 Measurement ID
  const CONSENT_KEY = 'cm_cookie_consent'; // 'accepted' | 'rejected'
  // ============================================

  const isGAConfigured = GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ignore */ }
  }

  function loadGoogleAnalytics() {
    if (!isGAConfigured || window.__cmGaLoaded) return;
    window.__cmGaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  // ================= styles =================
  const style = document.createElement('style');
  style.textContent = `
    .cc-banner{position:fixed;left:0;right:0;bottom:0;z-index:9997;
      background:var(--cream,#FAF8F3);border-top:1px solid var(--line,#E5E1D6);
      box-shadow:0 -10px 30px -10px rgba(0,0,0,.15);
      padding:1.2rem 1.4rem;display:flex;flex-wrap:wrap;align-items:center;gap:1rem;justify-content:space-between;
      transform:translateY(100%);transition:transform .35s ease;font-family:var(--font-body,'Inter',sans-serif);}
    .cc-banner.open{transform:translateY(0);}
    .cc-text{flex:1;min-width:240px;font-size:.85rem;color:var(--ink,#18181A);line-height:1.5;}
    .cc-text a{color:var(--blue,#0F75BC);text-decoration:underline;}
    .cc-actions{display:flex;gap:.6rem;flex-wrap:wrap;flex-shrink:0;}
    .cc-btn{font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:.74rem;text-transform:uppercase;
      letter-spacing:.04em;padding:.6rem 1.1rem;border-radius:30px;cursor:pointer;border:1px solid var(--ink,#18181A);
      background:transparent;color:var(--ink,#18181A);transition:background .2s ease,color .2s ease;white-space:nowrap;}
    .cc-btn:hover{background:var(--ink,#18181A);color:var(--cream,#FAF8F3);}
    .cc-btn.primary{background:var(--yellow,#FCB040);border-color:var(--yellow,#FCB040);color:var(--ink,#18181A);}
    .cc-btn.primary:hover{background:var(--ink,#18181A);border-color:var(--ink,#18181A);color:var(--cream,#FAF8F3);}
    @media (max-width:600px){ .cc-banner{padding:1rem;} .cc-actions{width:100%;} .cc-btn{flex:1;} }
  `;
  document.head.appendChild(style);

  // ================= markup =================
  const banner = document.createElement('div');
  banner.className = 'cc-banner';
  banner.innerHTML = `
    <p class="cc-text">
      We use cookies to run this site and, only with your consent, to understand how it's used (Google Analytics).
      See our <a href="cookie-policy.html">Cookie Policy</a> for details.
    </p>
    <div class="cc-actions">
      <button class="cc-btn" id="ccReject" type="button">Reject non-essential</button>
      <button class="cc-btn primary" id="ccAccept" type="button">Accept all</button>
    </div>
  `;
  document.body.appendChild(banner);

  const rejectBtn = banner.querySelector('#ccReject');
  const acceptBtn = banner.querySelector('#ccAccept');

  function showBanner() {
    banner.classList.add('open');
  }
  function hideBanner() {
    banner.classList.remove('open');
  }

  acceptBtn.addEventListener('click', () => {
    setConsent('accepted');
    hideBanner();
    loadGoogleAnalytics();
  });
  rejectBtn.addEventListener('click', () => {
    setConsent('rejected');
    hideBanner();
  });

  const existing = getConsent();
  if (existing === 'accepted') {
    loadGoogleAnalytics();
  } else if (!existing) {
    // small delay so it doesn't fight with the page's own entrance animations
    setTimeout(showBanner, 600);
  }

  // Lets any page (e.g. a "Cookie settings" footer link) reopen the banner
  // so visitors can change their mind later.
  window.cmReopenCookieBanner = function () {
    showBanner();
  };

  // Auto-wire any "change cookie settings" button on the page — no extra
  // script needed per page, this just works wherever the button exists.
  document.querySelectorAll('#cookieSettingsBtn, .cm-cookie-settings-btn').forEach((btn) => {
    btn.addEventListener('click', showBanner);
  });
})();
