const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const isLiveStream = require('../src/util/isLiveStream.js');
const pack = require('../package.json');

chai.use(sinonChai.default || sinonChai);
const { expect } = chai;

describe('isLiveStream', () => {
  let fetchStub;
  const url = 'https://andromeda.housejunkie.ca:8000/radio.mp3';

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    fetchStub.restore();
  });

  it('should return true when the stream is online', async () => {
    fetchStub.resolves({
      ok: true,
      status: 200,
      headers: {
        get: (key) => ({
          'icy-name': 'Station Name',
          'icy-description': 'A streaming radio station',
          'icy-genre': 'Jazz',
          'icy-br': '128',
          'content-type': 'audio/mp3',
          'icy-url': 'https://example.com'
        }[key.toLowerCase()])
      }
    });

    const live = await isLiveStream(url);

    expect(fetchStub).to.have.been.calledWith(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': `radiotxt.site/${pack.version}`
      },
      signal: sinon.match.any // if you're using AbortController for timeout
    });

    expect(live.ok).to.be.true;
  });

  it('should return false when the stream is offline or request fails', async () => {
    fetchStub.rejects(new Error('Network Error'));

    const live = await isLiveStream(url);

    expect(live.ok).to.be.false;
    expect(live.error).to.equal('Network Error');
  });
});