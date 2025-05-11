const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const axios = require('axios');
const isLiveStream = require('../util/isLiveStream.js');
const pack = require('../package.json');

chai.use(sinonChai.default || sinonChai); // 👈 safe fallback
const { expect } = chai;

describe('isLiveStream', () => {
  let axiosStub;
  const url = 'https://andromeda.housejunkie.ca:8000/radio.mp3';

  beforeEach(() => {
    axiosStub = sinon.stub(axios, 'head');
  });

  afterEach(() => {
    axiosStub.restore();
  });

  it('should return true when the stream is online', async () => {
    axiosStub.resolves({
      status: 200, 
      headers: {
        'icy-name': 'Station Name',
        'icy-description': 'A streaming radio station',
        'icy-genre': 'Jazz',
        'icy-br': 128,
        'content-type': 'audio/mp3',
        'icy-url': 'https://example.com'
      }
    });

    const live = await isLiveStream(url);

    expect(axiosStub).to.have.been.calledWith(url, {
      headers: {
        'User-Agent': `customradio.dough10.me/${pack.version}`
      },
      timeout: 3000
    });

    expect(live.ok).to.be.true;
  });

  it('should return false when the stream is offline or request fails', async () => {
    axiosStub.rejects(new Error('Network Error'));

    const live = await isLiveStream(url);
    expect(live.ok).to.be.false;
    expect(live.error).equal('Network Error');
  });
});
