import { supabase } from "./main.js";

export async function chargerScript(metierNumero) {
  const { data: secteur } = await supabase
    .from("secteurs")
    .select("famille")
    .eq("metier_numero", metierNumero)
    .single();

  if (!secteur) return { script: "Script non disponible.", objections: [] };

  const { data: famille } = await supabase
    .from("familles")
    .select("script_vente, reponses_objections")
    .eq("id", secteur.famille)
    .single();

  return {
    script: famille?.script_vente || "Script non disponible.",
    objections: famille?.reponses_objections || [],
  };
}
