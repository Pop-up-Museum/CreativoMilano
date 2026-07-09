/**
 * Creativo Milano — "Start a project" intake chat widget
 * ---------------------------------------------------------
 * Include on any page with:
 *   <script src="project-intake.js"></script>
 * right before </body>.
 *
 * It automatically turns every element with class="start-project-btn"
 * into a trigger that opens this chat-style intake flow instead of
 * navigating to a plain contact section.
 *
 * SENDING THE EMAIL — EmailJS setup (about 5 minutes, free):
 * 1. Go to https://www.emailjs.com and create a free account.
 * 2. Email Services → Add New Service → connect the inbox that should
 *    receive these leads (Gmail, Outlook, etc). Note the SERVICE ID.
 * 3. Email Templates → Create New Template. Use these merge fields
 *    anywhere in the template body/subject — they'll be filled in
 *    automatically from the chat:
 *      {{project_type}}  {{stage}}  {{timeline}}  {{budget}}
 *      {{location}}  {{name}}  {{email}}  {{phone}}  {{page_url}}
 *    Note the TEMPLATE ID.
 * 4. Account → General → copy your Public Key.
 * 5. Paste all three values into the CONFIG block just below.
 *
 * Until these are filled in, the widget still works end-to-end but
 * falls back to opening a pre-filled email in the visitor's own mail
 * app instead of sending automatically — so nothing is ever broken,
 * it just won't be "automatic" until EmailJS is configured.
 */

(function () {
  // ================= CONFIG — fill these in after EmailJS setup =================
  const EMAILJS_SERVICE_ID = 'service_856rwlw';
  const EMAILJS_TEMPLATE_ID = 'template_zsxekqa';
  const EMAILJS_PUBLIC_KEY = 'WtOYvUHESdlrKvK_U';
  const NOTIFY_EMAIL = 'info@creativomilano.it'; // used only for the mailto: fallback
  // =================================================================================

  const isConfigured = ![EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY].includes('service_856rwlw')
    && ![EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY].includes('template_zsxekqa')
    && ![EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY].includes('WtOYvUHESdlrKvK_U');

  // ---- The conversation script ----
  const STEPS = [
    {
      key: 'project_type', type: 'choice',
      q: "Hi! I'm here to get a few quick details so the right person can get back to you. First — what are you looking to build?",
      options: ['Museum', 'Theme park', 'Monument', 'Urban architecture', 'Park maintenance', 'Something else'],
    },
    {
      key: 'stage', type: 'choice',
      q: 'Got it. What stage are you at right now?',
      options: ['Just exploring ideas', 'Have a concept ready', 'Ready to start building', 'Need urgent support'],
    },
    {
      key: 'timeline', type: 'choice',
      q: "What's your ideal timeline?",
      options: ['ASAP', '1–3 months', '3–12 months', 'Not sure yet'],
    },
    {
      key: 'budget', type: 'choice',
      q: 'Roughly what budget range are we talking about?',
      options: ['Under €50k', '€50k–200k', '€200k–1M', '€1M+', 'Prefer not to say'],
    },
    {
      key: 'location', type: 'text',
      q: 'Where is the project located (city and country)?',
      placeholder: 'e.g. Milan, Italy',
    },
    {
      key: 'name', type: 'text',
      q: "Last step — who should we address our reply to?",
      placeholder: 'Your name',
    },
    {
      key: 'email', type: 'text',
      q: 'And what email should we send it to?',
      placeholder: 'you@example.com',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      errorMsg: "That doesn't look like a valid email — mind double-checking?",
    },
  ];

  const answers = {};
  let stepIndex = 0;

  // ================= styles =================
  const style = document.createElement('style');
  style.textContent = `
    .pi-overlay{position:fixed;inset:0;background:rgba(24,24,26,.55);z-index:9998;
      display:flex;align-items:center;justify-content:center;padding:4vh 4vw;
      opacity:0;pointer-events:none;transition:opacity .25s ease;}
    .pi-overlay.open{opacity:1;pointer-events:auto;}
    .pi-panel{width:min(420px,100%);max-height:min(640px,90vh);background:var(--cream,#FAF8F3);
      border-radius:20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.45);display:flex;flex-direction:column;
      overflow:hidden;transform:translateY(16px);transition:transform .25s ease;font-family:var(--font-body,'Inter',sans-serif);}
    .pi-overlay.open .pi-panel{transform:translateY(0);}
    .pi-header{background:var(--blue,#0F75BC);color:#fff;padding:1.1rem 1.3rem;display:flex;
      align-items:center;justify-content:space-between;flex-shrink:0;}
    .pi-header .title{font-family:var(--font-display,'Space Grotesk',sans-serif);font-weight:600;font-size:.98rem;}
    .pi-header .subtitle{font-size:.72rem;opacity:.85;margin-top:2px;}
    .pi-close{background:none;border:none;color:#fff;cursor:pointer;opacity:.85;padding:4px;}
    .pi-close:hover{opacity:1;}
    .pi-body{flex:1;overflow-y:auto;padding:1.2rem;display:flex;flex-direction:column;gap:.7rem;}
    .pi-msg{max-width:85%;padding:.7rem .95rem;border-radius:14px;font-size:.88rem;line-height:1.45;}
    .pi-msg.bot{background:#fff;border:1px solid var(--line,#E5E1D6);align-self:flex-start;border-bottom-left-radius:4px;}
    .pi-msg.user{background:var(--blue,#0F75BC);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}
    .pi-options{display:flex;flex-wrap:wrap;gap:.5rem;align-self:flex-start;max-width:100%;}
    .pi-option-btn{font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:.76rem;
      background:#fff;border:1px solid var(--line,#E5E1D6);color:var(--ink,#18181A);
      padding:.55rem .9rem;border-radius:30px;cursor:pointer;transition:background .2s ease,border-color .2s ease;}
    .pi-option-btn:hover{background:var(--yellow,#FCB040);border-color:var(--yellow,#FCB040);}
    .pi-input-row{display:flex;gap:.5rem;padding:.9rem;border-top:1px solid var(--line,#E5E1D6);background:#fff;flex-shrink:0;}
    .pi-input{flex:1;border:1px solid var(--line,#E5E1D6);border-radius:24px;padding:.6rem .9rem;font-size:.86rem;
      font-family:var(--font-body,'Inter',sans-serif);outline:none;}
    .pi-input:focus{border-color:var(--azure,#25AAE1);}
    .pi-send{background:var(--yellow,#FCB040);border:none;border-radius:50%;width:38px;height:38px;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;cursor:pointer;}
    .pi-send svg{width:16px;height:16px;color:var(--ink,#18181A);}
    .pi-error{font-size:.76rem;color:var(--red,#BF1E2E);padding:0 1.2rem;}
    .pi-progress{height:3px;background:var(--line,#E5E1D6);flex-shrink:0;}
    .pi-progress-fill{height:100%;background:var(--yellow,#FCB040);transition:width .3s ease;}
    .pi-typing{display:flex;gap:4px;align-items:center;padding:.7rem .95rem;}
    .pi-typing span{width:6px;height:6px;border-radius:50%;background:#9a9a94;animation:pi-bounce 1s infinite;}
    .pi-typing span:nth-child(2){animation-delay:.15s;} .pi-typing span:nth-child(3){animation-delay:.3s;}
    @keyframes pi-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}
    @media (max-width:480px){ .pi-panel{max-height:100vh;border-radius:0;width:100%;} .pi-overlay{padding:0;} }
  `;
  document.head.appendChild(style);

  // ================= markup =================
  const overlay = document.createElement('div');
  overlay.className = 'pi-overlay';
  overlay.innerHTML = `
    <div class="pi-panel">
      <div class="pi-progress"><div class="pi-progress-fill" style="width:0%"></div></div>
      <div class="pi-header">
        <div>
          <div class="title">Creativo Milano</div>
          <div class="subtitle">Start a project</div>
        </div>
        <button class="pi-close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="pi-body" id="piBody"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const bodyEl = overlay.querySelector('#piBody');
  const closeBtn = overlay.querySelector('.pi-close');
  const progressFill = overlay.querySelector('.pi-progress-fill');

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = 'pi-msg ' + role;
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'pi-msg bot pi-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  function updateProgress() {
    progressFill.style.width = Math.round((stepIndex / STEPS.length) * 100) + '%';
  }

  function renderStep() {
    updateProgress();
    if (stepIndex >= STEPS.length) {
      finishAndSend();
      return;
    }
    const step = STEPS[stepIndex];
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMessage('bot', step.q);
      if (step.type === 'choice') {
        const wrap = document.createElement('div');
        wrap.className = 'pi-options';
        step.options.forEach((opt) => {
          const btn = document.createElement('button');
          btn.className = 'pi-option-btn';
          btn.type = 'button';
          btn.textContent = opt;
          btn.addEventListener('click', () => selectChoice(step, opt, wrap));
          wrap.appendChild(btn);
        });
        bodyEl.appendChild(wrap);
        bodyEl.scrollTop = bodyEl.scrollHeight;
      } else {
        showTextInput(step);
      }
    }, 420);
  }

  function selectChoice(step, value, wrapEl) {
    wrapEl.remove();
    answers[step.key] = value;
    addMessage('user', value);
    stepIndex++;
    renderStep();
  }

  function showTextInput(step) {
    let row = overlay.querySelector('.pi-input-row');
    if (row) row.remove();
    let errorEl = overlay.querySelector('.pi-error');
    if (errorEl) errorEl.remove();

    row = document.createElement('div');
    row.className = 'pi-input-row';
    row.innerHTML = `
      <input class="pi-input" type="text" placeholder="${step.placeholder || ''}">
      <button class="pi-send" aria-label="Send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>
      </button>`;
    overlay.querySelector('.pi-panel').appendChild(row);

    const input = row.querySelector('.pi-input');
    const sendBtn = row.querySelector('.pi-send');
    input.focus();

    function submit() {
      const val = input.value.trim();
      if (!val) return;
      if (step.validate && !step.validate(val)) {
        let err = overlay.querySelector('.pi-error');
        if (!err) {
          err = document.createElement('p');
          err.className = 'pi-error';
          row.insertAdjacentElement('beforebegin', err);
        }
        err.textContent = step.errorMsg || 'Please check this value.';
        return;
      }
      answers[step.key] = val;
      addMessage('user', val);
      row.remove();
      const err = overlay.querySelector('.pi-error');
      if (err) err.remove();
      stepIndex++;
      renderStep();
    }

    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  function finishAndSend() {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMessage('bot', 'Perfect — sending this over to our team now…');

      const payload = {
        project_type: answers.project_type || '',
        stage: answers.stage || '',
        timeline: answers.timeline || '',
        budget: answers.budget || '',
        location: answers.location || '',
        name: answers.name || '',
        email: answers.email || '',
        phone: '',
        page_url: window.location.href,
      };

      if (isConfigured && window.emailjs) {
        window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload, EMAILJS_PUBLIC_KEY)
          .then(() => {
            addMessage('bot', `Thanks, ${payload.name || 'there'}! We've got your details and will be in touch within 1–2 business days.`);
          })
          .catch(() => {
            showFallback(payload);
          });
      } else {
        showFallback(payload);
      }
    }, 500);
  }

  function showFallback(payload) {
    addMessage('bot', "I couldn't send that automatically, but I've prepared an email for you — just hit send in your mail app.");
    const subject = encodeURIComponent(`New project inquiry — ${payload.project_type || 'General'}`);
    const body = encodeURIComponent(
      `Project type: ${payload.project_type}\nStage: ${payload.stage}\nTimeline: ${payload.timeline}\nBudget: ${payload.budget}\nLocation: ${payload.location}\nName: ${payload.name}\nEmail: ${payload.email}\nPage: ${payload.page_url}`
    );
    const mailtoLink = document.createElement('a');
    mailtoLink.href = `mailto:${NOTIFY_EMAIL}?subject=${subject}&body=${body}`;
    mailtoLink.textContent = 'Open email to send →';
    mailtoLink.style.color = 'var(--blue, #0F75BC)';
    mailtoLink.style.fontWeight = '600';
    mailtoLink.style.display = 'inline-block';
    mailtoLink.style.marginTop = '.4rem';
    const wrap = document.createElement('div');
    wrap.className = 'pi-msg bot';
    wrap.appendChild(mailtoLink);
    bodyEl.appendChild(wrap);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function openWidget() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (bodyEl.children.length === 0) renderStep();
  }
  function closeWidget() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeWidget);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWidget(); });

  // load EmailJS SDK once, quietly, if configured
  if (isConfigured) {
    const sdk = document.createElement('script');
    sdk.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    sdk.onload = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); };
    document.head.appendChild(sdk);
  }

  // attach to every trigger button on the page
  document.querySelectorAll('.start-project-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openWidget();
    });
  });
})();
