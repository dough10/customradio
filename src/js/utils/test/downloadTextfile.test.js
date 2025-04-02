import { expect } from '@open-wc/testing';
import Sinon from 'sinon';
import downloadTextfile from '../downloadTextfile.js';

describe('downloadTextfile', () => {
  let container;

  beforeEach(() => {
    // Set up the DOM structure for testing
    document.body.innerHTML = `
      <ul id="stations">
        <li selected data-name="Station A" data-url="http://example.com/streamA"></li>
        <li selected data-name="Station B" data-url="http://example.com/streamB"></li>
        <li data-name="Station C" data-url="http://example.com/streamC"></li>
      </ul>
    `;
    container = document.querySelector('#stations');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Sinon.restore();
  });

  it('should generate a text file with selected items and trigger download', async () => {
    // Mock the stamp function
    const mockStamp = Sinon.stub().returns('2025-04-02 12:00:00');

    // Stub URL.createObjectURL and URL.revokeObjectURL
    const createObjectURLStub = Sinon.stub(URL, 'createObjectURL').returns('blob:http://example.com/blob');
    const revokeObjectURLStub = Sinon.stub(URL, 'revokeObjectURL');

    // Spy on document methods
    const appendSpy = Sinon.spy(document.body, 'append');
    const removeChildSpy = Sinon.spy(document.body, 'removeChild');

    // Call the function with the mocked stamp
    await downloadTextfile(mockStamp);

    // Verify that appendChild was called
    expect(appendSpy.calledOnce, 'append was not called').to.be.true;

    // Verify the generated text content
    const expectedContent = `2025-04-02 12:00:00\nStation A, http://example.com/streamA\nStation B, http://example.com/streamB`;
    const blobArg = createObjectURLStub.getCall(0).args[0];
    const blobContent = await blobArg.text();
    expect(blobContent).to.equal(expectedContent);

    // Verify the download link
    const link = appendSpy.getCall(0).args[0];
    expect(link.tagName).to.equal('A');
    expect(link.href).to.equal('blob:http://example.com/blob');
    expect(link.download).to.equal('radio.txt');

    // Verify the link was clicked and removed
    // expect(link.click.calledOnce, 'link.click was not called').to.be.true;
    expect(removeChildSpy.calledWith(link), 'link was not removed').to.be.true;

    // Verify the URL was revoked
    expect(revokeObjectURLStub.calledWith('blob:http://example.com/blob')).to.be.true;

    // Restore stubs
    Sinon.restore();
  });
});