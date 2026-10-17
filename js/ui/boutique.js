'use strict';
// =====================================================================
//  BOUTIQUE : acheter et vendre (stock selon la ville et le chapitre : DW.shopStock)
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;

  // ------------------------------------------------------------ boutique
  class ShopScene extends DW.Scene {
    // stock : liste d'objets, ou nom de boutique (DW.SHOPS, stock selon le niveau de la ville)
    constructor(stock) { super(); this.src = stock; this.i = 0; this.qty = 0; this.sell = false; this.top = 0; }
    get stock() { return this.sell ? DW.ITEM_ORDER.filter(id => (DW.state.bag[id] || 0) > 0) : typeof this.src === 'string' ? DW.shopStock(this.src) : this.src; }
    price(id) { const it = DW.ITEMS[id]; return this.sell ? (it.sell || Math.floor(it.price / 2)) : Math.ceil(it.price * (DW.Collab ? DW.Collab.priceMult() : 1)); }   // (Comptoir du Bazar : -15 %)
    update() {
      const st = DW.state, L = this.stock;
      if (this.qty > 0) {
        const id = L[this.i], it = DW.ITEMS[id];
        const max = this.sell ? st.bag[id] || 0 : Math.max(1, Math.min(DW.bagRoom(id), Math.floor(st.bits / this.price(id))));
        if (Input.hit('up') || Input.hit('right')) { this.qty = this.qty >= max ? 1 : this.qty + 1; Audio.sfx('move'); }
        if (Input.hit('down') || Input.hit('left')) { this.qty = this.qty <= 1 ? max : this.qty - 1; Audio.sfx('move'); }
        if (Input.hit('back')) { this.qty = 0; Audio.sfx('back'); }
        if (Input.hit('ok')) {
          const sum = this.price(id) * this.qty;
          if (this.sell) { st.bag[id] -= this.qty; st.bits += sum; this.msg = `Vendu ! +${sum} Bits`; this.i = Math.min(this.i, Math.max(0, this.stock.length - 1)); }
          else { if (sum > st.bits) { Audio.sfx('bump'); this.qty = 0; return; } st.bits -= sum; DW.giveItem(id, this.qty); this.msg = `Merci ! ${it.name} x${this.qty}`; }
          Audio.sfx('buy'); this.msgT = 2; this.qty = 0;
        }
        return;
      }
      const n = L.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('left') || Input.hit('right')) { this.sell = !this.sell; this.i = 0; this.top = 0; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) {
        if (this.i >= L.length) { Audio.sfx('back'); this.close(); return; }
        const id = L[this.i];
        if (!this.sell) {
          if (st.bits < DW.ITEMS[id].price) { Audio.sfx('bump'); this.msg = "Tu n'as pas assez de Bits !"; this.msgT = 2; return; }
          if (!DW.bagRoom(id)) { Audio.sfx('bump'); this.msg = `Sac plein (${DW.BAG_MAX} max) !`; this.msgT = 2; return; }
        }
        Audio.sfx('select'); this.qty = 1;
      }
      // fenêtre de 8 lignes qui suit le curseur
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) { if (this.msgT > 0) this.msgT -= dt; }
    draw(c) {
      const st = DW.state, L = this.stock;
      UI.menuBg(c, this.t, this.sell ? 'VENDRE' : 'BOUTIQUE');
      UI.box(c, 8, 26, 210, 150);
      UI.text(c, this.sell ? '◀ ACHETER' : 'VENDRE ▶', 210, 22, { size: 7, align: 'right', color: '#9ab0e8' });
      const rows = L.concat(['__quit']).slice(this.top, this.top + 8);
      rows.forEach((id, k) => {
        const y = 44 + k * 16;
        if (id === '__quit') { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        const it = DW.ITEMS[id];
        c.drawImage(DW.Icons.item(id), 12, y - 11, 12, 12);
        UI.text(c, it.name + (this.sell ? ` ×${st.bag[id]}` : ''), 26, y, { size: 9 });
        UI.text(c, `${this.price(id)} B`, 210, y, { size: 9, align: 'right', color: '#ffd860' });
      });
      if (this.top > 0) UI.text(c, '▲', 113, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < L.length + 1) UI.text(c, '▼', 113, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      UI.box(c, 224, 26, 88, 56);
      UI.text(c, 'Bits', 232, 42, { size: 9, color: '#9ab0e8' });
      UI.text(c, String(st.bits), 304, 56, { size: 11, align: 'right', bold: true, color: '#ffd860' });
      const id = L[this.i];
      UI.box(c, 8, 180, 304, 54);
      if (id) {
        const it = DW.ITEMS[id];
        UI.wrap(c, it.desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
        UI.text(c, `Dans le sac : ${st.bag[id] || 0}`, 304, 76, { size: 7, align: 'right', color: '#9ab0e8' });
      } else UI.text(c, this.sell ? 'Rien à vendre.' : 'La boutique est vide... Fais grandir la ville !', 16, 200, { size: 8, color: '#c8f0ff' });
      if (this.qty > 0) {
        UI.box(c, 224, 90, 88, 50);
        UI.text(c, `× ${this.qty}`, 268, 110, { size: 12, align: 'center', color: '#ffffff' });
        UI.text(c, `${this.price(id) * this.qty} B`, 268, 128, { size: 9, align: 'center', color: '#ffd860' });
      }
      if (this.msgT > 0) UI.text(c, this.msg, 268, 160, { size: 8, align: 'center', color: '#7aff8a' });
    }
  }
  DW.ShopScene = ShopScene;

})();
