import { Duration, XSD_DAYTIME_DURATION } from "../../../../../src/domain/models/rdf/Duration";
import { IRI } from "../../../../../src/domain/models/rdf/IRI";

describe("Duration", () => {
  describe("parse", () => {
    describe("valid formats", () => {
      it('should parse "PT5H" as 5 hours', () => {
        const duration = Duration.parse("PT5H");
        expect(duration.totalHours).toBe(5);
        expect(duration.totalMilliseconds).toBe(5 * 60 * 60 * 1000);
      });

      it('should parse "PT30M" as 30 minutes', () => {
        const duration = Duration.parse("PT30M");
        expect(duration.totalMinutes).toBe(30);
        expect(duration.totalMilliseconds).toBe(30 * 60 * 1000);
      });

      it('should parse "PT45S" as 45 seconds', () => {
        const duration = Duration.parse("PT45S");
        expect(duration.totalSeconds).toBe(45);
        expect(duration.totalMilliseconds).toBe(45 * 1000);
      });

      it('should parse "P1D" as 1 day', () => {
        const duration = Duration.parse("P1D");
        expect(duration.totalDays).toBe(1);
        expect(duration.totalMilliseconds).toBe(24 * 60 * 60 * 1000);
      });

      it('should parse "P1DT2H" as 1 day 2 hours', () => {
        const duration = Duration.parse("P1DT2H");
        expect(duration.totalDays).toBe(1 + 2 / 24);
        expect(duration.totalHours).toBe(26);
      });

      it('should parse "PT8H30M" as 8 hours 30 minutes', () => {
        const duration = Duration.parse("PT8H30M");
        expect(duration.totalHours).toBe(8.5);
        expect(duration.totalMinutes).toBe(510);
      });

      it('should parse "PT1H30M45S" as 1 hour 30 minutes 45 seconds', () => {
        const duration = Duration.parse("PT1H30M45S");
        expect(duration.totalSeconds).toBe(3600 + 1800 + 45);
      });

      it('should parse "PT1.5S" as 1.5 seconds', () => {
        const duration = Duration.parse("PT1.5S");
        expect(duration.totalMilliseconds).toBe(1500);
      });

      it('should parse "P0D" as zero duration', () => {
        const duration = Duration.parse("P0D");
        expect(duration.totalMilliseconds).toBe(0);
      });

      it('should parse "PT0S" as zero duration', () => {
        const duration = Duration.parse("PT0S");
        expect(duration.totalMilliseconds).toBe(0);
      });

      it('should parse "P2DT3H4M5S" as full duration', () => {
        const duration = Duration.parse("P2DT3H4M5S");
        const expected = 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000;
        expect(duration.totalMilliseconds).toBe(expected);
      });
    });

    describe("negative durations", () => {
      it('should parse "-PT5H" as negative 5 hours', () => {
        const duration = Duration.parse("-PT5H");
        expect(duration.isNegative).toBe(true);
        expect(duration.totalHours).toBe(-5);
        expect(duration.totalMilliseconds).toBe(-5 * 60 * 60 * 1000);
      });

      it('should parse "-PT8H30M" as negative 8 hours 30 minutes', () => {
        const duration = Duration.parse("-PT8H30M");
        expect(duration.isNegative).toBe(true);
        expect(duration.totalMinutes).toBe(-510);
      });

      it('should parse "-P1DT2H" as negative 1 day 2 hours', () => {
        const duration = Duration.parse("-P1DT2H");
        expect(duration.isNegative).toBe(true);
        expect(duration.totalHours).toBe(-26);
      });
    });

    describe("invalid formats", () => {
      it("should throw for empty string", () => {
        expect(() => Duration.parse("")).toThrow("Invalid duration");
      });

      it("should throw for string without P prefix", () => {
        expect(() => Duration.parse("T5H")).toThrow("must start with 'P'");
      });

      it("should throw for invalid components", () => {
        expect(() => Duration.parse("P5Y")).toThrow("Invalid dayTimeDuration format");
      });

      it("should throw for empty T section", () => {
        expect(() => Duration.parse("PT")).toThrow("T must be followed by time components");
      });

      it("should throw for malformed input", () => {
        expect(() => Duration.parse("not a duration")).toThrow();
      });
    });
  });

  describe("tryParse", () => {
    it("should return Duration for valid input", () => {
      const duration = Duration.tryParse("PT5H");
      expect(duration).not.toBeNull();
      expect(duration!.totalHours).toBe(5);
    });

    it("should return null for invalid input", () => {
      const duration = Duration.tryParse("invalid");
      expect(duration).toBeNull();
    });
  });

  describe("fromComponents", () => {
    it("should create duration from components", () => {
      const duration = Duration.fromComponents(1, 2, 30, 45);
      expect(duration.components.days).toBe(1);
      expect(duration.components.hours).toBe(2);
      expect(duration.components.minutes).toBe(30);
      expect(duration.components.seconds).toBe(45);
    });

    it("should create negative duration", () => {
      const duration = Duration.fromComponents(0, 5, 0, 0, 0, true);
      expect(duration.isNegative).toBe(true);
      expect(duration.totalHours).toBe(-5);
    });

    it("should handle milliseconds", () => {
      const duration = Duration.fromComponents(0, 0, 0, 0, 500);
      expect(duration.totalMilliseconds).toBe(500);
    });
  });

  describe("fromDateDiff", () => {
    it("should calculate duration between two dates", () => {
      const start = new Date("2025-01-01T12:00:00Z");
      const end = new Date("2025-01-01T17:00:00Z");
      const duration = Duration.fromDateDiff(end, start);
      expect(duration.totalHours).toBe(5);
    });

    it("should return negative duration when end is before start", () => {
      const start = new Date("2025-01-01T17:00:00Z");
      const end = new Date("2025-01-01T12:00:00Z");
      const duration = Duration.fromDateDiff(end, start);
      expect(duration.isNegative).toBe(true);
      expect(duration.totalHours).toBe(-5);
    });

    it("should handle day boundaries", () => {
      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");
      const duration = Duration.fromDateDiff(end, start);
      expect(duration.totalDays).toBe(1);
    });
  });

  describe("toString", () => {
    it("should serialize zero duration as PT0S", () => {
      const duration = new Duration(0);
      expect(duration.toString()).toBe("PT0S");
    });

    it("should serialize 5 hours as PT5H", () => {
      const duration = Duration.fromComponents(0, 5, 0, 0);
      expect(duration.toString()).toBe("PT5H");
    });

    it("should serialize 30 minutes as PT30M", () => {
      const duration = Duration.fromComponents(0, 0, 30, 0);
      expect(duration.toString()).toBe("PT30M");
    });

    it("should serialize 1 day as P1D", () => {
      const duration = Duration.fromComponents(1, 0, 0, 0);
      expect(duration.toString()).toBe("P1D");
    });

    it("should serialize complex duration", () => {
      const duration = Duration.fromComponents(1, 2, 30, 45);
      expect(duration.toString()).toBe("P1DT2H30M45S");
    });

    it("should serialize negative duration", () => {
      const duration = Duration.fromComponents(0, 5, 30, 0, 0, true);
      expect(duration.toString()).toBe("-PT5H30M");
    });
  });

  describe("toLiteral", () => {
    it("should create Literal with correct datatype", () => {
      const duration = Duration.parse("PT5H");
      const literal = duration.toLiteral();
      expect(literal.datatype?.value).toBe(XSD_DAYTIME_DURATION);
      expect(literal.value).toBe("PT5H");
    });
  });

  describe("arithmetic operations", () => {
    describe("addToDate", () => {
      it("should add duration to date", () => {
        const date = new Date("2025-01-01T12:00:00Z");
        const duration = Duration.parse("PT5H");
        const result = duration.addToDate(date);
        expect(result.toISOString()).toBe("2025-01-01T17:00:00.000Z");
      });

      it("should handle negative duration", () => {
        const date = new Date("2025-01-01T12:00:00Z");
        const duration = Duration.parse("-PT5H");
        const result = duration.addToDate(date);
        expect(result.toISOString()).toBe("2025-01-01T07:00:00.000Z");
      });
    });

    describe("subtractFromDate", () => {
      it("should subtract duration from date", () => {
        const date = new Date("2025-01-01T12:00:00Z");
        const duration = Duration.parse("PT5H");
        const result = duration.subtractFromDate(date);
        expect(result.toISOString()).toBe("2025-01-01T07:00:00.000Z");
      });
    });

    describe("add", () => {
      it("should add two durations", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        const result = d1.add(d2);
        expect(result.totalHours).toBe(8);
      });

      it("should handle negative durations", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("-PT3H");
        const result = d1.add(d2);
        expect(result.totalHours).toBe(2);
      });
    });

    describe("subtract", () => {
      it("should subtract durations", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        const result = d1.subtract(d2);
        expect(result.totalHours).toBe(2);
      });

      it("should produce negative result when appropriate", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        const result = d1.subtract(d2);
        expect(result.totalHours).toBe(-2);
        expect(result.isNegative).toBe(true);
      });
    });

    describe("multiply", () => {
      it("should multiply duration by scalar", () => {
        const duration = Duration.parse("PT1H");
        const result = duration.multiply(3);
        expect(result.totalHours).toBe(3);
      });

      it("should handle fractional multiplier", () => {
        const duration = Duration.parse("PT1H");
        const result = duration.multiply(0.5);
        expect(result.totalMinutes).toBe(30);
      });

      it("should handle negative multiplier", () => {
        const duration = Duration.parse("PT1H");
        const result = duration.multiply(-2);
        expect(result.totalHours).toBe(-2);
        expect(result.isNegative).toBe(true);
      });
    });

    describe("divide", () => {
      it("should divide duration by scalar", () => {
        const duration = Duration.parse("PT6H");
        const result = duration.divide(2);
        expect(result.totalHours).toBe(3);
      });

      it("should throw on division by zero", () => {
        const duration = Duration.parse("PT1H");
        expect(() => duration.divide(0)).toThrow("Cannot divide duration by zero");
      });
    });

    describe("negate", () => {
      it("should negate positive duration", () => {
        const duration = Duration.parse("PT5H");
        const result = duration.negate();
        expect(result.isNegative).toBe(true);
        expect(result.totalHours).toBe(-5);
      });

      it("should negate negative duration", () => {
        const duration = Duration.parse("-PT5H");
        const result = duration.negate();
        expect(result.isNegative).toBe(false);
        expect(result.totalHours).toBe(5);
      });
    });

    describe("abs", () => {
      it("should return absolute value of negative duration", () => {
        const duration = Duration.parse("-PT5H");
        const result = duration.abs();
        expect(result.isNegative).toBe(false);
        expect(result.totalHours).toBe(5);
      });

      it("should return same value for positive duration", () => {
        const duration = Duration.parse("PT5H");
        const result = duration.abs();
        expect(result.totalHours).toBe(5);
      });
    });
  });

  describe("comparison operations", () => {
    describe("compareTo", () => {
      it("should return negative when this < other", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        expect(d1.compareTo(d2)).toBeLessThan(0);
      });

      it("should return positive when this > other", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.compareTo(d2)).toBeGreaterThan(0);
      });

      it("should return zero when equal", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT5H");
        expect(d1.compareTo(d2)).toBe(0);
      });
    });

    describe("equals", () => {
      it("should return true for equal durations", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT5H");
        expect(d1.equals(d2)).toBe(true);
      });

      it("should return false for different durations", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.equals(d2)).toBe(false);
      });

      it("should consider equivalent representations equal", () => {
        const d1 = Duration.parse("PT60M");
        const d2 = Duration.parse("PT1H");
        expect(d1.equals(d2)).toBe(true);
      });
    });

    describe("lessThan", () => {
      it("should return true when this < other", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        expect(d1.lessThan(d2)).toBe(true);
      });

      it("should return false when this >= other", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.lessThan(d2)).toBe(false);
      });
    });

    describe("greaterThan", () => {
      it("should return true when this > other", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.greaterThan(d2)).toBe(true);
      });

      it("should return false when this <= other", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        expect(d1.greaterThan(d2)).toBe(false);
      });
    });

    describe("lessThanOrEqual", () => {
      it("should return true when this < other", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        expect(d1.lessThanOrEqual(d2)).toBe(true);
      });

      it("should return true when equal", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT5H");
        expect(d1.lessThanOrEqual(d2)).toBe(true);
      });

      it("should return false when this > other", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.lessThanOrEqual(d2)).toBe(false);
      });
    });

    describe("greaterThanOrEqual", () => {
      it("should return true when this > other", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT3H");
        expect(d1.greaterThanOrEqual(d2)).toBe(true);
      });

      it("should return true when equal", () => {
        const d1 = Duration.parse("PT5H");
        const d2 = Duration.parse("PT5H");
        expect(d1.greaterThanOrEqual(d2)).toBe(true);
      });

      it("should return false when this < other", () => {
        const d1 = Duration.parse("PT3H");
        const d2 = Duration.parse("PT5H");
        expect(d1.greaterThanOrEqual(d2)).toBe(false);
      });
    });
  });

  describe("components accessor", () => {
    it("should decompose duration correctly", () => {
      const duration = Duration.fromComponents(2, 5, 30, 45);
      const { days, hours, minutes, seconds } = duration.components;
      expect(days).toBe(2);
      expect(hours).toBe(5);
      expect(minutes).toBe(30);
      expect(seconds).toBe(45);
    });

    it("should return positive components for negative duration", () => {
      const duration = Duration.parse("-PT5H30M");
      const { hours, minutes } = duration.components;
      expect(hours).toBe(5);
      expect(minutes).toBe(30);
      expect(duration.isNegative).toBe(true);
    });
  });
});
