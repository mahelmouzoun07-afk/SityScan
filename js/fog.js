// Effet de "brume qui se lève" : un calque semi-opaque par-dessus la carte,
// qui s'estompe progressivement pour révéler les points.

export function creerBrume(conteneurId) {
  const conteneur = document.getElementById(conteneurId);
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.zIndex = "4";
  canvas.style.pointerEvents = "none";
  conteneur.appendChild(canvas);

  function ajusterTaille() {
    canvas.width = conteneur.clientWidth;
    canvas.height = conteneur.clientHeight;
  }
  ajusterTaille();
  window.addEventListener("resize", ajusterTaille);

  const ctx = canvas.getContext("2d");

  function dessiner(opacite) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(11, 27, 63, ${opacite})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return {
    leverLaBrume(dureeMs = 1800) {
      return new Promise((resolve) => {
        dessiner(0.75);
        const debut = performance.now();
        function animer(maintenant) {
          const t = Math.min(1, (maintenant - debut) / dureeMs);
          dessiner(0.75 * (1 - t));
          if (t < 1) {
            requestAnimationFrame(animer);
          } else {
            canvas.remove();
            window.removeEventListener("resize", ajusterTaille);
            resolve();
          }
        }
        requestAnimationFrame(animer);
      });
    },
  };
}
