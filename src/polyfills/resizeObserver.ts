/**
 * Patch ResizeObserver to defer callbacks via requestAnimationFrame.
 * This avoids Chrome's "ResizeObserver loop completed with undelivered notifications"
 * runtime error when many observers trigger inside mutation/layout cycles.
 */
if (
  typeof window !== 'undefined' &&
  typeof window.ResizeObserver !== 'undefined'
) {
  const NativeResizeObserver = window.ResizeObserver

  class PatchedResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => callback(entries, observer))
      })
    }
  }

  window.ResizeObserver = PatchedResizeObserver
}

export {}
