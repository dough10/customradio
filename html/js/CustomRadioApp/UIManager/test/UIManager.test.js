import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import UIManager from '../UIManager.js';

describe('UIManager', () => {
  let uiManager;
  let mockSelectors;

  beforeEach(() => {
    mockSelectors = {
      toTop: '#toTop',
      filter: '#filter',
      downloadButton: '#downloadButton',
      stationCount: '#stationCount',
      resetButton: '#resetButton',
      main: '#main',
      genres: '#genres',
      selectedStation: '.selectedStation',
      loading: '.loading',
    };

    document.body.innerHTML = `
      <div class="alert">
        <div class="yellow-text"></div>
      </div>
      <button id="toTop"></button>
      <input id="filter" />
      <button id="downloadButton"></button>
      <div id="stationCount"></div>
      <button id="resetButton"></button>
      <div id="main"></div>
      <datalist id="genres">
        <option value="Rock"></option>
        <option value="Jazz"></option>
      </datalist>
      <div class="selectedStation" style="display: none;"></div>
      <div class="loading"></div>
      <div id="info"></div>
      <div id="add_button"></div>
      <div id="add-stream"></div>
      <input id="station-url"></input>
    `;

    uiManager = new UIManager(mockSelectors);
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('should toggle visibility of selected elements', () => {
    const selected = document.querySelector(mockSelectors.selectedStation);
    selected.style.display = 'none';

    uiManager.toggleSelectedVisability();

    expect(selected.style.display).to.equal('flex');

    uiManager.toggleSelectedVisability();

    expect(selected.style.display).to.equal('none');
  });

  it('should remove the loading animation and unhide the station count', () => {
    const stationCount = document.querySelector(mockSelectors.stationCount);
    stationCount.style.display = 'none';

    uiManager.loadingEnd();
    
    const loadingElement = document.querySelector(mockSelectors.loading);

    expect(loadingElement).to.be.null; // The loading element should be removed
    expect(stationCount.style.display).to.equal(''); // The station count should be visible
  });

  it('should scroll to the top of the page', () => {
    const main = document.querySelector(mockSelectors.main);
    main.scrollTop = 100;

    uiManager._toTopHandler();

    expect(main.scrollTop).to.equal(0);
  });

  it('should attach UI listeners', () => {
    const onFilterChange = sinon.spy();
    const onReset = sinon.spy();

    uiManager.attachListeners({ onFilterChange, onReset });

    const filter = document.querySelector(mockSelectors.filter);
    const resetButton = document.querySelector(mockSelectors.resetButton);

    filter.dispatchEvent(new Event('change'));
    resetButton.click();

    expect(onFilterChange.calledOnce).to.be.true;
    expect(onReset.calledOnce).to.be.true;
  });

  it('should detach UI listeners', () => {
    const emRemoveAllSpy = sinon.spy(uiManager._em, 'removeAll');

    uiManager.detachListeners();

    expect(emRemoveAllSpy.calledOnce).to.be.true;
  });
});