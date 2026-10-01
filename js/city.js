import { supabase } from "./main.js";

let villesDisponibles = [];
let villesChargees = false;

async function chargerVilles() {
  if (villesChargees) return villesDisponibles;

  const { data, error } = await supabase.rpc("villes_disponibles");

  if (error) {
    console.error("Erreur chargement villes :", error);
    return [];
  }

  villesDisponibles = data || [];
  villesChargees = true;
  return villesDisponibles;
}

function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function initRechercheVille({ onVilleChoisie }) {
  const ecran = document.getElementById("recherche-ville");
  const input = document.getElementById("input-ville");
  const liste = document.getElementById("liste-suggestions");
  const message = document.getElementById("message-recherche");
  const btnOuvrir = document.getElementById("btn-commencer");
  const btnFermer = document.getElementById("btn-fermer-recherche");

  function appliquerFiltre() {
    const requete = normaliser(input.value.trim());
    liste.innerHTML = "";

    if (!requete) {
      message.textContent = villesDisponibles.length
        ? `${villesDisponibles.length} ville${villesDisponibles.length > 1 ? "s" : ""} disponible${villesDisponibles.length > 1 ? "s" : ""} pour l'instant.`
        : "Aucune ville disponible pour l'instant.";
      return;
    }

    const resultats = villesDisponibles.filter((v) =>
      normaliser(v.ville).includes(requete)
    );

    if (resultats.length === 0) {
      message.textContent = "Cette ville n'est pas encore couverte.";
      return;
    }

    message.textContent = "";

    for (const { ville, pays } of resultats) {
      const li = document.createElement("li");
      li.textContent = pays ? `${ville} — ${pays}` : ville;
      li.addEventListener("click", () => {
        ecran.hidden = true;
        onVilleChoisie(ville);
      });
      liste.appendChild(li);
    }
  }

  btnOuvrir.addEventListener("click", async () => {
    ecran.hidden = false;
    input.value = "";
    input.disabled = true;
    liste.innerHTML = "";
    message.textContent = "Chargement des villes…";
    input.focus();

    await chargerVilles();
    input.disabled = false;
    input.focus();
    appliquerFiltre();
  });

  btnFermer.addEventListener("click", () => {
    ecran.hidden = true;
  });

  input.addEventListener("input", appliquerFiltre);
}
