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
    expect(removed).to.be.true; // Listener should be successfully removed

    mockElement.click();
    sinon.assert.notCalled(mockHandler); // Ensure the handler is not called after removal
  });

  it('should return false when trying to remove a non-existent listener', () => {
    const removed = eventManager.remove(999); // Invalid index
    expect(removed).to.be.false;
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

    expect(index).to.equal(0); // Listener is still added to the internal array
    expect(eventManager.listeners[0].target).to.be.null; // Target is null
  });

  it('should handle removing a listener with a null target gracefully', () => {
    const mockHandler = sinon.spy();
    const index = eventManager.add(null, 'click', mockHandler);

    const removed = eventManager.remove(index);
    expect(removed).to.be.false; // Cannot remove a listener with a null target
  });
});