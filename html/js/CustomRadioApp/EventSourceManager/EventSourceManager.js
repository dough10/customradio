export default class StreamManager {
  #streams = new Map();

  connect(name, url, {
    onMessage = () => {},
    onOpen = () => {},
    onError = () => {},
    withCredentials = false
  } = {}) {
    this.close(name);
    const stream = new EventSource(url, {
      withCredentials
    });
    stream.onmessage = ev => {
      onMessage(ev);
    };
    stream.onopen = ev => {
      onOpen(ev);
    };
    stream.onerror = ev => {
      onError(ev, stream.readyState);
    };
    this.#streams.set(name, stream);
    return stream;
  }

  close(name) {
    const stream = this.#streams.get(name);
    if (!stream) return;
    stream.close();
    this.#streams.delete(name);
  }

  closeAll() {
    for (const stream of this.#streams.values()) {
      stream.close();
    }
    this.#streams.clear();
  }

  isConnected(name) {
    return this.#streams.get(name)?.readyState === EventSource.OPEN;
  }

  getState(name) {
    return this.#streams.get(name)?.readyState ?? null;
  }
}
