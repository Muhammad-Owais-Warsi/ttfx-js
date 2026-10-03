import { effectAbout, effectHelps, effectNames, engine } from './shared';

async function boot() {
  await engine();
  const names = effectNames();
  const about = effectAbout();
  const helps = effectHelps();
  const box = document.getElementById('cli-effects') as HTMLElement;
  const frag = document.createDocumentFragment();
  for (const name of names) {
    const d = document.createElement('details');
    d.className = 'cli-fx';
    const s = document.createElement('summary');
    const b = document.createElement('b');
    b.textContent = name;
    const desc = document.createElement('span');
    desc.textContent = ' — ' + (about.get(name) ?? '');
    s.append(b, desc);
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = helps.get(name) ?? '';
    pre.append(code);
    d.append(s, pre);
    frag.append(d);
  }
  box.append(frag);
}

void boot();
