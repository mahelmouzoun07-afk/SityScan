// Petit état partagé entre modules : signale qu'on vient de terminer le questionnaire,
// pour afficher l'écran "Ton plan" après le tout premier scan seulement.
export const etatFlux = {
  venantDeOnboarding: false,
};
