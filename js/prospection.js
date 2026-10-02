import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";

export async function mettreAJourStatut(commerceId, statut) {
  const utilisateur = getUtilisateurActuel();

  if (!utilisateur) {
    alert("Connecte-toi d'abord (bouton « Mon compte ») pour suivre tes prospects.");
    return false;
  }

  const { error } = await supabase
    .from("prospection")
    .upsert(
      { profile_id: utilisateur.id, commerce_id: commerceId, statut, updated_at: new Date().toISOString() },
      { onConflict: "profile_id,commerce_id" }
    );

  if (error) {
    console.error("Erreur mise à jour statut :", error);
    return false;
  }

  return true;
}
