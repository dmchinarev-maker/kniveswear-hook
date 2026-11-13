const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const source = fs.readFileSync('loyalty.js','utf8');
const helpers = source.slice(source.indexOf('  function labelPromo'), source.indexOf('  /* ВЫБОР ПВЗ OZON'));
function fixture(html) {
 const {document} = parseHTML('<html><body><form>'+html+'</form></body></html>');
 const ctx = {document};vm.createContext(ctx);vm.runInContext(helpers,ctx);
 return {ctx,form:document.querySelector('form')};
}
test('blank promo field gains a visible associated label and placeholder without duplicate labels',()=>{
 const {ctx,form}=fixture('<div class="t-input-group_pc"><input id="promo"><button class="t-inputpromocode__btn"><span class="t-btnflex__text">Activate</span></button></div>');
 ctx.labelPromo(form);ctx.labelPromo(form);
 assert.equal(form.querySelectorAll('label').length,1);
 assert.equal(form.querySelector('label').textContent,'Промокод');
 assert.equal(form.querySelector('label').htmlFor,'promo');
 assert.equal(form.querySelector('input').getAttribute('aria-label'),'Промокод');
 assert.equal(form.querySelector('input').placeholder,'Введите промокод');
 assert.equal(form.querySelector('button span').textContent,'Применить');
});
test('native delivery removes the old widget and hidden Ozon shipping target',()=>{
 const {ctx,form}=fixture('<div class="t-radio__wrapper-delivery" data-delivery-services="y"></div><div class="kwp"></div><input name="ozon_point" value="old-point">');
 assert.equal(ctx.usesTildaDelivery(form),true);ctx.removeLegacyDelivery(form);
 assert.equal(form.querySelector('.kwp'),null);assert.equal(form.querySelector('[name="ozon_point"]'),null);
 assert.ok(form.querySelector('.t-radio__wrapper-delivery'));
});
test('legacy delivery remains available until native delivery is configured',()=>{
 const {ctx,form}=fixture('<div class="kwp"></div>');
 assert.equal(ctx.usesTildaDelivery(form),false);
});
test('late Ozon script cannot mount over native delivery',()=>{
 const {document,window}=parseHTML('<html><body><form><div id="customdelivery"></div></form></body></html>');
 const ctx={window,document,setTimeout:()=>{throw Error('unexpected timer');}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('ozon-pvz.js','utf8'),ctx);
 window.KWL_PVZ.mount(document.querySelector('form'));
 assert.equal(document.querySelector('.kwp'),null);
});
