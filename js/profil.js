import { supabase } from "./main.js";
import { getUtilisateurActuel } from "./auth.js";

const LABELS_PLAN = { gratuit: "Découverte · gratuit", essentiel: "Essentiel", pro: "Pro", illimite: "Illimité" };

function echapperHtml(texte) {
  const div = document.createElement("div");
  div.textContent = texte || "";
  return div.innerHTML;
}

function exporterCSV(prospects) {
  const entetes = ["Nom", "Secteur", "Quartier", "Ville", "Téléphone", "Statut", "Dernière mise à jour"];
  const lignes = prospects.map((p) => [p.nom, p.metier_label, p.quartier, p.ville, p.telephone || "", p.statut, p.updated_at]
    .map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
  const contenu = [entetes.join(","), ...lignes].join("\n");
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = "prospects-sityscan.csv";
  lien.click();
}

async function chargerEtAfficherTout() {
  const utilisateur = getUtilisateurActuel();
  const contenu = document.getElementById("profil-contenu");

  const [{ data: profil }, { data: prospects }, { data: maquettes }] = await Promise.all([
    supabase.from("profiles").select("plan, plan_expire_le, nom_entreprise").eq("id", utilisateur.id).single(),
    supabase.rpc("mes_prospects"),
    supabase.from("maquettes").select("id, mise_en_ligne_url"),
  ]);

  const palier = profil?.plan || "gratuit";
  const expire = profil?.plan_expire_le ? new Date(profil.plan_expire_le).toLocaleDateString("fr-FR") : null;
  const listeProspects = prospects || [];
  const enLigne = (maquettes || []).filter((m) => m.mise_en_ligne_url).length;

  contenu.innerHTML = `
    <div class="profil-entete">
      <div class="profil-avatar">${utilisateur.email[0].toUpperCase()}</div>
      <div>
        <h2>${echapperHtml(utilisateur.email)}</h2>
        <p class="message-discret">Membre depuis le ${new Date(utilisateur.created_at).toLocaleDateString("fr-FR")}</p>
      </div>
    </div>

    <div class="profil-bloc">
      <div class="profil-bloc-entete">
        <h3>Mon abonnement</h3>
        <span class="badge-palier">${palier === "gratuit" ? "Sans abonnement" : "Actif"}</span>
      </div>
      <p class="profil-palier">${LABELS_PLAN[palier]}</p>
      ${expire ? `<p class="message-discret">Valable jusqu'au ${expire}</p>` : ""}
      ${palier === "gratuit" ? `<p class="message-discret">Tu vois combien de commerces n'ont pas de site, mais pas lesquels. Choisis une formule pour les débloquer.</p>` : ""}
      <button class="cta" id="btn-voir-formules-profil">Choisir une formule</button>
    </div>

    <div class="profil-bloc" id="bloc-formules" hidden>
      <h3>Choisis ta formule</h3>
      <div class="cartes-formules">
        <div class="carte-formule"><h4>Essentiel</h4><p class="prix-formule">7 000 FCFA<span>/mois</span></p>
          <ul><li>20 commerces débloqués/ville</li><li>10 maquettes/jour</li><li>Scripts WhatsApp + appel</li></ul>
          <button class="bouton-secondaire btn-payer" data-palier="essentiel">Passer à Essentiel</button></div>
        <div class="carte-formule carte-formule-mise-en-avant"><h4>Pro</h4><p class="prix-formule">10 000 FCFA<span>/mois</span></p>
          <ul><li>100 commerces débloqués/ville</li><li>Maquettes illimitées</li><li>Devis/factures, export CSV</li></ul>
          <button class="cta btn-payer" data-palier="pro">Passer à Pro</button></div>
        <div class="carte-formule"><h4>Illimité</h4><p class="prix-formule">15 000 FCFA<span>/mois</span></p>
          <ul><li>Tous les commerces, sans limite</li><li>Ville pré-scannée sur demande</li><li>Domaine personnalisé</li></ul>
          <button class="bouton-secondaire btn-payer" data-palier="illimite">Passer à Illimité</button></div>
      </div>
      <p class="message-discret">Le paiement se fait via SaaSPay (bientôt disponible).</p>
    </div>

    <div class="profil-bloc">
      <div class="profil-bloc-entete"><h3>Mes prospects</h3><span class="badge-palier">${listeProspects.length}</span></div>
      <input type="text" id="recherche-prospect" placeholder="Chercher un commerce ou une ville..." />
      <div id="liste-prospects">${rendreListeProspects(listeProspects)}</div>
      ${listeProspects.length ? `<button class="bouton-secondaire" id="btn-export-csv">Exporter en CSV</button>` : ""}
    </div>

    <div class="profil-bloc">
      <div class="profil-bloc-entete"><h3>Mes sites</h3><span class="badge-palier">${(maquettes || []).length} maquette${(maquettes || []).length > 1 ? "s" : ""} · ${enLigne} en ligne</span></div>
    </div>

    <div class="profil-bloc">
      <h3>Sécurité</h3>
      <div class="ligne-securite">
        <input type="password" id="nouveau-mdp" placeholder="Nouveau mot de passe" />
        <button class="bouton-secondaire" id="btn-changer-mdp">Changer le mot de passe</button>
      </div>
      <p id="message-mdp" class="message-discret"></p>
    </div>
  `;

  document.getElementById("btn-voir-formules-profil").addEventListener("click", () => {
    document.getElementById("bloc-formules").hidden = false;
  });

  contenu.querySelectorAll(".btn-payer").forEach((btn) => {
    btn.addEventListener("click", () => {
      alert(`Paiement ${btn.dataset.palier} — intégration SaaSPay à venir. Rien n'a été débité.`);
    });
  });

  document.getElementById("recherche-prospect").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtres = listeProspects.filter((p) =>
      (p.nom || "").toLowerCase().includes(q) || (p.ville || "").toLowerCase().includes(q)
    );
    document.getElementById("liste-prospects").innerHTML = rendreListeProspects(filtres);
  });

  const btnCsv = document.getElementById("btn-export-csv");
  if (btnCsv) btnCsv.addEventListener("click", () => exporterCSV(listeProspects));

  document.getElementById("btn-changer-mdp").addEventListener("click", async () => {
    const mdp = document.getElementById("nouveau-mdp").value;
    const message = document.getElementById("message-mdp");
    if (mdp.length < 6) { message.textContent = "6 caractères minimum."; return; }
    const { error } = await supabase.auth.updateUser({ password: mdp });
    message.textContent = error ? "Erreur : " + error.message : "Mot de passe modifié.";
  });
}

function rendreListeProspects(liste) {
  if (!liste.length) return "<p class='message-discret'>Aucun prospect pour l'instant. Ouvre un commerce sur la carte et marque-le « Contacté ».</p>";
  const labels = { a_contacter: "À contacter", contacte: "Contacté", proposition: "Proposition", signe: "Signé", refuse: "Refusé" };
  return liste.map((p) => `
    <div class="ligne-prospect">
      <div><strong>${p.nom}</strong><p class="message-discret">${p.metier_label || ""} · ${p.quartier || ""}, ${p.ville || ""}</p></div>
      <span class="badge-statut badge-${p.statut}">${labels[p.statut] || p.statut}</span>
    </div>`).join("");
}

export async function ouvrirProfil({ afficherFormules } = {}) {
  document.getElementById("ecran-profil").hidden = false;
  await chargerEtAfficherTout();
  if (afficherFormules) document.getElementById("bloc-formules").hidden = false;
}

export function initProfil() {
  document.getElementById("btn-profil").addEventListener("click", () => ouvrirProfil());
  document.getElementById("btn-fermer-profil").addEventListener("click", () => {
    document.getElementById("ecran-profil").hidden = true;
  });
}
