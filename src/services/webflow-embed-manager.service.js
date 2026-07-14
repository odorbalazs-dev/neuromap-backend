import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const WEBFLOW_EMBED_CHARACTER_LIMIT = 50000;

const EMBEDS = [
  {
    key: "engineLoader",
    label: "Engine loader",
    type: "loader",
    placement: "Home page / Engine embed",
    sourcePath: "public/webflow/engine.js",
    snippetPath: "web/engine-embed.full.html",
    publicPath: "/public/webflow/engine.js",
    version: "20260714-landing-minimal-v2",
    note: "External script loader. This avoids the Webflow 50k code embed limit."
  },
  {
    key: "checkoutPagesLoader",
    label: "Checkout success/cancel loader",
    type: "loader",
    placement: "Every checkout success and checkout cancel page",
    sourcePath: "public/webflow/checkout-pages.js",
    snippetPath: "web/checkout-pages-embed.html",
    publicPath: "/public/webflow/checkout-pages.js",
    version: "20260713-two-tier-offer-v1",
    note: "Use the same loader on every language-specific success and cancel page."
  },
  {
    key: "allBanksBundle",
    label: "All banks bundle",
    type: "bank-bundle",
    placement: "Home page / all.banks embed before webflow bridge and engine",
    sourcePath: "public/banks/all-banks.bundle.js",
    publicPath: "/public/banks/all-banks.bundle.js",
    version: "20260602-bank-quality-v3",
    note: "Publishes the 250-item specific banks as browser globals."
  },
  {
    key: "successMarkup",
    label: "Success page fallback markup",
    type: "markup",
    placement: "Success page only, if the loader is not used",
    snippetPath: "web/checkout-success-embed.html",
    note: "Fallback full markup. Prefer checkoutPagesLoader for stable maintenance."
  },
  {
    key: "cancelMarkup",
    label: "Cancel page fallback markup",
    type: "markup",
    placement: "Cancel page only, if the loader is not used",
    snippetPath: "web/checkout-cancel-embed.html",
    note: "Fallback full markup. Prefer checkoutPagesLoader for stable maintenance."
  }
];

function rootPath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function readTextFile(relativePath) {
  if (!relativePath) return null;

  const absolutePath = rootPath(relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function publicUrl(publicPath, version) {
  if (!publicPath) return null;

  const base = String(
    process.env.BACKEND_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : env.APP_BASE_URL) ||
      ""
  ).replace(/\/+$/, "");

  const suffix = version
    ? `${publicPath}?v=${encodeURIComponent(version)}`
    : publicPath;

  return `${base}${suffix}`;
}

function fileStats(relativePath) {
  if (!relativePath) {
    return {
      exists: false,
      bytes: 0,
      characters: 0
    };
  }

  const absolutePath = rootPath(relativePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      exists: false,
      bytes: 0,
      characters: 0
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const stat = fs.statSync(absolutePath);

  return {
    exists: true,
    bytes: stat.size,
    characters: content.length
  };
}

function buildEmbed(definition) {
  const source = fileStats(definition.sourcePath);
  const snippetContent = readTextFile(definition.snippetPath);
  const versionedPublicUrl = publicUrl(definition.publicPath, definition.version);
  const loaderCode =
    definition.publicPath
      ? `<script src="${versionedPublicUrl}"></script>`
      : null;

  const copyCode = loaderCode || snippetContent || "";
  const snippet = snippetContent
    ? {
        exists: true,
        path: definition.snippetPath,
        characters: snippetContent.length,
        withinWebflowLimit: snippetContent.length < WEBFLOW_EMBED_CHARACTER_LIMIT
      }
    : {
        exists: false,
        path: definition.snippetPath || null,
        characters: 0,
        withinWebflowLimit: true
      };

  return {
    key: definition.key,
    label: definition.label,
    type: definition.type,
    placement: definition.placement,
    note: definition.note,
    version: definition.version || null,
    publicUrl: versionedPublicUrl,
    cacheBust: definition.publicPath
      ? {
          parameter: "v",
          version: definition.version || null,
          url: versionedPublicUrl,
          instruction: "When this version changes, replace only the v= value in Webflow and publish."
        }
      : null,
    copyCode,
    copyCodeCharacters: copyCode.length,
    source: {
      path: definition.sourcePath || null,
      ...source,
      withinWebflowLimit: source.characters < WEBFLOW_EMBED_CHARACTER_LIMIT
    },
    snippet,
    ready: Boolean(copyCode) && (
      definition.type === "markup"
        ? snippet.exists
        : source.exists
    )
  };
}

export async function buildWebflowEmbedManager() {
  const embeds = EMBEDS.map(buildEmbed);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    webflowEmbedCharacterLimit: WEBFLOW_EMBED_CHARACTER_LIMIT,
    summary: {
      total: embeds.length,
      ready: embeds.filter((item) => item.ready).length,
      loaders: embeds.filter((item) => item.type === "loader").length,
      overLimitSourceFiles: embeds.filter((item) => !item.source.withinWebflowLimit).length,
      overLimitSnippets: embeds.filter((item) => !item.snippet.withinWebflowLimit).length
    },
    embeds
  };
}

