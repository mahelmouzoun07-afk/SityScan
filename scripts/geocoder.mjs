// Usage : node --env-file=.env scripts/geocoder.mjs
// Géocode tous les commerces sans latitude/longitude, via Nominatim (OpenStreetMap, gratuit).
// Version 2 : nettoie les adresses, diagnostics complets en cas d'échec, repli sur ville/pays.

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

// Retire les annotations de collecte type "(estimé GPS)", "(d'après le nom)", "(À vérifier)"
function nettoyer(texte) {
  if (!texte) return "";
  return texte.replace(/\([^)]*\)/g, "").trim();
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
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(requete)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SityScan/1.0 (+https://github.com/mahelmouzoun07-afk/SityScan; usage interne ponctuel)",
      "Accept-Language": "fr",
    },
  });

  const texteBrut = await res.text();
  let data;
  try {
    data = JSON.parse(texteBrut);
  } catch {
    return { ok: false, statut: res.status, brut: texteBrut.slice(0, 200) };
  }

  if (!res.ok) return { ok: false, statut: res.status, brut: texteBrut.slice(0, 200) };
  if (!data.length) return { ok: false, statut: res.status, brut: "réponse vide (aucun résultat)" };

  return { ok: true, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
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
console.log(`${commerces.length} commerces à géocoder.\n`);

let reussis = 0, approximatifs = 0, echoues = 0;

for (const c of commerces) {
  const quartier = nettoyer(c.quartier);
  const adresse = nettoyer(c.adresse);
  const requetePrecise = [quartier, adresse, c.ville, c.pays].filter(Boolean).join(", ");

  let resultat = await geocoder(requetePrecise);

  if (!resultat.ok) {
    console.warn(`✗ Échec requête précise "${requetePrecise}" — HTTP ${resultat.statut} : ${resultat.brut}`);
    await attendre(1200);

    // Repli : coordonnées approximatives de la ville, mieux que rien, marqué à vérifier
    const requeteVille = [c.ville, c.pays].filter(Boolean).join(", ");
    resultat = await geocoder(requeteVille);

    if (resultat.ok) {
      console.log(`  → repli ville "${requeteVille}" réussi : ${resultat.lat}, ${resultat.lon} (approximatif)`);
      await mettreAJour(c.id, resultat.lat, resultat.lon);
      approximatifs++;
    } else {
      console.error(`  → repli ville aussi en échec — HTTP ${resultat.statut} : ${resultat.brut}`);
      echoues++;
    }
  } else {
    console.log(`✓ ${c.nom} → ${resultat.lat}, ${resultat.lon}`);
    await mettreAJour(c.id, resultat.lat, resultat.lon);
    reussis++;
  }

  await attendre(1200); // 1 req/seconde max, imposé par Nominatim
}

console.log(`\nTerminé. ${reussis} précis, ${approximatifs} approximatifs (ville), ${echoues} échoués.`);
process.exit(0);
