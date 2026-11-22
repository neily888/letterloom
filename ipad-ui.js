// Letterloom v1.22.7 — move the original buttons, never duplicate them.
// Moving DOM nodes preserves their existing event listeners and behaviour.
// Scope the change to iPad-sized portrait touch screens; restore on rotation.
export const IPAD_PORTRAIT_QUERY = '(min-width: 760px) and (max-width: 900px) and (orientation: portrait) and (any-pointer: coarse)';

export function positionHeadingButtons(compactMode,headerActions,headingActions,helpButton,newButton,installButton) {
  if (compactMode) {
    headingActions.append(helpButton,newButton);
  } else {
    headerActions.insertBefore(helpButton,installButton);
    headerActions.append(newButton);
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const media=window.matchMedia(IPAD_PORTRAIT_QUERY);
  const headerActions=document.querySelector('.header-actions');
  const headingActions=document.getElementById('ipad-heading-actions');
  const helpButton=document.getElementById('help-button');
  const newButton=document.getElementById('new-button');
  const installButton=document.getElementById('install-button');
  if (headerActions && headingActions && helpButton && newButton && installButton) {
    const sync=()=>positionHeadingButtons(media.matches,headerActions,headingActions,helpButton,newButton,installButton);
    sync();
    if (media.addEventListener) media.addEventListener('change',sync);
    else media.addListener(sync); // Older WebKit support.
  }
}
