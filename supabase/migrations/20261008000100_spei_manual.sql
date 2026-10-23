-- Veloo · 14 SPEI manual (validación antes de tener procesador).
--
-- El fan transfiere a la CLABE de Veloo escribiendo un concepto único (VLO + 5 caracteres) que se
-- guarda en spei_referencia. Alguien del equipo busca el concepto en la banca y confirma en el panel.
-- Queda registrado quién confirmó cada pago.

create unique index ordenes_concepto_spei_manual_idx on public.ordenes (spei_referencia)
  where procesador = 'spei_manual';

alter table public.ordenes add column confirmada_por uuid references public.staff (id) on delete set null;

-- Servidor (panel): el equipo vio la transferencia en la banca. Idempotente, como confirmar_pago.
-- Acepta órdenes vencidas: si el fan transfirió tarde con su concepto, igual se le da el acceso.
create function public.confirmar_spei_manual(p_orden uuid, p_staff uuid, p_token_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  o public.ordenes;
  nueva boolean;
begin
  if not exists (select 1 from public.staff where id = p_staff) then
    raise exception 'no_es_staff';
  end if;
  select * into o from public.ordenes where id = p_orden for update;
  if not found then
    raise exception 'orden_no_encontrada';
  end if;
  if o.procesador <> 'spei_manual' then
    raise exception 'orden_no_es_spei_manual';
  end if;

  nueva := public.confirmar_pago(p_orden, p_token_hash);
  if nueva then
    update public.ordenes set confirmada_por = p_staff where id = p_orden;
  end if;
  return nueva;
end $$;

revoke execute on function public.confirmar_spei_manual(uuid, uuid, text) from public, anon, authenticated;
