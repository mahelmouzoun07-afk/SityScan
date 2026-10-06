// Génère une image 9:16 partageable (format story), via canvas.
export function genererCartePartage(ville, total) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  const degrade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  degrade.addColorStop(0, "#1d5bff");
  degrade.addColorStop(1, "#0b1b3f");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "bold 60px Arial";
  ctx.fillText("sityscan", canvas.width / 2, 220);

  ctx.font = "bold 240px Arial";
  ctx.fillText(String(total), canvas.width / 2, 900);

  ctx.font = "50px Arial";
  ctx.fillText("commerces sans site web référencé", canvas.width / 2, 1000);
  ctx.fillText("à " + ville, canvas.width / 2, 1070);

  ctx.font = "36px Arial";
  ctx.fillStyle = "#ffffffaa";
  ctx.fillText("Quel est le classement de ta ville ?", canvas.width / 2, 1750);

  return canvas;
}

export function telechargerCartePartage(ville, total) {
  const canvas = genererCartePartage(ville, total);
  const lien = document.createElement("a");
  lien.download = `sityscan-${ville.toLowerCase()}.png`;
  lien.href = canvas.toDataURL("image/png");
  lien.click();
}
