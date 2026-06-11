/** Periodically check backend health on the client to update degraded banner state. */
export default defineNuxtPlugin(() => {
  const systemStore = useSystemStore();

  const check = () => {
    systemStore.checkBackendHealth().catch(() => undefined);
  };

  check();
  const interval = window.setInterval(check, 60_000);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => window.clearInterval(interval));
  }
});
