let commerceOuvert = null;

export function getCommerceOuvert() {
  return commerceOuvert;
}

function echapperHtml(texte) {
  const div = document.createElement("div");
  div.textContent = texte || "";
  return div.innerHTML;
}

export function ouvrirFicheCommerce(commerce, { onGenererSite, onFaireDevis }) {
  commerceOuvert = commerce;
  const ecran = document.getElementById("fiche-commerce");
  const contenu = document.getElementById("fiche-contenu");

  if (commerce.locked) {
    contenu.innerHTML = `
      <h2>${echapperHtml(commerce.nom)}</h2>
      <p class="message-discret">${echapperHtml(commerce.metier_label)}</p>
      <p class="fiche-verrou">🔒 Ce commerce fait partie des fiches verrouillées de ta formule actuelle.</p>
      <button class="cta" id="btn-voir-formules">Voir les formules</button>
    `;
  } else {
    const lienMaps = commerce.lien_google_maps
      ? `<a href="${echapperHtml(commerce.lien_google_maps)}" target="_blank" rel="noopener">Vérifier sur Google Maps ↗</a>`
      : "";

    contenu.innerHTML = `
      <h2>${echapperHtml(commerce.nom)}</h2>
      <p class="message-discret">${echapperHtml(commerce.metier_label)} · ${echapperHtml(commerce.quartier)}</p>
      <p>${echapperHtml(commerce.adresse) || "Adresse non renseignée"}</p>
      <p class="donnee-sensible">${commerce.telephone ? `📞 ${echapperHtml(commerce.telephone)}` : "Téléphone non renseigné"}</p>
      <p>${lienMaps}</p>
      <label class="fiche-statut-label">
        Statut de prospection
        <select id="select-statut">
          <option value="a_contacter" ${commerce.statut === "a_contacter" ? "selected" : ""}>À contacter</option>
          <option value="contacte" ${commerce.statut === "contacte" ? "selected" : ""}>Contacté</option>
          <option value="proposition" ${commerce.statut === "proposition" ? "selected" : ""}>Proposition faite</option>
          <option value="signe" ${commerce.statut === "signe" ? "selected" : ""}>Signé</option>
          <option value="refuse" ${commerce.statut === "refuse" ? "selected" : ""}>Refusé</option>
        </select>
      </label>
      <div class="fiche-boutons">
        <button class="cta" id="btn-generer-site">Générer son site →</button>
        <button class="bouton-secondaire" id="btn-voir-script">Voir le script de vente</button>
        <button class="bouton-secondaire" id="btn-faire-devis">Faire un devis</button>
      </div>
      <div id="zone-script" hidden></div>
    `;

    document.getElementById("btn-generer-site").addEventListener("click", () => {
      onGenererSite(commerce);
    });

    document.getElementById("btn-voir-script").addEventListener("click", async () => {
      const zone = document.getElementById("zone-script");
      if (!zone.hidden) { zone.hidden = true; return; }
      zone.hidden = false;
      zone.innerHTML = "<p class='message-discret'>Chargement…</p>";
      const { chargerScript } = await import("./scripts-vente.js");
      const { script, objections } = await chargerScript(commerce.metier_numero);
      const texteScript = script.replace(/\{nom\}/g, commerce.nom);
      zone.innerHTML = `
        <h3>Script</h3>
        <pre class="script-texte">${echapperHtml(texteScript)}</pre>
        <button class="bouton-secondaire" id="btn-copier-script">Copier le script</button>
        <h3>Réponses aux objections</h3>
        ${objections.map((o) => `<details><summary>${echapperHtml(o.objection)}</summary><p>${echapperHtml(o.reponse)}</p></details>`).join("")}
      `;
      document.getElementById("btn-copier-script").addEventListener("click", async () => {
        await navigator.clipboard.writeText(texteScript);
        document.getElementById("btn-copier-script").textContent = "Copié !";
      });
    });

    document.getElementById("btn-faire-devis").addEventListener("click", () => {
      onFaireDevis(commerce);
    });
  }

  ecran.hidden = false;
}

export function initFicheCommerce({ onChangerStatut, onDemanderFormules }) {
  const ecran = document.getElementById("fiche-commerce");
  const btnFermer = document.getElementById("btn-fermer-fiche");

  btnFermer.addEventListener("click", () => {
    ecran.hidden = true;
  });

  ecran.addEventListener("change", (e) => {
    if (e.target.id === "select-statut") {
      onChangerStatut(e.target.value);
    }
  });

  ecran.addEventListener("click", (e) => {
    if (e.target.id === "btn-voir-formules") {
      onDemanderFormules();
    }
  });
}
