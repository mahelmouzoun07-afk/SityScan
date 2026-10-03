# E-mails automatiques SityScan

Tous déclenchés automatiquement, gérés par `emails_a_envoyer` + la tâche quotidienne + l'Edge Function `envoyer-emails`.

| Type | Objet | Déclencheur |
|---|---|---|
| `bienvenue` | Bienvenue sur SityScan | Création de compte |
| `formule_activee` | Ta formule [X] est activée | Paiement confirmé (via `activer_formule()`) |
| `rappel_expiration` | Ton abonnement expire dans 3 jours | 3 jours avant `plan_expire_le` |
| `acces_coupe` | Ton accès a été suspendu | Le jour de l'expiration, sans renouvellement |
| `echec_paiement` | Ton paiement n'a pas abouti | À déclencher depuis le futur webhook de l'agrégateur |
| `ville_prete` | Ta ville a été scannée | À déclencher manuellement quand une ville demandée est ajoutée |

## Pour activer l'envoi réel
1. Créer un compte gratuit sur resend.com
2. Ajouter le secret `RESEND_API_KEY` dans Supabase (Project Settings → Edge Functions → Secrets)
3. Optionnel : `EMAIL_EXPEDITEUR` (sinon "SityScan <contact@sityscan.africa>")

Sans cette clé, les e-mails restent en attente dans `emails_a_envoyer` (rien n'est perdu), la fonction le confirme sans planter.
