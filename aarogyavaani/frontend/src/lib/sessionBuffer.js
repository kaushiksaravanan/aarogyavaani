// SessionBuffer - Process Only Latest Message Pattern
// Prevents AI from acting on intermediate/superseded user inputs
// Supports debouncing, explicit finalization, and undo/grace period

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * @typedef {Object} SessionBufferOptions
 * @property {number} [debounceMs=2000] - Milliseconds to wait after last keystroke before auto-finalizing
 * @property {function(string): void} [onFinalize=null] - Callback invoked when a message is finalized for AI processing
 * @property {number} [gracePeriodMs=5000] - Milliseconds after finalization during which undo is available
 */

export class SessionBuffer {
  /**
   * @param {SessionBufferOptions} options
   */
  constructor({ debounceMs = 2000, onFinalize = null, gracePeriodMs = 5000 } = {}) {
    /** @type {string|null} */
    this.latestMessage = null
    /** @type {string[]} */
    this.messageHistory = []
    /** @type {boolean} */
    this.finalized = false
    /** @type {number} */
    this.debounceMs = debounceMs
    /** @type {number} */
    this.gracePeriodMs = gracePeriodMs
    /** @type {function(string): void|null} */
    this.onFinalize = onFinalize
    /** @private */
    this._debounceTimer = null
    /** @private */
    this._graceTimer = null
    /** @private @type {string|null} */
    this._finalizedMessage = null
    /** @private @type {function|null} */
    this._undoCallback = null
  }

  /**
   * User types/updates their message. Resets debounce timer so only the
   * latest version is finalized after the user stops typing.
   * @param {string} message - The current message text
   */
  updateMessage(message) {
    this.latestMessage = message
    this.finalized = false

    // Clear any pending debounce — supersede previous draft
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }

    // Clear grace period from a previous finalization — user is correcting
    if (this._graceTimer) {
      clearTimeout(this._graceTimer)
      this._graceTimer = null
      this._finalizedMessage = null
    }

    // Start new debounce
    if (message && message.trim()) {
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null
        this._finalize()
      }, this.debounceMs)
    }
  }

  /**
   * Explicit send/submit by user. Cancels debounce and finalizes immediately.
   */
  submit() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    this._finalize()
  }

  /**
   * Internal: marks the latest message as finalized, records it in history,
   * invokes the onFinalize callback, and starts the grace/undo window.
   * @private
   */
  _finalize() {
    if (!this.latestMessage || !this.latestMessage.trim()) return
    if (this.finalized && this._finalizedMessage === this.latestMessage) return

    this.finalized = true
    this._finalizedMessage = this.latestMessage
    this.messageHistory.push(this.latestMessage)

    // Start grace period for undo
    if (this._graceTimer) clearTimeout(this._graceTimer)
    this._graceTimer = setTimeout(() => {
      this._graceTimer = null
    }, this.gracePeriodMs)

    if (this.onFinalize) {
      this.onFinalize(this.latestMessage)
    }
  }

  /**
   * Undo the last finalization if still within the grace period.
   * Removes the message from history and resets finalized state.
   * @returns {boolean} Whether the undo was successful
   */
  undo() {
    if (!this._graceTimer || !this.finalized) return false

    clearTimeout(this._graceTimer)
    this._graceTimer = null

    // Remove last finalized message from history
    if (this.messageHistory.length > 0) {
      this.messageHistory.pop()
    }

    this.finalized = false
    this._finalizedMessage = null

    if (this._undoCallback) {
      this._undoCallback()
    }

    return true
  }

  /**
   * Get the latest message (whether finalized or not).
   * @returns {string|null}
   */
  getLatest() {
    return this.latestMessage
  }

  /**
   * Check whether the grace/undo window is currently active.
   * @returns {boolean}
   */
  isInGracePeriod() {
    return !!this._graceTimer
  }

  /**
   * Check if currently debouncing (user still typing).
   * @returns {boolean}
   */
  isDebouncing() {
    return !!this._debounceTimer
  }

  /**
   * Register a callback to be invoked when undo is triggered.
   * @param {function(): void} cb
   */
  onUndo(cb) {
    this._undoCallback = cb
  }

  /**
   * Reset all state and clear timers.
   */
  reset() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    if (this._graceTimer) clearTimeout(this._graceTimer)
    this.latestMessage = null
    this.messageHistory = []
    this.finalized = false
    this._debounceTimer = null
    this._graceTimer = null
    this._finalizedMessage = null
  }

  /**
   * Destroy all timers. Call when unmounting / disposing.
   */
  destroy() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    if (this._graceTimer) clearTimeout(this._graceTimer)
    this._debounceTimer = null
    this._graceTimer = null
    this.onFinalize = null
    this._undoCallback = null
  }
}

/**
 * React hook wrapper for SessionBuffer.
 * @param {SessionBufferOptions} options
 * @returns {{ buffer: SessionBuffer, latestMessage: string|null, isDebouncing: boolean, isGracePeriod: boolean, submit: function, undo: function, updateMessage: function(string): void }}
 */
export function useSessionBuffer(options = {}) {
  const [latestMessage, setLatestMessage] = useState(null)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [isGracePeriod, setIsGracePeriod] = useState(false)
  const bufferRef = useRef(null)

  // Initialize buffer once
  if (!bufferRef.current) {
    bufferRef.current = new SessionBuffer({
      ...options,
      onFinalize: (msg) => {
        setLatestMessage(msg)
        setIsDebouncing(false)
        setIsGracePeriod(true)

        // Clear grace period state after timeout
        setTimeout(() => setIsGracePeriod(false), options.gracePeriodMs || 5000)

        if (options.onFinalize) options.onFinalize(msg)
      },
    })
  }

  useEffect(() => {
    return () => {
      if (bufferRef.current) bufferRef.current.destroy()
    }
  }, [])

  const updateMessage = useCallback((message) => {
    bufferRef.current.updateMessage(message)
    setLatestMessage(message)
    setIsDebouncing(true)
    setIsGracePeriod(false)
  }, [])

  const submit = useCallback(() => {
    bufferRef.current.submit()
  }, [])

  const undo = useCallback(() => {
    const success = bufferRef.current.undo()
    if (success) {
      setIsGracePeriod(false)
    }
    return success
  }, [])

  return {
    buffer: bufferRef.current,
    latestMessage,
    isDebouncing,
    isGracePeriod,
    submit,
    undo,
    updateMessage,
  }
}
