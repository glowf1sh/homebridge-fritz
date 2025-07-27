// lib/utils.js

/**
 * Validiert einen numerischen Wert gegen Typ, Min/Max-Grenzen und gibt einen Fallback zurück.
 * @param {*} value Der zu validierende Wert.
 * @param {object} options
 * @param {number} options.min - Erlaubtes Minimum.
 * @param {number} options.max - Erlaubtes Maximum.
 * @param {*} options.fallback - Rückgabewert bei Fehlschlag.
 * @returns {number|*} Der validierte numerische Wert oder der Fallback.
 */
function validateNumericValue(value, { min, max, fallback }) {
  const num = Number(value);

  if (value === null || Number.isNaN(num)) {
    return fallback;
  }

  if (num < min || num > max) {
    return fallback;
  }

  return num;
}

/**
 * Parst und validiert einen Temperaturwert für HomeKit.
 * HomeKit-Standardbereich: 0°C bis 100°C.
 * @param {*} value Der rohe Temperaturwert von der API.
 * @param {object} [options] - Zusätzliche Optionen wie Transformation.
 * @returns {number} Eine gültige Temperatur für HomeKit.
 */
function parseTemperature(value, options) {
    let temp = value;
    if (options && typeof options.transform === 'function') {
        temp = options.transform(temp);
    }
    // Capping ist hier eine bewusste Entscheidung statt Fallback, um den Wert so nah wie möglich am Original zu halten.
    const cappedValue = Math.max(0, Math.min(100, Number(temp)));
    return validateNumericValue(cappedValue, { min: 0, max: 100, fallback: 0 });
}


/**
 * Parst und validiert einen Batteriestand für HomeKit.
 * HomeKit-Standardbereich: 0% bis 100%.
 * @param {*} value Der rohe Batteriewert von der API.
 * @returns {number} Ein gültiger Batteriestand für HomeKit.
 */
function parseBatteryLevel(value) {
  // Hier ist ein Fallback auf 100 sicherer, um unnötige "Batterie leer"-Warnungen zu vermeiden.
  // Prüfe zuerst auf null/undefined, bevor Math-Operationen durchgeführt werden
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 100;
  }
  
  const cappedValue = Math.max(0, Math.min(100, Number(value)));
  return validateNumericValue(cappedValue, { min: 0, max: 100, fallback: 100 });
}

module.exports = {
  validateNumericValue,
  parseTemperature,
  parseBatteryLevel,
};