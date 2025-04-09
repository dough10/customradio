import { expect } from '@open-wc/testing';
import { svgIcon } from '../createSVGIcon.js';

/* jshint -W030 */
describe('svgIcon', () => {
  it('creates an SVG element with the correct attributes and child path', () => {
    const viewbox = '0 0 24 24';
    const d = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';

    const svg = svgIcon({ viewbox, d });

    // Check the svg element
    expect(svg).to.exist;
    expect(svg.tagName).to.equal('svg');
    expect(svg.getAttribute('fill')).to.equal('currentColor');
    expect(svg.getAttribute('viewBox')).to.equal(viewbox);

    // Check the path element
    const path = svg.querySelector('path');
    expect(path).to.exist;
    expect(path.getAttribute('d')).to.equal(d);
  });
});
/* jshint +W030 */
