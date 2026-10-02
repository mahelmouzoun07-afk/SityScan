import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";
import { genererDonneesMaquette, rendreHtmlMaquette, encoderMaquettePourUrl } from "./maquette.js";

let commerceActuel = null;
let donneesActuelles = null;

function afficherApercu() {
  const html = rendreHtmlMaquette(donneesActuelles);
  const iframe = document.getElementById("apercu-maquette");
  iframe.srcdoc = html;
}

function lienPartageable() {
  const encode = encoderMaquettePourUrl(donneesActuelles);
  return `${window.location.origin}/site.html#${encode}`;
}

async function sauvegarderMaquette() {
  const utilisateur = getUtilisateurActuel();
  if (!utilisateur) return; // pas connecté : aperçu seulement, pas de sauvegarde

  await supabase.from("maquettes").upsert(
    {
      profile_id: utilisateur.id,
      commerce_id: commerceActuel.id,
      famille: donneesActuelles.famille,
      style_numero: donneesActuelles.styleIndex,
      donnees: donneesActuelles,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,commerce_id" }
  );
}

export function ouvrirGenerateur(commerce) {
  commerceActuel = commerce;
  donneesActuelles = genererDonneesMaquette(commerce);

  document.getElementById("ecran-maquette").hidden = false;
  document.getElementById("message-maquette").textContent = "";
  afficherApercu();
  sauvegarderMaquette();
}

export function initGenerateur() {
  const ecran = document.getElementById("ecran-maquette");
  const message = document.getElementById("message-maquette");

  document.getElementById("btn-fermer-maquette").addEventListener("click", () => {
    ecran.hidden = true;
  });

  document.getElementById("btn-autre-style").addEventListener("click", () => {
    const nombreStyles = 12; // 4 palettes × 3 accroches
    const prochainStyle = (donneesActuelles.styleIndex + 1) % nombreStyles;
    donneesActuelles = genererDonneesMaquette(commerceActuel, prochainStyle);
    afficherApercu();
    sauvegarderMaquette();
  });

  document.getElementById("btn-copier-lien").addEventListener("click", async () => {
    const lien = lienPartageable();
    try {
      await navigator.clipboard.writeText(lien);
      message.textContent = "Lien copié ! Colle-le dans WhatsApp ou ton navigateur.";
    } catch {
      message.textContent = lien;
    }
  });

  document.getElementById("btn-modifier-site").addEventListener("click", () => {
    alert("Modification du texte, des prestations et des photos — fonctionnalité à construire ensuite.");
  });

  document.getElementById("btn-mettre-en-ligne").addEventListener("click", () => {
    alert("Mise en ligne sur un nom de domaine dédié — fonctionnalité à construire ensuite (le lien généré ci-dessus fonctionne déjà et peut être partagé tel quel).");
  });
}
