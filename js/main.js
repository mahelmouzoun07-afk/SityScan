import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config/supabase.js";
import { initRechercheVille } from "./city.js";
import { lancerScan } from "./scan.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

initRechercheVille({
  onVilleChoisie: async (ville) => {
    const { total, sansSite } = await lancerScan(map, ville);
    majCompteur(total, sansSite);
  },
});
