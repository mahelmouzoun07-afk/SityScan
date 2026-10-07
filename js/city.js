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

let callbackVilleChoisie = null;

export async function ouvrirRechercheVille() {
  const ecran = document.getElementById("recherche-ville");
  const input = document.getElementById("input-ville");
  const liste = document.getElementById("liste-suggestions");
  const message = document.getElementById("message-recherche");

  ecran.hidden = false;
  input.value = "";
  input.disabled = true;
  liste.innerHTML = "";
  message.textContent = "Chargement des villes…";
  input.focus();

  await chargerVilles();
  input.disabled = false;
  input.focus();
  appliquerFiltreInterne();
}

function appliquerFiltreInterne() {
  const input = document.getElementById("input-ville");
  const liste = document.getElementById("liste-suggestions");
  const message = document.getElementById("message-recherche");
  const ecran = document.getElementById("recherche-ville");

  const requete = normaliser(input.value.trim());
  liste.innerHTML = "";

  if (!requete) {
    message.textContent = villesDisponibles.length
      ? `${villesDisponibles.length} ville${villesDisponibles.length > 1 ? "s" : ""} disponible${villesDisponibles.length > 1 ? "s" : ""} pour l'instant.`
      : "Aucune ville disponible pour l'instant.";
    return;
  }

  const resultats = villesDisponibles.filter((v) => normaliser(v.ville).includes(requete));

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
      if (callbackVilleChoisie) callbackVilleChoisie(ville);
    });
    liste.appendChild(li);
  }
}

export function initRechercheVille({ onVilleChoisie }) {
  callbackVilleChoisie = onVilleChoisie;

  const input = document.getElementById("input-ville");
  const btnFermer = document.getElementById("btn-fermer-recherche");
  const btnAutreVille = document.getElementById("btn-autre-ville");

  btnFermer.addEventListener("click", () => {
    document.getElementById("recherche-ville").hidden = true;
  });

  // "Autre ville" dans l'en-tête permet de rescanner sans repasser par le questionnaire
  btnAutreVille.addEventListener("click", () => ouvrirRechercheVille());

  input.addEventListener("input", appliquerFiltreInterne);
}
