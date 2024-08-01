(async () => {
  const { expect } = await import('chai');
  const { plural } = require('../util/testStreams.js');
  
  describe('plural string', () => {
    it('should return "s" for any number other than 1', () => {
      [0, 2, 3, 4, 5, 6]
        .forEach(val => expect(plural(val)).to.equal('s'));
      expect(plural(1)).to.equal('');
    });
  });
})();
