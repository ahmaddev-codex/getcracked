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
        /**
         * Tailwind arbitrary values like bg-[#fff] or text-[14px] reintroduce
         * raw values through the back door.
         *
         * Matched on *any* string in these directories, not only on a
         * `className` attribute. Two real leaks came from the narrower rule: a
         * `.ts` module exporting class strings never has a JSX attribute at
         * all, and a class assembled in a template literal is a
         * `TemplateElement` rather than a `Literal`. Both passed a lint whose
         * whole job is stopping exactly that.
         *
         * The unit list covers decimals too — `w-[3.5px]` slipped past a `\d+px`
         * pattern, which is the kind of gap a regex acquires quietly.
         */
        {
          selector:
            "Literal[value=/\\[(#[0-9a-fA-F]{3,8}|[\\d.]+(px|rem|em|vh|vw|%))\\]/]",
          message:
            "Arbitrary Tailwind value re-introduces a raw colour or size. Add a token instead.",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\[(#[0-9a-fA-F]{3,8}|[\\d.]+(px|rem|em|vh|vw|%))\\]/]",
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
