/**
 * Provides haptic feedback by vibrating the device.
 * 
 * @returns {void}
 */
export default function hapticFeedback() {
  if (!('vibrate' in navigator)) {
    console.warn('Vibration API is not supported on this device.');
    return;
  }

  if (!window.matchMedia('(display-mode: standalone)').matches) {
    console.warn('Haptic feedback is only available in standalone mode.');
    return;
  }

  const success = navigator.vibrate(20);
  if (!success) {
    console.warn('Vibration request was ignored or failed.');
  }
}