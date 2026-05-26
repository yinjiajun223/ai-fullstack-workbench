import { calculateCostTool } from "./calculator";
import { generateCampaignBriefTool } from "./campaign";
import type { AiToolDefinition } from "@/server/ai";
import type { ToolExecutionContext, ToolMetadata } from "./types";

export class ToolNotFoundError extends Error {
  readonly code = "TOOL_NOT_FOUND";

  constructor(toolName: string) {
    super(`Tool "${toolName}" was not found.`);
    this.name = "ToolNotFoundError";
  }
}

export class ToolValidationError extends Error {
  readonly code = "TOOL_VALIDATION_ERROR";
  readonly details: unknown;

  constructor(details: unknown) {
    super("Tool input is invalid.");
    this.name = "ToolValidationError";
    this.details = details;
  }
}

const toolInputExamples: Record<string, unknown> = {
  calculate_cost: {
    quantity: 12,
    unitPrice: 39.9,
    discountRate: 0.1,
    taxRate: 0.06,
    currency: "CNY",
  },
  generate_campaign_brief: {
    productName: "AI Poster Studio",
    audience: "small business owners who need fast marketing visuals",
    goal: "increase trial signups",
    channels: ["landing page", "wechat", "email"],
  },
};

const tools = [
  calculateCostTool,
  generateCampaignBriefTool,
] as const;

type RegisteredTool = (typeof tools)[number];

const toolMap = new Map<string, RegisteredTool>(tools.map((tool) => [tool.name, tool]));

export function listTools(): ToolMetadata[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    permissionLevel: tool.permissionLevel,
    requiresConfirmation: tool.requiresConfirmation,
    inputExample: toolInputExamples[tool.name] ?? {},
  }));
}

export function listAiToolDefinitions(): AiToolDefinition[] {
  return [
    {
      type: "function",
      function: {
        name: "calculate_cost",
        description: calculateCostTool.description,
        parameters: {
          type: "object",
          properties: {
            quantity: { type: "number", description: "Item quantity. Must be greater than 0." },
            unitPrice: { type: "number", description: "Unit price. Must be non-negative." },
            discountRate: { type: "number", description: "Discount rate from 0 to 1." },
            taxRate: { type: "number", description: "Tax rate from 0 to 1." },
            currency: { type: "string", description: "Currency code, such as CNY or USD." },
          },
          required: ["quantity", "unitPrice"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_campaign_brief",
        description: generateCampaignBriefTool.description,
        parameters: {
          type: "object",
          properties: {
            productName: { type: "string", description: "Product or service name." },
            audience: { type: "string", description: "Target audience." },
            goal: { type: "string", description: "Campaign goal." },
            channels: {
              type: "array",
              items: { type: "string" },
              description: "Marketing channels to use.",
            },
          },
          required: ["productName", "audience", "goal", "channels"],
          additionalProperties: false,
        },
      },
    },
  ];
}

export function getTool(toolName: string): RegisteredTool {
  const tool = toolMap.get(toolName);

  if (!tool) {
    throw new ToolNotFoundError(toolName);
  }

  return tool;
}

export async function executeTool(input: {
  toolName: string;
  rawInput: unknown;
  context: ToolExecutionContext;
}): Promise<unknown> {
  const tool = getTool(input.toolName);
  const parsedInput = tool.inputSchema.safeParse(input.rawInput);

  if (!parsedInput.success) {
    throw new ToolValidationError(parsedInput.error.flatten());
  }

  const output = await tool.execute(parsedInput.data as never, input.context);

  if (tool.outputSchema) {
    return tool.outputSchema.parse(output);
  }

  return output;
}
