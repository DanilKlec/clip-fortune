import type { ViralityResult, UsageInfo } from "./virality-mock";
import type { AnalysisRecord } from "./analyses.functions";
export type { AnalysisRecord };
import {
  saveAnalysisFn,
  listAnalysesFn,
  getAnalysisByIdFn,
  deleteAnalysisFn,
} from "./analyses.functions";

interface SaveInput {
  fileName: string;
  fileSize: number;
  duration: number;
  platform: string;
  poster: string | null;
  result: ViralityResult;
  usage: UsageInfo | null;
}

export async function saveAnalysis(userId: string, input: SaveInput): Promise<string> {
  const res = await saveAnalysisFn({
    data: {
      userId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      duration: input.duration,
      platform: input.platform,
      poster: input.poster,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result: input.result as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usage: (input.usage ?? null) as any,
    },
  });
  return res.id;
}

export async function listAnalyses(): Promise<AnalysisRecord[]> {
  return await listAnalysesFn();
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  return await getAnalysisByIdFn({ data: { id } });
}

export async function deleteAnalysis(id: string): Promise<void> {
  await deleteAnalysisFn({ data: { id } });
}