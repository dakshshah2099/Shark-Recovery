/**
 * Indian Numbering System Currency & Number Formatting Utility
 * Handles Indian grouping (1,00,000 / 1,00,00,000) and denominations:
 * - Thousands (K / Thousand) [10^3]
 * - Lakhs (L / Lakh)         [10^5]
 * - Crores (Cr / Crore)      [10^7]
 */

export interface FormatOptions {
  decimals?: number;
  showSymbol?: boolean;
  spaceBeforeUnit?: boolean;
  useShortUnit?: boolean; // 'Cr' vs 'Crore'
}

/**
 * Standard Indian Rupee formatter with en-IN comma separation.
 * e.g., 14520500 -> ₹1,45,20,500.00
 */
export function formatIndianCurrency(
  amount: number | string | null | undefined,
  options: { decimals?: number; showSymbol?: boolean } = {}
): string {
  const { decimals = 2, showSymbol = true } = options;
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const val = Number(amount);
  const prefix = val < 0 ? '-' : '';
  const absVal = Math.abs(val);

  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${showSymbol ? '₹' : ''}${formatted}`;
}

/**
 * Compact Indian currency formatter.
 * e.g.,
 * 850         -> ₹850
 * 45,000      -> ₹45 K
 * 15,20,000   -> ₹15.20 L
 * 2,50,00,000 -> ₹2.50 Cr
 */
export function formatIndianCompact(
  amount: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const {
    decimals = 2,
    showSymbol = true,
    spaceBeforeUnit = true,
    useShortUnit = true,
  } = options;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showSymbol ? '₹0' : '0';
  }

  const val = Number(amount);
  const prefix = val < 0 ? '-' : '';
  const absVal = Math.abs(val);
  const symbol = showSymbol ? '₹' : '';
  const space = spaceBeforeUnit ? ' ' : '';

  // 1 Crore = 10,000,000 (10^7)
  if (absVal >= 10000000) {
    const crores = absVal / 10000000;
    const formatted = formatNumberTrimmed(crores, decimals);
    const unit = useShortUnit ? 'Cr' : crores === 1 ? 'Crore' : 'Crores';
    return `${prefix}${symbol}${formatted}${space}${unit}`;
  }

  // 1 Lakh = 100,000 (10^5)
  if (absVal >= 100000) {
    const lakhs = absVal / 100000;
    const formatted = formatNumberTrimmed(lakhs, decimals);
    const unit = useShortUnit ? 'L' : lakhs === 1 ? 'Lakh' : 'Lakhs';
    return `${prefix}${symbol}${formatted}${space}${unit}`;
  }

  // 1 Thousand = 1,000 (10^3)
  if (absVal >= 1000) {
    const thousands = absVal / 1000;
    const formatted = formatNumberTrimmed(thousands, decimals);
    const unit = useShortUnit ? 'K' : 'Thousand';
    return `${prefix}${symbol}${formatted}${space}${unit}`;
  }

  // Under 1,000
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Expresses a number in Indian words / denomination units.
 * e.g.,
 * 45000     -> "45 Thousand"
 * 1500000   -> "15 Lakhs"
 * 25000000  -> "2.5 Crores"
 */
export function formatIndianWords(
  amount: number | string | null | undefined,
  options: { decimals?: number; includeRupees?: boolean } = {}
): string {
  const { decimals = 2, includeRupees = false } = options;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return includeRupees ? '0 Rupees' : '0';
  }

  const val = Number(amount);
  const prefix = val < 0 ? 'Minus ' : '';
  const absVal = Math.abs(val);
  const suffix = includeRupees ? ' Rupees' : '';

  if (absVal >= 10000000) {
    const crores = absVal / 10000000;
    const formatted = formatNumberTrimmed(crores, decimals);
    const unit = crores === 1 ? 'Crore' : 'Crores';
    return `${prefix}${formatted} ${unit}${suffix}`;
  }

  if (absVal >= 100000) {
    const lakhs = absVal / 100000;
    const formatted = formatNumberTrimmed(lakhs, decimals);
    const unit = lakhs === 1 ? 'Lakh' : 'Lakhs';
    return `${prefix}${formatted} ${unit}${suffix}`;
  }

  if (absVal >= 1000) {
    const thousands = absVal / 1000;
    const formatted = formatNumberTrimmed(thousands, decimals);
    return `${prefix}${formatted} Thousand${suffix}`;
  }

  return `${prefix}${Math.round(absVal).toLocaleString('en-IN')}${suffix}`;
}

/**
 * Returns complete denomination metadata for dual display (number + pill badge/subtitle).
 */
export function getIndianDenomination(amount: number | string | null | undefined) {
  const val = Number(amount) || 0;
  const absVal = Math.abs(val);

  let unit = '';
  let shortUnit = '';
  let unitValue = 0;

  if (absVal >= 10000000) {
    unitValue = absVal / 10000000;
    unit = unitValue === 1 ? 'Crore' : 'Crores';
    shortUnit = 'Cr';
  } else if (absVal >= 100000) {
    unitValue = absVal / 100000;
    unit = unitValue === 1 ? 'Lakh' : 'Lakhs';
    shortUnit = 'L';
  } else if (absVal >= 1000) {
    unitValue = absVal / 1000;
    unit = 'Thousand';
    shortUnit = 'K';
  }

  return {
    value: val,
    full: formatIndianCurrency(val),
    compact: formatIndianCompact(val),
    words: formatIndianWords(val),
    unit,
    shortUnit,
    unitValue,
    hasDenomination: absVal >= 1000,
  };
}

/**
 * Helper to format decimal with max precision, removing redundant trailing zeros.
 */
function formatNumberTrimmed(num: number, maxDecimals: number): string {
  const fixed = num.toFixed(maxDecimals);
  // Keep up to maxDecimals, but trim trailing '.00' or '0'
  return fixed.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1');
}
