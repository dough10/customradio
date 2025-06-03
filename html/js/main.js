import CustomRadioApp from './CustomRadioApp/CustomRadioApp.js';
import EventManager from './CustomRadioApp/EventManager/EventManager.js';

const em = new EventManager();
const app = new CustomRadioApp();

/**
 * load app
 */
em.add(window, 'load', _ => app.init());

/**
 * cleanup on window unload
 */
em.add(window, 'beforeunload', _ => {
  app.destroy();
  em.removeAll();
});