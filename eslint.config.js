import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      ".agents",
      ".codex",
      ".impeccable",
      "node_modules",
      "src/routeTree.gen.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Guardián del sistema de diseño (ver DESIGN.md): usa tokens y componentes de src/components/ui.
      "no-restricted-syntax": [
        "warn",
        ...[
          [
            /#[0-9a-fA-F]{3,8}\b/,
            "Color hex en className: usa tokens (bg-cta, text-info, border-border…).",
          ],
          [/\bbg-white\b/, "bg-white no sirve para modo oscuro: usa bg-surface."],
          [
            /\brounded-(?:xl|2xl|3xl)\b/,
            "Radios del sistema: rounded-sm (4), rounded-md (6), rounded-lg (8).",
          ],
        ].flatMap(([pattern, message]) => [
          {
            selector: `JSXAttribute[name.name='className'] Literal[value=${pattern}]`,
            message,
          },
          {
            selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${pattern}]`,
            message,
          },
        ]),
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
