'use strict';
// =====================================================================
//  COMMANDES TACTILES (téléphone, tablette) : croix directionnelle, OK, Retour,
//  Menu, Courir, et un champ de saisie pour le nom. Affichées au premier toucher
//  (ou d'emblée sur un appareil sans souris). Passent par DW.Input.press / release.
// =====================================================================
(function () {
  const Input = DW.Input;
  let built = false, field = null;

  const css = `
  #touch{position:fixed;inset:0;pointer-events:none;z-index:5;user-select:none;-webkit-user-select:none;font-family:'Press Start 2P',monospace}
  #touch .t{position:absolute;pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;
    color:#e8f4ff;background:rgba(30,60,120,.38);border:2px solid rgba(160,200,255,.55);box-sizing:border-box;font-size:10px}
  #touch .t.on{background:rgba(255,220,100,.45)}
  #touch .pad{left:18px;bottom:22px;width:140px;height:140px;border-radius:50%}
  #touch .pad i{position:absolute;width:0;height:0;border:9px solid transparent;opacity:.8}
  #touch .pad .u{top:12px;left:61px;border-bottom:12px solid #e8f4ff;border-top:0}
  #touch .pad .d{bottom:12px;left:61px;border-top:12px solid #e8f4ff;border-bottom:0}
  #touch .pad .l{left:12px;top:61px;border-right:12px solid #e8f4ff;border-left:0}
  #touch .pad .r{right:12px;top:61px;border-left:12px solid #e8f4ff;border-right:0}
  #touch .a{right:22px;bottom:70px;width:74px;height:74px;border-radius:50%;font-size:12px}
  #touch .b{right:104px;bottom:26px;width:60px;height:60px;border-radius:50%;font-size:8px}
  #touch .menu{right:18px;bottom:162px;width:76px;height:32px;border-radius:16px;font-size:8px}
  #touch .run{left:18px;bottom:176px;width:76px;height:32px;border-radius:16px;font-size:8px}
  #touch input{position:absolute;left:50%;top:30%;transform:translateX(-50%);width:220px;font:16px sans-serif;padding:8px;
    pointer-events:auto;display:none;border:2px solid #ffd860;border-radius:6px;background:#0a1430;color:#ffd860;text-align:center}
  body.touch{align-items:flex-start}
  @media (orientation: landscape){ body.touch{align-items:center} }`;

  // capture du doigt (pour recevoir son relâchement même hors du bouton) ; peut échouer si le pointeur a déjà disparu
  const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (err) { /* sans capture */ } };
  // bouton qui tient une action tant qu'il est touché
  function hold(el, action) {
    const src = 'touch:' + action;
    const down = e => {
      e.preventDefault(); capture(el, e); el.classList.add('on');
      if (Input.textMode) { if (action === 'ok' || action === 'menu') Input.typed.push('Enter'); else if (action === 'back') Input.typed.push('Backspace'); return; }
      Input.press(src, action);
    };
    const up = () => { el.classList.remove('on'); Input.release(src, action); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  }
  // croix : la direction suit le doigt (on peut glisser d'une direction à l'autre)
  function dpad(el) {
    let cur = null;
    const set = d => {
      if (d === cur) return;
      if (cur) Input.release('touch:pad', cur);
      cur = d;
      if (d && !Input.textMode) Input.press('touch:pad', d);
      el.classList.toggle('on', !!d);
    };
    const at = e => {
      const r = el.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      if (x * x + y * y < 14 * 14) return null;
      return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
    };
    el.addEventListener('pointerdown', e => { e.preventDefault(); capture(el, e); set(at(e)); });
    el.addEventListener('pointermove', e => { if (cur !== null || e.buttons) set(at(e)); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, () => set(null));
  }

  function build() {
    if (built) return;
    built = true;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.body.classList.add('touch');
    const root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = '<div class="t pad"><i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i></div>' +
      '<div class="t a">OK</div><div class="t b">RETOUR</div><div class="t menu">MENU</div><div class="t run">COURIR</div>' +
      '<input data-saisie="1" maxlength="10" autocomplete="off" autocapitalize="words" enterkeyhint="done" placeholder="Ton nom">';
    document.body.appendChild(root);
    dpad(root.querySelector('.pad'));
    hold(root.querySelector('.a'), 'ok'); hold(root.querySelector('.b'), 'back');
    hold(root.querySelector('.menu'), 'menu'); hold(root.querySelector('.run'), 'run');
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
    window.dispatchEvent(new Event('resize'));
  }
  DW.Touch = { build, get on() { return built; } };

  window.addEventListener('touchstart', build, { once: true, passive: true });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
    if (document.body) build(); else window.addEventListener('DOMContentLoaded', build);
  }
})();
