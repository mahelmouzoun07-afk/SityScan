import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";

let commercePourDevis = null;

function ouvrirImpressionDevis({ nomEntreprise, nomClient, commerceNom, montant, devise, date }) {
  const fenetre = window.open("", "_blank");
  fenetre.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Devis</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #0b1b3f; }
    h1 { color: #1d5bff; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    td, th { border: 1px solid #ccc; padding: 12px; text-align: left; }
    .mentions { margin-top: 60px; font-size: 0.8rem; color: #666; }
  </style></head><body>
    <h1>Devis</h1>
    <p><strong>${nomEntreprise || "Votre entreprise"}</strong></p>
    <p>Date : ${date}</p>
    <table>
      <tr><th>Client</th><td>${nomClient}</td></tr>
      <tr><th>Commerce concerné</th><td>${commerceNom || "—"}</td></tr>
      <tr><th>Prestation</th><td>Création de site vitrine</td></tr>
      <tr><th>Montant</th><td>${montant} ${devise}</td></tr>
    </table>
    <p class="mentions">Devis valable 30 jours. Acompte de 30% à la signature, solde à la livraison.
    Mentions légales à compléter selon ton statut (micro-entrepreneur ou équivalent).</p>
    <script>window.print();</script>
  </body></html>`);
}

export function initDevis() {
  const ecran = document.getElementById("ecran-devis");
  const form = document.getElementById("form-devis");

  document.getElementById("btn-fermer-devis").addEventListener("click", () => { ecran.hidden = true; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const utilisateur = getUtilisateurActuel();
    const nomClient = document.getElementById("devis-nom-client").value.trim();
    const montant = parseFloat(document.getElementById("devis-montant").value) || 0;

    const { data: profil } = await supabase.from("profiles").select("nom_entreprise").eq("id", utilisateur.id).single();

    await supabase.from("devis").insert({
      profile_id: utilisateur.id,
      commerce_id: commercePourDevis?.id || null,
      nom_client: nomClient,
      montant,
      devise: "XOF",
      statut: "brouillon",
    });

    ouvrirImpressionDevis({
      nomEntreprise: profil?.nom_entreprise,
      nomClient,
      commerceNom: commercePourDevis?.nom,
      montant,
      devise: "FCFA",
      date: new Date().toLocaleDateString("fr-FR"),
    });

    ecran.hidden = true;
    form.reset();
  });
}

export function ouvrirDevis(commerce) {
  commercePourDevis = commerce || null;
  document.getElementById("devis-commerce-nom").textContent = commerce ? `Pour : ${commerce.nom}` : "";
  document.getElementById("ecran-devis").hidden = false;
}
