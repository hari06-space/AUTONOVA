import { useState, useCallback, useEffect } from 'react';

/**
 * Formats current system time to 12h format (hh:mm AM/PM)
 */
export const getSystemTime12h = () => {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
};

/**
 * Reusable BOS Live Clock hook for table rows / forms with analog time picker.
 *
 * @param {Array} list - The list of items (e.g. attendance records)
 * @param {Function} setList - State updater function for list
 * @param {Object} options - Configuration options
 * @param {String} options.timeField - Key of the time property (default: 'outTime')
 * @param {String} options.keyField - Key identifier on each item (default: 'id')
 * @param {Function} options.shouldUpdate - Optional item filter (item) => boolean
 * @param {Number} options.intervalMs - Update frequency in ms (default: 1000)
 */
export default function useBOSLiveClock(list, setList, options = {}) {
  const {
    timeField = 'outTime',
    keyField = 'id',
    shouldUpdate,
    intervalMs = 1000
  } = options;

  const [pausedRows, setPausedRows] = useState({});

  const togglePauseClock = useCallback(
    (key) => {
      setPausedRows((prev) => {
        const currentlyPaused = Boolean(prev[key] || prev[String(key)]);
        const isNowPaused = !currentlyPaused;
        if (!isNowPaused && setList) {
          const current12 = getSystemTime12h();
          setList((prevList) =>
            prevList.map((item, idx) => {
              const itemKey = item?.[keyField] ?? idx;
              if (String(itemKey) === String(key)) {
                return { ...item, [timeField]: current12 };
              }
              return item;
            })
          );
        }
        return { ...prev, [key]: isNowPaused, [String(key)]: isNowPaused };
      });
    },
    [setList, keyField, timeField]
  );

  const pauseRow = useCallback((key) => {
    setPausedRows((prev) => ({ ...prev, [key]: true, [String(key)]: true }));
  }, []);

  const resumeRow = useCallback(
    (key) => {
      setPausedRows((prev) => ({ ...prev, [key]: false, [String(key)]: false }));
      if (setList) {
        const current12 = getSystemTime12h();
        setList((prevList) =>
          prevList.map((item, idx) => {
            const itemKey = item?.[keyField] ?? idx;
            if (String(itemKey) === String(key)) {
              return { ...item, [timeField]: current12 };
            }
            return item;
          })
        );
      }
    },
    [setList, keyField, timeField]
  );

  const isRowPaused = useCallback(
    (key) => Boolean(pausedRows[key] || pausedRows[String(key)]),
    [pausedRows]
  );

  useEffect(() => {
    if (!setList || !list || list.length === 0) return;

    const timer = setInterval(() => {
      setList((prevList) => {
        if (!prevList || prevList.length === 0) return prevList;
        const current12 = getSystemTime12h();
        let changed = false;

        const updated = prevList.map((item, idx) => {
          const key = item?.[keyField] ?? idx;
          if (pausedRows[key] || pausedRows[String(key)]) return item;
          if (shouldUpdate && !shouldUpdate(item)) return item;

          const val = item?.[timeField];
          const cleanVal = !val || val === 'undefined' || val === 'null' ? '' : val;
          if (!cleanVal || cleanVal !== current12) {
            changed = true;
            return { ...item, [timeField]: current12 };
          }
          return item;
        });

        return changed ? updated : prevList;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [list, setList, pausedRows, timeField, keyField, shouldUpdate, intervalMs]);

  return {
    pausedRows,
    togglePauseClock,
    pauseRow,
    resumeRow,
    isRowPaused,
    getSystemTime12h
  };
}
