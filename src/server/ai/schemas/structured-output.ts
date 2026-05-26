import { z } from "zod";

export const StructuredOutputUseCaseSchema = z.enum([
  "marketing",
  "entities",
  "intent",
  "task-plan",
  "ui-schema",
]);

export type StructuredOutputUseCase = z.infer<typeof StructuredOutputUseCaseSchema>;

export const StructuredOutputRequestSchema = z.object({
  useCase: StructuredOutputUseCaseSchema,
  input: z.string().min(1),
  model: z.string().min(1).optional(),
});

export type StructuredOutputRequest = z.infer<typeof StructuredOutputRequestSchema>;

export const MarketingOutputSchema = z.object({
  title: z.string(),
  audience: z.string(),
  keyMessages: z.array(z.string()),
  channels: z.array(z.string()),
  callToAction: z.string(),
});

export const EntitiesOutputSchema = z.object({
  people: z.array(z.string()),
  organizations: z.array(z.string()),
  locations: z.array(z.string()),
  dates: z.array(z.string()),
  keywords: z.array(z.string()),
});

export const IntentOutputSchema = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string(),
  nextAction: z.string(),
});

export const TaskPlanOutputSchema = z.object({
  goal: z.string(),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })),
  risks: z.array(z.string()),
});

export const UiSchemaOutputSchema = z.object({
  pageTitle: z.string(),
  sections: z.array(z.object({
    name: z.string(),
    component: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      label: z.string(),
      required: z.boolean(),
    })),
  })),
});

export function getStructuredOutputSchema(useCase: StructuredOutputUseCase) {
  if (useCase === "marketing") {
    return MarketingOutputSchema;
  }

  if (useCase === "entities") {
    return EntitiesOutputSchema;
  }

  if (useCase === "intent") {
    return IntentOutputSchema;
  }

  if (useCase === "task-plan") {
    return TaskPlanOutputSchema;
  }

  return UiSchemaOutputSchema;
}

export function getStructuredOutputSchemaDescription(useCase: StructuredOutputUseCase): string {
  if (useCase === "marketing") {
    return JSON.stringify({
      title: "string",
      audience: "string",
      keyMessages: ["string"],
      channels: ["string"],
      callToAction: "string",
    });
  }

  if (useCase === "entities") {
    return JSON.stringify({
      people: ["string"],
      organizations: ["string"],
      locations: ["string"],
      dates: ["string"],
      keywords: ["string"],
    });
  }

  if (useCase === "intent") {
    return JSON.stringify({
      intent: "string",
      confidence: 0.8,
      reasoningSummary: "string",
      nextAction: "string",
    });
  }

  if (useCase === "task-plan") {
    return JSON.stringify({
      goal: "string",
      steps: [
        {
          title: "string",
          description: "string",
          priority: "low | medium | high",
        },
      ],
      risks: ["string"],
    });
  }

  return JSON.stringify({
    pageTitle: "string",
    sections: [
      {
        name: "string",
        component: "string",
        fields: [
          {
            name: "string",
            type: "string",
            label: "string",
            required: true,
          },
        ],
      },
    ],
  });
}
