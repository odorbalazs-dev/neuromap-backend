function optional(name, fallback = null) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function optionalBool(name, fallback = false) {
  const value = optional(name, null);

  if (value === null) return fallback;

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function optionalNumber(name, fallback) {
  const value = Number(optional(name, fallback));
  return Number.isFinite(value) ? value : fallback;
}

export const invoiceConfig = {
  taxPolicy: optional('INVOICE_TAX_POLICY_JSON', ''),
  provider: optional("INVOICE_PROVIDER", "szamlazzhu"),
  autoCreate: optionalBool("INVOICE_AUTO_CREATE", Boolean(optional("SZAMLAZZHU_AGENT_KEY"))),

  productName: optional("INVOICE_PRODUCT_NAME", "NeuroMap Kids riport"),
  productComment: optional(
    "INVOICE_PRODUCT_COMMENT",
    "Egyszeri digitális riport, online kérdőív alapján."
  ),

  szamlazzhu: {
    endpoint: optional("SZAMLAZZHU_ENDPOINT", "https://www.szamlazz.hu/szamla/"),
    agentKey: optional("SZAMLAZZHU_AGENT_KEY", null),
    eInvoice: optionalBool("SZAMLAZZHU_E_INVOICE", true),
    downloadPdf: optionalBool("SZAMLAZZHU_DOWNLOAD_PDF", true),
    sendEmail: optionalBool("SZAMLAZZHU_SEND_EMAIL", true),
    paymentMethod: optional("SZAMLAZZHU_PAYMENT_METHOD", "Bankkártya"),
    invoiceLanguage: optional("SZAMLAZZHU_INVOICE_LANGUAGE", "auto"),
    currency: optional("SZAMLAZZHU_CURRENCY", "USD"),
    vatRate: optional("SZAMLAZZHU_VAT_RATE", "AAM"),
    exchangeRateBank: optional('SZAMLAZZHU_EXCHANGE_RATE_BANK', 'MNB'),
    sellerName: optional("SZAMLAZZHU_SELLER_NAME", null),
    sellerEmailReplyTo: optional("SZAMLAZZHU_SELLER_EMAIL_REPLY_TO", null),
    timeoutMs: optionalNumber("SZAMLAZZHU_TIMEOUT_MS", 15000)
  }
};

export function isInvoiceAutomationConfigured() {
  if (!invoiceConfig.autoCreate) return false;
  if (invoiceConfig.provider !== "szamlazzhu") return false;
  return Boolean(invoiceConfig.szamlazzhu.agentKey);
}

export function resolveInvoiceTaxPolicy(country) {
  if (!invoiceConfig.taxPolicy && process.env.NODE_ENV !== 'production') return {};
  let policy;
  try { policy = JSON.parse(invoiceConfig.taxPolicy); } catch { throw new Error('INVOICE_TAX_POLICY_MISSING'); }
  if (!isInvoiceTaxPolicyValid(policy)) throw new Error('INVOICE_TAX_POLICY_INVALID');
  const rule = policy[String(country || '').toUpperCase()] || policy['*'];
  if (!rule) {
    throw new Error('INVOICE_COUNTRY_TAX_POLICY_UNVERIFIED');
  }
  return { vatRate: rule.vatRate, euVat: rule.euVat === true };
}

export function isInvoiceTaxPolicyValid(policy) {
  return Boolean(policy && typeof policy === 'object' && !Array.isArray(policy) && Object.keys(policy).length
    && Object.entries(policy).every(([country, rule]) => /^(\*|[A-Z]{2})$/.test(country)
      && rule && typeof rule.vatRate === 'string'
      && /^(AAM|TAM|EU|EUK|MAA|FAD|K\.AFA|[0-9]{1,2}(\.[0-9]{1,2})?)$/.test(rule.vatRate)
      && (rule.euVat === undefined || typeof rule.euVat === 'boolean')));
}
