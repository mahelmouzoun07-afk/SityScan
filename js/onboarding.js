import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";
import { ouvrirRechercheVille } from "./city.js";
import { etatFlux } from "./etat-flux.js";

const etat = {
  profil_type: null,
  objectif_mensuel: 70000,
  temps_semaine: null,
  competence_site: null,
  aisance_commerciale: null,
};

const PRIX_PAR_SITE_DEFAUT = 70000;

const FEEDBACKS_PROFIL = {
  etudiant: "Parfait : les commerces autour du campus sont souvent les premiers à dire oui.",
  salarie: "Bien vu : un complément de revenu qui peut vite devenir plus.",
  freelance: "Tu sais déjà démarcher — ça va beaucoup t'aider ici.",
  sans_activite: "Tu as le temps de t'y mettre à fond, c'est un vrai avantage.",
};

const FEEDBACKS_TEMPS = {
  "2": "C'est jouable, en visant un commerce à la fois.",
  "5": "largement de quoi vendre plusieurs sites par mois.",
  "10": "tu peux avancer vite, surtout le week-end.",
  "20": "à ce rythme, les résultats arrivent très vite.",
};

const FEEDBACKS_COMPETENCE = {
  aucune: "Pas de souci : la maquette est déjà prête à montrer, aucun code nécessaire.",
  outils: "Tu pars avec de l'avance : la maquette est prête, tu la peaufines avec tes outils.",
  oui: "Encore mieux : tu pourras pousser la personnalisation aussi loin que tu veux.",
};

function nombreDeSites(objectif) {
  return Math.max(1, Math.ceil(objectif / PRIX_PAR_SITE_DEFAUT));
}

function majProgression(etape) {
  document.getElementById("onboarding-progression-remplie").style.width = `${(etape / 5) * 100}%`;
  document.getElementById("onboarding-etape-label").textContent = etape === 5 ? "DERNIÈRE ÉTAPE" : `ÉTAPE ${etape} SUR 5`;
}

function carteOption(emoji, titre, sousTitre, valeur) {
  return `<button class="onboarding-carte" data-valeur="${valeur}">
    <span class="onboarding-emoji">${emoji}</span>
    <strong>${titre}</strong>
    <span class="message-discret">${sousTitre}</span>
  </button>`;
}

function afficherBanniere(texte) {
  const zone = document.getElementById("onboarding-banniere");
  if (!texte) { zone.hidden = true; return; }
  zone.hidden = false;
  zone.textContent = texte;
}

function rendreEtape1() {
  majProgression(1);
  afficherBanniere(null);
  document.getElementById("onboarding-titre").textContent = "Tu es plutôt…";
  document.getElementById("onboarding-corps").innerHTML = `
    <div class="onboarding-grille-cartes">
      ${carteOption("🎓", "Étudiant", "je veux un revenu à côté des cours", "etudiant")}
      ${carteOption("💼", "Salarié", "je veux un complément, puis plus", "salarie")}
      ${carteOption("🚀", "Freelance / auto-entrepreneur", "je cherche des clients", "freelance")}
      ${carteOption("🔥", "Sans activité", "je veux démarrer vite", "sans_activite")}
    </div>`;
  document.querySelectorAll(".onboarding-carte").forEach((c) => c.addEventListener("click", () => {
    etat.profil_type = c.dataset.valeur;
    rendreEtape2();
  }));
}

function rendreEtape2() {
  majProgression(2);
  afficherBanniere(FEEDBACKS_PROFIL[etat.profil_type]);
  document.getElementById("onboarding-titre").textContent = "Combien tu veux gagner par mois ?";

  const corps = document.getElementById("onboarding-corps");
  corps.innerHTML = `
    <div class="onboarding-slider-bloc">
      <div class="onboarding-slider-chiffre"><span id="valeur-objectif">${etat.objectif_mensuel.toLocaleString("fr-FR")}</span> <small>FCFA</small></div>
      <input type="range" id="slider-objectif" min="20000" max="500000" step="5000" value="${etat.objectif_mensuel}" />
      <div class="onboarding-slider-bornes"><span>20 000 FCFA</span><span>500 000 FCFA</span></div>
      <p id="texte-sites" class="message-discret"></p>
    </div>
    <button class="cta" id="btn-suite-objectif">C'est mon objectif →</button>`;

  function majTexte() {
    const v = parseInt(document.getElementById("slider-objectif").value);
    document.getElementById("valeur-objectif").textContent = v.toLocaleString("fr-FR");
    const sites = nombreDeSites(v);
    document.getElementById("texte-sites").innerHTML = `<strong>${sites}</strong> site${sites > 1 ? "s" : ""} à vendre par mois, à ${PRIX_PAR_SITE_DEFAUT.toLocaleString("fr-FR")} FCFA le site`;
  }
  majTexte();
  document.getElementById("slider-objectif").addEventListener("input", majTexte);

  document.getElementById("btn-suite-objectif").addEventListener("click", () => {
    etat.objectif_mensuel = parseInt(document.getElementById("slider-objectif").value);
    rendreEtape3();
  });
}

function rendreEtape3() {
  majProgression(3);
  const sites = nombreDeSites(etat.objectif_mensuel);
  afficherBanniere(`${etat.objectif_mensuel.toLocaleString("fr-FR")} FCFA par mois, c'est ${sites} site${sites > 1 ? "s" : ""} à vendre. Voyons ton temps.`);
  document.getElementById("onboarding-titre").textContent = "Combien de temps as-tu par semaine ?";
  document.getElementById("onboarding-corps").innerHTML = `
    <div class="onboarding-grille-cartes">
      ${carteOption("🍌", "2 h", "le soir, de temps en temps", "2")}
      ${carteOption("📅", "5 h", "quelques soirs", "5")}
      ${carteOption("☀️", "10 h", "les week-ends", "10")}
      ${carteOption("⚡", "20 h et +", "à fond", "20")}
    </div>`;
  document.querySelectorAll(".onboarding-carte").forEach((c) => c.addEventListener("click", () => {
    etat.temps_semaine = c.dataset.valeur;
    rendreEtape4();
  }));
}

function rendreEtape4() {
  majProgression(4);
  afficherBanniere(`${etat.temps_semaine} h par semaine, ${FEEDBACKS_TEMPS[etat.temps_semaine]}`);
  document.getElementById("onboarding-titre").textContent = "Tu sais créer un site ?";
  document.getElementById("onboarding-corps").innerHTML = `
    <div class="onboarding-grille-cartes">
      ${carteOption("🦆", "Pas du tout", "et je ne veux pas coder", "aucune")}
      ${carteOption("🧩", "Avec des outils", "Wix, Lovable, Canva…", "outils")}
      ${carteOption("💻", "Oui", "je code ou je maîtrise un CMS", "oui")}
    </div>`;
  document.querySelectorAll(".onboarding-carte").forEach((c) => c.addEventListener("click", () => {
    etat.competence_site = c.dataset.valeur;
    rendreEtape5();
  }));
}

function rendreEtape5() {
  majProgression(5);
  afficherBanniere(FEEDBACKS_COMPETENCE[etat.competence_site]);
  document.getElementById("onboarding-titre").textContent = "Parler à un commerçant, c'est…";
  document.getElementById("onboarding-corps").innerHTML = `
    <div class="onboarding-grille-cartes">
      ${carteOption("😎", "Facile", "je pousse la porte sans souci", "facile")}
      ${carteOption("🙂", "Ça dépend", "avec un script, ça va", "ca_depend")}
      ${carteOption("😬", "Stressant", "je préfère écrire", "stressant")}
    </div>`;
  document.querySelectorAll(".onboarding-carte").forEach((c) => c.addEventListener("click", () => {
    etat.aisance_commerciale = c.dataset.valeur;
    terminerOnboarding();
  }));
}

const COMMERCES_PAR_JOUR_SELON_TEMPS = { "2": 1, "5": 2, "10": 4, "20": 6 };

async function terminerOnboarding() {
  document.getElementById("ecran-onboarding").hidden = true;

  const utilisateur = getUtilisateurActuel();
  if (utilisateur) {
    await supabase.from("profiles").update({
      objectif_mensuel: etat.objectif_mensuel,
      prix_par_site: PRIX_PAR_SITE_DEFAUT,
      commerces_par_jour: COMMERCES_PAR_JOUR_SELON_TEMPS[etat.temps_semaine] || 1,
      profil_type: etat.profil_type,
      competence_site: etat.competence_site,
      aisance_commerciale: etat.aisance_commerciale,
      temps_semaine: etat.temps_semaine,
    }).eq("id", utilisateur.id);
  }

  etatFlux.venantDeOnboarding = true;
  await ouvrirRechercheVille();
}

export function initOnboarding() {
  document.getElementById("btn-commencer").addEventListener("click", () => {
    document.getElementById("ecran-onboarding").hidden = false;
    rendreEtape1();
  });

  document.getElementById("btn-fermer-onboarding").addEventListener("click", () => {
    document.getElementById("ecran-onboarding").hidden = true;
  });
}
