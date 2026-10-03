-- File des e-mails à envoyer
create table if not exists emails_a_envoyer (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('bienvenue','formule_activee','rappel_expiration','acces_coupe','echec_paiement','ville_prete')),
  contexte jsonb default '{}',
  envoye boolean default false,
  cree_le timestamptz default now(),
  envoye_le timestamptz
);

alter table emails_a_envoyer enable row level security;
create policy "Lecture de ses propres emails" on emails_a_envoyer for select using (auth.uid() = profile_id);

-- E-mail de bienvenue automatique à l'inscription
create or replace function public.gerer_nouvel_utilisateur()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.emails_a_envoyer (profile_id, type) values (new.id, 'bienvenue');
  return new;
end;
$$;

-- Vérification quotidienne : rappels J-3 + coupure d'accès à expiration
create or replace function public.verifier_abonnements_quotidien()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into emails_a_envoyer (profile_id, type, contexte)
  select p.id, 'rappel_expiration', jsonb_build_object('expire_le', p.plan_expire_le)
  from profiles p
  where p.plan != 'gratuit'
    and p.plan_expire_le between now() and now() + interval '3 days'
    and not exists (
      select 1 from emails_a_envoyer e
      where e.profile_id = p.id and e.type = 'rappel_expiration'
        and (e.contexte->>'expire_le')::timestamptz = p.plan_expire_le
    );

  insert into emails_a_envoyer (profile_id, type, contexte)
  select p.id, 'acces_coupe', jsonb_build_object('ancien_plan', p.plan)
  from profiles p
  where p.plan != 'gratuit' and p.plan_expire_le < now()
    and not exists (
      select 1 from emails_a_envoyer e
      where e.profile_id = p.id and e.type = 'acces_coupe'
        and e.cree_le > p.plan_expire_le - interval '1 day'
    );

  update profiles set plan = 'gratuit'
  where plan != 'gratuit' and plan_expire_le < now();
end;
$$;

-- Fonction à appeler par le futur webhook de paiement
create or replace function public.activer_formule(p_profile_id uuid, p_palier text, p_duree_jours int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set plan = p_palier, plan_expire_le = now() + make_interval(days => p_duree_jours)
  where id = p_profile_id;

  insert into emails_a_envoyer (profile_id, type, contexte)
  values (p_profile_id, 'formule_activee', jsonb_build_object('palier', p_palier, 'duree_jours', p_duree_jours));
end;
$$;

-- Tâches planifiées
select cron.schedule('verification-abonnements-quotidienne', '0 6 * * *',
  $$ select public.verifier_abonnements_quotidien(); $$);

select cron.schedule('envoi-emails-quotidien', '15 6 * * *', $$
  select net.http_post(
    url := 'https://ybcmiilfoyitvcxnaqbu.supabase.co/functions/v1/envoyer-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
$$);
