const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --yellow: #F5C400;
      --yellow-dim: rgba(245,196,0,0.12);
      --yellow-glow: rgba(245,196,0,0.35);
      --yellow-glow-strong: rgba(245,196,0,0.6);
      --bg: #0B0B0B;
      --card: #151515;
      --card2: #1A1A1A;
      --border: rgba(245,196,0,0.15);
      --border-hover: rgba(245,196,0,0.45);
      --grey: #9E9E9E;
      --grey-dim: #5A5A5A;
      --white: #F0F0F0;
      --red: #FF3B3B;
      --green: #00E676;
      --font-mono: 'Share Tech Mono', monospace;
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --radius: 14px;
      --radius-sm: 8px;
      --transition: 0.25s cubic-bezier(0.4,0,0.2,1);
      --text-scale: 1;
    }

    :root[data-theme="light"] {
      --bg: #F2F2F5;
      --card: #FFFFFF;
      --card2: #F9F9FA;
      --border: rgba(0,0,0,0.08);
      --border-hover: rgba(0,0,0,0.16);
      --grey: #4C4C4C;
      --grey-dim: #747474;
      --white: #0B0B0B;
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--white);
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      font-size: calc(16px * var(--text-scale));
      zoom: var(--text-scale);
    }

    @supports not (zoom: 1) {
      body {
        transform: scale(var(--text-scale));
        transform-origin: top center;
      }
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 4px; }

    .grid-bg {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(245,196,0,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245,196,0,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .scanlines {
      position: fixed; inset: 0; pointer-events: none; z-index: 1;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
      );
    }

    .page {
      min-height: 100vh;
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 80px;
      animation: fadeSlideIn 0.4s ease forwards;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      position: relative;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .card:hover {
      border-color: var(--border-hover);
      box-shadow: 0 0 20px var(--yellow-dim), 0 8px 32px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    .card-glow {
      box-shadow: 0 0 30px var(--yellow-dim), 0 0 60px rgba(245,196,0,0.05);
    }

    /* ── Buttons ── */
    .btn-primary {
      background: var(--yellow);
      color: #0B0B0B;
      border: none;
      border-radius: var(--radius-sm);
      padding: 14px 28px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.5px;
      cursor: pointer;
      width: 100%;
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
    }
    .btn-primary::after {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .btn-primary:hover {
      box-shadow: 0 0 20px var(--yellow-glow), 0 0 40px var(--yellow-dim);
      transform: translateY(-1px);
    }
    .btn-primary:hover::after { opacity: 1; }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-secondary {
      background: transparent;
      color: var(--yellow);
      border: 1px solid var(--border-hover);
      border-radius: var(--radius-sm);
      padding: 13px 28px;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      width: 100%;
      transition: all var(--transition);
    }
    .btn-secondary:hover {
      background: var(--yellow-dim);
      border-color: var(--yellow);
      box-shadow: 0 0 16px var(--yellow-dim);
    }

    .btn-icon {
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 16px;
      color: var(--grey);
      cursor: pointer;
      font-family: var(--font-body);
      font-size: 13px;
      display: flex; align-items: center; gap: 6px;
      transition: all var(--transition);
    }
    .btn-icon:hover {
      color: var(--yellow);
      border-color: var(--border-hover);
      background: var(--yellow-dim);
    }

    /* ── Form elements ── */
    .input-field {
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      color: var(--white);
      font-family: var(--font-mono);
      font-size: 15px;
      width: 100%;
      outline: none;
      transition: all var(--transition);
    }
    .input-field::placeholder { color: var(--grey-dim); }
    .input-field:focus {
      border-color: var(--yellow);
      box-shadow: 0 0 0 3px var(--yellow-dim), 0 0 16px rgba(245,196,0,0.1);
    }

    .toggle-group {
      display: flex;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 4px;
      gap: 4px;
    }
    .toggle-option {
      flex: 1; padding: 10px;
      border-radius: 6px;
      text-align: center;
      cursor: pointer;
      font-family: var(--font-body);
      font-weight: 500;
      font-size: 14px;
      color: var(--grey);
      transition: all var(--transition);
      border: none;
      background: transparent;
    }
    .toggle-option.active {
      background: var(--yellow);
      color: #0B0B0B;
      font-weight: 700;
      box-shadow: 0 0 12px var(--yellow-dim);
    }

    /* ── Code digits ── */
    .code-display { display: flex; gap: 8px; justify-content: center; align-items: center; }
    .code-digit {
      width: 52px; height: 64px;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-mono);
      font-size: 28px;
      font-weight: bold;
      color: var(--yellow);
      text-shadow: 0 0 10px var(--yellow-glow);
      animation: digitGlow 2s ease-in-out infinite alternate;
    }
    @keyframes digitGlow {
      from { box-shadow: 0 0 6px var(--yellow-dim); }
      to   { box-shadow: 0 0 16px var(--yellow-glow), inset 0 0 8px var(--yellow-dim); }
    }

    .code-input-group { display: flex; gap: 10px; justify-content: center; }
    .code-input-digit {
      width: 50px; height: 60px;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      text-align: center;
      font-family: var(--font-mono);
      font-size: 24px;
      font-weight: bold;
      color: var(--yellow);
      outline: none;
      transition: all var(--transition);
    }
    .code-input-digit:focus {
      border-color: var(--yellow);
      box-shadow: 0 0 0 3px var(--yellow-dim), 0 0 16px var(--yellow-dim);
    }

    /* ── QR ── */
    .qr-container {
      width: 180px; height: 180px;
      background: #FFF;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 30px var(--yellow-glow), 0 0 60px var(--yellow-dim);
      animation: qrPulse 3s ease-in-out infinite;
    }
    @keyframes qrPulse {
      0%,100% { box-shadow: 0 0 20px var(--yellow-glow), 0 0 40px var(--yellow-dim); }
      50%      { box-shadow: 0 0 40px var(--yellow-glow-strong), 0 0 80px var(--yellow-glow); }
    }

    /* ── Chat ── */
    .chat-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      animation: bubbleIn 0.3s ease forwards;
    }
    @keyframes bubbleIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .chat-bubble.sent {
      background: var(--yellow); color: #0B0B0B;
      border-bottom-right-radius: 4px;
      align-self: flex-end; margin-left: auto;
    }
    .chat-bubble.received {
      background: var(--card2);
      border: 1px solid var(--border);
      color: var(--white);
      border-bottom-left-radius: 4px;
    }

    /* ── Drop zone ── */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
    }
    .drop-zone:hover, .drop-zone.dragover {
      border-color: var(--yellow);
      background: var(--yellow-dim);
      box-shadow: 0 0 30px var(--yellow-dim);
    }
    .drop-zone::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at center, var(--yellow-dim) 0%, transparent 70%);
      opacity: 0; transition: opacity var(--transition);
    }
    .drop-zone:hover::before { opacity: 1; }

    /* ── Progress ── */
    .progress-bar { height: 4px; background: var(--card2); border-radius: 2px; overflow: hidden; }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--yellow), #FFE066);
      border-radius: 2px;
      transition: width 0.4s ease;
      box-shadow: 0 0 8px var(--yellow-glow);
    }

    /* ── Misc ── */
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--yellow);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: pulseDot 1.5s ease-in-out infinite;
    }
    @keyframes pulseDot {
      0%,100% { transform: scale(1);   opacity: 1;   }
      50%      { transform: scale(1.4); opacity: 0.6; }
    }

    .enc-lock { animation: lockPulse 2s ease-in-out infinite; }
    @keyframes lockPulse {
      0%,100% { filter: drop-shadow(0 0 3px var(--green)); }
      50%      { filter: drop-shadow(0 0 8px var(--green)) drop-shadow(0 0 16px rgba(0,230,118,0.3)); }
    }

    .success-circle {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(0,230,118,0.1);
      border: 2px solid var(--green);
      display: flex; align-items: center; justify-content: center;
      animation: successPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards,
                 successGlow 2s ease 0.6s infinite;
    }
    @keyframes successPop {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    @keyframes successGlow {
      0%,100% { box-shadow: 0 0 20px rgba(0,230,118,0.3); }
      50%      { box-shadow: 0 0 40px rgba(0,230,118,0.5), 0 0 80px rgba(0,230,118,0.2); }
    }

    .glitch { position: relative; animation: glitch 3s ease-in-out infinite; }
    .glitch::before, .glitch::after {
      content: attr(data-text);
      position: absolute; top: 0; left: 0; width: 100%;
    }
    .glitch::before {
      color: #F5C400;
      animation: glitchTop 3s ease-in-out infinite;
      clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
    }
    .glitch::after {
      color: #FF3B3B;
      animation: glitchBot 3s ease-in-out infinite;
      clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
    }
    @keyframes glitch     { 0%,85%,100%{transform:none}  86%{transform:translateX(2px)}  88%{transform:translateX(-2px)} 90%{transform:none} }
    @keyframes glitchTop  { 0%,85%,100%{transform:none;opacity:0} 86%{transform:translateX(-3px);opacity:.8} 88%{transform:translateX(3px);opacity:.5} 90%{opacity:0} }
    @keyframes glitchBot  { 0%,85%,100%{transform:none;opacity:0} 87%{transform:translateX(3px);opacity:.8} 89%{transform:translateX(-3px);opacity:.5} 91%{opacity:0} }

    .timer-display {
      font-family: var(--font-mono);
      font-size: 28px;
      color: var(--yellow);
      text-shadow: 0 0 10px var(--yellow-glow);
      letter-spacing: 3px;
    }
    .timer-display.urgent {
      color: var(--red);
      text-shadow: 0 0 10px rgba(255,59,59,0.5);
      animation: timerUrgent 0.5s ease-in-out infinite;
    }
    @keyframes timerUrgent { 50% { opacity: 0.7; } }

    .back-btn {
      display: flex; align-items: center; gap: 8px;
      color: var(--grey); cursor: pointer;
      font-size: 13px; font-family: var(--font-mono); letter-spacing: 0.5px;
      transition: color var(--transition);
      background: none; border: none; padding: 0;
    }
    .back-btn:hover { color: var(--yellow); }

    .status-row { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12px; color: var(--grey); }
    .nav-header { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
    .label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--grey); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .label::before { content: '//'; color: var(--yellow); opacity: 0.6; }
    .badge { display: inline-flex; align-items: center; gap: 5px; background: var(--yellow-dim); border: 1px solid var(--border-hover); color: var(--yellow); font-family: var(--font-mono); font-size: 11px; padding: 4px 10px; border-radius: 100px; }
    .badge.green { background: rgba(0,230,118,0.1); border-color: rgba(0,230,118,0.3); color: var(--green); }
    .badge.red   { background: rgba(255,59,59,0.1);  border-color: rgba(255,59,59,0.3);  color: var(--red); }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 20px 0; }
    .mono { font-family: var(--font-mono); }
    .text-yellow { color: var(--yellow); }
    .text-grey   { color: var(--grey); }
    .text-green  { color: var(--green); }
    .text-red    { color: var(--red); }
    .section-title { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }

    .timer-pill {
      flex: 1; padding: 10px 6px;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      text-align: center; cursor: pointer;
      font-family: var(--font-mono); font-size: 12px; color: var(--grey);
      transition: all var(--transition); background: var(--card2);
    }
    .timer-pill.active {
      border-color: var(--yellow); color: var(--yellow);
      background: var(--yellow-dim); box-shadow: 0 0 10px var(--yellow-dim);
    }
    .timer-pill:hover:not(.active) { border-color: var(--grey-dim); color: var(--white); }

    .terminal-line {
      font-family: var(--font-mono); font-size: 12px; color: var(--green);
      animation: terminalType 0.3s ease forwards;
      overflow: hidden; white-space: nowrap;
    }
    @keyframes terminalType {
      from { max-width: 0; opacity: 0; }
      to   { max-width: 100%; opacity: 1; }
    }

    .msg-bar {
      display: flex; align-items: center; gap: 10px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: 50px; padding: 8px 8px 8px 18px;
    }

    .fab {
      width: 40px; height: 40px; background: var(--card2);
      border: 1px solid var(--border); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all var(--transition); flex-shrink: 0;
    }
    .fab:hover { border-color: var(--yellow); background: var(--yellow-dim); }
    .fab.send   { background: var(--yellow); border-color: var(--yellow); }
    .fab.send:hover { box-shadow: 0 0 16px var(--yellow-glow); }

    .file-card { display: flex; align-items: center; gap: 12px; background: var(--card2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; }
    .file-icon-box { width: 44px; height: 44px; background: var(--yellow-dim); border: 1px solid var(--border-hover); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    @keyframes scanLine { 0% { top: 10%; } 50% { top: 85%; } 100% { top: 10%; } }

    @media (max-width: 480px) {
      .code-digit       { width: 44px; height: 56px; font-size: 24px; }
      .code-input-digit { width: 42px; height: 52px; font-size: 20px; }
    }
  `}</style>
);

export default GlobalStyles;
