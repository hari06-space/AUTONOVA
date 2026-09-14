/**
 * Universal Call Manager Helper
 * Centralized API to trigger, open, and control video calls across the ERP application.
 */

export const BOS_CALL_EVENTS = {
  START_CALL: 'bos-start-call',
  END_CALL: 'bos-end-call',
  OPEN_DIALOG: 'bos-open-call-dialog',
  CLOSE_DIALOG: 'bos-close-call-dialog'
};

/**
 * Start or join a video call from any page
 * @param {Object} options
 * @param {Object} [options.targetUser] - The participant employee / user object { userId, employeeName, ... }
 * @param {string} [options.callType] - 'AUDIT' | 'DIRECT' | 'GROUP_MEETING' | 'CHAT'
 * @param {string} [options.title] - Custom title for call dialog
 * @param {string} [options.subtitle] - Custom subtitle
 * @param {Object} [options.schedule] - For group meetings
 * @param {Array} [options.participants] - Attendance/participants list for group meetings
 * @param {Function} [options.onSyncAttendance] - Callback when sync attendance is clicked
 */
export function startUniversalCall(options = {}) {
  window.dispatchEvent(
    new CustomEvent(BOS_CALL_EVENTS.START_CALL, {
      detail: options
    })
  );
}

/**
 * End the currently active video call
 */
export function endUniversalCall() {
  window.dispatchEvent(new CustomEvent(BOS_CALL_EVENTS.END_CALL));
}

/**
 * Open/Restore the active call dialog
 */
export function openUniversalCallDialog() {
  window.dispatchEvent(new CustomEvent(BOS_CALL_EVENTS.OPEN_DIALOG));
}

/**
 * Close/Minimize the active call dialog to floating widget
 */
export function closeUniversalCallDialog() {
  window.dispatchEvent(new CustomEvent(BOS_CALL_EVENTS.CLOSE_DIALOG));
}
