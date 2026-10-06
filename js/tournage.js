// Mode tournage : masque les numéros de téléphone à l'écran (pour filmer une démo).
let actif = false;

export function initModeTournage() {
  const btn = document.getElementById("btn-mode-tournage");
  btn.addEventListener("click", () => {
    actif = !actif;
    document.body.classList.toggle("mode-tournage", actif);
    btn.textContent = actif ? "Mode tournage ●" : "Mode tournage";
    btn.classList.toggle("actif-rouge", actif);
  });
}
