import type { Rule } from "eslint";

type RejectEntry = { prefix: string; suggestion: string };

type EsNode = {
  type: string;
  value?: unknown;
  name?: unknown;
  expression?: EsNode;
  quasis?: Array<{ value: { raw: string } }>;
};

type JSXAttrNode = EsNode & {
  name: { type: string; name: string } | EsNode;
  value: EsNode | null;
};

const REJECT_LIST: RejectEntry[] = [
  { prefix: "pl-", suggestion: "ps-" },
  { prefix: "pr-", suggestion: "pe-" },
  { prefix: "ml-", suggestion: "ms-" },
  { prefix: "mr-", suggestion: "me-" },
  { prefix: "left-", suggestion: "start-" },
  { prefix: "right-", suggestion: "end-" },
  { prefix: "inset-left-", suggestion: "inset-start-" },
  { prefix: "inset-right-", suggestion: "inset-end-" },
  { prefix: "text-left", suggestion: "text-start" },
  { prefix: "text-right", suggestion: "text-end" },
  { prefix: "float-left", suggestion: "float-start" },
  { prefix: "float-right", suggestion: "float-end" },
  { prefix: "rounded-l-", suggestion: "rounded-s-" },
  { prefix: "rounded-r-", suggestion: "rounded-e-" },
  { prefix: "rounded-tl-", suggestion: "rounded-ts-" },
  { prefix: "rounded-tr-", suggestion: "rounded-te-" },
  { prefix: "rounded-bl-", suggestion: "rounded-bs-" },
  { prefix: "rounded-br-", suggestion: "rounded-be-" },
  { prefix: "bg-left-", suggestion: "bg-start-" },
  { prefix: "bg-right-", suggestion: "bg-end-" },
];

const ATTR_NAME_RE = /^(.*?)([Cc]lass)$|^(class|className)$/;

function isClassLikeAttr(name: EsNode): boolean {
  if (!name || typeof name !== "object") return false;
  if (name.type !== "JSXIdentifier") return false;
  return ATTR_NAME_RE.test((name as { name: string }).name);
}

function* tokensFromLiteral(value: unknown): Generator<string> {
  if (typeof value !== "string") return;
  for (const tok of value.trim().split(/\s+/)) {
    if (tok) yield tok;
  }
}

function* tokensFromTemplate(tpl: EsNode): Generator<string> {
  for (const quasi of tpl.quasis ?? []) {
    for (const tok of quasi.value.raw.trim().split(/\s+/)) {
      if (tok) yield tok;
    }
  }
}

const noPhysicalTailwind: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban physical-direction Tailwind utilities in className; require logical-property utilities per ADR-0008.",
    },
    schema: [],
    messages: {
      physical:
        'Do not use physical-direction Tailwind utility "{{token}}". Use "{{suggested}}" instead. (ADR-0008)',
    },
  },
  create(context) {
    return {
      JSXAttribute(node: JSXAttrNode) {
        if (!isClassLikeAttr(node.name as EsNode)) return;
        const value = node.value;
        if (!value) return;

        let tokens: string[] = [];
        if (value.type === "Literal") {
          tokens = Array.from(tokensFromLiteral((value as { value: unknown }).value));
        } else if (value.type === "JSXExpressionContainer") {
          const expr = value.expression;
          if (!expr) return;
          if (expr.type === "Literal") {
            tokens = Array.from(tokensFromLiteral((expr as { value: unknown }).value));
          } else if (expr.type === "TemplateLiteral") {
            tokens = Array.from(tokensFromTemplate(expr));
          }
        } else if (value.type === "JSXEmptyExpression") {
          return;
        }

        for (const tok of tokens) {
          const utilityPart = tok.split(":").pop() ?? tok;
          const hit = REJECT_LIST.find(
            (e) =>
              utilityPart === e.prefix || utilityPart.startsWith(e.prefix),
          );
          if (hit) {
            context.report({
              node: node as never,
              messageId: "physical",
              data: {
                token: hit.prefix,
                suggested: hit.suggestion,
              },
            });
          }
        }
      },
    };
  },
};

export default noPhysicalTailwind;
