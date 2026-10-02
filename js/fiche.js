let commerceOuvert = null;

export function getCommerceOuvert() {
  return commerceOuvert;
}

function echapperHtml(texte) {
  const div = document.createElement("div");
  div.textContent = texte || "";
  return div.innerHTML;
}

export function ouvrirFicheCommerce(commerce, { onGenererSite }) {
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
      <p>${commerce.telephone ? `📞 ${echapperHtml(commerce.telephone)}` : "Téléphone non renseigné"}</p>
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
      <button class="cta" id="btn-generer-site">Générer son site →</button>
    `;

    document.getElementById("btn-generer-site").addEventListener("click", () => {
      onGenererSite(commerce);
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
