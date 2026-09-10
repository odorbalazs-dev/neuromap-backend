import { legalContent as content } from "./legal-document.service.js";
import { getPublicLegalConfiguration } from "./consent.service.js";
import { SUPPORT_COPY } from "../config/support.js";

const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function renderLegalPage(kind, requestedLang) {
  const lang = Object.hasOwn(content, requestedLang) ? requestedLang : "hu";
  const copy = content[lang];
  const config = getPublicLegalConfiguration();
  const support = SUPPORT_COPY[lang];
  const title = kind === "support" ? support[0] : copy.ui[`${kind}Title`];
  const sections = kind === "support" ? support.slice(1).map(text => ["", text]) : copy[kind];
  const controller = config.controller;
  const authority = config.supervisoryAuthority;
  const navigation = Object.keys(content).map(code => `<a lang="${code}" href="?lang=${code}" ${code === lang ? 'aria-current="page"' : ""}>${code.toUpperCase()}</a>`).join(" ");
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | NeuroMap Kids</title><link rel="stylesheet" href="/public/legal-pages.css"></head><body><header><a href="https://www.neuromapkids.com/">NeuroMap Kids</a><nav aria-label="Language">${navigation}</nav></header><main><h1>${escape(title)}</h1><address>${escape(controller.name)}<br>${escape(controller.address)} (${escape(controller.country)})<br><a href="mailto:${escape(controller.privacyEmail)}">${escape(controller.privacyEmail)}</a></address><p>${escape(config.policyEffectiveDate)} | ${escape(config.privacyPolicyVersion)}</p>${sections.map(([heading, text]) => `<section>${heading ? `<h2>${escape(heading)}</h2>` : ""}<p>${escape(text)}</p></section>`).join("")}<section><h2>${escape(authority.name)}</h2><address>${escape(authority.address)}<br>${escape(authority.postalAddress)}<br><a href="mailto:${escape(authority.email)}">${escape(authority.email)}</a><br>${escape(authority.phone)}</address><p><a href="${escape(authority.url)}">NAIH</a> | <a href="${escape(config.europeanAuthorities.directoryUrl)}">EU / EEA</a></p></section><section><h2>${escape(support[0])}</h2><p><a href="mailto:${escape(config.support.email)}">${escape(config.support.email)}</a></p><a href="/legal/support?lang=${lang}">${escape(support[0])}</a></section></main><footer><a href="/legal/privacy?lang=${lang}">${escape(copy.ui.privacyLink)}</a> | <a href="/legal/terms?lang=${lang}">${escape(copy.ui.termsLink)}</a></footer></body></html>`;
}
