(async () => {
  const { expect } = await import('chai');
  const rmRef = require('../util/rmRef');

  describe('rmRef', function() {
    it('should remove the "ref" query parameter from the URL', function() {
      const urlWithRef = 'http://example.com/path?ref=123&param=value';
      const expectedUrl = 'http://example.com/path?param=value';
      const result = rmRef(urlWithRef);
      expect(result).to.equal(expectedUrl);
    });

    it('should return the same URL if "ref" query parameter is not present', function() {
      const urlWithoutRef = 'http://example.com/path?param=value';
      const result = rmRef(urlWithoutRef);
      expect(result).to.equal(urlWithoutRef);
    });

    it('should handle URLs without any query parameters', function() {
      const urlWithoutQuery = 'http://example.com/path';
      const result = rmRef(urlWithoutQuery);
      expect(result).to.equal(urlWithoutQuery);
    });

    it('should handle URLs with multiple "ref" query parameters', function() {
      const urlWithMultipleRefs = 'http://example.com/path?ref=123&ref=456&param=value';
      const expectedUrl = 'http://example.com/path?param=value';
      const result = rmRef(urlWithMultipleRefs);
      expect(result).to.equal(expectedUrl);
    });

    it('should handle URLs with only the "ref" query parameter', function() {
      const urlWithOnlyRef = 'http://example.com/path?ref=123';
      const expectedUrl = 'http://example.com/path';
      const result = rmRef(urlWithOnlyRef);
      expect(result).to.equal(expectedUrl);
    });
  });

  run(); // Run the tests
})();