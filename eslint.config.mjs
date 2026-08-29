import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  /**
   * Module K / AD-8: tokens are the only source of visual values.
   *
   * Without this the rule is a convention, and conventions lose to deadlines —
   * someone drops a `#fff` into a component and the design system quietly stops
   * being the source of truth. Making it a build failure is the whole point.
   *
   * Scoped to components and app routes. `globals.css` is where colours are
   * *defined*, and `lib/design/tokens.ts` parses them, so neither is covered.
   */
  {
    files: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Hardcoded colour in className. Use a design token (see src/app/globals.css).",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] > JSXExpressionContainer TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Hardcoded colour in className. Use a design token (see src/app/globals.css).",
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "Inline style bypasses the token layer. Use a token-backed utility class instead.",
        },
        {
          // Tailwind arbitrary values like bg-[#fff] or text-[14px] reintroduce
          // raw values through the back door.
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\[(#[0-9a-fA-F]{3,8}|\\d+px)\\]/]",
          message:
            "Arbitrary Tailwind value re-introduces a raw colour or size. Add a token instead.",
        },
      ],
    },
  },

  /**
   * The gallery exists to render the tokens themselves, and the runtime spike is
   * throwaway prototype UI that predates the design system.
   */
  {
    files: ["src/app/(dev)/**/*.tsx", "src/app/(spike)/**/*.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
]);

export default eslintConfig;
