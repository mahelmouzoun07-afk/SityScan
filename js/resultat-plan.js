import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";
import { ouvrirProfil } from "./profil.js";
import { ouvrirMonPlan } from "./plan.js";

const LABELS_TEMPS = { "2": "2 h", "5": "5 h", "10": "10 h", "20": "20 h et +" };

export async function afficherResultatPlan(ville, totalCommerces) {
  const utilisateur = getUtilisateurActuel();
  if (!utilisateur) return;

  const { data: profil } = await supabase
    .from("profiles")
    .select("objectif_mensuel, prix_par_site, temps_semaine")
    .eq("id", utilisateur.id)
    .single();

  const objectif = profil?.objectif_mensuel || 70000;
  const prix = profil?.prix_par_site || 70000;
  const sites = Math.max(1, Math.ceil(objectif / prix));
  const contacts = sites * 2; // hypothèse : 1 oui pour 2 contacts
  const contactsParSemaine = Math.ceil(contacts / 4);
  const moisDeReserve = totalCommerces > 0 ? Math.max(1, Math.floor(totalCommerces / contacts)) : 0;

  const contenu = document.getElementById("resultat-plan-contenu");
  contenu.innerHTML = `
    <span class="onboarding-etape-label">TON PLAN</span>
    <h2>${totalCommerces.toLocaleString("fr-FR")} commerces sans site web à ${ville}.</h2>

    <p class="message-discret" style="margin-top:16px;">Ton objectif</p>
    <div class="onboarding-slider-chiffre">${objectif.toLocaleString("fr-FR")} <small>FCFA par mois, avec ${sites} site${sites > 1 ? "s" : ""} vendu${sites > 1 ? "s" : ""} à ${prix.toLocaleString("fr-FR")} FCFA</small></div>

    <h3 style="margin-top:24px;">Ton plan pour y arriver</h3>
    <div class="plan-roadmap">
      <div class="roadmap-etape"><span class="roadmap-numero">1</span><div><strong>Objectif : ${sites} site${sites > 1 ? "s" : ""} vendu${sites > 1 ? "s" : ""} par mois</strong><p>à ${prix.toLocaleString("fr-FR")} FCFA = ${(sites * prix).toLocaleString("fr-FR")} FCFA.</p></div></div>
      <div class="roadmap-etape"><span class="roadmap-numero">2</span><div><strong>Contacter ${contacts} commerces dans le mois</strong><p>soit environ ${contactsParSemaine} par semaine : un oui pour 2 contacts, ça fait ${sites} vente${sites > 1 ? "s" : ""}.</p></div></div>
      <div class="roadmap-etape"><span class="roadmap-numero">3</span><div><strong>Pour chacun, générer sa maquette en quelques secondes</strong><p>et la montrer sur ton téléphone : « je vous ai déjà fait votre site ».</p></div></div>
      <div class="roadmap-etape"><span class="roadmap-numero">4</span><div><strong>Suivre le script de vente et les réponses aux objections</strong><p>encaisser un acompte avec le devis intégré.</p></div></div>
      <div class="roadmap-etape"><span class="roadmap-numero">5</span><div><strong>À ${ville}, tu as ${totalCommerces.toLocaleString("fr-FR")} commerces à contacter</strong><p>${moisDeReserve > 1 ? `de quoi tenir environ ${moisDeReserve} mois à ce rythme.` : "de quoi largement démarrer."}</p></div></div>
    </div>

    <div class="plan-cartes" style="margin-top:20px;">
      <div class="plan-carte">
        <p>Temps nécessaire : environ ${sites * 2}h par semaine. ${profil?.temps_semaine ? `Tu as indiqué en avoir ${LABELS_TEMPS[profil.temps_semaine] || profil.temps_semaine}.` : ""} Ton premier site peut être vendu cette semaine.</p>
      </div>
    </div>

    <button class="cta" id="btn-je-lance-mon-plan" style="width:100%; margin-top:16px;">Je lance mon plan</button>
    <button class="bouton-secondaire" id="btn-suivre-plan-jour" style="width:100%; margin-top:10px;">Suivre mon plan jour après jour →</button>
    <p class="message-discret" style="margin-top:14px;">Estimation illustrative, pas une promesse : ça dépend de ton effort, de ta ville et de ta façon de présenter.</p>
  `;

  document.getElementById("ecran-resultat-plan").hidden = false;

  document.getElementById("btn-je-lance-mon-plan").addEventListener("click", () => {
    document.getElementById("ecran-resultat-plan").hidden = true;
    ouvrirProfil({ afficherFormules: true });
  });

  document.getElementById("btn-suivre-plan-jour").addEventListener("click", () => {
    document.getElementById("ecran-resultat-plan").hidden = true;
    ouvrirMonPlan();
  });
}

export function initResultatPlan() {
  document.getElementById("btn-fermer-resultat-plan").addEventListener("click", () => {
    document.getElementById("ecran-resultat-plan").hidden = true;
  });
}
