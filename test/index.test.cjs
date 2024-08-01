(async () => {
  const { expect } = await import('chai');
  const { plural } = require('../index');
  
  describe('plural string', () => {
    it('should return s for any input number other then 1', () => {
      [0,2,3,4,5,6]
      .map(val => plural(val))
      .forEach(val => expect(val).to.equal('s'));
      expect(plural(1)).to.equal('');
    });
  });
})();
