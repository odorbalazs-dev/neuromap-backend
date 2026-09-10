import { XMLParser, XMLValidator } from 'fast-xml-parser';

const xmlParser = new XMLParser({ removeNSPrefix: true, parseTagValue: false, processEntities: false });
function parseProviderXml(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) throw new Error('INVOICE_RESPONSE_INVALID');
  return xmlParser.parse(text);
}

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
    taxId: getTaxId(customerDetails),
    taxIdType: customerDetails.tax_ids?.[0]?.type || null
  };
}

export function buildInvoiceAmounts({ session, checkoutSession, config }) {
  const currency = String(
    checkoutSession?.currency || session?.currency || config.currency || "USD"
  ).toUpperCase();
  const amountTotal = Number(
    checkoutSession?.amount_total ?? session?.amount_total
  );

  if (!Number.isInteger(amountTotal) || amountTotal <= 0) {
    throw new Error("Missing or invalid paid amount for invoice creation.");
  }

  const grossAmount = amountTotal / 100;

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

export function buildInvoiceXml({
  session,
  checkoutSession,
  billing,
  amounts,
  config,
  productName,
  productComment
}) {
  const today = formatDate();
  const invoiceNote = productComment;
  const paidDate = session.paid_at ? formatDate(new Date(session.paid_at)) : today;
  if (billing.taxId && !['hu_tin', 'eu_vat'].includes(billing.taxIdType)) {
    throw new Error('INVOICE_TAX_ID_REVIEW_REQUIRED');
  }

  const sellerXml = [
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
    <valaszVerzio>2</valaszVerzio>
    <szamlaKulsoAzon>${escapeXml(config.externalId || 'nm-' + session.id)}</szamlaKulsoAzon>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${paidDate}</teljesitesDatum>
    <fizetesiHataridoDatum>${paidDate}</fizetesiHataridoDatum>
    <fizmod>${escapeXml(config.paymentMethod)}</fizmod>
    <penznem>${escapeXml(amounts.currency)}</penznem>
    <szamlaNyelve>${escapeXml(config.invoiceLanguage)}</szamlaNyelve>
    <megjegyzes>${escapeXml(invoiceNote)}</megjegyzes>
    ${amounts.currency !== 'HUF' ? `<arfolyamBank>${escapeXml(config.exchangeRateBank || 'MNB')}</arfolyamBank>` : ''}
    <rendelesSzam>${escapeXml(config.externalId || 'nm-' + session.id)}</rendelesSzam>
    <fizetve>true</fizetve>
    ${config.euVat === true ? '<eusAfa>true</eusAfa>' : ''}
  </fejlec>
  <elado>${sellerXml}</elado>
  <vevo>
    <nev>${escapeXml(billing.name)}</nev>
    <orszag>${escapeXml(billing.country)}</orszag>
    <irsz>${escapeXml(billing.zip)}</irsz>
    <telepules>${escapeXml(billing.city)}</telepules>
    <cim>${escapeXml(fullAddress)}</cim>
    <email>${escapeXml(billing.email)}</email>
    <sendEmail>${config.sendEmail ? "true" : "false"}</sendEmail>
    ${billing.taxId && billing.taxIdType === 'hu_tin' ? `<adoszam>${escapeXml(billing.taxId)}</adoszam>` : ''}
    ${billing.taxId && billing.taxIdType === 'eu_vat' ? `<adoszamEU>${escapeXml(billing.taxId)}</adoszamEU>` : ''}
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
  if (!text) return null;
  const parsed = parseProviderXml(text);
  const root = parsed.xmlszamlavalasz;
  const value = root?.[tagName];
  return typeof value === 'string' ? value.trim() : null;
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
  productComment,
  beforeSubmit = async () => {}
}) {
  if (!config.agentKey) {
    throw new Error("Missing SZAMLAZZHU_AGENT_KEY.");
  }

  const billing = buildBillingInfo({ session, checkoutSession });
  const amounts = buildInvoiceAmounts({ session, checkoutSession, config });

  const xml = buildInvoiceXml({
    session,
    checkoutSession,
    billing,
    amounts,
    config,
    productName,
    productComment
  });
  await beforeSubmit();

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

    if (!response.ok || providerError || readXmlTag(responseText, 'sikeres') === 'false') {
      throw new Error(
        providerError ||
          `Szamlazz.hu invoice request failed with HTTP ${response.status}.`
      );
    }

    const invoiceNumber =
      headers.invoiceNumber ||
      readXmlTag(responseText, "szamlaszam") ||
      readXmlTag(responseText, "szlahu_szamlaszam");
    if (!invoiceNumber || invoiceNumber.length > 100 || /[<>\r\n]/.test(invoiceNumber)) {
      throw new Error('INVOICE_RESPONSE_UNVERIFIED');
    }

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

export async function findSzamlazzHuInvoice({ config, externalId, expectedAmount, expectedCurrency }) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamlaxml xmlns="http://www.szamlazz.hu/xmlszamlaxml">
<szamlaagentkulcs>${escapeXml(config.agentKey)}</szamlaagentkulcs>
<pdf>false</pdf><szamlaKulsoAzon>${escapeXml(externalId)}</szamlaKulsoAzon></xmlszamlaxml>`;
  const form = new FormData();
  form.append('action-szamla_agent_xml', new Blob([xml], { type: 'application/xml' }), 'lookup.xml');
  const response = await fetch(config.endpoint, { method: 'POST', body: form, signal: AbortSignal.timeout(config.timeoutMs || 15000) });
  if (!response.ok) throw new Error('INVOICE_LOOKUP_UNAVAILABLE');
  const parsed = parseProviderXml(await response.text());
  if (parsed.xmlszamlavalasz?.sikeres === 'false' && parsed.xmlszamlavalasz?.hibakod === '7') return null;
  const invoice = parsed.szamla;
  const number = invoice?.alap?.szamlaszam;
  if (!number || String(invoice.alap.devizanem).toUpperCase() !== String(expectedCurrency).toUpperCase() ||
      Math.round(Number(invoice.osszegek?.totalossz?.brutto) * 100) !== expectedAmount ||
      ['true','1'].includes(invoice.alap.teszt)) throw new Error('INVOICE_LOOKUP_UNVERIFIED');
  return { providerInvoiceId: number, invoiceNumber: number, providerResponse: { recovered: true, externalId } };
}
