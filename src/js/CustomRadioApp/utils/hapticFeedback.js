/**
 * vibrate the device to provide haptic feedback.
 * 
 * @returns {void}
 */
export default function hapticFeedback() {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate(20);
}