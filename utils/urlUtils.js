// utils/urlUtils.js

/**
 * Cleans and formats a given URL string to a consistent domain format.
 * Removes protocol (http/https), path, and 'www.' subdomain.
 * @param {string} urlString The URL string to clean.
 * @returns {string} The cleaned domain string (e.g., 'example.com').
 */
function cleanSiteUrl(urlString) {
  let site = urlString.replace(/^https?:\/\//, ''); // Remove http/https
  site = site.split('/')[0]; // Get only the domain part
  site = site.replace(/^www\./, ''); // Remove www.
  return site;
}

// Export the function for use in other scripts
// Note: Chrome extensions content scripts and popup/options scripts
// run in isolated worlds, so direct export/import might not work
// as in standard web pages. We'll attach it to the global scope
// or ensure it's included in the same context.
// For simplicity in this plain JS extension, we'll make it globally available
// if included via a script tag, or ensure it's loaded before other scripts.
// For modules, we'd use `export { cleanSiteUrl };` and `import { cleanSiteUrl } from './urlUtils.js';`
// but given the current project structure, a global function or direct inclusion is more fitting.
// For now, I'll assume it's loaded in a way that makes it accessible,
// or I'll adjust the import/export if the manifest allows 'module' type scripts.
// Given the current manifest, direct script inclusion is the way.
// So, I'll just define it as a global function.