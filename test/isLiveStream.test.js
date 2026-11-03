const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { EnvHttpProxyAgent } = require('undici');
const isLiveStream = require('../src/util/isLiveStream.js');
const pack = require('../package.json');

chai.use(sinonChai.default || sinonChai);
const { expect } = chai;

describe('isLiveStream', () => {
  let fetchStub;
  let closeStub;
  const url = 'https://andromeda.housejunkie.ca:8000/radio.mp3';

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
    closeStub = sinon.stub(EnvHttpProxyAgent.prototype, 'close').resolves();
  });

  afterEach(() => {
    fetchStub.restore();
    closeStub.restore();
  });

  it('should return true when the stream is online', async () => {
    const cancel = sinon.stub().resolves();
    fetchStub.resolves({
      ok: true,
      status: 200,
      body: { cancel },
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
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': `radiotxt.site/${pack.version}`,
        'Accept': 'audio/*, */*;q=0.9',
        'Icy-MetaData': '1',
        'Range': 'bytes=0-'
      },
      signal: sinon.match.any,
      dispatcher: sinon.match.instanceOf(EnvHttpProxyAgent)
    });

    expect(live.ok).to.be.true;
    expect(cancel).to.have.been.calledOnce;
    expect(closeStub).to.have.been.calledOnce;
  });

  it('should return false when the stream is offline or request fails', async () => {
    fetchStub.rejects(new Error('Network Error'));

    const live = await isLiveStream(url);

    expect(live.ok).to.be.false;
    expect(live.error).to.equal('Network Error');
    expect(closeStub).to.have.been.calledOnce;
  });
});