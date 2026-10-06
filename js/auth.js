import { supabase } from "./main.js";

let utilisateurActuel = null;

function appliquerEtatConnecte(session) {
  utilisateurActuel = session?.user || null;

  const btnCompte = document.getElementById("btn-compte");
  const btnProfil = document.getElementById("btn-profil");
  if (!btnCompte) return;

  btnCompte.hidden = !!utilisateurActuel;
  if (btnProfil) {
    btnProfil.hidden = !utilisateurActuel;
    if (utilisateurActuel) btnProfil.textContent = utilisateurActuel.email;
  }
}

export function getUtilisateurActuel() {
  return utilisateurActuel;
}

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  appliquerEtatConnecte(session);

  supabase.auth.onAuthStateChange((_event, session) => {
    appliquerEtatConnecte(session);
  });

  const ecran = document.getElementById("ecran-compte");
  const btnOuvrir = document.getElementById("btn-compte");
  const btnFermer = document.getElementById("btn-fermer-compte");
  const formulaire = document.getElementById("form-connexion");
  const inputEmail = document.getElementById("input-email-connexion");
  const message = document.getElementById("message-connexion");
  const btnDeconnexion = document.getElementById("btn-deconnexion");
  const vueConnexion = document.getElementById("vue-connexion");
  const vueConnecte = document.getElementById("vue-connecte");
  const emailAffiche = document.getElementById("email-connecte");

  function rafraichirVue() {
    const connecte = !!utilisateurActuel;
    vueConnexion.hidden = connecte;
    vueConnecte.hidden = !connecte;
    if (connecte) emailAffiche.textContent = utilisateurActuel.email;
  }

  btnOuvrir.addEventListener("click", () => {
    ecran.hidden = false;
    message.textContent = "";
    rafraichirVue();
  });

  btnFermer.addEventListener("click", () => {
    ecran.hidden = true;
  });

  formulaire.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = inputEmail.value.trim();
    if (!email) return;

    message.textContent = "Envoi du lien en cours…";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    message.textContent = error
      ? "Erreur : impossible d'envoyer le lien. Vérifie l'adresse et réessaie."
      : `Lien envoyé à ${email}. Ouvre ta boîte mail et clique dessus pour te connecter.`;
  });

  btnDeconnexion.addEventListener("click", async () => {
    await supabase.auth.signOut();
    ecran.hidden = true;
  });
}
