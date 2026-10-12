'use strict';
// =====================================================================
//  COMMANDES TACTILES (téléphone, tablette)
//  - stick analogique 8 directions (le pommeau suit le doigt), gros boutons A (OK) et B (Retour),
//    MENU, et COURIR en interrupteur (un appui l'active, un autre l'arrête)
//  - disposition qui s'adapte : en portrait, les commandes remplissent la zone sous l'écran de jeu ;
//    en paysage, elles se placent sur les côtés (ou par-dessus si la place manque)
//  - toucher l'écran de jeu = OK (faire avancer les dialogues) ; petite vibration à chaque appui
//  Affichées au premier toucher (ou d'emblée sur un appareil sans souris). Passent par DW.Input.press / release.
// =====================================================================
(function () {
  const Input = DW.Input;
  let built = false, field = null, root = null, running = false;

  const css = `
  html,body{touch-action:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
  #touch{position:fixed;inset:0;pointer-events:none;z-index:5;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Press Start 2P',monospace}
  #touch .t{position:absolute;pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;
    color:#e8f4ff;background:rgba(30,60,120,.42);border:2px solid rgba(160,200,255,.6);box-sizing:border-box;border-radius:50%;
    box-shadow:0 0 10px rgba(60,120,255,.35) inset}
  #touch .t.on{background:rgba(255,220,100,.5);border-color:#ffe680}
  #touch .stick .knob{position:absolute;left:50%;top:50%;width:42%;height:42%;margin:-21% 0 0 -21%;border-radius:50%;
    background:radial-gradient(circle at 35% 35%,#9ac8ff,#2a5ab8);border:2px solid #cfe4ff;box-sizing:border-box;pointer-events:none;transition:transform .05s}
  #touch .stick i{position:absolute;width:0;height:0;border:7px solid transparent;opacity:.6}
  #touch .stick .u{top:6%;left:50%;margin-left:-7px;border-bottom:10px solid #e8f4ff;border-top:0}
  #touch .stick .d{bottom:6%;left:50%;margin-left:-7px;border-top:10px solid #e8f4ff;border-bottom:0}
  #touch .stick .l{left:6%;top:50%;margin-top:-7px;border-right:10px solid #e8f4ff;border-left:0}
  #touch .stick .r{right:6%;top:50%;margin-top:-7px;border-left:10px solid #e8f4ff;border-right:0}
  #touch .a{background:rgba(40,150,80,.5);border-color:rgba(150,255,180,.7)}
  #touch .b{background:rgba(160,50,50,.45);border-color:rgba(255,160,160,.7)}
  #touch .pill{border-radius:999px}
  #touch .run.toggled{background:rgba(255,160,40,.6);border-color:#ffd080}
  #touch input{position:absolute;left:50%;top:30%;transform:translateX(-50%);width:220px;font:16px sans-serif;padding:8px;
    pointer-events:auto;display:none;border:2px solid #ffd860;border-radius:6px;background:#0a1430;color:#ffd860;text-align:center}
  #touch .deck{position:absolute;left:0;right:0;bottom:0;pointer-events:none;border-top:2px solid rgba(120,180,255,.35);
    background:linear-gradient(180deg,#14224a 0%,#0a1230 60%,#070b1e 100%);box-shadow:0 -6px 18px rgba(0,0,0,.5) inset}
  #touch .deck::after{content:'DIGIVICE';position:absolute;left:50%;top:10px;transform:translateX(-50%);font-size:8px;letter-spacing:3px;color:rgba(160,200,255,.45)}
  body.touch{align-items:flex-start}
  @media (orientation: landscape){ body.touch{align-items:center} }`;

  const buzz = () => { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* sans vibration */ } };
  // capture du doigt (pour recevoir son relâchement même hors du bouton) ; peut échouer si le pointeur a déjà disparu
  const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (err) { /* sans capture */ } };
  // bouton qui tient une action tant qu'il est touché
  function hold(el, action) {
    const src = 'touch:' + action;
    const down = e => {
      e.preventDefault(); capture(el, e); el.classList.add('on'); buzz();
      if (Input.textMode) { if (action === 'ok' || action === 'menu') Input.typed.push('Enter'); else if (action === 'back') Input.typed.push('Backspace'); return; }
      Input.press(src, action);
    };
    const up = () => { el.classList.remove('on'); Input.release(src, action); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  }
  // COURIR : interrupteur
  function toggleRun(el) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); buzz(); running = !running; el.classList.toggle('toggled', running);
      if (running) Input.press('touch:run', 'run'); else Input.release('touch:run', 'run');
    });
  }
  // stick analogique : 8 secteurs de 45°, avec une marge pour ne pas hésiter entre deux directions
  const SECT = ['right', 'right,down', 'down', 'down,left', 'left', 'left,up', 'up', 'up,right'];
  function stick(el) {
    const knob = el.querySelector('.knob');
    let cur = null, sector = -1;
    const set = d => {
      if (d === cur) return;
      if (cur) for (const a of cur.split(',')) Input.release('touch:pad:' + a, a);
      cur = d;
      if (d && !Input.textMode) { for (const a of d.split(',')) Input.press('touch:pad:' + a, a); buzz(); }
      el.classList.toggle('on', !!d);
    };
    const move = e => {
      const r = el.getBoundingClientRect(), R = r.width / 2;
      let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R);
      const dist = Math.hypot(x, y), lim = R * 0.62;
      if (dist > lim) { x *= lim / dist; y *= lim / dist; }
      knob.style.transform = `translate(${x}px,${y}px)`;
      if (dist < R * 0.22) { sector = -1; set(null); return; }                     // zone morte au centre
      const a = (Math.atan2(y, x) / (Math.PI / 4) + 8) % 8;
      let s = Math.round(a) % 8;
      if (sector >= 0 && Math.abs(((a - sector + 12) % 8) - 4) < 0.62) s = sector;  // marge autour du secteur actuel
      sector = s; set(SECT[s]);
    };
    const end = () => { sector = -1; knob.style.transform = ''; set(null); };
    el.addEventListener('pointerdown', e => { e.preventDefault(); capture(el, e); move(e); });
    el.addEventListener('pointermove', e => { if (cur !== null || e.buttons || e.pressure) move(e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
  }

  // ------------------------------------------------------------ disposition selon l'écran
  function place(el, x, y, w, h) { Object.assign(el.style, { left: Math.round(x) + 'px', top: Math.round(y) + 'px', width: Math.round(w) + 'px', height: Math.round(h) + 'px', fontSize: Math.max(8, Math.round(Math.min(w, h) * 0.2)) + 'px', opacity: '' }); }
  function layout() {
    if (!root) return;
    const vw = window.innerWidth, vh = window.innerHeight, c = DW.canvas.getBoundingClientRect();
    const $ = s => root.querySelector(s), S = $('.stick'), A = $('.a'), B = $('.b'), M = $('.menu'), R = $('.run');
    const below = vh - c.bottom, side = (vw - c.width) / 2, D = $('.deck');
    D.style.display = below > 150 ? 'block' : 'none';
    if (below > 150) {
      // portrait : panneau façon console portable sous l'écran de jeu, commandes compactes
      const top = c.bottom, h = vh - top; D.style.top = top + 'px';
      const u = Math.min(h * 0.42, vw * 0.3, 150), cy = top + Math.min(h * 0.5, 34 + u * 0.75);
      place(S, vw * 0.08, cy - u / 2, u, u);
      const a = u * 0.46, b = u * 0.36;
      place(A, vw - a - vw * 0.08, cy - a * 0.9, a, a);
      place(B, vw - a - b - vw * 0.11, cy + a * 0.1, b, b);
      place(M, vw / 2 + 6, cy + u * 0.5 + 14, 84, 26);
      place(R, vw / 2 - 90, cy + u * 0.5 + 14, 84, 26);
    } else {
      // paysage : sur les côtés de l'écran de jeu (par-dessus, un peu transparents, si la place manque)
      const room = side > 110, u = Math.min(room ? side * 0.8 : vh * 0.28, vh * 0.34, 140), m = room ? (side - u) / 2 : 10;
      place(S, m, vh - u - 14, u, u);
      const a = u * 0.5, b = u * 0.4;
      place(A, vw - a - m, vh - u * 0.95 - 14, a, a);
      place(B, vw - a - b - m - 6, vh - b - 14, b, b);
      place(M, vw - 100 - m, 10, 100, 30);
      place(R, m, 10, 100, 30);
      if (!room) for (const el of [S, A, B, M, R]) el.style.opacity = '0.55';   // par-dessus le jeu : discrets
    }
  }

  function build() {
    if (built) return;
    built = true;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.body.classList.add('touch');
    root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = '<div class="deck"></div><div class="t stick"><i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i><div class="knob"></div></div>' +
      '<div class="t a">A</div><div class="t b">B</div><div class="t pill menu">MENU</div><div class="t pill run">COURIR</div>' +
      '<input data-saisie="1" maxlength="10" autocomplete="off" autocapitalize="words" enterkeyhint="done" placeholder="Ton nom">';
    document.body.appendChild(root);
    stick(root.querySelector('.stick'));
    hold(root.querySelector('.a'), 'ok'); hold(root.querySelector('.b'), 'back');
    hold(root.querySelector('.menu'), 'menu'); toggleRun(root.querySelector('.run'));
    // toucher l'écran de jeu = OK (dialogues, menus)
    DW.canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; e.preventDefault(); buzz(); Input.press('touch:screen', 'ok'); });
    for (const ev of ['pointerup', 'pointercancel']) DW.canvas.addEventListener(ev, () => Input.release('touch:screen', 'ok'));
    // saisie du nom : le clavier du téléphone écrit dans ce champ, recopié lettre par lettre dans Input.typed
    field = root.querySelector('input');
    field.addEventListener('input', e => {
      if (e.inputType && e.inputType.startsWith('delete')) Input.typed.push('Backspace');
      else for (const ch of e.data || '') Input.typed.push(ch);
      field.value = '';
    });
    field.addEventListener('keydown', e => { if (e.key === 'Enter') { Input.typed.push('Enter'); field.blur(); e.preventDefault(); } });
    // affiche le champ seulement pendant la saisie du nom
    setInterval(() => {
      const show = Input.textMode;
      if ((field.style.display === 'block') !== show) { field.style.display = show ? 'block' : 'none'; if (!show) field.blur(); }
    }, 150);
    window.addEventListener('resize', () => setTimeout(layout, 30));
    window.dispatchEvent(new Event('resize'));
    setTimeout(layout, 50);
  }
  DW.Touch = { build, layout, get on() { return built; } };

  window.addEventListener('touchstart', build, { once: true, passive: true });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
    if (document.body) build(); else window.addEventListener('DOMContentLoaded', build);
  }
})();
