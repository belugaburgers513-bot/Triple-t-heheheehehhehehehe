document.addEventListener('DOMContentLoaded', () => {

  // ── Elements ──────────────────────────────────────────────────────
  const startScreen  = document.getElementById('start-screen');
  const startText    = document.getElementById('start-text');
  const profileBlock = document.getElementById('profile-block');
  const bgMusic      = document.getElementById('bg-music');
  const hackerMusic  = document.getElementById('hacker-music');
  const rainMusic    = document.getElementById('rain-music');
  const animeMusic   = document.getElementById('anime-music');
  const carMusic     = document.getElementById('car-music');
  const bgVideo      = document.getElementById('background');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeIcon   = document.getElementById('volume-icon');
  const cursor       = document.getElementById('cursor');
  const hackerOverlay = document.getElementById('hacker-overlay');
  const snowOverlay   = document.getElementById('snow-overlay');

  let currentAudio = bgMusic;
  let isMuted = false;

  // ── Cursor ────────────────────────────────────────────────────────
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) {
    document.body.classList.add('touch-device');
  } else {
    document.addEventListener('mousemove', e => {
      cursor.style.display = 'block';
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }

  // ── Start screen typewriter ───────────────────────────────────────
  const msg = 'Click here to see the motion baby';
  let idx = 0;
  let blink = true;

  function typeWriter() {
    if (idx <= msg.length) {
      startText.textContent = msg.slice(0, idx) + (blink ? '|' : ' ');
      idx++;
      setTimeout(typeWriter, 80);
    }
  }
  setInterval(() => {
    blink = !blink;
    if (idx > msg.length) startText.textContent = msg + (blink ? '|' : ' ');
  }, 500);
  typeWriter();

  // ── Start screen click — plays music, shows card ──────────────────
  function launch() {
    startScreen.classList.add('hidden');

    // Show card
    profileBlock.classList.remove('hidden');
    gsap.fromTo(profileBlock,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );

    // Play music — this MUST happen inside a user gesture
    bgMusic.volume = parseFloat(volumeSlider.value);
    bgMusic.muted = false;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Retry once on failure
        bgMusic.load();
        bgMusic.play().catch(() => {});
      });
    }
  }

  startScreen.addEventListener('click', launch);
  startScreen.addEventListener('touchend', e => { e.preventDefault(); launch(); });

  // ── Volume ────────────────────────────────────────────────────────
  volumeSlider.addEventListener('input', () => {
    currentAudio.volume = parseFloat(volumeSlider.value);
  });

  volumeIcon.addEventListener('click', () => {
    isMuted = !isMuted;
    currentAudio.muted = isMuted;
  });

  // ── Theme switcher ────────────────────────────────────────────────
  function switchTheme(videoSrc, audio, overlay, overlayOverProfile) {
    // Swap video
    gsap.to(bgVideo, { opacity: 0, duration: 0.4, onComplete: () => {
      bgVideo.querySelector('source').src = videoSrc;
      bgVideo.load();
      bgVideo.play().catch(() => {});
      gsap.to(bgVideo, { opacity: 1, duration: 0.4 });
    }});

    // Swap audio
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = audio;
    currentAudio.volume = parseFloat(volumeSlider.value);
    currentAudio.muted = isMuted;
    currentAudio.play().catch(() => {});

    // Overlays
    hackerOverlay.classList.add('hidden');
    snowOverlay.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');

    profileBlock.style.zIndex = overlayOverProfile ? '2' : '20';
  }

  document.getElementById('home-theme').addEventListener('click', () =>
    switchTheme('assets/background.mp4', bgMusic, null, false));

  document.getElementById('hacker-theme').addEventListener('click', () =>
    switchTheme('assets/hacker_background.mp4', hackerMusic, hackerOverlay, false));

  document.getElementById('rain-theme').addEventListener('click', () =>
    switchTheme('assets/rain_background.mov', rainMusic, snowOverlay, true));

  document.getElementById('anime-theme').addEventListener('click', () =>
    switchTheme('assets/anime_background.mp4', animeMusic, null, false));

  document.getElementById('car-theme').addEventListener('click', () =>
    switchTheme('assets/car_background.mp4', carMusic, null, false));

  // ── Discord Lanyard ───────────────────────────────────────────────
  const DISCORD_ID  = '1135423302307950682';
  const dcAvatar    = document.getElementById('dc-avatar');
  const dcDot       = document.getElementById('dc-status-dot');
  const dcActivity  = document.getElementById('dc-activity');

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
      const msg = JSON.parse(e.data);
      if (msg.op === 1) {
        hb = setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
      } else if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
        applyPresence(msg.d);
      }
    };
    ws.onclose = () => { clearInterval(hb); setTimeout(connectLanyard, 3000); };
    ws.onerror = () => ws.close();
  }
  connectLanyard();

});
