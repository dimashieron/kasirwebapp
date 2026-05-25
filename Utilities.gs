// ============================================================
// KASIR WARUNG - Utilities.gs
// ============================================================

const Utilities = (() => {

  function response(success, message, data = null) {
    return { success, message, data };
  }

  function formatCurrency(amount) {
    return 'Rp ' + parseInt(amount || 0).toLocaleString('id-ID');
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy');
  }

  function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return SpreadsheetApp.getActive() ? 
      Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm') : 
      d.toLocaleString('id-ID');
  }

  function getToday() {
    const now = new Date();
    const tz = 'Asia/Jakarta';
    return new Date(Utilities.formatDate(now, tz, 'yyyy/MM/dd'));
  }

  function getTodayString() {
    return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  }

  function isToday(date) {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  }

  function generateInvoiceNumber() {
    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return 'INV' + dateStr + random;
  }

  function validateRequired(obj, fields) {
    const missing = fields.filter(f => !obj[f] && obj[f] !== 0);
    if (missing.length > 0) {
      throw new Error('Field wajib kosong: ' + missing.join(', '));
    }
  }

  function sanitizeString(str) {
    if (!str) return '';
    return String(str).trim().replace(/[<>]/g, '');
  }

  function parseNumber(val) {
    const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function rowToObject(row, headers) {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  }

  return { response, formatCurrency, formatDate, formatDateTime, getToday, getTodayString, isToday, generateInvoiceNumber, validateRequired, sanitizeString, parseNumber, rowToObject };
})();
