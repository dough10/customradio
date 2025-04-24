import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import EventManager from '../EventManager.js';

describe('EventManager', () => {
  let eventManager;
  let mockElement;

  beforeEach(() => {
    eventManager = new EventManager();
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    eventManager.removeAll(); // Ensure all listeners are cleaned up after each test
  });

  it('should add an event listener and return its index', () => {
    const mockHandler = sinon.spy();
    const index = eventManager.add(mockElement, 'click', mockHandler);

    expect(index).to.equal(0); // First listener should have index 0
    mockElement.click();
    sinon.assert.calledOnce(mockHandler); // Ensure the handler is called once
  });

  it('should remove a specific event listener by index', () => {
    const mockHandler = sinon.spy();
    const index = eventManager.add(mockElement, 'click', mockHandler);

    const removed = eventManager.remove(index);
    expect(removed).to.not.be.null; // Listener should be successfully removed

    mockElement.click();
    sinon.assert.notCalled(mockHandler); // Ensure the handler is not called after removal
  });

  it('should return null when trying to remove a non-existent listener', () => {
    const removed = eventManager.remove(999); // Invalid index
    expect(removed).to.be.null;
  });

  it('should remove all event listeners', () => {
    const mockHandler1 = sinon.spy();
    const mockHandler2 = sinon.spy();

    eventManager.add(mockElement, 'click', mockHandler1);
    eventManager.add(mockElement, 'mouseover', mockHandler2);

    eventManager.removeAll();

    mockElement.click();
    mockElement.dispatchEvent(new Event('mouseover'));

    sinon.assert.notCalled(mockHandler1);
    sinon.assert.notCalled(mockHandler2);
    expect(eventManager.listeners.length).to.equal(0); // Ensure the listeners array is empty
  });

  it('should handle adding a listener to a null target gracefully', () => {
    const mockHandler = sinon.spy();
    const index = eventManager.add(null, 'click', mockHandler);

    expect(index).to.equal(-1); // Invalid target should return -1
  });

  it('should handle removing a listener with a null target gracefully', () => {
    const mockHandler = sinon.spy();
    const index = eventManager.add(null, 'click', mockHandler);

    const removed = eventManager.remove(index);
    expect(removed).to.be.null; // Cannot remove a listener with a null target
  });

  it('should add and remove listeners with namespaces', () => {
    const mockHandler1 = sinon.spy();
    const mockHandler2 = sinon.spy();

    eventManager.add(mockElement, 'click', mockHandler1, {}, 'namespace1');
    eventManager.add(mockElement, 'mouseover', mockHandler2, {}, 'namespace2');

    // Remove all listeners in 'namespace1'
    eventManager.removeByNamespace('namespace1');

    mockElement.click();
    mockElement.dispatchEvent(new Event('mouseover'));

    sinon.assert.notCalled(mockHandler1); // Listener in 'namespace1' should be removed
    sinon.assert.calledOnce(mockHandler2); // Listener in 'namespace2' should still exist
  });

  it('should not remove listeners when namespace does not match', () => {
    const mockHandler = sinon.spy();

    eventManager.add(mockElement, 'click', mockHandler, {}, 'namespace1');

    // Attempt to remove listeners in a non-existent namespace
    eventManager.removeByNamespace('namespace2');

    mockElement.click();
    sinon.assert.calledOnce(mockHandler); // Listener should still exist
  });

  it('should remove all listeners when namespace is null', () => {
    const mockHandler1 = sinon.spy();
    const mockHandler2 = sinon.spy();

    eventManager.add(mockElement, 'click', mockHandler1, {}, null);
    eventManager.add(mockElement, 'mouseover', mockHandler2, {}, null);

    eventManager.removeByNamespace(null);

    mockElement.click();
    mockElement.dispatchEvent(new Event('mouseover'));

    sinon.assert.notCalled(mockHandler1);
    sinon.assert.notCalled(mockHandler2);
    expect(eventManager.listeners.length).to.equal(0); // Ensure the listeners array is empty
  });
});