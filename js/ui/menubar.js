import { element } from './dom.js';

// menus: [{ title | icon, items?: [{ label, shortcut, action, enabled? } | '-'] }]
// items가 없는 메뉴는 비활성(회색)으로만 표시된다.
//
// 원본처럼 "누른 채로 끌어서 놓으면 실행"되고, 짧게 클릭하면 열린 채로 남아 다시 클릭해 고를 수도 있다.
export function createMenubar(el, menus) {
  let openEntry = null;
  let tracking = false; // 마우스 버튼을 누른 채로 메뉴를 보고 있는가

  const entries = menus.map((menu) => {
    const title = element('div', 'menu-title', menu.title);
    if (menu.icon) title.append(menu.icon);
    if (!menu.items) title.classList.add('disabled');
    el.append(title);
    return { menu, title, list: null };
  });

  function open(entry) {
    close();
    const list = element('div', 'menu');
    list.style.left = `${entry.title.offsetLeft}px`;
    for (const item of entry.menu.items) {
      if (item === '-') {
        list.append(element('div', 'menu-separator'));
        continue;
      }
      const row = element('div', 'menu-item');
      row.append(element('span', '', item.label), element('span', '', item.shortcut || ''));
      if (item.enabled && !item.enabled()) row.classList.add('disabled');
      row.item = item;
      list.append(row);
    }
    el.parentElement.append(list);
    entry.title.classList.add('open');
    entry.list = list;
    openEntry = entry;
  }

  function close() {
    if (!openEntry) return;
    openEntry.title.classList.remove('open');
    openEntry.list.remove();
    openEntry = null;
    tracking = false;
  }

  for (const entry of entries) {
    if (!entry.menu.items) continue;

    entry.title.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (openEntry === entry && !tracking) {
        close();
        return;
      }
      open(entry);
      tracking = true;
    });

    // 메뉴가 열린 상태에서 다른 제목 위로 가면 그 메뉴로 바꾼다.
    entry.title.addEventListener('pointerenter', () => {
      if (!openEntry || openEntry === entry) return;
      const wasTracking = tracking;
      open(entry);
      tracking = wasTracking;
    });
  }

  document.addEventListener('pointerup', (e) => {
    if (!openEntry) return;
    const row = e.target.closest?.('.menu-item');
    if (row) {
      if (row.classList.contains('disabled')) {
        if (tracking) close();
        return;
      }
      close();
      row.item.action();
      return;
    }
    if (tracking && e.target.closest?.('.menu-title') === openEntry.title) {
      tracking = false; // 짧은 클릭: 메뉴를 열어 둔다
      return;
    }
    close();
  });

  // 메뉴가 열려 있을 때 바깥을 클릭하면 닫기만 하고, 그 클릭은 그림에 전달하지 않는다.
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!openEntry || tracking) return;
      if (e.target.closest?.('.menu, .menu-title')) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    },
    true,
  );

  return { close };
}
