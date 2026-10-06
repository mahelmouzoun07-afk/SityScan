export function initKitLegal() {
  document.getElementById("btn-kit-legal").addEventListener("click", () => {
    document.getElementById("ecran-kit-legal").hidden = false;
  });
  document.getElementById("btn-fermer-kit-legal").addEventListener("click", () => {
    document.getElementById("ecran-kit-legal").hidden = true;
  });
}
