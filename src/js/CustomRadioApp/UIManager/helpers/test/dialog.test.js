import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {initDialogInteractions} from '../dialog.js';
import _OPTIONS from '../../../utils/post_options.js';
import Toast from '../../../Toast/Toast.js';
import loadingAnimation from '../insertLoadingAnimation.js';

describe('addDialogInteractions', () => {
  let dialog, addDialog, closeButton, addButton, form, inputElement, submitButton;

  beforeEach(() => {
    // Set up the DOM structure for testing
    document.body.innerHTML = `
    <meta name="X-CSRF-Token" content="test-token">
      <dialog id="info-dialog">
        <button class="close">Close</button>
        <h1></h1>
        <div id="changelog"></div>
        <ul id="dependencies"></ul>
      </dialog>
      <dialog id="add">
        <form id="add-stream">
          <input id="station-url" />
          <button id="submit-stream" disabled>Submit</button>
          <div id="response"></div>
        </form>
      </dialog>
      <button id="info">Info</button>
      <button id="add_button">Add</button>
    `;

    dialog = document.querySelector('#info-dialog');
    addDialog = document.querySelector('#add');
    closeButton = dialog.querySelector('.close');
    addButton = document.querySelector('#add_button');
    form = document.querySelector('#add-stream');
    inputElement = document.querySelector('#station-url');
    submitButton = document.querySelector('#submit-stream');

    // Initialize dialog interactions
    initDialogInteractions();
  });

  afterEach(() => {
    // Clean up the DOM after each test
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('should open the info dialog and populate dependencies', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      json: sinon.stub().resolves({
        version: '1.0.0',
        dependencies: { axios: '^1.2.3', sinon: '^7.5.0' },
        changelog: {
          "1.0.0": [
            'change made'
          ]
        }
      }),
    });

    const infoButton = document.querySelector('#info');
    infoButton.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(dialog.open).to.be.true;

    const versionHeader = dialog.querySelector('h1');
    expect(versionHeader.textContent).to.equal('v1.0.0');

    const changes = dialog.querySelectorAll('#changelog>*');
    expect(changes).to.have.lengthOf(2);
    expect(changes[0].textContent).to.equal('1.0.0:');
    expect(changes[1].textContent).to.equal('change made');

    const dependencies = dialog.querySelectorAll('#dependencies>li');
    expect(dependencies).to.have.lengthOf(2);
    expect(dependencies[0].textContent).to.equal('axios: 1.2.3');
    expect(dependencies[1].textContent).to.equal('sinon: 7.5.0');

    fetchStub.restore();
  });

  it('should close the dialog when the close button is clicked', () => {
    const closeSpy = sinon.spy(dialog, 'close');

    closeButton.click();

    expect(closeSpy).to.have.been.calledOnce;
  });

  it('should open the add dialog when the add button is clicked', () => {
    const addDialog = document.querySelector('#add');
    const showModalSpy = sinon.spy(addDialog, 'showModal');

    addButton.click();

    expect(showModalSpy).to.have.been.calledOnce;
  });

  it('should enable the submit button for a valid URL', () => {
    inputElement.value = 'https://example.com';
    inputElement.dispatchEvent(new Event('input'));

    expect(submitButton.hasAttribute('disabled')).to.be.false;
  });

  it('should disable the submit button for an invalid URL', () => {
    inputElement.value = 'invalid-url';
    inputElement.dispatchEvent(new Event('input'));

    expect(submitButton.hasAttribute('disabled')).to.be.true;
  });

  it('should handle form submission and display a success message', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      json: () => Promise.resolve({ message: 'Stream added successfully!' }),
    });

    inputElement.value = 'https://example.com';
    inputElement.dispatchEvent(new Event('input'));

    expect(submitButton.hasAttribute('disabled')).to.be.false;

    submitButton.click();

    expect(fetchStub).to.have.been.calledOnceWith('/add');

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(addDialog.querySelector('#response').textContent).to.equal('Stream added successfully!');

    fetchStub.restore();
  });

  it('should handle form submission errors and display an error message', async () => {
    const fetchStub = sinon.stub(window, 'fetch').rejects(new Error('Network error'));

    inputElement.value = 'https://example.com';
    inputElement.dispatchEvent(new Event('input'));

    expect(submitButton.hasAttribute('disabled')).to.be.false;
    
    submitButton.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fetchStub).to.have.been.called;
    expect(addDialog.querySelector('#response').textContent).to.equal('An error occurred!');

    fetchStub.restore();
  });
});