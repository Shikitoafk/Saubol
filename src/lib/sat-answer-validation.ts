/**
 * Exact-value scoring for Digital SAT student-produced responses.
 *
 * The College Board accepts equivalent decimal and fractional forms.  String
 * comparison used to reject correct work such as `9/10`, `0.9`, and `0,9`.
 * Parse the small numeric grammar allowed by SAT instead and compare reduced
 * rational values exactly (never with floating-point rounding).
 */
type Rational = { numerator: bigint; denominator: bigint };

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a || 1n;
};

const reduced = (numerator: bigint, denominator: bigint): Rational | null => {
  if (denominator === 0n) return null;
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator / divisor) * sign,
    denominator: (denominator / divisor) * sign,
  };
};

const decimalRational = (value: string): Rational | null => {
  const match = value.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2];
  const fraction = match[3] || "";
  const denominator = 10n ** BigInt(fraction.length);
  return reduced(sign * BigInt(`${whole}${fraction}`), denominator);
};

function parseRational(raw: string): Rational | null {
  let value = raw.trim().replace(/\s*\/\s*/g, "/");
  if (!value) return null;

  // Imported answer keys can contain lightweight KaTeX fractions.
  value = value
    .replace(/\\(?:d?frac)\s*\{\s*([^{}]+)\s*}\s*\{\s*([^{}]+)\s*}/g, "$1/$2")
    .replace(/[{}]/g, "")
    .replace(/\\,/g, "")
    .replace(/−/g, "-")
    .replace(/[,$]/g, (token, offset, source) => {
      // Decimal comma: `0,9` → `0.9`. Thousands grouping: `1,320` → 1320.
      if (token !== ",") return "";
      const before = source.slice(0, offset);
      const after = source.slice(offset + 1);
      return /^[-+]?\d{1,3}$/.test(before) && /^\d{3}(?:\D|$)/.test(after) ? "" : ".";
    });

  const fraction = value.match(/^([+-]?\d+)\/(\d+)$/);
  if (fraction) return reduced(BigInt(fraction[1]), BigInt(fraction[2]));

  const mixed = value.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = BigInt(mixed[1]);
    const numerator = BigInt(mixed[2]);
    const denominator = BigInt(mixed[3]);
    if (denominator === 0n) return null;
    return reduced((whole < 0n ? -1n : 1n) * (abs(whole) * denominator + numerator), denominator);
  }
  return decimalRational(value);
}

const abs = (value: bigint) => value < 0n ? -value : value;

function answerVariants(answer: string): string[] {
  // Keep a comma as decimal punctuation; only unambiguous separators create
  // multiple accepted answers in imported answer keys.
  return answer.split(/\s*(?:;|\||\bor\b)\s*/i).map(value => value.trim()).filter(Boolean);
}

export function isEquivalentSATAnswer(input: string, storedAnswer?: string): boolean {
  const submitted = parseRational(input);
  if (!submitted || !storedAnswer?.trim()) return false;
  return answerVariants(storedAnswer).some((variant) => {
    const expected = parseRational(variant);
    return Boolean(expected && submitted.numerator === expected.numerator && submitted.denominator === expected.denominator);
  });
}

/** Keep the free-response field aligned with SAT's numeric-entry controls. */
export function sanitizeSATAnswerInput(value: string): string {
  return value.replace(/[^0-9.,/\s+\-−]/g, "").slice(0, 32);
}
