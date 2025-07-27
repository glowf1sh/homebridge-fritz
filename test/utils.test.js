// test/utils.test.js

const {
  validateNumericValue,
  parseTemperature,
  parseBatteryLevel,
} = require('../lib/utils'); // Diese Datei existiert noch nicht

describe('Utility Functions', () => {

  describe('validateNumericValue(value, options)', () => {
    const options = { min: 0, max: 100, fallback: 0 };

    // 1. Typ-Validierung
    it('should return fallback for null', () => {
      expect(validateNumericValue(null, options)).toBe(options.fallback);
    });
    it('should return fallback for undefined', () => {
      expect(validateNumericValue(undefined, options)).toBe(options.fallback);
    });
    it('should return fallback for NaN', () => {
      expect(validateNumericValue(NaN, options)).toBe(options.fallback);
    });
    it('should return fallback for a non-numeric string', () => {
      expect(validateNumericValue('invalid', options)).toBe(options.fallback);
    });
    it('should return fallback for an object', () => {
      expect(validateNumericValue({}, options)).toBe(options.fallback);
    });

    // 2. Bereichsvalidierung
    it('should return fallback for value below min', () => {
      expect(validateNumericValue(-10, options)).toBe(options.fallback);
    });
    it('should return fallback for value above max', () => {
      expect(validateNumericValue(101, options)).toBe(options.fallback);
    });

    // 3. Happy Path
    it('should return parsed number for a valid numeric string', () => {
      expect(validateNumericValue('42.5', options)).toBe(42.5);
    });
    it('should return number for a valid integer', () => {
      expect(validateNumericValue(50, options)).toBe(50);
    });
    it('should return number for a valid float', () => {
      expect(validateNumericValue(99.9, options)).toBe(99.9);
    });
    it('should return number for boundary values (min and max)', () => {
      expect(validateNumericValue(0, options)).toBe(0);
      expect(validateNumericValue(100, options)).toBe(100);
    });
  });

  describe('parseTemperature(value)', () => {
    // HomeKit-Standard: 0-100 Grad Celsius
    it('should handle valid temperature', () => {
      expect(parseTemperature(21.5)).toBe(21.5);
    });
    it('should handle temperature as string', () => {
        expect(parseTemperature('22')).toBe(22);
    });
    it('should return a valid fallback for NaN', () => {
      // Wir erwarten, dass der letzte gültige Wert oder ein Standardwert zurückgegeben wird.
      // Hier definieren wir 0 als Fallback.
      expect(parseTemperature(NaN)).toBe(0);
    });
    it('should cap temperature at 100', () => {
      expect(parseTemperature(150)).toBe(100); // Capping, nicht Fallback
    });
    it('should floor temperature at 0', () => {
      expect(parseTemperature(-10)).toBe(0); // Capping, nicht Fallback
    });
    // Spezifischer Fritz!Box Anwendungsfall: API liefert Wert * 0.5
    it('should handle Fritz!Box specific temperature format (value / 2)', () => {
        // Annahme: Die Funktion könnte eine Transformation beinhalten
        expect(parseTemperature(43, { transform: val => val / 2 })).toBe(21.5);
    });
  });

  describe('parseBatteryLevel(value)', () => {
    it('should handle valid battery level', () => {
      expect(parseBatteryLevel(80)).toBe(80);
    });
    it('should return a valid fallback for null', () => {
      // Für Batterie ist 100% ein sicherer Fallback, um keine "leere Batterie" Warnung auszulösen
      expect(parseBatteryLevel(null)).toBe(100);
    });
    it('should handle battery level as string', () => {
        expect(parseBatteryLevel('75')).toBe(75);
    });
    it('should cap battery level at 100', () => {
      expect(parseBatteryLevel(110)).toBe(100);
    });
    it('should floor battery level at 0', () => {
        expect(parseBatteryLevel(-10)).toBe(0);
    });
  });
});