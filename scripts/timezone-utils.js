/**
 * Timezone utilities for Indian Standard Time (IST)
 * IST is UTC+5:30
 * JavaScript version for use in Node.js scripts
 */

/**
 * Get current date in IST timezone
 */
function getCurrentISTDate() {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(now.getTime() + istOffset);
}

/**
 * Get today's date string in YYYY-MM-DD format in IST
 */
function getTodayISTDateString() {
  const istDate = getCurrentISTDate();
  return istDate.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string in YYYY-MM-DD format in IST
 */
function getYesterdayISTDateString() {
  const istDate = getCurrentISTDate();
  const yesterday = new Date(istDate.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Check if it's midnight in IST (between 00:00 and 00:01)
 */
function isMidnightIST() {
  const istDate = getCurrentISTDate();
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  
  return hours === 0 && minutes === 0;
}

/**
 * Format date for logging with IST timezone
 */
function formatISTDateTime(date) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false
  });
}

/**
 * Check if a given date string is today in IST
 */
function isTodayIST(dateString) {
  const todayIST = getTodayISTDateString();
  return dateString === todayIST;
}

/**
 * Check if a given date string is yesterday in IST
 */
function isYesterdayIST(dateString) {
  const yesterdayIST = getYesterdayISTDateString();
  return dateString === yesterdayIST;
}

module.exports = {
  getCurrentISTDate,
  getTodayISTDateString,
  getYesterdayISTDateString,
  isMidnightIST,
  formatISTDateTime,
  isTodayIST,
  isYesterdayIST
};
