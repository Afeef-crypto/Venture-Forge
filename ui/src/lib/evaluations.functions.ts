/**
 * Legacy Lovable AI evaluation path — replaced by client-side FastAPI streaming
 * in `evaluation.$id.tsx`. Kept as a stub so imports do not break during migration.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  id: z.string().uuid(),
});

export const runEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async () => {
    throw new Error(
      "Server-side AI evaluation is disabled. Evaluations run through the FastAPI backend from the live evaluation page.",
    );
  });
