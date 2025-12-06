import ShareDialog from "./Share.js";
import InfoDialog from "./Info.js";
import AddStreamDialog from "./Add.js";
import GreetingDialog from "./Greeting.js";

let shareDialog;
let infoDialog;
let addStreamDialog;
let greetingDialog

/**
 * dialog interactions
 * 
 * @returns {void}
 */
function initDialogInteractions() {
  shareDialog = new ShareDialog();
  infoDialog = new InfoDialog();
  addStreamDialog = new AddStreamDialog();
  greetingDialog = new GreetingDialog();
}

/**
 * Cleans up and removes all event listeners added by `initDialogInteractions`.
 */
function destroyDialogInteractions() {
  if (shareDialog) {
    shareDialog.destroy();
    shareDialog = null;
  }
  if (infoDialog) {
    infoDialog.destroy();
    infoDialog = null;
  }
  if (addStreamDialog) {
    addStreamDialog.destroy();
    addStreamDialog = null;
  }
}

export {initDialogInteractions, destroyDialogInteractions};