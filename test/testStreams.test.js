const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');

const testModule = require('../src/util/testStreams.js');
const isLiveStream = require('../src/util/isLiveStream.js');
const useableHomepage = require('../src/util/useableHomepage.js');
const Stations = require('../src/model/Stations.js');
const retry = require('../src/util/retry.js');

describe('testStreams.js module', () => {
  afterEach(() => sinon.restore());

  describe('plural()', () => {
    it('should return "y" string for 1', () => {
      expect(testModule.plural(1)).to.equal('y');
    });

    it('should return "ies" for other numbers', () => {
      expect(testModule.plural(0)).to.equal('ies');
      expect(testModule.plural(2)).to.equal('ies');
    });
  });

  describe('msToHhMmSs()', () => {
    it('should format time correctly', () => {
      const ms = 3723000; // 1h 2m 3s
      expect(testModule.msToHhMmSs(ms)).to.equal('1 hours 2 minutes and 3 seconds');
    });
  });

  describe('testHomepageConnection()', () => {
    let axiosHeadStub, homepageStub;

    beforeEach(() => {
      axiosHeadStub = sinon.stub(axios, 'head');
      sinon.stub(require.cache[require.resolve('../src/util/useableHomepage.js')], 'exports').value((value) => value);
    });

    it('should return homepage on valid HEAD response', async () => {
      axiosHeadStub.resolves({
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });

      const url = 'http://original-url.com/';

      const result = await testModule.testHomepageConnection(url);
      expect(result).to.equal(url);
    });

    it('should return undefined on failed HEAD request', async () => {
      axiosHeadStub.rejects(new Error('Failed'));

      const result = await testModule.testHomepageConnection('http://bad-url.com');
      expect(result).to.be.undefined;
    });

    it('should return undefined if homepage is not useable', async () => {
      const result = await testModule.testHomepageConnection('invalid-url');
      expect(result).to.be.undefined;
    });
  });

  describe('testStreams()', () => {
    let getAllStationsStub, updateStationStub, dbStatsStub, sqlCloseStub;
    let liveStreamStub, homepageStub;
    let retryStub;

    beforeEach(() => {
      // Fake DB setup
      getAllStationsStub = sinon.stub().resolves([
        { id: 1, name: 'Station 1', url: 'http://station1.test', genre: 'Jazz' },
        { id: 2, name: 'Station 2', url: 'http://station2.test', genre: 'Rock' }
      ]);
      updateStationStub = sinon.stub().resolves();
      dbStatsStub = sinon.stub().resolves({ total: 2, online: 1 });
      sqlCloseStub = sinon.stub().resolves();

      sinon.stub(Stations.prototype, 'getAllStations').callsFake(getAllStationsStub);
      sinon.stub(Stations.prototype, 'updateStation').callsFake(updateStationStub);
      sinon.stub(Stations.prototype, 'dbStats').callsFake(dbStatsStub);
      sinon.stub(Stations.prototype, 'close').callsFake(sqlCloseStub);

      // Mocks
      sinon.stub(require.cache[require.resolve('../util/isLiveStream.js')], 'exports').callsFake(async url => ({
        name: `Mocked ${url}`,
        url,
        isLive: true,
        content: 'audio/mpeg',
        bitrate: 128,
        icyGenre: 'Mock Genre',
        icyurl: 'http://mock.home/'
      }));

      homepageStub = sinon.stub(testModule, 'testHomepageConnection').resolves('http://mock.home/');

      // Prevent retry from retrying during tests
      sinon.stub(require.cache[require.resolve('../util/retry.js')], 'exports').callsFake(fn => fn());
    });

    // it('should run testStreams and update stations', async () => {
    //   await testModule.testStreams();

    //   expect(getAllStationsStub.calledOnce).to.be.true;
    //   expect(updateStationStub.callCount).to.be.above(0);
    //   expect(dbStatsStub.calledOnce).to.be.true;
    //   expect(sqlCloseStub.calledOnce).to.be.true;
    // });
  });
});
