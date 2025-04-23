import CustomRadioApp from './CustomRadioApp/CustomRadioApp.js';

const app = new CustomRadioApp();

/**
 * load app
 */
window.addEventListener('DOMContentLoaded', _ => app.init());

/**
 * cleanup on window unload
 */
window.addEventListener('unload', _ => app.destroy());