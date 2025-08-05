# AI Rules for Focus Guard Chrome Extension

This document outlines the technical stack and specific guidelines for developing and modifying the Focus Guard Chrome Extension.

## Tech Stack Overview:

*   **Core Language:** JavaScript (ES6+) for all logic and interactivity.
*   **Platform:** Google Chrome Extension API for browser integration and functionalities.
*   **User Interface:** Plain HTML, CSS, and JavaScript for all UI components.
*   **Styling:** Custom CSS files (e.g., `options.css`, `popup.css`) and inline styles where appropriate (e.g., `blocked.html`).
*   **Icons:** Material Icons, loaded via Google Fonts CDN.
*   **Data Persistence:** `chrome.storage.local` for storing user-specific data, such as the list of blocked sites.
*   **Network Request Handling:** `chrome.declarativeNetRequest` API for efficient and performant blocking of websites.
*   **No Frontend Frameworks:** The project does not utilize any frontend frameworks like React, Vue, or Angular.
*   **No Build Tools:** The project is a direct Chrome extension setup and does not use bundlers like Webpack or Rollup.

## Library and Tooling Usage Rules:

*   **JavaScript:** Always use vanilla JavaScript. Do not introduce external JavaScript libraries (e.g., jQuery, Lodash) or frameworks (e.g., React, Vue) unless explicitly requested and justified by the user.
*   **CSS:** Stick to plain CSS for styling. Maintain the current modular approach with separate CSS files for different UI sections.
*   **Icons:** Continue to use Material Icons for any new icon requirements.
*   **Storage:** All persistent data must be managed exclusively through `chrome.storage.local`.
*   **Browser APIs:** Only use the official Chrome Extensions API for all browser-related interactions, including tab management, network requests, and runtime communication.
*   **Modularity:** Maintain the existing structure by creating separate HTML, CSS, and JavaScript files for distinct features or UI components (e.g., `popup`, `options`, `blocked` page).
*   **No Shadcn/UI or React:** This project is a plain JavaScript Chrome extension. Therefore, shadcn/ui components and React are not part of the tech stack and should not be used.