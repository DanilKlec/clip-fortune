REVOKE ALL ON public.analyses FROM anon, authenticated;
REVOKE ALL ON public.analysis_metrics FROM anon, authenticated;
REVOKE ALL ON public.app_error_log FROM anon, authenticated;
REVOKE ALL ON public.otp_codes FROM anon, authenticated;
REVOKE ALL ON public.usage_counters FROM anon, authenticated;

GRANT ALL ON public.analyses TO service_role;
GRANT ALL ON public.analysis_metrics TO service_role;
GRANT ALL ON public.app_error_log TO service_role;
GRANT ALL ON public.otp_codes TO service_role;
GRANT ALL ON public.usage_counters TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.analyses;
CREATE POLICY "Service role only" ON public.analyses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only" ON public.analysis_metrics;
CREATE POLICY "Service role only" ON public.analysis_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only" ON public.app_error_log;
CREATE POLICY "Service role only" ON public.app_error_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only" ON public.otp_codes;
CREATE POLICY "Service role only" ON public.otp_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only" ON public.usage_counters;
CREATE POLICY "Service role only" ON public.usage_counters
  FOR ALL TO service_role USING (true) WITH CHECK (true);