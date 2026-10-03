// Animation "apparition au défilement" — implémentation maison (IntersectionObserver),
// inspirée du principe standard observé sur des sites modernes, pas copiée.

export const STYLE_ANIMATIONS = `
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-stagger > * { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal-stagger.visible > * { opacity: 1; transform: translateY(0); }
.reveal-stagger.visible > *:nth-child(1) { transition-delay: 0.05s; }
.reveal-stagger.visible > *:nth-child(2) { transition-delay: 0.15s; }
.reveal-stagger.visible > *:nth-child(3) { transition-delay: 0.25s; }
.reveal-stagger.visible > *:nth-child(4) { transition-delay: 0.35s; }
.hero-zoom { animation: heroZoom 14s ease-in-out infinite alternate; }
@keyframes heroZoom { from { transform: scale(1); } to { transform: scale(1.08); } }
`;

export const SCRIPT_ANIMATIONS = `
document.addEventListener("DOMContentLoaded", function () {
  var cibles = document.querySelectorAll(".reveal, .reveal-stagger");
  var observateur = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (entree) {
      if (entree.isIntersecting) {
        entree.target.classList.add("visible");
        observateur.unobserve(entree.target);
      }
    });
  }, { threshold: 0.15 });
  cibles.forEach(function (el) { observateur.observe(el); });
});
`;
