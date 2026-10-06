export const MANAGED_PAYMENTS_API_VERSION = '2025-03-31.basil';
export const MANAGED_INVOICE_EXCLUSION = 'STRIPE_MANAGED_PAYMENT_INVOICE_EXCLUDED';

export function isManagedCheckout(checkout) {
  return checkout?.managed_payments?.enabled === true;
}

export function managedPaymentsMode(config) {
  const test = config.STRIPE_MANAGED_PAYMENTS_TEST_ENABLED === true;
  const live = config.STRIPE_MANAGED_PAYMENTS_LIVE_ENABLED === true;
  if (test && live) throw new Error('MANAGED_PAYMENTS_MODE_CONFLICT');
  if (test && !/^(sk|rk)_test_/.test(config.STRIPE_SECRET_KEY || '')) {
    throw new Error('MANAGED_PAYMENTS_TEST_KEY_REQUIRED');
  }
  if (live && !/^(sk|rk)_live_/.test(config.STRIPE_SECRET_KEY || '')) {
    throw new Error('MANAGED_PAYMENTS_LIVE_KEY_REQUIRED');
  }
  return live ? 'live' : test ? 'test' : null;
}

export function managedPaymentsTestEnabled(config) {
  return managedPaymentsMode(config) === 'test';
}

export function validateManagedPrice(price, productPackage, mode) {
  if (!['test', 'live'].includes(mode)) throw new Error('MANAGED_PAYMENTS_MODE_REQUIRED');
  const product = price?.product;
  const taxCode = typeof product?.tax_code === 'string' ? product.tax_code : product?.tax_code?.id;
  if (price?.livemode !== (mode === 'live') || price.active !== true || price.type !== 'one_time' ||
      price.unit_amount !== productPackage.unitAmount || price.currency !== productPackage.currency.toLowerCase() ||
      price.tax_behavior !== 'inclusive' || !product || product.deleted || product.active !== true ||
      taxCode !== 'txcd_10503000') {
    throw new Error(`MANAGED_PAYMENTS_${mode.toUpperCase()}_PRICE_INVALID`);
  }
}

export function validateManagedTestPrice(price, productPackage) {
  validateManagedPrice(price, productPackage, 'test');
}

export function validateManagedCheckout(checkout, mode) {
  if (!['test', 'live'].includes(mode)) throw new Error('MANAGED_PAYMENTS_MODE_REQUIRED');
  if (checkout?.object !== 'checkout.session' || !isManagedCheckout(checkout) ||
      checkout.livemode !== (mode === 'live')) {
    throw new Error('MANAGED_PAYMENTS_CHECKOUT_INVALID');
  }
}
