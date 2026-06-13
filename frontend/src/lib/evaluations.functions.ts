import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(120),
  idea: z.string().min(10).max(8000),
  industry: z.string(), stage: z.string(), depth: z.string(), research: z.boolean(),
});

const reportSchema = z.object({
  overallScore: z.number().min(0).max(100), verdict: z.string(), executiveSummary: z.string(),
  investorHook: z.string(), biggestStrength: z.string(), biggestRisk: z.string(), marketOpportunity: z.string(),
  agents: z.array(z.object({ name: z.string(), score: z.number(), analysis: z.string(), recommendations: z.array(z.string()), risks: z.array(z.string()) })).length(6),
  roadmap: z.array(z.object({ period: z.string(), milestone: z.string(), deliverables: z.array(z.string()), effort: z.string() })).length(4),
  tasks: z.array(z.object({ domain: z.enum(["Frontend","Backend","Database","Design"]), title: z.string(), description: z.string(), priority: z.enum(["High","Medium","Low"]) })),
});

export const runEvaluation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => inputSchema.parse(d)).handler(async ({ data, context }) => {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI service is not configured");
  const gateway = createOpenAICompatible({ name: "lovable", baseURL: "https://ai.gateway.lovable.dev/v1", headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
  const { object } = await generateObject({
    model: gateway("google/gemini-3-flash-preview"), schema: reportSchema,
    prompt: `Act as a six-person venture analysis firm. Evaluate this startup rigorously. The six agents must be named YC Partner, Tech Auditor, Business CFO, Marketing Expert, Demand Intel, and Synthesis Agent. Industry: ${data.industry}. Stage: ${data.stage}. Depth: ${data.depth}. Idea: ${data.idea}`,
  });
  const { error } = await context.supabase.from("evaluations").update({ status: "completed", progress: 100, overall_score: object.overallScore, verdict: object.verdict, agent_results: object.agents, report: object }).eq("id", data.id).eq("user_id", context.userId);
  if (error) throw error;
  return object;
});