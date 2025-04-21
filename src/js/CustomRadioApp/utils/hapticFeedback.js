/**
 * Provides haptic feedback by vibrating the device.
 * 
 * @returns {void}
 */
export default function hapticFeedback() {
  if (!('vibrate' in navigator)) {
    return;
  }

  if (!window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  const success = navigator.vibrate(20);
  if (!success) {
    console.warn('Vibration request was ignored or failed.');
  }
}