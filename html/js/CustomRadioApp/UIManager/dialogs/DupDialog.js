import EventManager from "../../EventManager/EventManager";
import ConfirmationDialog from "./ConfirmationDialog.js";
import Toast from "../../Toast/Toast.js";
import DialogBase from "./DialogBase.js";
import sleep from "../../utils/sleep.js";
import opt from '../../utils/post_options.js';
import createSVGIcon from '../../LazyLoader/helpers/createSVGIcon.js';

const em = new EventManager();

class DupDialog extends DialogBase {

  #buttonsActive = false;
  #scollArea = '#duplicates>.scrollable'
  #allButtonsSelector = `${this.#scollArea}>div>button`;
  #buttonSVG = {
    d: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    viewbox: '0 0 24 24'
  };

  constructor(sel) {
    super(sel);
    this.#activateButtons();
  }

  #createElements({ url, name, id }) {
    const $title = document.createElement('span');
    $title.textContent = name;

    const $url = document.createElement('span');
    $url.textContent = url;

    const $left = document.createElement('div');
    $left.append($title, $url);

    const $button = document.createElement('button');
    $button.classList.add('small-button');
    $button.append(createSVGIcon(this.#buttonSVG));

    const $wrapper = document.createElement('div');
    $wrapper.dataset.id = id;
    $wrapper.append($left, $button);
    return $wrapper;
  }

  #pushToUi(duplicates) {
    this.#buttonsActive = false;
    const fragment = document.createDocumentFragment();
    for (const dup of duplicates) {
      fragment.append(this.#createElements(dup));
    }
    document.querySelector(this.#scollArea).replaceChildren(fragment);
    this.#activateButtons();
  }

  async #unmarkDuplicate(ev) {
    try {
      const button = ev.target;
      button.disabled = true;
      const id = button.parentElement.dataset;
      const markres = await fetch('/stations/duplicates/unmark', opt(id));
      if (!markres.ok) throw new Error('API error');
      const dupres = await fetch('/stations/duplicates');
      if (!dupres.ok) throw new Error('API error');
      this.#pushToUi(await dupres.json());
    } catch (err) {
      new Toast(`Failed to remove duplicates: ${err}`);
      console.error(err)
    }
  }

  #activateButtons() {
    if (this.#buttonsActive) return;
    const buttons = document.querySelectorAll(this.#allButtonsSelector);
    buttons.forEach(button => {
      em.add(button, em.types.click, ev => new ConfirmationDialog(
        'Remove from duplicate list?',
        _ => this.#unmarkDuplicate(ev)
      ));
    });
    this.#buttonsActive = true;
  }
}

export default DupDialog;