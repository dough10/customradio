import Alert from "./Alerts.js";
import EventManager from "../EventManager/EventManager.js";

const em = new EventManager();

/**
 * fetches active alerts
 * 
 * @returns {Object[]}
 */
async function fetchAlerts() {
  try {
    const url = new URL('/alerts', window.location.origin);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return await res.json();
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return [];
  }
}

/**
 * async wait for an alert to be closed
 */
function waitForAlertClose() {
  const ns = `alert-close${Date.now()}`;
  return new Promise((resolve) => {
    em.add(document, em.types.alertClosed, _ => {
      em.removeByNamespace(ns);
      resolve();
    }, { once: true }, ns);
  });
}

/**
 * displays active alerts fatched from api
 * 
 * @returns {void}
 */
export default async function showActiveAlerts() {
  const alerts = await fetchAlerts();

  for (const { id, version, title, paragraphs } of alerts) {
    if (document.querySelector('.alert')) {
      await waitForAlertClose();
    }
    const key = `alert_${id}_${version}`;
    new Alert(key, title, paragraphs);
  }
}