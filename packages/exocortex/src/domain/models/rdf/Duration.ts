import { IRI } from "./IRI";
import { Literal } from "./Literal";

/** XSD dayTimeDuration datatype URI */
export const XSD_DAYTIME_DURATION = "http://www.w3.org/2001/XMLSchema#dayTimeDuration";

/** XSD dateTime datatype URI */
export const XSD_DATETIME = "http://www.w3.org/2001/XMLSchema#dateTime";

/**
 * Represents an xsd:dayTimeDuration value.
 * Format: [-]P[nD][T[nH][nM][n.nS]]
 *
 * Examples:
 * - "PT5H" - 5 hours
 * - "-PT8H30M" - negative 8 hours 30 minutes
 * - "P1DT2H" - 1 day and 2 hours
 * - "PT0S" - zero duration
 *
 * @see https://www.w3.org/TR/xpath-functions/#dt-dayTimeDuration
 * @see https://www.w3.org/TR/sparql11-query/#operandDataTypes
 */
export class Duration {
  /** Total duration in milliseconds (signed) */
  private readonly _totalMs: number;

  /**
   * Create a Duration from milliseconds.
   * @param totalMs Total milliseconds (can be negative)
   */
  constructor(totalMs: number) {
    this._totalMs = totalMs;
  }

  /**
   * Get total duration in milliseconds.
   */
  get totalMilliseconds(): number {
    return this._totalMs;
  }

  /**
   * Get total duration in seconds (decimal).
   */
  get totalSeconds(): number {
    return this._totalMs / 1000;
  }

  /**
   * Get total duration in minutes (decimal).
   */
  get totalMinutes(): number {
    return this._totalMs / (1000 * 60);
  }

  /**
   * Get total duration in hours (decimal).
   */
  get totalHours(): number {
    return this._totalMs / (1000 * 60 * 60);
  }

  /**
   * Get total duration in days (decimal).
   */
  get totalDays(): number {
    return this._totalMs / (1000 * 60 * 60 * 24);
  }

  /**
   * Check if duration is negative.
   */
  get isNegative(): boolean {
    return this._totalMs < 0;
  }

  /**
   * Get components of the duration.
   * Returns decomposed days, hours, minutes, seconds (all non-negative).
   */
  get components(): { days: number; hours: number; minutes: number; seconds: number } {
    const absMs = Math.abs(this._totalMs);

    const totalSeconds = absMs / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const remainingAfterDays = totalSeconds % 86400;
    const hours = Math.floor(remainingAfterDays / 3600);
    const remainingAfterHours = remainingAfterDays % 3600;
    const minutes = Math.floor(remainingAfterHours / 60);
    const seconds = remainingAfterHours % 60;

    return { days, hours, minutes, seconds };
  }

  /**
   * Parse an xsd:dayTimeDuration string.
   * Format: [-]P[nD][T[nH][nM][n.nS]]
   *
   * @param durationStr Duration string in ISO 8601 duration format
   * @returns Duration instance
   * @throws Error if format is invalid
   *
   * Examples:
   * - "PT5H" → 5 hours
   * - "-PT8H30M" → -8 hours 30 minutes
   * - "P1DT2H" → 1 day 2 hours
   * - "PT0S" → 0
   * - "P0D" → 0
   * - "PT1.5S" → 1.5 seconds
   */
  static parse(durationStr: string): Duration {
    if (!durationStr || typeof durationStr !== "string") {
      throw new Error(`Invalid duration: ${durationStr}`);
    }

    const trimmed = durationStr.trim();

    // Check for negative duration
    let isNegative = false;
    let str = trimmed;
    if (str.startsWith("-")) {
      isNegative = true;
      str = str.substring(1);
    }

    // Must start with P
    if (!str.startsWith("P")) {
      throw new Error(`Invalid dayTimeDuration format: ${durationStr} (must start with 'P' or '-P')`);
    }

    str = str.substring(1); // Remove P

    let totalMs = 0;

    // Parse days (before T)
    const tIndex = str.indexOf("T");
    if (tIndex === -1) {
      // No time component - only days allowed
      if (str.length > 0) {
        const dayMatch = str.match(/^(\d+(?:\.\d+)?)D$/);
        if (dayMatch) {
          totalMs += parseFloat(dayMatch[1]) * 24 * 60 * 60 * 1000;
        } else if (str !== "") {
          throw new Error(
            `Invalid dayTimeDuration format: ${durationStr} (date component must be nD or empty)`
          );
        }
      }
    } else {
      // Has time component
      const datePart = str.substring(0, tIndex);
      const timePart = str.substring(tIndex + 1);

      // Parse days from date part
      if (datePart.length > 0) {
        const dayMatch = datePart.match(/^(\d+(?:\.\d+)?)D$/);
        if (dayMatch) {
          totalMs += parseFloat(dayMatch[1]) * 24 * 60 * 60 * 1000;
        } else {
          throw new Error(
            `Invalid dayTimeDuration format: ${durationStr} (date component must be nD or empty)`
          );
        }
      }

      // Parse time part: nH, nM, n.nS
      if (timePart.length === 0) {
        throw new Error(`Invalid dayTimeDuration format: ${durationStr} (T must be followed by time components)`);
      }

      // Use regex to extract H, M, S components
      let remaining = timePart;

      // Hours
      const hoursMatch = remaining.match(/^(\d+(?:\.\d+)?)H/);
      if (hoursMatch) {
        totalMs += parseFloat(hoursMatch[1]) * 60 * 60 * 1000;
        remaining = remaining.substring(hoursMatch[0].length);
      }

      // Minutes
      const minutesMatch = remaining.match(/^(\d+(?:\.\d+)?)M/);
      if (minutesMatch) {
        totalMs += parseFloat(minutesMatch[1]) * 60 * 1000;
        remaining = remaining.substring(minutesMatch[0].length);
      }

      // Seconds
      const secondsMatch = remaining.match(/^(\d+(?:\.\d+)?)S$/);
      if (secondsMatch) {
        totalMs += parseFloat(secondsMatch[1]) * 1000;
        remaining = "";
      }

      if (remaining.length > 0) {
        throw new Error(`Invalid dayTimeDuration format: ${durationStr} (invalid time component: ${remaining})`);
      }
    }

    return new Duration(isNegative ? -totalMs : totalMs);
  }

  /**
   * Try to parse a duration string, returning null if invalid.
   */
  static tryParse(durationStr: string): Duration | null {
    try {
      return Duration.parse(durationStr);
    } catch {
      return null;
    }
  }

  /**
   * Create a Duration from individual components.
   */
  static fromComponents(
    days: number = 0,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0,
    negative: boolean = false
  ): Duration {
    let totalMs = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000 + milliseconds;

    if (negative) {
      totalMs = -totalMs;
    }

    return new Duration(totalMs);
  }

  /**
   * Create a Duration from the difference between two dates.
   * @param end End date
   * @param start Start date
   * @returns Duration representing (end - start)
   */
  static fromDateDiff(end: Date, start: Date): Duration {
    return new Duration(end.getTime() - start.getTime());
  }

  /**
   * Convert to xsd:dayTimeDuration string format.
   * Returns the canonical lexical form.
   */
  toString(): string {
    if (this._totalMs === 0) {
      return "PT0S";
    }

    const { days, hours, minutes, seconds } = this.components;
    const negative = this.isNegative;

    let result = negative ? "-P" : "P";

    if (days > 0) {
      result += `${days}D`;
    }

    if (hours > 0 || minutes > 0 || seconds > 0) {
      result += "T";
      if (hours > 0) {
        result += `${hours}H`;
      }
      if (minutes > 0) {
        result += `${minutes}M`;
      }
      if (seconds > 0) {
        // Handle decimal seconds
        if (Number.isInteger(seconds)) {
          result += `${seconds}S`;
        } else {
          result += `${seconds.toFixed(3).replace(/\.?0+$/, "")}S`;
        }
      }
    }

    // If only days and result ends with D, that's fine
    // If we only have negative zero scenario, return PT0S
    if (result === "-P" || result === "P") {
      return "PT0S";
    }

    return result;
  }

  /**
   * Convert to an RDF Literal with xsd:dayTimeDuration datatype.
   */
  toLiteral(): Literal {
    return new Literal(this.toString(), new IRI(XSD_DAYTIME_DURATION));
  }

  /**
   * Add this duration to a Date, returning a new Date.
   */
  addToDate(date: Date): Date {
    return new Date(date.getTime() + this._totalMs);
  }

  /**
   * Subtract this duration from a Date, returning a new Date.
   */
  subtractFromDate(date: Date): Date {
    return new Date(date.getTime() - this._totalMs);
  }

  /**
   * Add another duration to this duration.
   */
  add(other: Duration): Duration {
    return new Duration(this._totalMs + other._totalMs);
  }

  /**
   * Subtract another duration from this duration.
   */
  subtract(other: Duration): Duration {
    return new Duration(this._totalMs - other._totalMs);
  }

  /**
   * Multiply duration by a scalar.
   */
  multiply(scalar: number): Duration {
    return new Duration(this._totalMs * scalar);
  }

  /**
   * Divide duration by a scalar.
   */
  divide(scalar: number): Duration {
    if (scalar === 0) {
      throw new Error("Cannot divide duration by zero");
    }
    return new Duration(this._totalMs / scalar);
  }

  /**
   * Negate the duration (flip sign).
   */
  negate(): Duration {
    return new Duration(-this._totalMs);
  }

  /**
   * Get the absolute value of the duration.
   */
  abs(): Duration {
    return new Duration(Math.abs(this._totalMs));
  }

  /**
   * Compare two durations.
   * @returns negative if this < other, 0 if equal, positive if this > other
   */
  compareTo(other: Duration): number {
    return this._totalMs - other._totalMs;
  }

  /**
   * Check equality with another duration.
   */
  equals(other: Duration): boolean {
    return this._totalMs === other._totalMs;
  }

  /**
   * Check if this duration is less than another.
   */
  lessThan(other: Duration): boolean {
    return this._totalMs < other._totalMs;
  }

  /**
   * Check if this duration is greater than another.
   */
  greaterThan(other: Duration): boolean {
    return this._totalMs > other._totalMs;
  }

  /**
   * Check if this duration is less than or equal to another.
   */
  lessThanOrEqual(other: Duration): boolean {
    return this._totalMs <= other._totalMs;
  }

  /**
   * Check if this duration is greater than or equal to another.
   */
  greaterThanOrEqual(other: Duration): boolean {
    return this._totalMs >= other._totalMs;
  }
}
