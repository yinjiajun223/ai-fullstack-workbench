import { z } from "zod";
import type { AppTool } from "./types";

const GenerateCampaignBriefInputSchema = z.object({
  productName: z.string().min(1).max(80),
  audience: z.string().min(1).max(160),
  goal: z.string().min(1).max(160),
  channels: z.array(z.string().min(1).max(40)).min(1).max(6),
});

const GenerateCampaignBriefOutputSchema = z.object({
  title: z.string(),
  audience: z.string(),
  goal: z.string(),
  keyMessages: z.array(z.string()),
  channels: z.array(z.string()),
  callToAction: z.string(),
});

type GenerateCampaignBriefInput = z.infer<typeof GenerateCampaignBriefInputSchema>;
type GenerateCampaignBriefOutput = z.infer<typeof GenerateCampaignBriefOutputSchema>;

export const generateCampaignBriefTool: AppTool<GenerateCampaignBriefInput, GenerateCampaignBriefOutput> = {
  name: "generate_campaign_brief",
  description: "Create a deterministic campaign brief from product, audience, goal, and channels.",
  permissionLevel: "compute",
  requiresConfirmation: false,
  inputSchema: GenerateCampaignBriefInputSchema,
  outputSchema: GenerateCampaignBriefOutputSchema,
  async execute(input) {
    return {
      title: `${input.productName} campaign brief`,
      audience: input.audience,
      goal: input.goal,
      keyMessages: [
        `Position ${input.productName} around the audience's highest-value need.`,
        `Make the campaign goal explicit: ${input.goal}.`,
        "Use measurable conversion signals for each selected channel.",
      ],
      channels: input.channels,
      callToAction: `Invite the audience to try ${input.productName} with a low-friction next step.`,
    };
  },
};
