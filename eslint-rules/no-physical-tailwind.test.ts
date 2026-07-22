import { RuleTester } from "eslint";
import noPhysicalTailwind from "./no-physical-tailwind.js";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-physical-tailwind", noPhysicalTailwind, {
  valid: [
    {
      code: '<div className="ps-4 pe-4 text-start ms-auto rounded-s-2" />',
    },
    { code: '<div className="mt-4 mb-4 top-2 bottom-2" />' },
    { code: '<div className="translate-x-4" />' },
  ],
  invalid: [
    {
      code: '<div className="pl-4 pr-4 text-left ml-auto rounded-l-2" />',
      errors: [
        {
          messageId: "physical",
          data: {
            token: "pl-",
            suggested: "ps-",
          },
        },
        {
          messageId: "physical",
          data: {
            token: "pr-",
            suggested: "pe-",
          },
        },
        {
          messageId: "physical",
          data: {
            token: "text-left",
            suggested: "text-start",
          },
        },
        {
          messageId: "physical",
          data: {
            token: "ml-",
            suggested: "ms-",
          },
        },
        {
          messageId: "physical",
          data: {
            token: "rounded-l-",
            suggested: "rounded-s-",
          },
        },
      ],
    },
    {
      code: '<span className="text-right" />',
      errors: [
        {
          messageId: "physical",
          data: {
            token: "text-right",
            suggested: "text-end",
          },
        },
      ],
    },
    {
      code: '<button class="float-left" />',
      errors: [
        {
          messageId: "physical",
          data: {
            token: "float-left",
            suggested: "float-start",
          },
        },
      ],
    },
  ],
});
