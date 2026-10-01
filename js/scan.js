import { supabase } from "./main.js";
import { creerBrume } from "./fog.js";

let markersActuels = [];

function viderMarkers() {
  for (const m of markersActuels) m.remove();
  markersActuels = [];
}

function centreEtZoom(commerces) {
  const points = commerces.filter((c) => c.latitude && c.longitude);
  if (points.length === 0) return null;

  const latMoyenne = points.reduce((s, c) => s + c.latitude, 0) / points.length;
  const lonMoyenne = points.reduce((s, c) => s + c.longitude, 0) / points.length;
  return [lonMoyenne, latMoyenne];
}

function creerMarker(map, commerce) {
  const el = document.createElement("div");
  el.className = commerce.locked
    ? "marker marker-verrouille"
    : commerce.a_un_site
      ? "marker marker-avec-site"
      : "marker marker-sans-site";
  el.title = commerce.nom;

  const contenuPopup = commerce.locked
    ? `<strong>${commerce.nom}</strong><br/>${commerce.metier_label || ""}<br/><em>Débloque ce commerce avec un abonnement</em>`
    : `<strong>${commerce.nom}</strong><br/>${commerce.metier_label || ""}<br/>${commerce.quartier || ""}${commerce.telephone ? `<br/>${commerce.telephone}` : ""}`;

  const popup = new maplibregl.Popup({ offset: 12 }).setHTML(contenuPopup);

  return new maplibregl.Marker({ element: el })
    .setLngLat([commerce.longitude, commerce.latitude])
    .setPopup(popup)
    .addTo(map);
}

export async function lancerScan(map, ville) {
  viderMarkers();

  const { data: commerces, error } = await supabase.rpc("commerces_ville", { p_ville: ville });

  if (error) {
    console.error("Erreur chargement commerces :", error);
    return { total: 0, sansSite: 0 };
  }

  const centre = centreEtZoom(commerces);
  if (centre) {
    map.flyTo({ center: centre, zoom: 13, duration: 1200 });
  }

  const brume = creerBrume("map-section");
  await new Promise((resolve) => setTimeout(resolve, 900)); // laisser la carte se recentrer
  await brume.leverLaBrume(1800);

  const avecCoordonnees = commerces.filter((c) => c.latitude && c.longitude);
  for (const c of avecCoordonnees) {
    markersActuels.push(creerMarker(map, c));
  }

  const sansSite = commerces.filter((c) => !c.a_un_site).length;

  return { total: commerces.length, sansSite };
}
