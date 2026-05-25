const injected = new Set();

export function injectStyles(id, css) {
  if (injected.has(id)) return;
  injected.add(id);
  const style = document.createElement('style');
  style.setAttribute('data-style-id', id);
  style.textContent = css;
  document.head.appendChild(style);
}
