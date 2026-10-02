// Génère les données d'une maquette (texte + style) à partir d'un commerce,
// puis les transforme en page HTML autonome.

const ACCROCHES = {
  restauration: [
    "Le goût de {quartier}, servi avec le sourire.",
    "{nom} — on vous attend à table.",
    "Une adresse à {ville} qu'on ne vous présente plus.",
  ],
  commerce_detail: [
    "Tout ce qu'il vous faut, à {quartier}.",
    "{nom} — votre boutique de confiance à {ville}.",
    "La qualité, à deux pas de chez vous.",
  ],
  hebergement: [
    "Posez vos valises à {quartier}.",
    "{nom} — votre séjour commence ici.",
    "Confort et accueil, au cœur de {ville}.",
  ],
  finance: [
    "Votre argent, simplifié.",
    "{nom} — des solutions claires, à {quartier}.",
    "La confiance d'abord.",
  ],
  transport_auto: [
    "On vous emmène, où que vous alliez.",
    "{nom} — votre véhicule entre de bonnes mains.",
    "Fiable, rapide, à {ville}.",
  ],
  education: [
    "Apprendre, grandir, réussir.",
    "{nom} — l'excellence à {quartier}.",
    "Votre avenir commence ici.",
  ],
  beaute_bien_etre: [
    "Prenez soin de vous à {quartier}.",
    "{nom} — votre moment à vous.",
    "La beauté, sans compromis.",
  ],
  sante: [
    "Votre santé, notre priorité.",
    "{nom} — un soin attentif à {ville}.",
    "Prendre soin de vous, simplement.",
  ],
  artisans_btp: [
    "Du travail bien fait, à {quartier}.",
    "{nom} — votre projet entre de bonnes mains.",
    "Solide, fiable, durable.",
  ],
  services_pro: [
    "Des solutions sur mesure, à {ville}.",
    "{nom} — votre partenaire de confiance.",
    "L'expertise à votre service.",
  ],
  organisations: [
    "Ensemble, à {quartier}.",
    "{nom} — une communauté qui vous ressemble.",
    "Rejoignez-nous.",
  ],
  evenementiel: [
    "Vos moments précieux, bien organisés.",
    "{nom} — on s'occupe de tout.",
    "Un événement réussi commence ici.",
  ],
  autres: [
    "{nom} — à votre service à {quartier}.",
    "Simple, rapide, efficace.",
    "Une adresse à connaître à {ville}.",
  ],
};

const PALETTES = [
  { primaire: "#1d5bff", fond: "#ffffff", texte: "#0b1b3f" },
  { primaire: "#d4572a", fond: "#fff8f3", texte: "#2b1a10" },
  { primaire: "#1a8f5c", fond: "#f3fff8", texte: "#0d2b1c" },
  { primaire: "#9b2bd4", fond: "#faf3ff", texte: "#2b0d2b" },
];

function hashSimple(texte) {
  let h = 0;
  for (let i = 0; i < texte.length; i++) {
    h = (h * 31 + texte.charCodeAt(i)) >>> 0;
  }
  return h;
}

function remplacerVariables(texte, commerce) {
  return texte
    .replace(/{nom}/g, commerce.nom)
    .replace(/{ville}/g, commerce.ville || "")
    .replace(/{quartier}/g, commerce.quartier || commerce.ville || "");
}

export function genererDonneesMaquette(commerce, styleIndex = null) {
  const famille = commerce.famille || "autres";
  const banqueAccroches = ACCROCHES[famille] || ACCROCHES.autres;
  const base = hashSimple(commerce.id || commerce.nom);

  const indexStyle = styleIndex !== null ? styleIndex : base % (banqueAccroches.length * PALETTES.length);
  const indexAccroche = indexStyle % banqueAccroches.length;
  const indexPalette = Math.floor(indexStyle / banqueAccroches.length) % PALETTES.length;

  return {
    styleIndex: indexStyle,
    famille,
    accroche: remplacerVariables(banqueAccroches[indexAccroche], commerce),
    palette: PALETTES[indexPalette],
    nom: commerce.nom,
    quartier: commerce.quartier,
    ville: commerce.ville,
    telephone: commerce.telephone,
    adresse: commerce.adresse,
  };
}

export function rendreHtmlMaquette(donnees) {
  const { nom, accroche, palette, quartier, ville, telephone, adresse } = donnees;
  const lienWhatsapp = telephone
    ? `https://wa.me/${telephone.replace(/[^0-9]/g, "")}`
    : null;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${nom}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Schibsted Grotesk', Arial, sans-serif; background: ${palette.fond}; color: ${palette.texte}; }
  .hero { padding: 64px 24px; text-align: center; background: ${palette.primaire}; color: white; }
  .hero h1 { font-size: clamp(1.8rem, 6vw, 3rem); margin-bottom: 12px; }
  .hero p { font-size: 1.2rem; opacity: 0.9; }
  .section { padding: 40px 24px; max-width: 700px; margin: 0 auto; }
  .section h2 { margin-bottom: 16px; color: ${palette.primaire}; }
  .galerie { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .galerie div { aspect-ratio: 1; border-radius: 12px; background: ${palette.primaire}22; }
  .contact { text-align: center; padding: 40px 24px; }
  .bouton { display: inline-block; margin-top: 16px; background: ${palette.primaire}; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
  <div class="hero">
    <h1>${nom}</h1>
    <p>${accroche}</p>
  </div>
  <div class="section">
    <h2>À propos</h2>
    <p>${nom} vous accueille à ${quartier || ville}. Qualité et service au rendez-vous.</p>
  </div>
  <div class="section">
    <h2>Galerie</h2>
    <div class="galerie"><div></div><div></div><div></div></div>
  </div>
  <div class="contact">
    <h2>Nous contacter</h2>
    <p>${adresse || ""}</p>
    ${lienWhatsapp ? `<a class="bouton" href="${lienWhatsapp}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>` : ""}
  </div>
</body>
</html>`;
}

export function encoderMaquettePourUrl(donnees) {
  const json = JSON.stringify(donnees);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decoderMaquetteDepuisUrl(encode) {
  const json = decodeURIComponent(escape(atob(encode)));
  return JSON.parse(json);
}
