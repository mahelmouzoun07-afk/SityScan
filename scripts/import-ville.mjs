// Usage : node scripts/import-ville.mjs <chemin-csv> <ville> <pays>
// Exemple : node scripts/import-ville.mjs data/import/cotonou.csv "Cotonou" "Bénin"

import { readFileSync } from "node:fs";

const [, , csvPath, ville, pays] = process.argv;

if (!csvPath || !ville || !pays) {
  console.error("Usage: node scripts/import-ville.mjs <chemin-csv> <ville> <pays>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Variables d'environnement manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Parseur CSV minimal, gère les champs entre guillemets contenant des virgules
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignoré */ }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toNumberOrNull(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

const raw = readFileSync(csvPath, "utf-8");
const rows = parseCSV(raw);
const headers = rows[0].map(h => h.trim());
const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ""));

const idx = (nom) => headers.findIndex(h => h.toLowerCase().startsWith(nom.toLowerCase()));

const iQuartier = idx("Quartier");
const iNom = idx("Nom");
const iMetier = idx("Métier");
const iAdresse = idx("Adresse");
const iMaps = idx("Lien Google Map");
const iSiteWeb = idx("Site web");
const iTelephone = idx("Téléphone");
const iNote = idx("Note");
const iNbAvis = idx("Nb avis");
const iStatut = idx("Statut");
const iNotes = idx("Notes");

const commerces = dataRows.map((r) => {
  const metierBrut = r[iMetier]?.trim() || "";
  const matchNumero = metierBrut.match(/^(\d+)\./);

  return {
    ville,
    pays,
    quartier: r[iQuartier]?.trim() || null,
    nom: r[iNom]?.trim() || null,
    metier_numero: matchNumero ? parseInt(matchNumero[1], 10) : null,
    metier_label: metierBrut || null,
    adresse: r[iAdresse]?.trim() || null,
    lien_google_maps: r[iMaps]?.trim() || null,
    a_un_site: (r[iSiteWeb]?.trim() || "").toLowerCase() === "oui",
    telephone: (r[iTelephone]?.trim() === "Non trouvé") ? null : (r[iTelephone]?.trim() || null),
    note: toNumberOrNull(r[iNote]),
    nb_avis: toIntOrNull(r[iNbAvis]),
    statut: r[iStatut]?.trim() || "À contacter",
    notes: r[iNotes]?.trim() || null,
  };
}).filter(c => c.nom && c.lien_google_maps);

console.log(`${commerces.length} commerces à importer pour ${ville}, ${pays}.`);

const res = await fetch(`${SUPABASE_URL}/rest/v1/commerces?on_conflict=lien_google_maps`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Prefer": "resolution=merge-duplicates",
  },
  body: JSON.stringify(commerces),
});

if (!res.ok) {
  console.error("Erreur import :", res.status, await res.text());
  process.exit(1);
}

console.log("Import terminé avec succès.");
process.exit(0);