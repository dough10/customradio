(async () => {
  const { expect } = await import('chai');
  const useableHomepage = require('../util/useableHomepage');
  
  describe('useableHomapage', function() {
    it('should return null for an empty homepage', function() {
      const homepage = '';
      const result = useableHomepage(homepage);
      expect(result).to.be.null;
    });
    
    it('should return null for an invalid homepage', function() {
      const homepage = 'Unknown';
      const result = useableHomepage(homepage);
      expect(result).to.be.null;
    });

    it('should return null for localhost', function() {
      const homepage = 'http://localhost/';
      const result = useableHomepage(homepage);
      expect(result).to.be.null;
    });
    
    it('should return null for a homepage with only protocol', function() {
      const homepage = 'http://';
      const result = useableHomepage(homepage);
      expect(result).to.be.null;
    });

    it('should return a usable URL for a valid homepage', function() {
      const homepage = 'http://example.com/';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with IPv4 address', function() {
      const homepage = 'http://192.168.0.1/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with IPv4 address and port', function() {
      const homepage = 'http://192.168.0.1:3000/';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www subdomain', function() {
      const homepage = 'http://www.example.com/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with https protocol', function() {
      const homepage = 'https://example.com/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with subdomain', function() {
      const homepage = 'http://sub.example.com/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with co.uk domain', function() {
      const homepage = 'http://example.co.uk/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www and co.uk domain', function() {
      const homepage = 'http://www.example.co.uk/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage using a domain name and port', function() {
      const homepage = 'http://example.com:8080/path';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with hash', function() {
      const homepage = 'http://example.com/path#section';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with search query', function() {
      const homepage = 'http://example.com/path?param=value';
      const result = useableHomepage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with only domain and no protocol', function() {
      const homepage = 'example.com';
      const expected = 'http://example.com/';
      const result = useableHomepage(homepage);
      expect(result).to.equal(expected);
    });

    it('should return a usable URL for a homepage with www.domain and no protocol', function() {
      const homepage = 'www.example.com';
      const expected = 'http://www.example.com/';
      const result = useableHomepage(homepage);
      expect(result).to.equal(expected);
    });

  });
  run();
})();