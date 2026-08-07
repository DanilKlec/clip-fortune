import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ViralityResult, UsageInfo } from "./virality-mock";

export interface AnalysisRecord {
  id: string;
  created_at: string;
  file_name: string;
  file_size: number | null;
  duration: number | null;
  platform: string | null;
  poster: string | null;
  overall_score: number | null;
  result: ViralityResult;
  usage: UsageInfo | null;
}

async function getSessionEmail(): Promise<string> {
  const { readAuthSession } = await import("./auth-session.server");
  const session = await readAuthSession();
  const email = session.data.email;
  if (!email || !session.data.unlockedAt) throw new Error("Unauthorized");
  return email;
}

const SELECT_COLS =
  "id, created_at, file_name, file_size, duration, platform, poster, overall_score, result, usage";

export const saveAnalysisFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      fileName: string;
      fileSize: number;
      duration: number;
      platform: string;
      poster: string | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usage: any;
      userId: string;
    }) =>
      z
        .object({
          fileName: z.string(),
          fileSize: z.number(),
          duration: z.number(),
          platform: z.string(),
          poster: z.string().nullable(),
          result: z.any(),
          usage: z.any().nullable(),
          userId: z.string().uuid(),
        })
        .parse(input),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const email = await getSessionEmail();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: data.userId,
        email,
        file_name: data.fileName,
        file_size: data.fileSize,
        duration: data.duration,
        platform: data.platform,
        poster: data.poster,
        overall_score: data.result?.overall_score ?? null,
        result: data.result,
        usage: data.usage ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id as string };
  });

export const listAnalysesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AnalysisRecord[]> => {
    const email = await getSessionEmail();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("analyses")
      .select(SELECT_COLS)
      .eq("email", email)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AnalysisRecord[];
  },
);

export const getAnalysisByIdFn = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<AnalysisRecord | null> => {
    const email = await getSessionEmail();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select(SELECT_COLS)
      .eq("id", data.id)
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return (row ?? null) as unknown as AnalysisRecord | null;
  });

export const deleteAnalysisFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = await getSessionEmail();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("analyses")
      .delete()
      .eq("id", data.id)
      .eq("email", email);
    if (error) throw error;
    return { ok: true };
  });

// Best-effort: attach current session email to any rows previously created
// under the given anon user_id (which had no email). Called once after login.
export const attachEmailToOwnedAnalysesFn = createServerFn({ method: "POST" })
  .inputValidator((input: { anonUserId: string }) =>
    z.object({ anonUserId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ updated: number }> => {
    const email = await getSessionEmail();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("analyses")
      .update({ email })
      .eq("user_id", data.anonUserId)
      .is("email", null)
      .select("id");
    if (error) throw error;
    return { updated: rows?.length ?? 0 };
  });