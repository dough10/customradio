import { expect } from '@open-wc/testing';
import Sinon from 'sinon';
import AudioPlayer from '../audio.js';
import Toast from '../../Toast/Toast.js';

describe('AudioPlayer', () => {
  let audioPlayer;
  let playerElement;

  beforeEach(() => {
    // Set up the DOM structure for testing
    document.body.innerHTML = `
      <div class="player">
        <span id="name">station name</span>
        <label id="vol">
          <span>
            Volume
          </span>
          <input type="range" min="0" max="100" aria-label="Volume control" role="slider">
        </label>
        <span id="bitrate">
          0kbps
        </span>
        <div class="small-button player-big">
          <svg viewBox="0 -960 960 960" id="play-button">
            <path fill="currentColor" d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"></path>
          </svg>
        </div>
      </div>
      <ul id="stations">
        <li data-url="http://example.com/stream1"></li>
        <li data-url="http://example.com/stream2"></li>
      </ul>
    `;

    audioPlayer = new AudioPlayer();
    playerElement = document.querySelector('.player');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Sinon.restore();
  });

  it('should toggle play/pause state', async () => {
    const icon = document.querySelector('.player>.small-button>svg>path');


    const playStub = Sinon.stub(audioPlayer.player, 'play').callsFake(() => {
      Object.defineProperty(audioPlayer.player, 'paused', { value: false, configurable: true });
    });
    const pauseStub = Sinon.stub(audioPlayer.player, 'pause').callsFake(() => {
      Object.defineProperty(audioPlayer.player, 'paused', { value: true, configurable: true });
    });
  
    Object.defineProperty(audioPlayer.player, 'paused', { value: true, configurable: true });
    audioPlayer._togglePlay();
    expect(playStub.calledOnce).to.be.true;
    expect(audioPlayer.player.paused).to.be.false;
    
    Object.defineProperty(audioPlayer.player, 'paused', { value: false, configurable: true });
    audioPlayer._togglePlay();
    expect(pauseStub.calledOnce).to.be.true;
    expect(audioPlayer.player.paused).to.be.true;
  });

  it('should hide the volume slider on mobile devices', async () => {
    const volumeElement = document.querySelector('#vol');
    const canChangeVolStub = Sinon.stub(audioPlayer, '_canChangeVol').resolves(false);

    await audioPlayer.load();

    expect(volumeElement.style.display).to.equal('none');
    expect(canChangeVolStub.calledOnce).to.be.true;
  });

  it('should handle online state and restart playback', () => {
    const playStub = Sinon.stub(audioPlayer.player, 'play');
    playerElement.setAttribute('playing', '');

    audioPlayer._handleOnline();

    expect(playStub.calledOnce, 'play was called one time').to.be.true;
  });

  it('should clear the playing state after pausing', () => {
    const clearPlayingStub = Sinon.stub(audioPlayer, '_clearPlaying');
    const setTimeoutStub = Sinon.stub(window, 'setTimeout').callsFake((fn) => fn());

    audioPlayer._onpause();

    expect(setTimeoutStub.calledOnce).to.be.true;
    expect(clearPlayingStub.calledOnce).to.be.true;
  });
  
  it('should play a stream and update the player state', () => {
    const playStub = Sinon.stub(audioPlayer.player, 'play');
    const station = { id: 'station1', url: 'http://example.com/stream1', name: 'Test Station', bitrate: 128 };
    
    audioPlayer.playStream(station);
    
    expect(audioPlayer.player.dataset.id).to.equal('station1');
    expect(audioPlayer.player.src).to.equal('http://example.com/stream1');
    expect(document.querySelector('#name').textContent).to.equal('Test Station');
    expect(document.querySelector('#bitrate').textContent).to.equal('128kbps');
    expect(playStub.calledOnce).to.be.true;
  });

  it('should update the playing state on time update', () => {
    const currentPlayingElement = document.querySelector('li[data-url="http://example.com/stream1"]');
    audioPlayer.currentPlayingElement = currentPlayingElement;

    audioPlayer._ontimeupdate();

    expect(currentPlayingElement.hasAttribute('playing')).to.be.true;
  });

  it('should handle a buffering state', () => {
    const icon = document.querySelector('.player>.small-button>svg>path');

    audioPlayer._onwaiting();

    expect(icon.getAttribute('d')).to.equal('M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z');
    expect(icon.parentElement.classList.contains('spin')).to.be.true;
  });

  it('should handle a playing state', () => {
    const icon = document.querySelector('.player>.small-button>svg>path');

    audioPlayer._onplaying();

    expect(icon.getAttribute('d')).to.equal('M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z');
    expect(icon.parentElement.classList.contains('spin')).to.be.false;
  });

  it('should handle a plause state', () => {
    const icon = document.querySelector('.player>.small-button>svg>path');

    audioPlayer._onpause();

    expect(icon.getAttribute('d')).to.equal('M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z');
    expect(icon.parentElement.classList.contains('spin')).to.be.false;
  });
});