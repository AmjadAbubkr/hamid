# RTL Convention: Tailwind Logical Properties Only

The Profile site is bilingual with one RTL Locale (Arabic) and one LTR Locale (French). All layout utility classes in the codebase MUST use Tailwind's logical-property utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `text-end`, `rounded-s-`, `rounded-e-`, etc.) and MUST NOT use the physical-direction equivalents (`pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`).

The Arabic binary direction switch is handled by `<html dir="auto">` (set per-Locale at the document root), under which Tailwind's logical-property utilities automatically flow opposite without needing conditional class names.

## Why

Physical properties silently break Arabic layout — text indents align to the wrong side, icons sit on the wrong side of buttons, list bullet markers overlap text. Tailwind's logical-property utilities know about `dir` and flip automatically; physical utilities don't. Without a strict convention, a future contributor will instinctively reach for `ml-4` and the next Arabic-mode visitor will see a layout bug.

## Enforcement

Lint via a custom ESLint rule or a `stylelint` plugin: ban physical-property utilities on `className` string tokens. The reject-list includes the names enumerated above. Also `text-right` and `text-left` are rejected; use `text-start` / `text-end`.
