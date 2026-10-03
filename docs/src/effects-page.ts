import { effectAbout, effectNames, engine } from './shared';

async function boot() {
  await engine();
  const about = effectAbout();
  const grid = document.getElementById('fxgrid') as HTMLElement;
  const frag = document.createDocumentFragment();
  for (const name of effectNames()) {
    const card = document.createElement('div');
    card.className = 'fxcard';
    const b = document.createElement('b');
    b.textContent = name;
    const span = document.createElement('span');
    span.textContent = about.get(name) ?? '';
    const code = document.createElement('code');
    code.textContent = `echo "hello" | ttfx ${name}`;
    code.title = 'click to copy';
    code.style.cursor = 'pointer';
    code.addEventListener('click', () => {
      void navigator.clipboard?.writeText(code.textContent ?? '');
      code.textContent = 'copied!';
      setTimeout(() => {
        code.textContent = `echo "hello" | ttfx ${name}`;
      }, 900);
    });
    card.append(b, span, code);
    frag.append(card);
  }
  grid.append(frag);
}

void boot();
