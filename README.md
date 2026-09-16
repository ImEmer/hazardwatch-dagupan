# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Critical UI Rules - Do Not Revert

### Hazard Type Dropdown (Submit Report)

- Must remain a flat list of `<option>` elements.
- Never wrap options in `<optgroup>`.
- Never add bold group headers such as "Road and Traffic" or "Water and Drainage".
- Add new categories to `HAZARD_CATEGORY_GROUPS` in `frontend/src/services/reportOptions.js`; the dropdown flattens them automatically.
- If any developer or AI agent tries to reintroduce `<optgroup>`, reject the change.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

Privileged dashboard sessions (`admin`, `superadmin`, and `barangay`) use browser `sessionStorage` so closing their tab clears access. Regular citizen sessions use `localStorage` for a persistent sign-in experience.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
