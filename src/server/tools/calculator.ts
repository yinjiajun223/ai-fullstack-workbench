import { z } from "zod";
import type { AppTool } from "./types";

const CalculateCostInputSchema = z.object({
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountRate: z.number().min(0).max(1).optional().default(0),
  taxRate: z.number().min(0).max(1).optional().default(0),
  currency: z.string().min(1).max(8).optional().default("CNY"),
});

const CalculateCostOutputSchema = z.object({
  quantity: z.number(),
  unitPrice: z.number(),
  subtotal: z.number(),
  discount: z.number(),
  tax: z.number(),
  total: z.number(),
  currency: z.string(),
});

type CalculateCostInput = z.infer<typeof CalculateCostInputSchema>;
type CalculateCostOutput = z.infer<typeof CalculateCostOutputSchema>;

export const calculateCostTool: AppTool<CalculateCostInput, CalculateCostOutput> = {
  name: "calculate_cost",
  description: "Calculate subtotal, discount, tax, and total for a simple pricing scenario.",
  permissionLevel: "compute",
  requiresConfirmation: false,
  inputSchema: CalculateCostInputSchema,
  outputSchema: CalculateCostOutputSchema,
  async execute(input) {
    const subtotal = roundMoney(input.quantity * input.unitPrice);
    const discount = roundMoney(subtotal * input.discountRate);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = roundMoney(taxableAmount * input.taxRate);
    const total = roundMoney(taxableAmount + tax);

    return {
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      subtotal,
      discount,
      tax,
      total,
      currency: input.currency,
    };
  },
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
