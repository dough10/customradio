(async () => {
  const { expect } = await import('chai');
  const useableHomapage = require('../util/useableHomapage');

  describe('useableHomapage', function() {
    it('should return a usable URL for a valid homepage', function() {
      const homepage = 'http://example.com/path?param=value';
      const expectedUrl = 'http://example.com/path?param=value';
      const result = useableHomapage(homepage);
      console.log(result)
      expect(result).to.equal(expectedUrl);
    });

    it('should return null for an invalid homepage', function() {
      const homepage = 'N/A';
      const result = useableHomapage(homepage);
      expect(result).to.be.null;
    });

    it('should return null for a homepage with only protocol', function() {
      const homepage = 'http://';
      const result = useableHomapage(homepage);
      expect(result).to.be.null;
    });

    it('should return a usable URL for a homepage with IPv4 address', function() {
      const homepage = 'http://192.168.0.1/path';
      const expectedUrl = 'http://192.168.0.1/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });

    it('should return a usable URL for a homepage with subdomain', function() {
      const homepage = 'http://sub.example.com/path';
      const expectedUrl = 'http://sub.example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });

    it('should return a usable URL for a homepage with co.uk domain', function() {
      const homepage = 'http://example.co.uk/path';
      const expectedUrl = 'http://example.co.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });

    it('should return a usable URL for a homepage with port', function() {
      const homepage = 'http://example.com:8080/path';
      const expectedUrl = 'http://example.com:8080/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });

    it('should return a usable URL for a homepage with hash', function() {
      const homepage = 'http://example.com/path#section';
      const expectedUrl = 'http://example.com/path#section';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });

    it('should return a usable URL for a homepage with search query', function() {
      const homepage = 'http://example.com/path?param=value';
      const expectedUrl = 'http://example.com/path?param=value';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expectedUrl);
    });
  });

  run(); // Run the tests
})();