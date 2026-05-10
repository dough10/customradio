import DialogBase from './DialogBase.js';
import EventManager from '../../EventManager/EventManager.js';
import { t } from '../../utils/i18n.js';

function createDialog(textBody) {
  const dialog = document.createElement('dialog');
  dialog.id = `confirmation-${Date.now()}`;

  const body = document.createElement('div');
  body.textContent = textBody;
  body.classList.add('margin-bottom-24');

  const yes = document.createElement('button');
  yes.classList.add('button');
  yes.textContent = t('yes');

  const no = document.createElement('button');
  no.classList.add('button');
  no.textContent = t('no');

  const buttonRow = document.createElement('div)');
  buttonRow.classList.add('flex-row');
  buttonRow.append(yes, no);

  dialog.append(body, buttonRow);

  return { dialog, yes, no };
}

class ConfirmationDialog extends DialogBase {
  constructor(text, onConfirm) {
    const { dialog, yes, no } = createDialog(text);

    document.body.append(dialog);

    super(`#${dialog.id}`);

    this.em = new EventManager();

    const cleanup = () => {
      let called = false;

      const done = () => {
        if (called) return;
        called = true;
        this.destroy();
        this.em.removeAll();
        dialog.remove();
      };

      this.em.add(
        this.$dialog,
        this.em.types.transitionend,
        (e) => {
          if (e.target !== this.$dialog) return;
          done();
        },
        true
      );

      setTimeout(done, 350);

      this.close();
    };

    this.em.add(yes, this.em.types.click, _ => {
      if (typeof onConfirm === 'function') onConfirm();
      cleanup();
    });

    this.em.add(no, this.em.types.click, cleanup);

    requestAnimationFrame(_ => this.open());
  }
}

export default ConfirmationDialog;