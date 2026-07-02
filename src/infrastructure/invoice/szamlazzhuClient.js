function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2);
}

function isNumericVatRate(vatRate) {
  return /^\d+(\.\d+)?$/.test(String(vatRate || "").trim());
}

function calculateLineAmounts({ grossAmount, vatRate }) {
  const gross = Number(grossAmount || 0);

  if (!isNumericVatRate(vatRate)) {
    return {
      net: gross,
      vat: 0,
      gross
    };
  }

  const rate = Number(vatRate) / 100;
  const net = gross / (1 + rate);

  return {
    net,
    vat: gross - net,
    gross
  };
}

function getTaxId(customerDetails) {
  const taxIds = customerDetails?.tax_ids;

  if (Array.isArray(taxIds) && taxIds.length > 0) {
    return taxIds[0]?.value || taxIds[0]?.id || null;
  }

  return null;
}

export function buildBillingInfo({ session, checkoutSession }) {
  const customerDetails = checkoutSession?.customer_details || {};
  const address = customerDetails.address || {};

  return {
    name: customerDetails.name || session?.name || "NeuroMap Kids vásárló",
    email: customerDetails.email || session?.email || "",
    country: address.country || "",
    zip: address.postal_code || "",
    city: address.city || "",
    addressLine1: address.line1 || "",
    addressLine2: address.line2 || "",
    taxId: getTaxId(customerDetails)
  };
}

export function buildInvoiceAmounts({ checkoutSession, config }) {
  const currency = String(checkoutSession?.currency || config.currency || "USD").toUpperCase();
  const grossAmount = checkoutSession?.amount_total
    ? Number(checkoutSession.amount_total) / 100
    : 5;

  return {
    currency,
    grossAmount,
    vatRate: config.vatRate || "AAM",
    ...calculateLineAmounts({
      grossAmount,
      vatRate: config.vatRate || "AAM"
    })
  };
}

function buildInvoiceXml({
  session,
  checkoutSession,
  billing,
  amounts,
  config,
  productName,
  productComment
}) {
  const today = formatDate();
  const invoiceNote = [
    "NeuroMap Kids online kérdőív riport.",
    checkoutSession?.id ? `Stripe checkout session: ${checkoutSession.id}` : null,
    session?.id ? `Belső session: ${session.id}` : null
  ].filter(Boolean).join(" ");

  const sellerXml = [
    config.sellerName ? `<nev>${escapeXml(config.sellerName)}</nev>` : "",
    config.sellerEmailReplyTo
      ? `<emailReplyto>${escapeXml(config.sellerEmailReplyTo)}</emailReplyto>`
      : ""
  ].join("");

  const fullAddress = [billing.addressLine1, billing.addressLine2]
    .filter(Boolean)
    .join(", ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla">
  <beallitasok>
    <szamlaagentkulcs>${escapeXml(config.agentKey)}</szamlaagentkulcs>
    <eszamla>${config.eInvoice ? "true" : "false"}</eszamla>
    <szamlaLetoltes>${config.downloadPdf ? "true" : "false"}</szamlaLetoltes>
    <szamlaLetoltesPld>1</szamlaLetoltesPld>
    <valaszVerzio>2</valaszVerzio>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${today}</teljesitesDatum>
    <fizetesiHataridoDatum>${today}</fizetesiHataridoDatum>
    <fizmod>${escapeXml(config.paymentMethod)}</fizmod>
    <penznem>${escapeXml(amounts.currency)}</penznem>
    <szamlaNyelve>${escapeXml(config.invoiceLanguage)}</szamlaNyelve>
    <megjegyzes>${escapeXml(invoiceNote)}</megjegyzes>
  </fejlec>
  <elado>${sellerXml}</elado>
  <vevo>
    <nev>${escapeXml(billing.name)}</nev>
    <irsz>${escapeXml(billing.zip)}</irsz>
    <telepules>${escapeXml(billing.city)}</telepules>
    <cim>${escapeXml(fullAddress)}</cim>
    <email>${escapeXml(billing.email)}</email>
    <sendEmail>${config.sendEmail ? "true" : "false"}</sendEmail>
    ${billing.taxId ? `<adoszam>${escapeXml(billing.taxId)}</adoszam>` : ""}
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>${escapeXml(productName)}</megnevezes>
      <mennyiseg>1</mennyiseg>
      <mennyisegiEgyseg>db</mennyisegiEgyseg>
      <nettoEgysegar>${formatAmount(amounts.net)}</nettoEgysegar>
      <afakulcs>${escapeXml(amounts.vatRate)}</afakulcs>
      <nettoErtek>${formatAmount(amounts.net)}</nettoErtek>
      <afaErtek>${formatAmount(amounts.vat)}</afaErtek>
      <bruttoErtek>${formatAmount(amounts.gross)}</bruttoErtek>
      <megjegyzes>${escapeXml(productComment)}</megjegyzes>
    </tetel>
  </tetelek>
</xmlszamla>`;
}

function readXmlTag(text, tagName) {
  const pattern = new RegExp(`<(?:[^:>]+:)?${tagName}>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tagName}>`, "i");
  const match = String(text || "").match(pattern);
  return match ? match[1].trim() : null;
}

function readProviderHeaders(response) {
  return {
    invoiceNumber:
      response.headers.get("szlahu_szamlaszam") ||
      response.headers.get("szlahu-szamlaszam"),
    grossTotal:
      response.headers.get("szlahu_bruttovegosszeg") ||
      response.headers.get("szlahu-bruttovegosszeg"),
    netTotal:
      response.headers.get("szlahu_nettovegosszeg") ||
      response.headers.get("szlahu-nettovegosszeg"),
    error:
      response.headers.get("szlahu_error") ||
      response.headers.get("szlahu-error"),
    errorCode:
      response.headers.get("szlahu_error_code") ||
      response.headers.get("szlahu-error-code")
  };
}

export async function createSzamlazzHuInvoice({
  session,
  checkoutSession,
  config,
  productName,
  productComment
}) {
  if (!config.agentKey) {
    throw new Error("Missing SZAMLAZZHU_AGENT_KEY.");
  }

  const billing = buildBillingInfo({ session, checkoutSession });
  const amounts = buildInvoiceAmounts({ checkoutSession, config });

  const xml = buildInvoiceXml({
    session,
    checkoutSession,
    billing,
    amounts,
    config,
    productName,
    productComment
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 15000);

  try {
    const form = new FormData();
    form.append(
      "action-xmlagentxmlfile",
      new Blob([xml], { type: "application/xml" }),
      "neuromap-invoice.xml"
    );

    const response = await fetch(config.endpoint, {
      method: "POST",
      body: form,
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") || "";
    const headers = readProviderHeaders(response);
    const responseText = contentType.includes("text") || contentType.includes("xml")
      ? await response.text()
      : "";

    const providerError =
      headers.error ||
      readXmlTag(responseText, "hibauzenet") ||
      readXmlTag(responseText, "error");

    if (!response.ok || providerError) {
      throw new Error(
        providerError ||
          `Szamlazz.hu invoice request failed with HTTP ${response.status}.`
      );
    }

    const invoiceNumber =
      headers.invoiceNumber ||
      readXmlTag(responseText, "szamlaszam") ||
      readXmlTag(responseText, "szlahu_szamlaszam");

    return {
      providerInvoiceId: invoiceNumber || null,
      invoiceNumber: invoiceNumber || null,
      billing,
      amounts,
      providerResponse: {
        httpStatus: response.status,
        contentType,
        headers,
        xmlInvoiceNumber: invoiceNumber || null
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
