import { element } from './dom.js';

let current = null;

export function isDialogOpen() {
  return current !== null;
}

// 이중 테두리 대화상자 + 기본 버튼. Enter, Esc, 버튼 클릭으로 닫는다.
export function showDialog(container, { title, lines, button = 'OK' }) {
  if (current) return;

  const overlay = element('div', 'overlay');
  const dialog = element('div', 'dialog');
  const body = element('div', 'dialog-body');
  body.append(element('h1', '', title));
  for (const line of lines) body.append(element('p', '', line));
  const ok = element('div', 'button', button);
  body.append(ok);
  dialog.append(body);
  overlay.append(dialog);
  container.append(overlay);

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    current = null;
  }

  ok.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  current = overlay;
}
