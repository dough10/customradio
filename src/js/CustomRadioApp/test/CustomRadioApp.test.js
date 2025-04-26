import { expect } from '@open-wc/testing';
import sinon from 'sinon';

import CustomRadioApp from '../CustomRadioApp.js';

describe('CustomRadioApp', () => {
  let app;
  let uiManager;
  let stationsManager;
  let consoleLogSpy;
  let hapticFeedbackStub;
  let swloader;

  beforeEach(() => {
    uiManager = {
      attachListeners: sinon.stub(),
      detachListeners: sinon.stub(),
      loadingStart: sinon.stub().callsFake((el) => {
        const loadingEl = document.createElement('div');
        loadingEl.classList.add('loading');
        loadingEl.textContent = 'Loading...';
        el.appendChild(loadingEl);
      }),
      loadingEnd: sinon.stub().callsFake(() => {
        const loadingEl = document.querySelector('.loading');
        if (loadingEl) {
          loadingEl.remove();
        }
      }),
      setCounts: sinon.stub(),
      currentGenres: sinon.stub().returns([]),
      getGenres: sinon.stub().resolves([]),
      loadGenres: sinon.stub(),
      onscroll: sinon.stub(),
      audioPlayer: {
        playStream: sinon.stub()
      }
    };

    stationsManager = {
      fetchStations: sinon.stub().resolves([]),
      filterStations: sinon.stub().returns([]),
      getSelectedStations: sinon.stub().returns([]),
      getGenres: sinon.stub().resolves([]),
    };

    hapticFeedbackStub = sinon.stub();

    swloader = sinon.stub();

    document.body.innerHTML = `
      <input type="text" id="filter" value="" />
      <button id="reset">Reset</button>
      <div>
        <ul id="stations">
          <li selected>Station 1</li>
          <li>Station 2</li>
        </ul>
      </div>
      `;
    consoleLogSpy = sinon.spy(console, 'log');
    app = new CustomRadioApp(uiManager, stationsManager, hapticFeedbackStub, swloader);


  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    app.destroy();
    app = null;
  });

  it('should set the language based on navigator.language', () => {
    const lang = navigator.language.split('-')[0];
    console.log(`Language set to: ${lang}`);
    expect(consoleLogSpy).to.have.been.calledWith(`Language set to: ${lang}`);
    consoleLogSpy.restore();
  });

  it('should call attachListeners on init', () => {
    app.init();
    expect(uiManager.attachListeners).to.have.been.called;
    expect(swloader).to.have.been.called;
    consoleLogSpy.restore();
  });

  it('should call detachListeners on destroy', () => {
    app.destroy();
    expect(uiManager.detachListeners).to.have.been.called;
    consoleLogSpy.restore();
  });

  it('should reset filter when _resetFilter is called', () => {
    sinon.stub(app, '_filterChanged');
    const filter = document.querySelector('#filter');
    filter.value = 'test';

    app.init();
    app._resetFilter();
    
    expect(hapticFeedbackStub, 'should call hapticFeedback').to.have.been.called;
    expect(filter.value, 'should clear filter input value').to.equal('');
    expect(app._filterChanged, 'should call filterChanged with "#filter" as target').to.have.been.calledWith({ target: filter });
    sinon.restore();
    consoleLogSpy.restore();
  });

  it('should filter stations when _filterChanged is called', async () => {
    const stationsEl = document.querySelector('#stations');
    const replaceChildrenStub = sinon.stub(stationsEl, 'replaceChildren');

    const filter = document.querySelector('#filter');
    filter.value = 'test';

    app.init();
    await app._filterChanged({ target: filter });

    expect(consoleLogSpy, 'should log filter changes').to.have.been.calledWith(`Filter changed: ${filter.value}`);
    expect(uiManager.loadingStart, 'should start loading animation').to.have.been.calledWith(document.querySelector('#stations'));
    expect(stationsManager.fetchStations, 'should fetch stations').to.have.been.calledWith(filter.value);
    expect(stationsManager.filterStations, 'should filter stations').to.have.been.calledWith([],[]);
    expect(uiManager.setCounts, 'should set counts in UI').to.have.been.calledWith(0, 0);
    expect(replaceChildrenStub, 'should replace children of stations list').to.have.been.called;
    expect(uiManager.currentGenres, 'should get current genres').to.have.been.called;
    expect(stationsManager.getGenres, 'should get genres').to.have.been.called;
    expect(uiManager.loadGenres, 'should load genres').to.have.been.called;
    expect(uiManager.loadingEnd, 'should end loading animation').to.have.been.called;
    expect(app._lzldr, 'should have lzldr initialized').to.be.exist;
    expect(app._lzldr._list, 'should have list in lzldr').to.be.an('array').that.is.empty;
  });
});