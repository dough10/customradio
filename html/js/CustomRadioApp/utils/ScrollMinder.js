import EventManager from "../EventManager/EventManager";

export default class ScrollMinder {
  static EVENTS = Object.freeze({
    SCROLL: "scrollminder:scroll",
    SCROLL_DOWN: "scrollminder:scrollDown",
    SCROLL_UP: "scrollminder:scrollUp",
    CLOSE_TO_BOTTOM: "scrollminder:closeToBottom"
  });

  #lastPos = 0;
  #em = new EventManager();
  #destroyed = false;
  #bottomThreshold;
  #wasCloseToBottom = false;

  #onScrollDown;
  #onScrollUp;
  #onCloseToBottom;
  #onScroll;

  #handleScroll = (ev) => this.#scroll(ev);

  constructor(
    scrollableElement,
    {
      onScroll = () => {},
      onScrollDown = () => {},
      onScrollUp = () => {},
      onCloseToBottom = () => {},
      bottomThreshold = 50
    } = {}
  ) {
    if (!(scrollableElement instanceof HTMLElement)) {
      throw new TypeError(
        "scrollableElement must be an HTMLElement"
      );
    }

    if (typeof onScrollDown !== "function") {
      throw new TypeError("onScrollDown must be a function");
    }

    if (typeof onScroll !== "function") {
      throw new TypeError("onScroll must be a function");
    }

    if (typeof onScrollUp !== "function") {
      throw new TypeError("onScrollUp must be a function");
    }

    if (typeof onCloseToBottom !== "function") {
      throw new TypeError("onCloseToBottom must be a function");
    }

    if (
      typeof bottomThreshold !== "number" ||
      !Number.isFinite(bottomThreshold) ||
      bottomThreshold < 0
    ) {
      throw new TypeError(
        "bottomThreshold must be a non-negative number"
      );
    }
    const maxPos = scrollableElement.scrollHeight - scrollableElement.clientHeight;

    this.#wasCloseToBottom = Math.max(0, maxPos - scrollableElement.scrollTop) <= bottomThreshold;
    this.#lastPos = scrollableElement.scrollTop;
    this.#bottomThreshold = bottomThreshold;

    this.#onScroll = onScroll;
    this.#onScrollDown = onScrollDown;
    this.#onScrollUp = onScrollUp;
    this.#onCloseToBottom = onCloseToBottom;

    this.#em.add(
      scrollableElement,
      EventManager.types.scroll,
      this.#handleScroll
    );
  }

  #scroll(ev) {
    const el = ev.currentTarget;
    const pos = el.scrollTop;
    const maxPos = el.scrollHeight - el.clientHeight;
    const remaining = Math.max(0, maxPos - pos);

    this.#notify(
      ScrollMinder.EVENTS.SCROLL,
      this.#onScroll,
      el,
      pos,
      maxPos,
      remaining
    );

    if (pos > this.#lastPos) {
      this.#notify(
        ScrollMinder.EVENTS.SCROLL_DOWN,
        this.#onScrollDown,
        el,
        pos,
        maxPos,
        remaining
      );
    } else if (pos < this.#lastPos) {
      this.#notify(
        ScrollMinder.EVENTS.SCROLL_UP,
        this.#onScrollUp,
        el,
        pos,
        maxPos,
        remaining
      );
    }

    const isCloseToBottom = remaining <= this.#bottomThreshold;

    if (isCloseToBottom && !this.#wasCloseToBottom) {
      this.#notify(
        ScrollMinder.EVENTS.CLOSE_TO_BOTTOM,
        this.#onCloseToBottom,
        el,
        pos,
        maxPos,
        remaining
      );
    }

    this.#wasCloseToBottom = isCloseToBottom;

    this.#lastPos = pos;
  }

  #notify(eventName, callback, el, pos, maxPos, remaining) {
    el.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        element: el,
        scrollTop: pos,
        scrollMax: maxPos,
        remaining
      }
    }));

    callback(el, pos, maxPos, remaining);
  }

  destroy() {
    if (this.#destroyed) return;
    this.#em.removeAll();
    this.#destroyed = true;
  }
}


/**
 * example desired usage
 * new ScrollMinder(qs('#scroll'), {
 *   onCloseToBottom: () => console.log('almost there')
 * });
 */
