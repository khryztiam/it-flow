-- Asegura que la tabla alertas_usuario emita eventos Realtime
-- para postgres_changes en Supabase.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alertas_usuario'
  ) then
    alter publication supabase_realtime add table public.alertas_usuario;
  end if;
end
$$;
