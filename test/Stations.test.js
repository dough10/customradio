const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const Stations = require('../model/Stations');

(async () => {
  const { expect } = await import('chai');

  describe('Stations', function() {
    let dbPath;
    let stations;

    beforeEach(function(done) {
      dbPath = path.join(__dirname, 'test.db');
      stations = new Stations(dbPath);
      stations.initializationPromise.then(() => done());
    });

    afterEach(function(done) {
      stations.close().then(() => {
        fs.unlinkSync(dbPath);
        done();
      });
    });

    it('should create tables and indexes', async function() {
      const tables = await stations._runQuery("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.map(table => table.name);
      expect(tableNames).to.include.members(['stations', 'genres']);

      const indexes = await stations._runQuery("SELECT name FROM sqlite_master WHERE type='index'");
      const indexNames = indexes.map(index => index.name);
      expect(indexNames).to.include.members([
        'idx_stations_url',
        'idx_stations_id',
        'idx_genres_genres',
        'idx_genres_time'
      ]);
    });

    it('should add a new station', async function() {
      const station = {
        name: 'Test Station',
        url: 'http://teststation.com',
        genre: 'Rock',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation.com/icon.png',
        homepage: 'http://teststation.com',
        error: '',
        duplicate: false
      };

      const id = await stations.addStation(station);
      expect(id).to.be.a('number');

      const rows = await stations._runQuery('SELECT * FROM stations WHERE id = ?', [id]);
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].name).to.equal(station.name);
    });

    it('should update a station', async function() {
      const station = {
        name: 'Test Station',
        url: 'http://teststation.com',
        genre: 'Rock',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation.com/icon.png',
        homepage: 'http://teststation.com',
        error: '',
        duplicate: false
      };

      const id = await stations.addStation(station);
      station.id = id;
      station.name = 'Updated Station';

      const message = await stations.updateStation(station);
      expect(message).to.equal('Station updated successfully.');

      const rows = await stations._runQuery('SELECT * FROM stations WHERE id = ?', [id]);
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].name).to.equal('Updated Station');
    });

    it('should get all stations', async function() {
      const station1 = {
        name: 'Test Station 1',
        url: 'http://teststation1.com',
        genre: 'Rock',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation1.com/icon.png',
        homepage: 'http://teststation1.com',
        error: '',
        duplicate: false
      };

      const station2 = {
        name: 'Test Station 2',
        url: 'http://teststation2.com',
        genre: 'Pop',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation2.com/icon.png',
        homepage: 'http://teststation2.com',
        error: '',
        duplicate: false
      };

      await stations.addStation(station1);
      await stations.addStation(station2);

      const rows = await stations.getAllStations();
      expect(rows).to.have.lengthOf(2);
    });

    it('should get stations by genre', async function() {
      const station1 = {
        name: 'Test Station 1',
        url: 'http://teststation1.com',
        genre: 'Rock',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation1.com/icon.png',
        homepage: 'http://teststation1.com',
        error: '',
        duplicate: false
      };

      const station2 = {
        name: 'Test Station 2',
        url: 'http://teststation2.com',
        genre: 'Pop',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation2.com/icon.png',
        homepage: 'http://teststation2.com',
        error: '',
        duplicate: false
      };

      await stations.addStation(station1);
      await stations.addStation(station2);

      const rows = await stations.getStationsByGenre(['Rock']);
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].genre).to.equal('Rock');
    });

    it('should log a genre', async function() {
      const genre = 'Rock';
      const id = await stations.logGenres(genre);
      expect(id).to.be.a('number');

      const rows = await stations._runQuery('SELECT * FROM genres WHERE id = ?', [id]);
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].genres).to.equal(genre);
    });

    it('should get top genres', async function() {
      await stations.logGenres('Rock');
      await stations.logGenres('Pop');
      await stations.logGenres('Rock');

      const genres = await stations.topGenres();
      expect(genres).to.have.lengthOf(2);
      expect(genres).to.include.members(['Rock', 'Pop']);
    });

    it('should get database stats', async function() {
      const station1 = {
        name: 'Test Station 1',
        url: 'http://teststation1.com',
        genre: 'Rock',
        online: true,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation1.com/icon.png',
        homepage: 'http://teststation1.com',
        error: '',
        duplicate: false
      };

      const station2 = {
        name: 'Test Station 2',
        url: 'http://teststation2.com',
        genre: 'Pop',
        online: false,
        'content-type': 'audio/mpeg',
        bitrate: 128,
        icon: 'http://teststation2.com/icon.png',
        homepage: 'http://teststation2.com',
        error: '',
        duplicate: false
      };

      await stations.addStation(station1);
      await stations.addStation(station2);

      const stats = await stations.dbStats();
      expect(stats.online).to.equal(1);
      expect(stats.total).to.equal(2);
    });
  });
})();