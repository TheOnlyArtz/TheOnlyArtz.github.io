revoke all on function public.record_analysis(text, integer) from public, anon, authenticated;
revoke all on function public.get_public_stats() from public, anon, authenticated;
grant execute on function public.record_analysis(text, integer) to service_role;
grant execute on function public.get_public_stats() to service_role;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
