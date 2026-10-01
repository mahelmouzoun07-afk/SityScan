// Usage : node scripts/geocoder.mjs
// Géocode tous les commerces sans latitude/longitude, via Nominatim (OpenStreetMap, gratuit).
// Respecte la limite de 1 requête/seconde imposée par leur politique d'usage.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Variables d'environnement manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function recupererCommercesSansCoordonnees() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/commerces?latitude=is.null&select=id,nom,quartier,adresse,ville,pays`,
    { headers }
  );
  if (!res.ok) throw new Error(`Erreur récupération : ${res.status} ${await res.text()}`);
  return res.json();
}

async function geocoder(requete) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(requete)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScanTaVille-import/1.0 (usage interne, une seule fois)" },
  });
  if (!res.ok) throw new Error(`Erreur Nominatim : ${res.status}`);
  const data = await res.json();
  return data.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
}

async function mettreAJour(id, lat, lon) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/commerces?id=eq.${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ latitude: lat, longitude: lon }),
  });
  if (!res.ok) throw new Error(`Erreur mise à jour ${id} : ${res.status} ${await res.text()}`);
}

const commerces = await recupererCommercesSansCoordonnees();
console.log(`${commerces.length} commerces à géocoder.`);

let reussis = 0, echoues = 0;

for (const c of commerces) {
  const requete = [c.quartier, c.adresse, c.ville, c.pays].filter(Boolean).join(", ");
  try {
    const point = await geocoder(requete);
    if (point) {
      await mettreAJour(c.id, point.lat, point.lon);
      console.log(`✓ ${c.nom} → ${point.lat}, ${point.lon}`);
      reussis++;
    } else {
      console.warn(`✗ Introuvable : ${c.nom} (${requete})`);
      echoues++;
    }
  } catch (e) {
    console.error(`✗ Erreur sur ${c.nom} :`, e.message);
    echoues++;
  }
  await attendre(1100); // 1 req/seconde max, imposé par Nominatim
}

console.log(`\nTerminé. ${reussis} géocodés, ${echoues} échoués.`);
console.log("Les échoués gardent latitude/longitude = null, à corriger manuellement si besoin.");
process.exit(0);
