document.addEventListener('DOMContentLoaded', () => {

  const startScreen  = document.getElementById('start-screen');
  const startText    = document.getElementById('start-text');
  const profileBlock = document.getElementById('profile-block');
  const bgMusic      = document.getElementById('bg-music');
  const cursor       = document.getElementById('cursor');

  // ── Cursor ────────────────────────────────────────────────────────
  if (!window.matchMedia('(pointer: coarse)').matches) {
    document.addEventListener('mousemove', e => {
      cursor.style.display = 'block';
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  } else {
    document.body.classList.add('touch-device');
  }

  // ── Typewriter ────────────────────────────────────────────────────
  const msg = 'Click here to see the motion baby';
  let idx = 0, blink = true;
  function typeWriter() {
    startText.textContent = msg.slice(0, idx) + (blink ? '|' : ' ');
    if (idx < msg.length) { idx++; setTimeout(typeWriter, 80); }
  }
  setInterval(() => {
    blink = !blink;
    if (idx >= msg.length) startText.textContent = msg + (blink ? '|' : ' ');
  }, 500);
  typeWriter();

  // ── Launch ────────────────────────────────────────────────────────
  let launched = false;

  function launch() {
    if (launched) return;
    launched = true;
    startScreen.style.display = 'none';
    profileBlock.classList.remove('hidden');
    gsap.fromTo(profileBlock,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );
    bgMusic.volume = 0.5;
    bgMusic.play().catch(() => {});
  }

  // Both click AND touchstart — covers all devices
  startScreen.addEventListener('click', launch);
  startScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    launch();
  }, { passive: false });

  // ── Discord Lanyard ───────────────────────────────────────────────
  const DISCORD_ID = '1135423302307950682';
  const dcAvatar   = document.getElementById('dc-avatar');
  const dcDot      = document.getElementById('dc-status-dot');
  const dcActivity = document.getElementById('dc-activity');

  function applyPresence(d) {
    if (d.discord_user && d.discord_user.avatar) {
      dcAvatar.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${d.discord_user.avatar}.png?size=128`;
    }
    dcDot.className = 'status-' + (d.discord_status || 'offline');
    const act    = (d.activities || []).find(a => a.type !== 4);
    const custom = (d.activities || []).find(a => a.type === 4);
    if (act) {
      dcActivity.textContent = act.name + (act.details ? ' — ' + act.details : '');
    } else if (custom && custom.state) {
      dcActivity.textContent = custom.state;
    } else {
      const map = { online: '🟢 Online', idle: '🟡 Away', dnd: '🔴 Do Not Disturb', offline: '⚫ Offline' };
      dcActivity.textContent = map[d.discord_status] || '⚫ Offline';
    }
  }

  function connectLanyard() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    let hb;
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.op === 1) {
        hb = setInterval(() => ws.send(JSON.stringify({ op: 3 })), m.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
      } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) {
        applyPresence(m.d);
      }
    };
    ws.onclose = () => { clearInterval(hb); setTimeout(connectLanyard, 3000); };
    ws.onerror = () => ws.close();
  }
  connectLanyard();

});
