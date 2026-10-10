export function registerPwaServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
    void navigator.serviceWorker.register(`${basePath}/sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}
