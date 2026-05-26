import type { z } from "zod";

export type ToolPermissionLevel = "read" | "compute" | "write";

export type ToolExecutionContext = {
  requestId: string;
  userId?: string;
};

export type AppTool<TInput = unknown, TOutput = unknown> = {
  name: string;
  description: string;
  permissionLevel: ToolPermissionLevel;
  requiresConfirmation: boolean;
  inputSchema: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
};

export type ToolMetadata = {
  name: string;
  description: string;
  permissionLevel: ToolPermissionLevel;
  requiresConfirmation: boolean;
  inputExample: unknown;
};
