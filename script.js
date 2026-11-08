// Invoice Styles — github.com/veraetogrex-portfolio · zero dependencies
// One invoice, three looks: an ivory receipt, a loud colour block, a terminal printout.
// Switching style doesn't just recolour it: every block flies to its new place (FLIP),
// the terminal types itself out, and the total rolls like an odometer.

const root  = document.querySelector('#invoice');
const parts = [...root.querySelectorAll('.iv-part')];
const tabs  = [...root.querySelectorAll('.iv-switch button')];
const rows  = [...root.querySelectorAll('.iv-row')];
const odo   = root.querySelector('.iv-odo');
const DEFAULT_QTY = rows.map(r => +r.querySelector('.iv-qty b').textContent);
let style = 'paper';

root.querySelector('.iv-dl').insertAdjacentHTML('beforeend', '<span class="iv-caret" hidden></span>');
const caret = root.querySelector('.iv-caret');

// money
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = r => +r.querySelector('.iv-qty b').textContent;
const total = () => rows.reduce((s, r) => s + qty(r) * r.dataset.price, 0);

// 1 · odometer: every digit is a column 0–9 that slides to its value
function setTotal(n, spin = false) {
  const text = money(n);
  if (odo.dataset.shape !== text.replace(/\d/g, '0')) {        // new number of digits: rebuild the columns
    odo.dataset.shape = text.replace(/\d/g, '0');
    odo.innerHTML = [...text].map(c => /\d/.test(c)
      ? `<span class="iv-d"><span class="iv-col">${[...'0123456789'].map(d => `<i>${d}</i>`).join('')}</span></span>`
      : `<i>${c}</i>`).join('');
  }
  const digits = text.replace(/\D/g, '');
  [...odo.querySelectorAll('.iv-col')].forEach((col, k) => {
    const d = +digits[k];
    if (spin) {                                               // start a few digits away, then spin in, left to right
      col.style.transition = 'none'; col.style.transform = `translateY(${-((d + 6) % 10) * 1.1}em)`;
      void col.offsetWidth; col.style.transition = ''; col.style.transitionDelay = k * 45 + 'ms';
    } else col.style.transitionDelay = '';
    col.style.transform = `translateY(${-d * 1.1}em)`;
  });
  odo.setAttribute('aria-label', text);
}

function paintRows() { rows.forEach(r => r.querySelector('.iv-sum').textContent = money(qty(r) * r.dataset.price)); }

// 2 · restyle: measure, switch the class, then animate every part from where it was (FLIP)
function restyle(next) {
  if (next === style) return;
  const k = root.getBoundingClientRect().width / root.offsetWidth;   // works inside zoomed / scaled parents
  const before = new Map(parts.map(p => [p, p.getBoundingClientRect()]));
  root.classList.replace('is-' + style, 'is-' + next); style = next;
  tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.style === next));
  caret.hidden = next !== 'term';

  parts.forEach((p, i) => {
    p.getAnimations().forEach(a => a.cancel());
    if (next === 'term') {                                     // 3 · terminal: each block types itself in
      p.animate([{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0 -10% 0)' }],
        { duration: 360, delay: 80 + i * 120, easing: 'steps(12)', fill: 'backwards' });
      return;
    }
    const a = before.get(p), b = p.getBoundingClientRect();
    const dx = (a.left - b.left) / k, dy = (a.top - b.top) / k, s = a.height / b.height;
    p.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})`, opacity: .6 }, { transform: 'none', opacity: 1 }],
      { duration: 560, delay: i * 30, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
  });
  setTotal(total(), true);
}

function step(row, by) {
  const b = row.querySelector('.iv-qty b'), n = Math.max(0, Math.min(9, +b.textContent + by));
  if (n === +b.textContent) return;
  b.textContent = n;
  b.animate([{ transform: `translateY(${by > 0 ? -10 : 10}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
  paintRows(); setTotal(total());
}

function reset() {
  parts.forEach(p => p.getAnimations().forEach(a => a.cancel()));
  root.className = 'iv is-paper'; style = 'paper'; caret.hidden = true;
  tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.style === 'paper'));
  rows.forEach((r, i) => r.querySelector('.iv-qty b').textContent = DEFAULT_QTY[i]);
  paintRows();
  odo.dataset.shape = ''; setTotal(total());
  odo.querySelectorAll('.iv-col').forEach(c => { c.style.transition = 'none'; void c.offsetWidth; c.style.transition = ''; });
}

tabs.forEach(t => t.addEventListener('click', () => restyle(t.dataset.style)));
rows.forEach(r => {
  r.querySelector('.iv-inc').addEventListener('click', () => step(r, +1));
  r.querySelector('.iv-dec').addEventListener('click', () => step(r, -1));
});

reset();
root.invoice = { restyle, reset };                        // for scripted demos
