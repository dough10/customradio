import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { streamTest } from '../util/isLiveStream.js';


describe('streamTest', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return stream details for a valid audio stream', async () => {
    const url = 'http://example.com/stream';
    const responseHeaders = {
      'icy-name': 'My Stream',
      'icy-description': 'A great stream',
      'icy-genre': 'Rock',
      'icy-br': '128000',
      'content-type': 'audio/mpeg',
      'icy-url': 'http://example.com/icy-url'
    };
    mock.onHead(url).reply(200, null, responseHeaders);

    const result = await streamTest(url);

    expect(result).to.deep.equal({
      ok: true,
      url,
      name: 'My Stream',
      description: 'A great stream',
      icyurl: 'http://example.com/icy-url',
      isLive: true,
      icyGenre: 'Rock',
      content: 'audio/mpeg',
      bitrate: 128000,
      error: null
    });
  });

  // it('should handle invalid content-type', async () => {
  //   const url = 'http://example.com/stream';
  //   mock.onHead(url).reply(200, null, {
  //     'content-type': 'text/html'
  //   });

  //   const result = await streamTest(url);

  //   expect(result).to.deep.equal({
  //     ok: false,
  //     error: 'invalid content-type: text/html'
  //   });
  // });

  // it('should handle no ICY headers', async () => {
  //   const url = 'http://example.com/stream';
  //   mock.onHead(url).reply(200, null, {
  //     'content-type': 'audio/mpeg'
  //   });

  //   const result = await streamTest(url);

  //   expect(result).to.deep.equal({
  //     ok: true,
  //     url,
  //     name: url,
  //     description: null,
  //     icyurl: null,
  //     isLive: true,
  //     icyGenre: null,
  //     content: 'audio/mpeg',
  //     bitrate: null,
  //     error: null
  //   });
  // });

  // it('should handle errors from axios', async () => {
  //   const url = 'http://example.com/stream';
  //   mock.onHead(url).networkError();

  //   const result = await streamTest(url);

  //   expect(result).to.deep.equal({
  //     ok: false,
  //     error: 'Network Error'
  //   });
  // });
});