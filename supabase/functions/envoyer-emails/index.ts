// Edge Function : envoie les e-mails en attente dans la table emails_a_envoyer.
// Nécessite le secret RESEND_API_KEY (compte gratuit sur resend.com) pour envoyer réellement.
// Sans cette clé, la fonction ne fait rien et laisse les e-mails en attente (rien n'est perdu).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EXPEDITEUR = Deno.env.get("EMAIL_EXPEDITEUR") || "SityScan <contact@sityscan.africa>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function contenuEmail(type: string, contexte: Record<string, unknown>) {
  switch (type) {
    case "bienvenue":
      return {
        objet: "Bienvenue sur SityScan",
        corps: `Bonjour,

Ton compte SityScan est créé. Tu peux maintenant scanner une ville, découvrir les commerces sans site web, et commencer à vendre des sites.

Pour débloquer des commerces et générer des maquettes, choisis une formule depuis l'application.

À bientôt,
L'équipe SityScan`,
      };
    case "formule_activee":
      return {
        objet: `Ta formule ${contexte.palier} est activée`,
        corps: `Bonjour,

Ta formule "${contexte.palier}" est maintenant active pour ${contexte.duree_jours} jours.

Tu peux dès maintenant débloquer des commerces et générer leurs sites.

L'équipe SityScan`,
      };
    case "rappel_expiration":
      return {
        objet: "Ton abonnement SityScan expire dans 3 jours",
        corps: `Bonjour,

Ton abonnement arrive à expiration le ${new Date(contexte.expire_le as string).toLocaleDateString("fr-FR")}.

Renouvelle dès maintenant depuis l'application pour ne pas perdre l'accès à tes commerces débloqués.

L'équipe SityScan`,
      };
    case "acces_coupe":
      return {
        objet: "Ton accès SityScan a été suspendu",
        corps: `Bonjour,

Ton abonnement "${contexte.ancien_plan}" est arrivé à expiration et ton accès aux commerces débloqués a été suspendu.

Rassure-toi : tes maquettes déjà générées et tes prospects sont toujours sauvegardés. Renouvelle une formule pour retrouver l'accès complet.

L'équipe SityScan`,
      };
    case "echec_paiement":
      return {
        objet: "Ton paiement n'a pas abouti",
        corps: `Bonjour,

Ton dernier paiement n'a pas pu être validé. Réessaie depuis l'application pour activer ta formule.

L'équipe SityScan`,
      };
    case "ville_prete":
      return {
        objet: "Ta ville a été scannée",
        corps: `Bonjour,

La ville que tu as demandée est maintenant disponible sur SityScan. Tu peux commencer à prospecter dès maintenant.

L'équipe SityScan`,
      };
    default:
      return null;
  }
}

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ ok: false, raison: "RESEND_API_KEY non configurée — rien envoyé, rien perdu." }), { status: 200 });
  }

  const { data: enAttente, error } = await supabase
    .from("emails_a_envoyer")
    .select("id, profile_id, type, contexte")
    .eq("envoye", false)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ ok: false, erreur: error.message }), { status: 500 });
  }

  let envoyes = 0;
  const erreurs: string[] = [];

  for (const email of enAttente ?? []) {
    const contenu = contenuEmail(email.type, email.contexte || {});
    if (!contenu) continue;

    const { data: utilisateur } = await supabase.auth.admin.getUserById(email.profile_id);
    const adresse = utilisateur?.user?.email;
    if (!adresse) { erreurs.push(`Pas d'e-mail pour ${email.profile_id}`); continue; }

    const resAppel = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EXPEDITEUR, to: adresse, subject: contenu.objet, text: contenu.corps }),
    });

    if (resAppel.ok) {
      await supabase.from("emails_a_envoyer").update({ envoye: true, envoye_le: new Date().toISOString() }).eq("id", email.id);
      envoyes++;
    } else {
      erreurs.push(`Échec envoi ${email.id} : ${await resAppel.text()}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, envoyes, erreurs }), { status: 200 });
});
