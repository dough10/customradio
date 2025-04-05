import CustomRadioApp from './utils/CustomRadioApp.js';

const app = new CustomRadioApp();

/**
 * window loaded
 */
window.onload = _ => app.init();

/**
 * cleanup on window unload
 */
window.onbeforeunload = _ => app.destroy();