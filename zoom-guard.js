// v1.22.6: iOS Safari fallback for accidental page pinch-zoom.
// Do not touch pointer/touchmove events: these power rack/board dragging and scrolling.
export function preventPagePinch(event) {
  if (event.cancelable) event.preventDefault();
}

if (typeof document !== 'undefined' && typeof window !== 'undefined' &&
    window.matchMedia?.('(any-pointer: coarse)').matches) {
  document.addEventListener('gesturestart', preventPagePinch, {passive:false});
  document.addEventListener('gesturechange', preventPagePinch, {passive:false});
}
