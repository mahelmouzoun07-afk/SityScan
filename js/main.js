import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config/supabase.js";
import { initRechercheVille } from "./city.js";
import { lancerScan, definirGestionGenererSite } from "./scan.js";
import { initAuth, getUtilisateurActuel } from "./auth.js";
import { initFicheCommerce, getCommerceOuvert } from "./fiche.js";
import { mettreAJourStatut } from "./prospection.js";
import { ouvrirGenerateur, initGenerateur } from "./generateur.js";
import { initMonPlan } from "./plan.js";
import { initModeTournage } from "./tournage.js";
import { initProfil, ouvrirProfil } from "./profil.js";
import { initKitLegal } from "./kit-legal.js";
import { initDevis, ouvrirDevis } from "./devis.js";
import { telechargerCartePartage } from "./carte-partage.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

initAuth();
initGenerateur();
initMonPlan();
initModeTournage();
initProfil();
initKitLegal();
initDevis();

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [2.4183, 6.3703], // Cotonou — ville pilote
  zoom: 11
});

map.addControl(new maplibregl.NavigationControl());

let villeActuelle = null;
let totalActuel = 0;

function majCompteur(total, sansSite) {
  document.getElementById("count-total").textContent = sansSite;
  document.getElementById("count-aucun").textContent = sansSite;
  document.getElementById("count-social").textContent = total - sansSite;
  totalActuel = sansSite;
  document.getElementById("btn-partager-carte").hidden = total === 0;
}

initFicheCommerce({
  onChangerStatut: async (statut) => {
    const commerce = getCommerceOuvert();
    if (commerce) await mettreAJourStatut(commerce.id, statut);
  },
  onDemanderFormules: () => {
    document.getElementById("fiche-commerce").hidden = true;
    ouvrirProfil({ afficherFormules: true });
  },
  onFaireDevis: (commerce) => {
    ouvrirDevis(commerce);
  },
});

definirGestionGenererSite((commerce) => {
  document.getElementById("fiche-commerce").hidden = true;
  ouvrirGenerateur(commerce);
});

document.getElementById("btn-partager-carte").addEventListener("click", () => {
  if (villeActuelle) telechargerCartePartage(villeActuelle, totalActuel);
});

initRechercheVille({
  onVilleChoisie: async (ville) => {
    villeActuelle = ville;
    const { total, sansSite } = await lancerScan(map, ville);
    majCompteur(total, sansSite);

    const utilisateur = getUtilisateurActuel();
    if (utilisateur) {
      await supabase.from("profiles").update({ ville_cible: ville }).eq("id", utilisateur.id);
    }
  },
});
