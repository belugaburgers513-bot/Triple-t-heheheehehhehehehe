(function () {
  var launched = false;

  var startScreen  = document.getElementById('start-screen');
  var startText    = document.getElementById('start-text');
  var profileBlock = document.getElementById('profile-block');
  var bgMusic      = document.getElementById('bg-music');
  var cursor       = document.getElementById('cursor');

  // Cursor
  if (window.matchMedia('(pointer: coarse)').matches) {
    document.body.classList.add('touch-device');
  } else {
    document.addEventListener('mousemove', function(e) {
      cursor.style.display = 'block';
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }

  // Typewriter
  var msg = 'Click here to see the motion baby';
  var idx = 0, blink = true;
  function type() {
    startText.textContent = msg.slice(0, idx) + (blink ? '|' : ' ');
    if (idx < msg.length) { idx++; setTimeout(type, 80); }
  }
  setInterval(function() {
    blink = !blink;
    if (idx >= msg.length) startText.textContent = msg + (blink ? '|' : ' ');
  }, 500);
  type();

  // Launch — music play() must be the FIRST thing called in the event handler
  function launch() {
    if (launched) return;
    launched = true;

    // Play music FIRST before anything else
    bgMusic.volume = 0.5;
    bgMusic.play();

    // Then do UI stuff
    startScreen.style.display = 'none';
    profileBlock.classList.remove('hidden');

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(profileBlock,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
      );
    } else {
      profileBlock.style.opacity = 1;
    }
  }

  startScreen.addEventListener('click', launch);

  startScreen.addEventListener('touchend', function(e) {
    e.preventDefault();
    launch();
  }, { passive: false });

  // Discord Lanyard
  var DISCORD_ID = '1135423302307950682';
  var dcAvatar   = document.getElementById('dc-avatar');
  var dcDot      = document.getElementById('dc-status-dot');
  var dcActivity = document.getElementById('dc-activity');

  function applyPresence(d) {
    if (d.discord_user && d.discord_user.avatar) {
      dcAvatar.src = 'https://cdn.discordapp.com/avatars/' + DISCORD_ID + '/' + d.discord_user.avatar + '.png?size=128';
    }
    dcDot.className = 'status-' + (d.discord_status || 'offline');
    var act    = (d.activities || []).filter(function(a){ return a.type !== 4; })[0];
    var custom = (d.activities || []).filter(function(a){ return a.type === 4; })[0];
    if (act) {
      dcActivity.textContent = act.name + (act.details ? ' — ' + act.details : '');
    } else if (custom && custom.state) {
      dcActivity.textContent = custom.state;
    } else {
      var map = { online: '🟢 Online', idle: '🟡 Away', dnd: '🔴 Do Not Disturb', offline: '⚫ Offline' };
      dcActivity.textContent = map[d.discord_status] || '⚫ Offline';
    }
  }

  function connectLanyard() {
    var ws = new WebSocket('wss://api.lanyard.rest/socket');
    var hb;
    ws.onmessage = function(e) {
      var m = JSON.parse(e.data);
      if (m.op === 1) {
        hb = setInterval(function(){ ws.send(JSON.stringify({ op: 3 })); }, m.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
      } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) {
        applyPresence(m.d);
      }
    };
    ws.onclose = function() { clearInterval(hb); setTimeout(connectLanyard, 3000); };
    ws.onerror = function() { ws.close(); };
  }
  connectLanyard();

})();
