import { ACCROCHES, PALETTES, hashSimple, remplacerVariables } from "./maquette.js";
import { photosDuSecteur } from "./photos.js";
import { STYLE_ANIMATIONS, SCRIPT_ANIMATIONS } from "./animations.js";
import { featuresDeLaFamille, TEMOIGNAGES_GENERIQUES, FAQ_GENERIQUE } from "./contenu-generique.js";

export function slugifier(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function styleEtAccroche(commerce, familleId, seed) {
  const banque = ACCROCHES[familleId] || ACCROCHES.autres;
  const palette = PALETTES[seed % PALETTES.length];
  const accroche = remplacerVariables(banque[seed % banque.length], commerce);
  return { palette, accroche };
}

function lienWhatsapp(commerce) {
  return commerce.telephone ? `https://wa.me/${commerce.telephone.replace(/[^0-9]/g, "")}` : null;
}

// --- Composants partagés ---

function entete(commerce, pages, pageActuelle) {
  const liens = pages
    .map((p) => `<a href="${slugifier(p)}.html" class="${p === pageActuelle ? 'actif' : ''}">${p}</a>`)
    .join("");
  const wa = lienWhatsapp(commerce);
  return `
  <header class="entete-sticky">
    <a href="accueil.html" class="logo">${commerce.nom}</a>
    <nav class="nav-pages">${liens}</nav>
    ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="bouton-wa-entete">WhatsApp</a>` : ""}
  </header>`;
}

function boutonWhatsappFlottant(commerce) {
  const wa = lienWhatsapp(commerce);
  return wa ? `<a href="${wa}" target="_blank" rel="noopener" class="wa-flottant" aria-label="WhatsApp">💬</a>` : "";
}

function pied(commerce) {
  const wa = lienWhatsapp(commerce);
  return `
  <footer class="pied">
    <div class="pied-colonnes">
      <div>
        <strong>${commerce.nom}</strong>
        <p>${commerce.adresse || ""}</p>
        <p>${commerce.quartier || ""}, ${commerce.ville || ""}</p>
      </div>
      <div>
        <strong>Contact</strong>
        ${commerce.telephone ? `<p>${commerce.telephone}</p>` : ""}
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ""}
      </div>
      <div>
        <strong>Suivez-nous</strong>
        <p>Réseaux sociaux à ajouter</p>
      </div>
    </div>
    <p class="mention">Site généré avec SityScan</p>
  </footer>`;
}

function sectionFeatures(familleId, palette) {
  const items = featuresDeLaFamille(familleId);
  return `
  <div class="section reveal-stagger grille-features">
    ${items.map((t) => `<div class="feature"><div class="feature-puce"></div><p>${t}</p></div>`).join("")}
  </div>`;
}

function sectionTemoignages() {
  return `
  <div class="section reveal">
    <h2>Ce qu'on dit de nous</h2>
    <div class="reveal-stagger cartes-temoignages">
      ${TEMOIGNAGES_GENERIQUES.map((t) => `<div class="temoignage"><p>« ${t.texte} »</p><span>— ${t.auteur}</span></div>`).join("")}
    </div>
  </div>`;
}

function sectionFaqMini() {
  return `
  <div class="section reveal">
    <h2>Questions fréquentes</h2>
    ${FAQ_GENERIQUE.map((f) => `<details><summary>${f.q}</summary><p>${f.r}</p></details>`).join("")}
  </div>`;
}

function imageFond(url) {
  return url ? `<div class="hero-fond hero-zoom" style="background-image:url('${url}')"></div><div class="hero-voile"></div>` : "";
}

function heroPage(titre, sousTitre, photos, grand) {
  return `
  <div class="${grand ? 'hero-page hero-grand' : 'hero-page'}">
    ${imageFond(photos[0])}
    <h1>${titre}</h1>
    ${sousTitre ? `<p>${sousTitre}</p>` : ""}
  </div>`;
}

// --- Gabarits de page ---

function pageAccueil(commerce, famille, palette, accroche, photos) {
  return `
  ${heroPage(commerce.nom, accroche, photos, true)}
  <div class="section reveal">
    <h2>Bienvenue</h2>
    <p>${commerce.nom} vous accueille à ${commerce.quartier || commerce.ville}. ${famille.element_cle ? `Notre priorité : ${famille.element_cle.toLowerCase()}.` : ""}</p>
  </div>
  ${sectionFeatures(famille.id, palette)}
  <div class="section reveal-stagger grille-images">
    ${photos.slice(1, 4).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>
  ${sectionTemoignages()}
  ${sectionFaqMini()}`;
}

function pageGalerie(commerce, photos) {
  return `
  ${heroPage("Galerie", null, photos, false)}
  <div class="section reveal-stagger grille-images grille-dense">
    ${photos.slice(1).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>`;
}

function pageContact(commerce, photos) {
  const wa = lienWhatsapp(commerce);
  return `
  ${heroPage("Contact", null, photos, false)}
  <div class="section reveal">
    <h2>Nous trouver</h2>
    <p>${commerce.adresse || ""}</p>
    <p>${commerce.quartier || ""}, ${commerce.ville || ""}</p>
    ${wa ? `<a class="bouton" href="${wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ""}
  </div>`;
}

function pageTarifs(commerce, photos) {
  return `
  ${heroPage("Tarifs", null, photos, false)}
  <div class="section reveal-stagger cartes">
    ${["Formule simple", "Formule standard", "Formule complète"].map((nom, i) => `
      <div class="carte">
        <div class="photo" style="background-image:url('${photos[i + 1] || ''}')"></div>
        <div class="texte"><strong>${nom}</strong><p>Détails à personnaliser.</p><span class="prix">— FCFA</span></div>
      </div>`).join("")}
  </div>`;
}

function pageFormulaire(titre, photos) {
  return `
  ${heroPage(titre, null, photos, false)}
  <div class="section reveal">
    <form class="formulaire" onsubmit="event.preventDefault(); alert('Formulaire à activer.');">
      <input type="text" placeholder="Votre nom" required />
      <input type="tel" placeholder="Votre téléphone" required />
      <textarea placeholder="Votre demande" rows="4"></textarea>
      <button type="submit" class="bouton">Envoyer</button>
    </form>
  </div>`;
}

function pageEquipe(titre, photos) {
  return `
  ${heroPage(titre, null, photos, false)}
  <div class="section reveal-stagger cartes">
    ${photos.slice(1, 4).map((u) => `
      <div class="carte">
        <div class="photo" style="background-image:url('${u}')"></div>
        <div class="texte"><strong>Membre de l'équipe</strong><p>À personnaliser.</p></div>
      </div>`).join("")}
  </div>`;
}

// Menu/carte restauration — sections par catégorie, inspiré des thèmes WordPress restaurant
function pageMenu(commerce, photos) {
  const categories = [
    { nom: "Entrées", plats: ["Plat à personnaliser", "Plat à personnaliser"] },
    { nom: "Plats principaux", plats: ["Plat à personnaliser", "Plat à personnaliser", "Plat à personnaliser"] },
    { nom: "Desserts", plats: ["Plat à personnaliser"] },
    { nom: "Boissons", plats: ["Boisson à personnaliser", "Boisson à personnaliser"] },
  ];
  return `
  ${heroPage("Menu / Carte", "À personnaliser avec vos vrais plats et prix", photos, false)}
  <div class="section reveal">
    ${categories.map((cat) => `
      <div class="categorie-menu">
        <h3>${cat.nom}</h3>
        ${cat.plats.map((p) => `<div class="ligne-menu"><span>${p}</span><span class="prix">— FCFA</span></div>`).join("")}
      </div>`).join("")}
  </div>`;
}

// Boutique/catalogue/produit — grille façon Shopify
function pageCatalogue(titre, photos) {
  const nbProduits = Math.min(photos.length - 1, 6);
  return `
  ${heroPage(titre, "Parcourez nos produits", photos, false)}
  <div class="section reveal-stagger grille-produits">
    ${Array.from({ length: nbProduits }).map((_, i) => `
      <div class="carte-produit">
        <div class="photo" style="background-image:url('${photos[i + 1]}')"></div>
        <div class="texte">
          <strong>Produit à personnaliser</strong>
          <span class="prix">— FCFA</span>
          <button class="bouton-petit" onclick="alert('Commande WhatsApp à activer.')">Commander</button>
        </div>
      </div>`).join("")}
  </div>`;
}

function pageGenerique(titre, commerce, photos) {
  return `
  ${heroPage(titre, null, photos, false)}
  <div class="section reveal">
    <p>${titre} — contenu à personnaliser pour ${commerce.nom}.</p>
  </div>
  <div class="section reveal-stagger grille-images">
    ${photos.slice(1, 3).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>`;
}

function choisirGabarit(titre, commerce, famille, palette, photos) {
  const t = titre.toLowerCase();
  if (t.includes("accueil")) {
    const { accroche } = styleEtAccroche(commerce, famille.id, hashSimple(commerce.id));
    return pageAccueil(commerce, famille, palette, accroche, photos);
  }
  if (t.includes("menu") || t.includes("carte")) return pageMenu(commerce, photos);
  if (t.includes("boutique") || t.includes("catalogue") || t.includes("produit") || t.includes("catégories"))
    return pageCatalogue(titre, photos);
  if (t.includes("galerie")) return pageGalerie(commerce, photos);
  if (t.includes("contact")) return pageContact(commerce, photos);
  if (t.includes("tarif")) return pageTarifs(commerce, photos);
  if (t.includes("réservation") || t.includes("rendez-vous") || t.includes("inscription") || t.includes("devis") || t.includes("souscription") || t.includes("candidature"))
    return pageFormulaire(titre, photos);
  if (t.includes("équipe") || t.includes("professionnels") || t.includes("agents") || t.includes("coachs"))
    return pageEquipe(titre, photos);
  return pageGenerique(titre, commerce, photos);
}

const STYLE_SUPPLEMENTAIRE = `
.entete-sticky { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; flex-wrap: wrap; gap: 8px; background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); }
.logo { font-weight: 800; font-size: 1.2rem; text-decoration: none; }
.nav-pages { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.82rem; }
.nav-pages a { text-decoration: none; opacity: 0.75; }
.nav-pages a.actif { opacity: 1; font-weight: 600; border-bottom: 2px solid currentColor; }
.bouton-wa-entete { background: #25d366; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; }
.wa-flottant { position: fixed; bottom: 20px; right: 20px; background: #25d366; width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,0.25); z-index: 20; }
.hero-page { position: relative; padding: 72px 24px; text-align: center; color: white; overflow: hidden; }
.hero-grand { padding: 100px 24px; }
.hero-page h1 { font-size: clamp(1.6rem, 5vw, 2.8rem); text-shadow: 0 2px 10px rgba(0,0,0,0.4); }
.hero-page p { margin-top: 10px; font-size: 1.05rem; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
.hero-fond { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: -2; }
.hero-voile { position: absolute; inset: 0; background: rgba(0,0,0,0.45); z-index: -1; }
.section { padding: 48px 24px; max-width: 780px; margin: 0 auto; }
.section h2 { margin-bottom: 16px; }
.grille-images { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.grille-dense { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.grille-images div { aspect-ratio: 1; border-radius: 12px; background-size: cover; background-position: center; }
.grille-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; max-width: 780px; margin: 0 auto; }
.feature { text-align: center; padding: 16px; }
.feature-puce { width: 36px; height: 36px; border-radius: 50%; background: currentColor; opacity: 0.15; margin: 0 auto 10px; }
.cartes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.carte { border-radius: 14px; overflow: hidden; border: 1px solid #0001; }
.carte .photo { height: 140px; background-size: cover; background-position: center; }
.carte .texte { padding: 14px; }
.cartes-temoignages { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.temoignage { padding: 18px; border-radius: 14px; background: currentColor; background: rgba(0,0,0,0.04); }
.temoignage span { display: block; margin-top: 10px; font-size: 0.85rem; opacity: 0.7; }
.categorie-menu { margin-bottom: 28px; }
.categorie-menu h3 { margin-bottom: 10px; }
.ligne-menu { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #0002; }
.grille-produits { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.carte-produit { border-radius: 14px; overflow: hidden; border: 1px solid #0001; }
.carte-produit .photo { aspect-ratio: 1; background-size: cover; background-position: center; }
.carte-produit .texte { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.prix { font-weight: 700; opacity: 0.8; }
.bouton-petit { margin-top: 6px; border: none; border-radius: 16px; padding: 8px 14px; font-size: 0.85rem; cursor: pointer; background: currentColor; color: white; }
.formulaire { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
.formulaire input, .formulaire textarea { padding: 12px 14px; border-radius: 10px; font-family: inherit; border: 2px solid currentColor; }
.bouton { display: inline-block; margin-top: 12px; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; color: white; }
.pied { padding: 40px 24px 24px; font-size: 0.88rem; }
.pied-colonnes { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; max-width: 780px; margin: 0 auto 20px; }
.pied a { display: block; margin-top: 6px; }
.mention { text-align: center; opacity: 0.5; font-size: 0.75rem; }
details { border-bottom: 1px solid #0001; padding: 12px 0; }
summary { cursor: pointer; font-weight: 600; }
details p { margin-top: 8px; opacity: 0.8; }
`;

function enveloppe({ titrePage, commerce, pages, pageActuelle, palette, corps, famille }) {
  const description = `${commerce.nom} — ${titrePage} à ${commerce.ville || ''}.`.slice(0, 155);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titrePage} — ${commerce.nom}</title>
<meta name="description" content="${description}" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏪</text></svg>" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Schibsted Grotesk', Arial, sans-serif; background: ${palette.fond}; color: ${palette.texte}; }
  a { color: inherit; }
  .bouton, .bouton-petit, .wa-flottant, .bouton-wa-entete { color: white; }
  .bouton, .bouton-petit { background: ${palette.primaire}; }
  .section h2, .feature-puce, .formulaire input, .formulaire textarea { color: ${palette.primaire}; }
  .nav-pages a.actif { border-color: ${palette.primaire}; }
  ${STYLE_SUPPLEMENTAIRE}
  ${STYLE_ANIMATIONS}
</style>
</head>
<body>
${entete(commerce, pages, pageActuelle)}
${corps}
${pied(commerce)}
${boutonWhatsappFlottant(commerce)}
<script>${SCRIPT_ANIMATIONS}</script>
</body>
</html>`;
}

export function genererSiteMultiPages(commerce, famille) {
  const seed = hashSimple(commerce.id || commerce.nom);
  const { palette } = styleEtAccroche(commerce, famille.id, seed);
  const pages = famille.pages_essentielles;
  const resultat = {};

  for (const titrePage of pages) {
    const photos = photosDuSecteur(commerce.metier_numero, seed + hashSimple(titrePage), 7);
    const corps = choisirGabarit(titrePage, commerce, famille, palette, photos);
    const slug = slugifier(titrePage);
    resultat[slug] = {
      titre: titrePage,
      html: enveloppe({ titrePage, commerce, pages, pageActuelle: titrePage, palette, corps, famille }),
    };
  }

  return resultat;
}
