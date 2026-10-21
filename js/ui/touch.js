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
  let built = false, field = null, root = null;

  const css = `
  html,body{touch-action:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
  #touch{position:fixed;inset:0;pointer-events:none;z-index:5;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Press Start 2P',monospace}
  #touch .t{position:absolute;pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;
    color:#e8f4ff;background:rgba(30,60,120,.42);border:2px solid rgba(160,200,255,.6);box-sizing:border-box;border-radius:50%;
    box-shadow:0 0 10px rgba(60,120,255,.35) inset;transition:opacity .15s}
  #touch.dialogue .t.surdlg{opacity:.2!important}
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
  #touch input{position:absolute;font:16px sans-serif;padding:0;margin:0;box-sizing:border-box;pointer-events:auto;display:none;
    border:0;outline:0;background:transparent;color:transparent;caret-color:transparent;text-align:center;opacity:.02}
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
  // COURIR : interrupteur (Input.runLock : ce n'est pas une touche tenue, il n'accélère donc pas les textes)
  function toggleRun(el) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); buzz(); Input.runLock = !Input.runLock; el.classList.toggle('toggled', Input.runLock);
    });
  }
  // stick analogique : 8 secteurs de 45° (Input.secteur) ; dans la saisie du nom, il déplace la sélection des prénoms
  const ARROW = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  function stick(el) {
    const knob = el.querySelector('.knob');
    let cur = null, sector = -1;
    const set = d => {
      if (d === cur) return;
      if (cur) for (const a of cur.split(',')) Input.release('touch:pad:' + a, a);
      cur = d;
      if (d && Input.textMode) { if (ARROW[d]) { Input.typed.push(ARROW[d]); buzz(); } }   // (pas en diagonale)
      else if (d) { for (const a of d.split(',')) Input.press('touch:pad:' + a, a); buzz(); }
      el.classList.toggle('on', !!d);
    };
    const move = e => {
      const r = el.getBoundingClientRect(), R = r.width / 2;
      let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R);
      const dist = Math.hypot(x, y), lim = R * 0.62;
      if (dist > lim) { x *= lim / dist; y *= lim / dist; }
      knob.style.transform = `translate(${x}px,${y}px)`;
      if (dist < R * 0.22) { sector = -1; set(null); return; }                     // zone morte au centre
      sector = Input.secteur(x, y, sector); set(Input.SECT[sector]);
    };
    const end = () => { sector = -1; knob.style.transform = ''; set(null); };
    el.addEventListener('pointerdown', e => { e.preventDefault(); capture(el, e); move(e); });
    el.addEventListener('pointermove', e => { if (cur !== null || e.buttons || e.pressure) move(e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
  }

  // ------------------------------------------------------------ disposition selon l'écran
  // zone sûre (encoche et barre d'accueil des iPhone, viewport-fit=cover) : les commandes restent dans la partie visible
  let sonde = null;
  function zoneSure() {
    if (!sonde) { sonde = document.createElement('div'); sonde.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(sonde); }
    const s = getComputedStyle(sonde), v = k => parseFloat(s[k]) || 0;
    return { t: v('paddingTop'), r: v('paddingRight'), b: v('paddingBottom'), l: v('paddingLeft') };
  }
  function place(el, x, y, w, h) { Object.assign(el.style, { left: Math.round(x) + 'px', top: Math.round(y) + 'px', width: Math.round(w) + 'px', height: Math.round(h) + 'px', fontSize: Math.max(8, Math.round(Math.min(w, h) * 0.2)) + 'px', opacity: '' }); }
  function layout() {
    if (!root) return;
    const vw = window.innerWidth, vh = window.innerHeight, c = DW.canvas.getBoundingClientRect();
    const $ = s => root.querySelector(s), S = $('.stick'), A = $('.a'), B = $('.b'), M = $('.menu'), R = $('.run');
    const below = vh - c.bottom, side = (vw - c.width) / 2, D = $('.deck'), Z = zoneSure();
    D.style.display = below > 150 ? 'block' : 'none';
    if (below > 150) {
      // portrait : panneau façon console portable sous l'écran de jeu, commandes compactes
      const top = c.bottom, h = vh - top; D.style.top = top + 'px';
      // (boutons d'au moins 44 px : la taille conseillée pour un doigt)
      const u = Math.min(h * 0.42, vw * 0.3, 150), cy = top + Math.min(h * 0.5, 34 + u * 0.75) - Z.b / 2;
      place(S, vw * 0.08 + Z.l, cy - u / 2, u, u);
      const a = Math.max(48, u * 0.46), b = Math.max(44, u * 0.4);
      place(A, vw - a - vw * 0.08 - Z.r, cy - a * 0.9, a, a);
      place(B, vw - a - b - vw * 0.11 - Z.r, cy + a * 0.1, b, b);
      const py = Math.min(cy + u * 0.5 + 14, vh - Z.b - 40);
      place(M, vw / 2 + 6, py, 90, 34);
      place(R, vw / 2 - 96, py, 90, 34);
    } else {
      // paysage : sur les côtés de l'écran de jeu (par-dessus, un peu transparents, si la place manque)
      const room = side > 110;
      // bandes libres mais étroites (écran 16:9 de 640 × 360 : 80 px de chaque côté) : des commandes plus petites, A et B
      // l'un au-dessus de l'autre, MENU et COURIR rétrécis, toutes DANS les bandes (avant : par-dessus le jeu, le bouton B
      // cachait la fin des dialogues) ; boutons d'au moins 44 px, zone sûre comprise
      const bG = c.left - Z.l, bD = vw - c.right - Z.r, bande = Math.min(bG, bD), etroit = !room && bande >= 66 && vh - Z.t - Z.b >= 230;
      if (etroit) {
        const w = bande - 12, xG = (Z.l + c.left) / 2, xD = (c.right + vw - Z.r) / 2;   // (largeur utile, milieu de chaque bande)
        const u = Math.min(w, vh * 0.34, 140), a = Math.min(w, 70), b = Math.min(w, 60), p = Math.min(w, 100);
        place(S, xG - u / 2, vh - u - 14 - Z.b, u, u);
        place(B, xD - b / 2, vh - b - 14 - Z.b, b, b);
        place(A, xD - a / 2, vh - b - a - 24 - Z.b, a, a);
        place(M, xD - p / 2, 10 + Z.t, p, 34);
        place(R, xG - p / 2, 10 + Z.t, p, 34);
      } else {
        const u = Math.min(room ? side * 0.8 : vh * 0.28, vh * 0.34, 140), m = room ? (side - u) / 2 : 10;
        place(S, m + Z.l, vh - u - 14 - Z.b, u, u);
        const a = Math.max(48, u * 0.5), b = Math.max(44, u * 0.42);
        place(A, vw - a - m - Z.r, vh - u * 0.95 - 14 - Z.b, a, a);
        place(B, vw - a - b - m - 6 - Z.r, vh - b - 14 - Z.b, b, b);
        place(M, vw - 100 - m - Z.r, 10 + Z.t, 100, 34);
        place(R, m + Z.l, 10 + Z.t, 100, 34);
        if (!room) for (const el of [S, A, B, M, R]) el.style.opacity = '0.55';   // par-dessus le jeu : discrets
      }
    }
    // commandes posées sur l'image du jeu (écran 4:3 : aucune bande libre) : celles qui couvrent la boîte de dialogue
    // (en bas de l'écran de jeu, 6 à 314 × 167 à 236) s'effacent presque pendant les dialogues — on lit le début et la fin
    // des répliques (avant : le stick cachait leur début) ; elles marchent toujours (classe « dialogue » : build)
    const kx = c.width / DW.W, ky = c.height / DW.H, dl = c.left + 6 * kx, dr = c.left + 314 * kx, dt = c.top + 167 * ky, db = c.top + 236 * ky;
    for (const el of [S, A, B, M, R]) {
      const x = parseFloat(el.style.left), y = parseFloat(el.style.top), w = parseFloat(el.style.width), h = parseFloat(el.style.height);
      el.classList.toggle('surdlg', x < dr && x + w > dl && y < db && y + h > dt);
    }
  }

  const surTitre = () => !!(DW.TitleScene && DW.Game.top() instanceof DW.TitleScene);
  // le champ de saisie du nom, exactement sur le cadre du nom de l'écran (NameScene.FIELD)
  function placeChamp() {
    const F = DW.NameScene && DW.NameScene.FIELD; if (!field || !F) return;
    const c = DW.canvas.getBoundingClientRect(), kx = c.width / DW.W, ky = c.height / DW.H;
    Object.assign(field.style, { left: Math.round(c.left + F[0] * kx) + 'px', top: Math.round(c.top + F[1] * ky) + 'px', width: Math.round(F[2] * kx) + 'px', height: Math.round(F[3] * ky) + 'px' });
  }

  function build() {
    if (built) return;
    built = true;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.body.classList.add('touch');
    root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = '<div class="deck"></div><div class="t stick"><i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i><div class="knob"></div></div>' +
      '<div class="t a">A</div><div class="t b">B</div><div class="t pill menu">MENU</div><div class="t pill run">COURIR</div>' +
      '<input data-saisie="1" maxlength="10" autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="words" enterkeyhint="done">';
    document.body.appendChild(root);
    stick(root.querySelector('.stick'));
    hold(root.querySelector('.a'), 'ok'); hold(root.querySelector('.b'), 'back');
    hold(root.querySelector('.menu'), 'menu'); toggleRun(root.querySelector('.run'));
    // toucher l'écran de jeu = OK (dialogues, menus)
    DW.canvas.addEventListener('pointerdown', e => {
      // saisie du nom : on touche un prénom proposé, VALIDER, EFFACER ou le cadre du nom (qui ouvre le clavier)
      if (Input.textMode) {
        e.preventDefault(); if (e.pointerType !== 'mouse') buzz();
        const r = DW.canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * DW.W, y = (e.clientY - r.top) / r.height * DW.H;
        const F = DW.NameScene && DW.NameScene.FIELD;
        if (F && field && x >= F[0] && x <= F[0] + F[2] && y >= F[1] && y <= F[1] + F[3]) { field.focus(); return; }
        if (field) field.blur();
        Input.typed.push('Tap:' + x + ',' + y); return;
      }
      if (e.pointerType === 'mouse') return; e.preventDefault(); buzz();
      { const r = DW.canvas.getBoundingClientRect(); Input.tapXY = [(e.clientX - r.left) / r.width * DW.W, (e.clientY - r.top) / r.height * DW.H]; }
      Input.press('touch:screen', 'ok');
    });
    for (const ev of ['pointerup', 'pointercancel']) DW.canvas.addEventListener(ev, () => Input.release('touch:screen', 'ok'));
    // saisie du nom : le clavier du téléphone écrit dans ce champ, posé (invisible) sur le cadre du nom ; son texte entier
    // devient le nom à chaque changement (avant : vidé à chaque lettre, la touche d'effacement et les mots proposés par
    // le clavier ne marchaient pas)
    field = root.querySelector('input');
    field.addEventListener('input', () => Input.typed.push('Set:' + field.value));
    field.addEventListener('focus', () => { field.value = Input.textValue || ''; });
    field.addEventListener('keydown', e => { if (e.key === 'Enter') { Input.typed.push('Enter'); field.blur(); e.preventDefault(); } });
    // le champ n'existe que pendant la saisie du nom, recopie le nom choisi autrement (prénom proposé, EFFACER)
    setInterval(() => {
      const show = Input.textMode;
      if ((field.style.display === 'block') !== show) { field.style.display = show ? 'block' : 'none'; if (!show) field.blur(); }
      if (show) { placeChamp(); if (document.activeElement !== field && field.value !== (Input.textValue || '')) field.value = Input.textValue || ''; }
      // pendant un dialogue, les commandes posées sur sa boîte s'effacent presque (layout : surdlg)
      root.classList.toggle('dialogue', !!DW.DialogScene && DW.Game.top() instanceof DW.DialogScene);
      // bouton Retour du téléphone (Android) : prêt dès qu'on quitte l'écran titre (voir plus bas)
      if (!surTitre() && !(history.state && history.state.jeu)) try { history.pushState({ jeu: 1 }, ''); } catch (e) { /* sans historique */ }
    }, 150);
    // bouton Retour du téléphone : c'est le Retour du jeu (avant : il fermait l'appli) ; sur l'écran titre, il quitte
    window.addEventListener('popstate', () => {
      if (surTitre()) return;
      Input.press('touch:retour', 'back'); setTimeout(() => Input.release('touch:retour', 'back'), 90);
      try { history.pushState({ jeu: 1 }, ''); } catch (e) { /* sans historique */ }
    });
    // (iOS ne libère le son qu'à la fin d'un toucher)
    window.addEventListener('touchend', () => DW.Audio.init(), { passive: true });
    Input.device = 'touch';   // (sinon les aides disaient « ESPACE » jusqu'au premier toucher)
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
