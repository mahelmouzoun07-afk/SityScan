import { ACCROCHES, PALETTES, hashSimple, remplacerVariables } from "./maquette.js";
import { photosDuSecteur } from "./photos.js";
import { STYLE_ANIMATIONS, SCRIPT_ANIMATIONS } from "./animations.js";

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

function entete(commerce, pages, pageActuelle, palette) {
  const liens = pages
    .map((p) => `<a href="${slugifier(p)}.html" class="${p === pageActuelle ? 'actif' : ''}">${p}</a>`)
    .join("");
  return `
  <header class="entete">
    <a href="accueil.html" class="logo">${commerce.nom}</a>
    <nav class="nav-pages">${liens}</nav>
  </header>`;
}

function pied(commerce, palette) {
  const lienWhatsapp = commerce.telephone
    ? `https://wa.me/${commerce.telephone.replace(/[^0-9]/g, "")}`
    : null;
  return `
  <footer class="pied">
    <p>${commerce.nom} · ${commerce.adresse || commerce.quartier || ""}</p>
    ${lienWhatsapp ? `<a href="${lienWhatsapp}" target="_blank" rel="noopener" class="bouton-wa">Écrire sur WhatsApp</a>` : ""}
    <p class="mention">Site généré avec SityScan</p>
  </footer>`;
}

function enveloppe({ titrePage, commerce, pages, pageActuelle, palette, corps }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titrePage} — ${commerce.nom}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Schibsted Grotesk', Arial, sans-serif; background: ${palette.fond}; color: ${palette.texte}; }
  a { color: inherit; }
  .entete { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; flex-wrap: wrap; gap: 8px; }
  .logo { font-weight: 800; font-size: 1.2rem; text-decoration: none; color: ${palette.primaire}; }
  .nav-pages { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.85rem; }
  .nav-pages a { text-decoration: none; opacity: 0.75; }
  .nav-pages a.actif { opacity: 1; font-weight: 600; border-bottom: 2px solid ${palette.primaire}; }
  .hero-page { position: relative; padding: 72px 24px; text-align: center; color: white; overflow: hidden; }
  .hero-page h1 { font-size: clamp(1.6rem, 5vw, 2.6rem); text-shadow: 0 2px 10px rgba(0,0,0,0.4); }
  .hero-page p { margin-top: 10px; font-size: 1.05rem; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
  .hero-fond { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: -2; }
  .hero-voile { position: absolute; inset: 0; background: rgba(0,0,0,0.45); z-index: -1; }
  .section { padding: 48px 24px; max-width: 760px; margin: 0 auto; }
  .section h2 { color: ${palette.primaire}; margin-bottom: 16px; }
  .grille-images { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
  .grille-images div { aspect-ratio: 1; border-radius: 12px; background-size: cover; background-position: center; }
  .cartes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .carte { border-radius: 14px; overflow: hidden; border: 1px solid #0001; }
  .carte .photo { height: 140px; background-size: cover; background-position: center; }
  .carte .texte { padding: 14px; }
  .formulaire { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
  .formulaire input, .formulaire textarea { padding: 12px 14px; border: 2px solid ${palette.primaire}55; border-radius: 10px; font-family: inherit; }
  .bouton { display: inline-block; margin-top: 12px; background: ${palette.primaire}; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; }
  .pied { text-align: center; padding: 32px 24px; font-size: 0.85rem; opacity: 0.75; }
  .bouton-wa { display: inline-block; margin: 10px 0; background: #25d366; color: white; padding: 10px 20px; border-radius: 20px; text-decoration: none; }
  .mention { margin-top: 8px; font-size: 0.75rem; opacity: 0.5; }
  ${STYLE_ANIMATIONS}
</style>
</head>
<body>
${entete(commerce, pages, pageActuelle, palette)}
${corps}
${pied(commerce, palette)}
<script>${SCRIPT_ANIMATIONS}</script>
</body>
</html>`;
}

function imageFond(url) {
  return url ? `<div class="hero-fond hero-zoom" style="background-image:url('${url}')"></div><div class="hero-voile"></div>` : "";
}

// --- Gabarits de page, choisis par mot-clé dans le nom de la page ---

function pageAccueil(commerce, famille, palette, accroche, photos) {
  return `
  <div class="hero-page">
    ${imageFond(photos[0])}
    <h1>${commerce.nom}</h1>
    <p>${accroche}</p>
  </div>
  <div class="section reveal">
    <h2>Bienvenue</h2>
    <p>${commerce.nom} vous accueille à ${commerce.quartier || commerce.ville}. ${famille.element_cle ? `Notre priorité : ${famille.element_cle.toLowerCase()}.` : ""}</p>
  </div>
  <div class="section reveal-stagger grille-images">
    ${photos.slice(1, 4).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>`;
}

function pageGalerie(commerce, palette, photos) {
  return `
  <div class="hero-page" style="padding:48px 24px;">${imageFond(photos[0])}<h1>Galerie</h1></div>
  <div class="section reveal-stagger grille-images">
    ${photos.slice(1).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>`;
}

function pageContact(commerce, palette, photos) {
  const lienWhatsapp = commerce.telephone ? `https://wa.me/${commerce.telephone.replace(/[^0-9]/g, "")}` : null;
  return `
  <div class="hero-page" style="padding:48px 24px;">${imageFond(photos[0])}<h1>Contact</h1></div>
  <div class="section reveal">
    <h2>Nous trouver</h2>
    <p>${commerce.adresse || ""}</p>
    <p>${commerce.quartier || ""}, ${commerce.ville || ""}</p>
    ${lienWhatsapp ? `<a class="bouton" href="${lienWhatsapp}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ""}
  </div>`;
}

function pageTarifs(commerce, palette, photos) {
  return `
  <div class="hero-page" style="padding:48px 24px;">${imageFond(photos[0])}<h1>Tarifs</h1></div>
  <div class="section reveal-stagger cartes">
    ${["Formule simple", "Formule standard", "Formule complète"].map((nom, i) => `
      <div class="carte">
        <div class="photo" style="background-image:url('${photos[i + 1] || ''}')"></div>
        <div class="texte"><strong>${nom}</strong><p>Détails à personnaliser.</p></div>
      </div>`).join("")}
  </div>`;
}

function pageFormulaire(titre, commerce, palette, photos) {
  return `
  <div class="hero-page" style="padding:48px 24px;">${imageFond(photos[0])}<h1>${titre}</h1></div>
  <div class="section reveal">
    <form class="formulaire" onsubmit="event.preventDefault(); alert('Formulaire à activer.');">
      <input type="text" placeholder="Votre nom" required />
      <input type="tel" placeholder="Votre téléphone" required />
      <textarea placeholder="Votre demande" rows="4"></textarea>
      <button type="submit" class="bouton">Envoyer</button>
    </form>
  </div>`;
}

function pageEquipe(titre, commerce, palette, photos) {
  return `
  <div class="hero-page" style="padding:48px 24px;">${imageFond(photos[0])}<h1>${titre}</h1></div>
  <div class="section reveal-stagger cartes">
    ${photos.slice(1, 4).map((u) => `
      <div class="carte">
        <div class="photo" style="background-image:url('${u}')"></div>
        <div class="texte"><strong>Membre de l'équipe</strong><p>À personnaliser.</p></div>
      </div>`).join("")}
  </div>`;
}

function pageGenerique(titre, commerce, famille, palette, photos) {
  return `
  <div class="hero-page" style="padding:56px 24px;">${imageFond(photos[0])}<h1>${titre}</h1></div>
  <div class="section reveal">
    <p>${titre} — contenu à personnaliser pour ${commerce.nom}.</p>
  </div>
  <div class="section reveal-stagger grille-images">
    ${photos.slice(1, 3).map((u) => `<div style="background-image:url('${u}')"></div>`).join("")}
  </div>`;
}

function choisirGabarit(titre, commerce, famille, palette, photos) {
  const t = titre.toLowerCase();
  if (t.includes("accueil")) return pageAccueil(commerce, famille, palette, styleEtAccroche(commerce, famille.id, hashSimple(commerce.id)).accroche, photos);
  if (t.includes("galerie")) return pageGalerie(commerce, palette, photos);
  if (t.includes("contact")) return pageContact(commerce, palette, photos);
  if (t.includes("tarif")) return pageTarifs(commerce, palette, photos);
  if (t.includes("réservation") || t.includes("rendez-vous") || t.includes("inscription") || t.includes("devis") || t.includes("souscription") || t.includes("candidature"))
    return pageFormulaire(titre, commerce, palette, photos);
  if (t.includes("équipe") || t.includes("professionnels") || t.includes("agents") || t.includes("coachs"))
    return pageEquipe(titre, commerce, palette, photos);
  return pageGenerique(titre, commerce, famille, palette, photos);
}

// Génère toutes les pages "essentielles" (⭐) d'une famille pour un commerce donné.
// Retourne { [slug]: { titre, html } }
export function genererSiteMultiPages(commerce, famille) {
  const seed = hashSimple(commerce.id || commerce.nom);
  const { palette } = styleEtAccroche(commerce, famille.id, seed);
  const pages = famille.pages_essentielles;
  const resultat = {};

  for (const titrePage of pages) {
    const photos = photosDuSecteur(commerce.metier_numero, seed + hashSimple(titrePage), 5);
    const corps = choisirGabarit(titrePage, commerce, famille, palette, photos);
    const slug = slugifier(titrePage);
    resultat[slug] = {
      titre: titrePage,
      html: enveloppe({ titrePage, commerce, pages, pageActuelle: titrePage, palette, corps }),
    };
  }

  return resultat;
}
