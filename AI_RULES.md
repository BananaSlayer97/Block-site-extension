# Focus Guard Chrome 扩展开发规范

本文档为 Focus Guard Chrome 扩展的开发和修改制定了技术栈和具体指导原则。

## 技术栈概览：

*   **核心语言：** JavaScript (ES6+) 用于所有逻辑和交互功能。
*   **平台：** Google Chrome Extension API 用于浏览器集成和功能实现。
*   **用户界面：** 纯 HTML、CSS 和 JavaScript 构建所有 UI 组件。
*   **样式设计：** 自定义 CSS 文件（如 `options.css`、`popup.css`）和适当的内联样式（如 `blocked.html`）。
*   **图标：** Material Icons，通过 Google Fonts CDN 加载。
*   **数据持久化：** `chrome.storage.local` 存储用户特定数据，如被屏蔽网站列表。
*   **网络请求处理：** `chrome.declarativeNetRequest` API 实现高效的网站屏蔽功能。
*   **无前端框架：** 项目不使用任何前端框架，如 React、Vue 或 Angular。
*   **无构建工具：** 项目采用直接的 Chrome 扩展设置，不使用 Webpack 或 Rollup 等打包工具。

## 库和工具使用规则：

*   **JavaScript：** 始终使用原生 JavaScript。除非用户明确要求并提供合理理由，否则不引入外部 JavaScript 库（如 jQuery、Lodash）或框架（如 React、Vue）。
*   **CSS：** 坚持使用纯 CSS 进行样式设计。维持当前的模块化方法，为不同 UI 部分使用独立的 CSS 文件。
*   **图标：** 对于任何新的图标需求，继续使用 Material Icons。
*   **存储：** 所有持久化数据必须专门通过 `chrome.storage.local` 管理。
*   **浏览器 API：** 仅使用官方 Chrome Extensions API 进行所有浏览器相关交互，包括标签页管理、网络请求和运行时通信。
*   **模块化：** 通过为不同功能或 UI 组件（如 `popup`、`options`、`blocked` 页面）创建独立的 HTML、CSS 和 JavaScript 文件来维护现有结构。
*   **禁用 Shadcn/UI 或 React：** 本项目是纯 JavaScript Chrome 扩展。因此，shadcn/ui 组件和 React 不属于技术栈，不应使用。