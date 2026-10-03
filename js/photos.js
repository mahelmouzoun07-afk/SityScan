// Mappe chaque secteur (1-57) vers son dossier de photos dans le dépôt public
// github.com/mahelmouzoun07-afk/images (100 photos par secteur, 001.jpg à 100.jpg).

const BASE_URL = "https://raw.githubusercontent.com/mahelmouzoun07-afk/images/main";

const DOSSIERS = {
  1: "01_Restaurants_maquis_buvettes_bars",
  2: "02_Boutiques_commerces_detail",
  3: "03_Hotels_auberges_residences",
  4: "04_Banques_transfert_mobile_money",
  5: "05_Stations_service",
  6: "06_Ecoles_universites_formation",
  7: "07_Salons_coiffure_beaute",
  8: "08_Cliniques_hopitaux_laboratoires",
  9: "09_Garages_mecaniciens_pieces_auto",
  10: "10_Agences_immobilieres",
  11: "11_Eglises_mosquees_associations",
  12: "12_Boites_de_nuit_lounges",
  13: "13_Agences_voyage_transporteurs",
  14: "14_Avocats_comptables_consultants",
  15: "15_Agences_web_communication",
  16: "16_Salles_de_sport",
  17: "17_Photographes_traiteurs",
  18: "18_Imprimeries_publicite",
  19: "19_Bureaux_etudes_architectes",
  20: "20_Notaires_huissiers",
  21: "21_Securite_gardiennage",
  22: "22_Nettoyage_desinsectisation",
  23: "23_Recrutement_interim",
  24: "24_Cabinets_dentaires_opticiens",
  25: "25_Veterinaires",
  26: "26_Kinesitherapeutes_reeducation",
  27: "27_Spas_massage",
  28: "28_Plombiers_electriciens_climaticiens",
  29: "29_Menuisiers_soudeurs_vitriers",
  30: "30_Materiaux_carrelage",
  31: "31_Decorateurs_interieur",
  32: "32_Salles_reception_conference",
  33: "33_Decorateurs_mariage_DJ_sonorisation",
  34: "34_Location_baches_chaises_vehicules",
  35: "35_Wedding_planners",
  36: "36_Auto_ecoles",
  37: "37_Creches_garderies",
  38: "38_Laveries_pressings",
  39: "39_Imprimeurs_teeshirts_brodeurs",
  40: "40_Coworkings_cybercafes",
  41: "41_Energie_solaire",
  42: "42_Taxis_VTC_coursiers",
  43: "43_Demenageurs_transitaires",
  44: "44_Loueurs_voitures",
  45: "45_Concessionnaires_lavage_auto",
  46: "46_Boulangeries_patisseries",
  47: "47_Boucheries_poissonneries",
  48: "48_Fleuristes",
  49: "49_Librairies_papeteries",
  50: "50_Telephonie_reparation_informatique",
  51: "51_Couturiers_stylistes",
  52: "52_Studios_photo_video_musique",
  53: "53_Assurances",
  54: "54_ONG_organisations_internationales",
  55: "55_Ecoles_de_langues",
  56: "56_Pompes_funebres",
  57: "57_Transformation_agroalimentaire",
};

function zeroPad3(n) {
  return String(n).padStart(3, "0");
}

// Renvoie jusqu'à `nombre` URLs de photos pour ce secteur, en commençant
// à un indice dérivé du style choisi (pour varier les photos d'une maquette à l'autre).
export function photosDuSecteur(metierNumero, styleIndex, nombre = 4) {
  const dossier = DOSSIERS[metierNumero];
  if (!dossier) return [];

  const urls = [];
  for (let i = 0; i < nombre; i++) {
    const indice = ((styleIndex + i * 13) % 100) + 1; // 1 à 100
    urls.push(`${BASE_URL}/${dossier}/${zeroPad3(indice)}.jpg`);
  }
  return urls;
}
