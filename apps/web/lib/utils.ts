import { createCn } from "cn/config";

// Teach the class merger about Coreta's custom @theme tokens (globals.css) so that,
// e.g., cn("size-8", "size-touch") resolves to "size-touch" instead of keeping both.
export const cn = createCn({
  extend: {
    theme: {
      spacing: ["touch"],
    },
  },
});
