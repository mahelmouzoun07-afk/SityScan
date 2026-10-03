// Banques de contenu générique (témoignages, features, FAQ) — à personnaliser
// plus tard via "Modifier le site". Écrit par nous, pas copié.

export const FEATURES_PAR_FAMILLE = {
  restauration: ["Ingrédients frais chaque jour", "Service rapide et soigné", "Cadre convivial", "Commande WhatsApp facile"],
  beaute_bien_etre: ["Produits de qualité", "Professionnels expérimentés", "Hygiène irréprochable", "Rendez-vous flexible"],
  sante: ["Équipe qualifiée", "Prise en charge rapide", "Matériel aux normes", "Accueil attentif"],
  education: ["Programme structuré", "Équipe pédagogique investie", "Suivi personnalisé", "Résultats concrets"],
  _default: ["Qualité constante", "Équipe à votre écoute", "Rapport qualité-prix", "Proche de chez vous"],
};

export const TEMOIGNAGES_GENERIQUES = [
  { texte: "Très satisfait du service, je recommande sans hésiter.", auteur: "Client régulier" },
  { texte: "Accueil chaleureux et professionnalisme au rendez-vous.", auteur: "Cliente fidèle" },
  { texte: "Exactement ce que je cherchais dans le quartier.", auteur: "Client du coin" },
];

export const FAQ_GENERIQUE = [
  { q: "Quels sont vos horaires ?", r: "Contactez-nous directement sur WhatsApp pour connaître nos horaires actuels." },
  { q: "Comment vous contacter ?", r: "Le plus simple est WhatsApp — bouton en haut et en bas de chaque page." },
  { q: "Prenez-vous les paiements Mobile Money ?", r: "À confirmer directement avec nous selon le moyen de paiement souhaité." },
];

export function featuresDeLaFamille(familleId) {
  return FEATURES_PAR_FAMILLE[familleId] || FEATURES_PAR_FAMILLE._default;
}
