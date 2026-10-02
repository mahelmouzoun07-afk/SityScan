import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config/supabase.js";
import { initRechercheVille } from "./city.js";
import { lancerScan, definirGestionGenererSite } from "./scan.js";
import { initAuth } from "./auth.js";
import { initFicheCommerce, getCommerceOuvert } from "./fiche.js";
import { mettreAJourStatut } from "./prospection.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

initAuth();

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [2.4183, 6.3703], // Cotonou — ville pilote
  zoom: 11
});

map.addControl(new maplibregl.NavigationControl());

function majCompteur(total, sansSite) {
  document.getElementById("count-total").textContent = sansSite;
  document.getElementById("count-aucun").textContent = sansSite;
  document.getElementById("count-social").textContent = total - sansSite;
}

initFicheCommerce({
  onChangerStatut: async (statut) => {
    const commerce = getCommerceOuvert();
    if (commerce) await mettreAJourStatut(commerce.id, statut);
  },
  onDemanderFormules: () => {
    alert("Écran des formules à venir — pour l'instant, aucun commerce n'est débloqué sans palier payant.");
  },
});

definirGestionGenererSite((commerce) => {
  alert(`Génération de la maquette pour "${commerce.nom}" — fonctionnalité à construire ensuite.`);
});

initRechercheVille({
  onVilleChoisie: async (ville) => {
    const { total, sansSite } = await lancerScan(map, ville);
    majCompteur(total, sansSite);
  },
});
