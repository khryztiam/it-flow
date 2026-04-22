-- ITFlow
-- Flujo de alertas admin -> user con confirmacion de lectura
-- Fecha: 2026-04-21
--
-- Objetivo:
-- 1. Permitir que un admin envie una alerta individual a un usuario final.
-- 2. Mostrar la alerta como activa para el user hasta que confirme "Enterado".
-- 3. Mantener un estado visual temporal en admin por 12 horas tras la confirmacion.
-- 4. Permitir una sola alerta activa por usuario para simplificar la UX inicial.

begin;

create extension if not exists pgcrypto;

create table if not exists public.alertas_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_por uuid not null references public.usuarios(id) on delete restrict,
  mensaje text not null,
  activa boolean not null default true,
  enviada_at timestamptz not null default timezone('utc', now()),
  confirmada_at timestamptz null,
  confirmada_por uuid null references public.usuarios(id) on delete set null,
  admin_resuelta_visible_hasta timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint alertas_usuario_mensaje_no_vacio
    check (length(btrim(mensaje)) between 1 and 500),
  constraint alertas_usuario_confirmacion_consistente
    check (
      (activa = true and confirmada_at is null and confirmada_por is null)
      or
      (activa = false and confirmada_at is not null and confirmada_por is not null)
    )
);

comment on table public.alertas_usuario is
  'Alertas puntuales enviadas por administracion a un usuario especifico.';
comment on column public.alertas_usuario.activa is
  'true = el user aun no confirma; false = el user ya confirmo.';
comment on column public.alertas_usuario.admin_resuelta_visible_hasta is
  'Mantiene visible un check temporal del lado admin despues de confirmada.';

create unique index if not exists ux_alertas_usuario_una_activa_por_usuario
  on public.alertas_usuario(usuario_id)
  where activa = true;

create index if not exists ix_alertas_usuario_usuario_activa
  on public.alertas_usuario(usuario_id, activa, enviada_at desc);

create index if not exists ix_alertas_usuario_creado_por
  on public.alertas_usuario(creado_por, enviada_at desc);

create index if not exists ix_alertas_usuario_admin_visible
  on public.alertas_usuario(admin_resuelta_visible_hasta desc)
  where admin_resuelta_visible_hasta is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.es_admin_itflow(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.roles r on r.id = u.rol_id
    where u.id = p_user_id
      and r.nombre = 'admin'
  );
$$;

create or replace function public.es_user_itflow(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.roles r on r.id = u.rol_id
    where u.id = p_user_id
      and r.nombre = 'user'
  );
$$;

create or replace function public.tg_alertas_usuario_validar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.mensaje := btrim(new.mensaje);

  if not public.es_admin_itflow(new.creado_por) then
    raise exception 'Solo un admin puede crear o gestionar alertas.';
  end if;

  if not public.es_user_itflow(new.usuario_id) then
    raise exception 'La alerta debe enviarse a un usuario con rol user.';
  end if;

  if tg_op = 'INSERT' then
    new.activa := true;
    new.enviada_at := coalesce(new.enviada_at, timezone('utc', now()));
    new.confirmada_at := null;
    new.confirmada_por := null;
    new.admin_resuelta_visible_hasta := null;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.usuario_id <> new.usuario_id then
      raise exception 'No se puede cambiar el usuario destino de una alerta.';
    end if;

    if old.creado_por <> new.creado_por then
      raise exception 'No se puede cambiar el creador de una alerta.';
    end if;

    if new.activa = true then
      new.confirmada_at := null;
      new.confirmada_por := null;
      new.admin_resuelta_visible_hasta := null;
      return new;
    end if;

    if new.confirmada_por is null then
      raise exception 'La alerta confirmada debe registrar quien la confirmo.';
    end if;

    if new.confirmada_por <> new.usuario_id then
      raise exception 'Solo el usuario destinatario puede confirmar la alerta.';
    end if;

    new.confirmada_at := coalesce(new.confirmada_at, timezone('utc', now()));
    new.admin_resuelta_visible_hasta := coalesce(
      new.admin_resuelta_visible_hasta,
      new.confirmada_at + interval '12 hours'
    );

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_alertas_usuario_updated_at on public.alertas_usuario;
create trigger trg_alertas_usuario_updated_at
before update on public.alertas_usuario
for each row
execute function public.set_updated_at();

drop trigger if exists trg_alertas_usuario_validar on public.alertas_usuario;
create trigger trg_alertas_usuario_validar
before insert or update on public.alertas_usuario
for each row
execute function public.tg_alertas_usuario_validar();

create or replace function public.crear_alerta_usuario(
  p_usuario_id uuid,
  p_creado_por uuid,
  p_mensaje text
)
returns public.alertas_usuario
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alerta public.alertas_usuario;
begin
  insert into public.alertas_usuario (
    usuario_id,
    creado_por,
    mensaje
  )
  values (
    p_usuario_id,
    p_creado_por,
    p_mensaje
  )
  on conflict (usuario_id)
  where (activa = true)
  do update
    set mensaje = excluded.mensaje,
        creado_por = excluded.creado_por,
        activa = true,
        enviada_at = timezone('utc', now()),
        confirmada_at = null,
        confirmada_por = null,
        admin_resuelta_visible_hasta = null,
        updated_at = timezone('utc', now())
  returning * into v_alerta;

  return v_alerta;
end;
$$;

create or replace function public.confirmar_alerta_usuario(
  p_alerta_id uuid,
  p_usuario_id uuid
)
returns public.alertas_usuario
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alerta public.alertas_usuario;
begin
  update public.alertas_usuario
  set activa = false,
      confirmada_por = p_usuario_id,
      confirmada_at = timezone('utc', now()),
      admin_resuelta_visible_hasta = timezone('utc', now()) + interval '12 hours'
  where id = p_alerta_id
    and usuario_id = p_usuario_id
    and activa = true
  returning * into v_alerta;

  if v_alerta is null then
    raise exception 'No existe una alerta activa para confirmar con esos datos.';
  end if;

  return v_alerta;
end;
$$;

create or replace view public.vw_alertas_usuario_estado as
select
  a.id,
  a.usuario_id,
  u.nombre_completo as usuario_nombre,
  u.email as usuario_email,
  a.creado_por,
  uc.nombre_completo as creado_por_nombre,
  a.mensaje,
  a.activa,
  a.enviada_at,
  a.confirmada_at,
  a.confirmada_por,
  a.admin_resuelta_visible_hasta,
  case
    when a.activa then 'pendiente'
    when a.admin_resuelta_visible_hasta is not null
      and a.admin_resuelta_visible_hasta > timezone('utc', now()) then 'confirmada_visible_admin'
    else 'cerrada'
  end as estado_visual_admin,
  a.activa as mostrar_banner_user,
  (
    a.activa
    or (
      a.admin_resuelta_visible_hasta is not null
      and a.admin_resuelta_visible_hasta > timezone('utc', now())
    )
  ) as mostrar_en_admin
from public.alertas_usuario a
join public.usuarios u on u.id = a.usuario_id
join public.usuarios uc on uc.id = a.creado_por;

alter table public.alertas_usuario enable row level security;

drop policy if exists "alertas_usuario_select_admin" on public.alertas_usuario;
create policy "alertas_usuario_select_admin"
on public.alertas_usuario
for select
to authenticated
using (public.es_admin_itflow(auth.uid()));

drop policy if exists "alertas_usuario_select_self" on public.alertas_usuario;
create policy "alertas_usuario_select_self"
on public.alertas_usuario
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists "alertas_usuario_insert_admin" on public.alertas_usuario;
create policy "alertas_usuario_insert_admin"
on public.alertas_usuario
for insert
to authenticated
with check (
  public.es_admin_itflow(auth.uid())
  and creado_por = auth.uid()
);

drop policy if exists "alertas_usuario_update_admin" on public.alertas_usuario;
create policy "alertas_usuario_update_admin"
on public.alertas_usuario
for update
to authenticated
using (public.es_admin_itflow(auth.uid()))
with check (public.es_admin_itflow(auth.uid()));

drop policy if exists "alertas_usuario_update_self_confirm" on public.alertas_usuario;
create policy "alertas_usuario_update_self_confirm"
on public.alertas_usuario
for update
to authenticated
using (
  usuario_id = auth.uid()
  and activa = true
)
with check (
  usuario_id = auth.uid()
  and activa = false
  and confirmada_por = auth.uid()
);

revoke all on public.alertas_usuario from anon;
grant select, insert, update on public.alertas_usuario to authenticated;
grant select on public.vw_alertas_usuario_estado to authenticated;
grant execute on function public.crear_alerta_usuario(uuid, uuid, text) to authenticated;
grant execute on function public.confirmar_alerta_usuario(uuid, uuid) to authenticated;

commit;
