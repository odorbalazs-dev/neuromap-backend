export const MANAGED_PAYMENTS_API_VERSION = '2025-03-31.basil';
export const MANAGED_INVOICE_EXCLUSION = 'STRIPE_MANAGED_PAYMENT_INVOICE_EXCLUDED';

export function isManagedCheckout(checkout) {
  return checkout?.managed_payments?.enabled === true;
}

// Preparation only: production activation requires a separately tested release.
export function managedPaymentsTestEnabled(config) {
  if (!config.STRIPE_MANAGED_PAYMENTS_TEST_ENABLED) return false;
  if (!/^(sk|rk)_test_/.test(config.STRIPE_SECRET_KEY || '')) {
    throw new Error('MANAGED_PAYMENTS_TEST_KEY_REQUIRED');
  }
  return true;
}

export function validateManagedTestPrice(price, productPackage) {
  const product = price?.product;
  const taxCode = typeof product?.tax_code === 'string' ? product.tax_code : product?.tax_code?.id;
  if (price?.livemode !== false || price.active !== true || price.type !== 'one_time' ||
      price.unit_amount !== productPackage.unitAmount || price.currency !== productPackage.currency.toLowerCase() ||
      price.tax_behavior !== 'inclusive' || !product || product.deleted || product.active !== true ||
      taxCode !== 'txcd_10503000') {
    throw new Error('MANAGED_PAYMENTS_TEST_PRICE_INVALID');
  }
}
