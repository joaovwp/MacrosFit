const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
let inactivityTimer = null;
let cleanupFunctions = [];

export function resetInactivityTimer(onTimeout) {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  if (!onTimeout) return;

  inactivityTimer = setTimeout(() => {
    onTimeout();
  }, INACTIVITY_TIMEOUT);
}

export function setupInactivityTracking(onTimeout) {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  const reset = () => resetInactivityTimer(onTimeout);

  events.forEach(event => {
    window.addEventListener(event, reset);
    cleanupFunctions.push(() => window.removeEventListener(event, reset));
  });

  reset();
}

export function endSession() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];
}
