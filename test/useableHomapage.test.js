(async () => {
  const { expect } = await import('chai');
  const useableHomapage = require('../util/useableHomapage');

  describe('useableHomapage', function() {
    it('should return a usable URL for a valid homepage', function() {
      const homepage = 'http://example.com/';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
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
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with IPv4 address and port', function() {
      const homepage = 'http://192.168.0.1:3000/';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www subdomain', function() {
      const homepage = 'http://www.example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with no subdomain', function() {
      const homepage = 'http://example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with https protocol', function() {
      const homepage = 'https://example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www subdomain and https protocol', function() {
      const homepage = 'https://www.example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with subdomain', function() {
      const homepage = 'http://sub.example.com/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with co.uk domain', function() {
      const homepage = 'http://example.co.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www and co.uk domain', function() {
      const homepage = 'http://www.example.co.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with gov.uk domain', function() {
      const homepage = 'http://example.gov.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www and gov.uk domain', function() {
      const homepage = 'http://www.example.gov.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with org.uk domain', function() {
      const homepage = 'http://example.org.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with www and org.uk domain', function() {
      const homepage = 'http://www.example.org.uk/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with port', function() {
      const homepage = 'http://example.com:8080/path';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with hash', function() {
      const homepage = 'http://example.com/path#section';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return a usable URL for a homepage with search query', function() {
      const homepage = 'http://example.com/path?param=value';
      const result = useableHomapage(homepage);
      expect(result).to.equal(homepage);
    });

    it('should return null for an empty homepage', function() {
      const homepage = '';
      const result = useableHomapage(homepage);
      expect(result).to.be.null;
    });

    // need to fix so it does return a corrected value
    it('should return a usable URL for a homepage with only domain and no protocol', function() {
      const homepage = 'example.com';
      const expected = 'http://example.com/';
      const result = useableHomapage(homepage);
      expect(result).to.equal(expected);
    });
  });

  it('should return a usable URL for a homepage with www.domain and no protocol', function() {
    const homepage = 'www.example.com';
    const expected = 'http://www.example.com/';
    const result = useableHomapage(homepage);
    expect(result).to.equal(expected);
  });

  run(); // Run the tests
})();