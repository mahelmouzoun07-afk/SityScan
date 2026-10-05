import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";

const TIPS = [
  "Le premier « oui » est le plus dur. Après, tu as une vraie référence à montrer au commerçant d'à côté.",
  "Montre la maquette sur ton téléphone, pas en envoyant un lien — le commerçant voit le résultat tout de suite.",
  "Un « je vais réfléchir » se transforme en RDV avec : « Je repasse jeudi avec la version finale, 10 minutes ? »",
  "Demande 30 % d'acompte à la signature. Un client qui a payé ne disparaît pas.",
  "Ton premier client connaît les commerçants du coin. « Vous connaissez quelqu'un à qui ça servirait ? » vaut 10 prospections.",
];

function jourISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function joursRestantsCeMois() {
  const maintenant = new Date();
  const dernierJour = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).getDate();
  return dernierJour - maintenant.getDate();
}

async function chargerProfil() {
  const utilisateur = getUtilisateurActuel();
  const { data } = await supabase
    .from("profiles")
    .select("objectif_mensuel, prix_par_site, commerces_par_jour, ville_cible, roadmap_manuel")
    .eq("id", utilisateur.id)
    .single();
  return data;
}

async function chargerActiviteSemaine() {
  const utilisateur = getUtilisateurActuel();
  const il_y_a_7_jours = new Date();
  il_y_a_7_jours.setDate(il_y_a_7_jours.getDate() - 6);

  const { data } = await supabase
    .from("activite_quotidienne")
    .select("jour, commerces_contactes")
    .eq("profile_id", utilisateur.id)
    .gte("jour", jourISO(il_y_a_7_jours));

  const parJour = new Map((data || []).map((d) => [d.jour, d.commerces_contactes]));
  const jours = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    jours.push({ date: jourISO(d), valeur: parJour.get(jourISO(d)) || 0 });
  }
  return jours;
}

async function modifierActiviteDuJour(delta) {
  const utilisateur = getUtilisateurActuel();
  const aujourdhui = jourISO();

  const { data: existant } = await supabase
    .from("activite_quotidienne")
    .select("commerces_contactes")
    .eq("profile_id", utilisateur.id)
    .eq("jour", aujourdhui)
    .maybeSingle();

  const nouvelleValeur = Math.max(0, (existant?.commerces_contactes || 0) + delta);

  await supabase.from("activite_quotidienne").upsert(
    { profile_id: utilisateur.id, jour: aujourdhui, commerces_contactes: nouvelleValeur },
    { onConflict: "profile_id,jour" }
  );
}

function calculerRoadmap(stats, profil) {
  const etapes = [
    { id: "objectif", titre: "Fixer mon objectif : " + Math.round(profil.objectif_mensuel) + " FCFA par mois", fait: !!profil.objectif_mensuel },
    { id: "ville", titre: "Scanner ma ville : " + (profil.ville_cible || "—"), fait: !!profil.ville_cible },
    { id: "maquette", titre: "Générer ma première maquette", description: "Choisis un commerce que tu croises souvent. Ouvre sa fiche, touche « Générer son site ».", fait: stats.maquettes >= 1 },
    { id: "contacter5", titre: "Contacter mes 5 premiers commerces", fait: stats.contactes >= 5 },
    { id: "rdv", titre: "Décrocher un premier rendez-vous", description: "Un « je vais réfléchir » se transforme en RDV avec : « Je repasse jeudi avec la version finale, 10 minutes ? »", fait: stats.rdv >= 1 },
    { id: "vente", titre: "Vendre mon premier site", description: "Demande 30 % d'acompte à la signature, avec le devis intégré.", fait: stats.signes >= 1 },
    { id: "facture", titre: "Envoyer ma première facture", description: "Il te faut un statut (micro-entrepreneur, gratuit en ligne).", fait: !!profil.roadmap_manuel?.facture, manuel: true },
    { id: "avis", titre: "Demander un avis et une recommandation", description: "Ton premier client connaît les commerçants du coin.", fait: !!profil.roadmap_manuel?.avis, manuel: true },
    { id: "objectifAtteint", titre: "Atteindre " + Math.round(profil.objectif_mensuel) + " FCFA dans le mois", fait: stats.encaisses >= profil.objectif_mensuel },
  ];
  return etapes;
}

function barresSemaine(jours, objectifParJour) {
  const lettres = ["L", "M", "M", "J", "V", "S", "D"];
  return jours.map((j, i) => {
    const date = new Date(j.date);
    const lettre = lettres[(date.getDay() + 6) % 7];
    const rempli = j.valeur > 0;
    return `<div class="barre-jour ${rempli ? 'rempli' : ''}"><div class="barre"></div><span>${lettre}</span></div>`;
  }).join("");
}

export async function ouvrirMonPlan() {
  const contenu = document.getElementById("plan-contenu");
  contenu.innerHTML = "<p class='message-discret'>Chargement…</p>";
  document.getElementById("ecran-plan").hidden = false;

  const [profil, { data: stats }, activite] = await Promise.all([
    chargerProfil(),
    supabase.rpc("mes_stats"),
    chargerActiviteSemaine(),
  ]);

  const s = (stats && stats[0]) || { maquettes: 0, contactes: 0, rdv: 0, signes: 0, encaisses: 0 };
  const etapes = calculerRoadmap(s, profil);
  const prochaine = etapes.find((e) => !e.fait);
  const pourcentage = Math.min(100, Math.round((s.encaisses / (profil.objectif_mensuel || 1)) * 100));
  const aujourdhui = activite[activite.length - 1];
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  contenu.innerHTML = `
    <div class="plan-banniere">
      <span class="plan-mois">MON PLAN · ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).toUpperCase()}</span>
      <div class="plan-chiffre">${Math.round(s.encaisses).toLocaleString("fr-FR")} <small>sur ${Math.round(profil.objectif_mensuel).toLocaleString("fr-FR")} FCFA</small></div>
      <p>Il reste ${joursRestantsCeMois()} jours ce mois-ci. ${profil.ville_cible ? `Ta ville : ${profil.ville_cible}.` : ""}</p>
      <div class="plan-barre"><div class="plan-barre-remplie" style="width:${pourcentage}%"></div></div>
    </div>

    <div class="plan-aujourdhui">
      <div>
        <span class="plan-label">AUJOURD'HUI</span>
        <div class="plan-compte">${aujourdhui.valeur} / ${profil.commerces_par_jour} commerces contactés</div>
      </div>
      <div class="plan-boutons-compte">
        <button id="btn-moins" class="btn-rond">−</button>
        <button id="btn-plus" class="btn-rond btn-rond-actif">+1</button>
      </div>
    </div>
    <div class="plan-semaine">${barresSemaine(activite, profil.commerces_par_jour)}</div>

    ${prochaine ? `
    <div class="plan-cartes">
      <div class="plan-carte">
        <span class="plan-label">PROCHAINE ÉTAPE</span>
        <h3>${prochaine.titre}</h3>
        ${prochaine.description ? `<p>${prochaine.description}</p>` : ""}
        ${prochaine.id === "maquette" ? `<button class="cta" id="btn-ouvrir-carte-depuis-plan">Ouvrir la carte</button>` : ""}
      </div>
      <div class="plan-carte">
        <span class="plan-label">LE TIP DU JOUR</span>
        <p>${tip}</p>
      </div>
    </div>` : `<p class="plan-felicitations">🎉 Toutes les étapes de ta feuille de route sont complétées !</p>`}

    <div class="plan-stats">
      <div><strong>${s.maquettes}</strong><span>Maquettes</span></div>
      <div><strong>${s.contactes}</strong><span>Contactés</span></div>
      <div><strong>${s.rdv}</strong><span>RDV en cours</span></div>
      <div><strong>${s.signes}</strong><span>Sites vendus</span></div>
      <div><strong>${s.contactes ? Math.round((s.signes / s.contactes) * 100) : 0}%</strong><span>Taux de oui</span></div>
    </div>

    <div class="plan-roadmap">
      <h3>Ma feuille de route</h3>
      ${etapes.map((e, i) => `
        <div class="roadmap-etape ${e.fait ? 'fait' : ''}">
          <span class="roadmap-numero">${e.fait ? '✓' : i + 1}</span>
          <div>
            <strong>${e.titre}</strong>
            ${e.description ? `<p>${e.description}</p>` : ""}
          </div>
          ${e.manuel ? `<button class="btn-petit-cta roadmap-toggle" data-id="${e.id}">${e.fait ? 'Fait ✓' : "C'est fait"}</button>` : ""}
        </div>`).join("")}
    </div>

    <div class="plan-reglages">
      <h3>Mes réglages</h3>
      <div class="reglages-grille">
        <label>Objectif par mois (FCFA)<input type="number" id="reglage-objectif" value="${profil.objectif_mensuel}" /></label>
        <label>Mon prix par site (FCFA)<input type="number" id="reglage-prix" value="${profil.prix_par_site}" /></label>
        <label>Commerces par jour<input type="number" id="reglage-rythme" value="${profil.commerces_par_jour}" /></label>
      </div>
      <button class="cta" id="btn-enregistrer-reglages">Enregistrer</button>
      <p id="message-reglages" class="message-discret"></p>
    </div>
  `;

  document.getElementById("btn-plus").addEventListener("click", async () => { await modifierActiviteDuJour(1); ouvrirMonPlan(); });
  document.getElementById("btn-moins").addEventListener("click", async () => { await modifierActiviteDuJour(-1); ouvrirMonPlan(); });

  contenu.querySelectorAll(".roadmap-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const nouveauManuel = { ...profil.roadmap_manuel, [id]: !profil.roadmap_manuel?.[id] };
      const utilisateur = getUtilisateurActuel();
      await supabase.from("profiles").update({ roadmap_manuel: nouveauManuel }).eq("id", utilisateur.id);
      ouvrirMonPlan();
    });
  });

  document.getElementById("btn-enregistrer-reglages").addEventListener("click", async () => {
    const utilisateur = getUtilisateurActuel();
    const objectif_mensuel = parseFloat(document.getElementById("reglage-objectif").value) || 0;
    const prix_par_site = parseFloat(document.getElementById("reglage-prix").value) || 0;
    const commerces_par_jour = parseInt(document.getElementById("reglage-rythme").value) || 1;

    await supabase.from("profiles").update({ objectif_mensuel, prix_par_site, commerces_par_jour }).eq("id", utilisateur.id);
    document.getElementById("message-reglages").textContent = "Enregistré.";
  });
}

export function initMonPlan() {
  document.getElementById("btn-mon-plan").addEventListener("click", ouvrirMonPlan);
  document.getElementById("btn-fermer-plan").addEventListener("click", () => {
    document.getElementById("ecran-plan").hidden = true;
  });
}
