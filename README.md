# TEG Tracker

Suivi des taux de crédit immobilier et aide à la renégociation, pour un prêt **composite** (PTZ + prêt classique). L'outil :

- suit dans le temps les taux du marché (source Banque de France) ;
- calcule le **TEG de départ** (TAEG, assurance incluse) de la combinaison de tranches ;
- rend un verdict chiffré **renégocier / attendre** sur la **tranche classique** (le PTZ à 0 % n'est jamais renégocié), via une **économie nette** complète (frais IRA, dossier, garantie inclus) ;
- expose une CLI (collecte + verdict) et un petit dashboard web React (courbe des taux + simulation).

## Conventions de données (importantes)

- **Montants : centimes entiers** partout dans le domaine. Conversion en euros uniquement à l'affichage. Évite les erreurs de flottants.
- **Taux : points de base entiers (bp)** — 1 bp = 0,01 %, donc 3,10 % = `310`. La fraction décimale n'apparaît que transitoirement dans un calcul, jamais en stockage ni en comparaison.
- Dans les **fichiers de config**, c'est plus humain : montants en **euros**, taux en **pourcent** (ex. `3.5`). La conversion cents/bp est faite au chargement.

## Architecture (hexagonale fonctionnelle)

`adapters → application → domain` (dépendances vers le centre uniquement). Effets en `Future<Result<…>>` (Boxed). Use cases injectés depuis `src/composition-root.ts`.

```
src/
  domain/         model/ (loan, market-rate, verdict, amortization-schedule), services/ (amortization, apr, renegotiation), money.ts, rate.ts
  application/    ports/ (types de fonctions), use-cases/ (collect, compute-initial-apr, evaluate-renegotiation, simulate-scenario, get-rate-history)
  adapters/
    driven/       bdf-webstat.source · json-rate.repository · json-loan-config · csv-amortization-schedule
    driving/      cli/ (collect|verdict|serve) · http/ (server Hono)
web/              SPA React (Vite), Boxed Future/AsyncData, graphe SVG
data/             loan.json · rates.json · tableau.csv (optionnel)
```

## Configuration

Copier l'exemple et l'adapter :

```bash
cp data/loan.json.example data/loan.json
```

`tableau.csv` (optionnel) : ton **tableau d'amortissement réel** (export banque) au format
`month,payment,principal,interest,outstanding` (montants en euros). S'il est présent, le coût restant de l'ancien prêt est lu **exactement** dans ce tableau ; sinon, mode dégradé recalculé depuis les paramètres. Voir `data/tableau.csv.example`.

## Source des taux

Par **défaut, aucune configuration** : la source est l'**API publique de la BCE** (ECB Data Portal), série MIR du taux des crédits immobiliers aux ménages en France, en SDMX-JSON, **sans clé**. `npm run collect` (ou `docker compose run --rm collect`) fonctionne directement.

Override optionnel (autre série, ou Banque de France Webstat qui exige une clé développeur) via variables d'environnement :

```bash
export RATE_SOURCE_URL="https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2C.A.R.A.2250.EUR.N?format=jsondata"
export RATE_SOURCE_KEY="<clé d'abonnement>"   # uniquement si la source en exige une (ex. BdF Webstat)
```

Le parser accepte les deux formes de SDMX-JSON (BCE : `structure`/`dataSets` à la racine ; BdF : sous `data`). Les taux sont convertis de pourcent en **points de base entiers** (3,10 % → 310 bp).

Alternative manuelle : alimenter `data/rates.json` à la main, format `[{ "date": "2026-06", "rateBp": 310 }]`.

## Commandes

```bash
npm install
npm test              # suite de tests (domaine + use cases + adapters)
npm run typecheck     # tsc backend
npm run typecheck:web # tsc front
npm run build:web     # build du dashboard React (web/dist)

npm run db:setup        # crée le schéma PostgreSQL (migration, idempotent)
npm run import:loan      # importe le prêt en base (défaut: data/loan.json) — remplace l'existant
npm run import:schedule  # importe l'échéancier (défaut: data/tableau.csv) — remplace l'existant
npm run collect          # récupère les taux (BCE) et les historise en base (cron)
npm run import:all       # import:loan + import:schedule + collect
npm run verdict          # affiche le TEG de départ + le verdict en terminal
npm run serve            # lance le dashboard (http://localhost:3000)
npm run dev:web          # dev front avec HMR (proxy /api vers :3000)
```

Toutes ces commandes nécessitent `DATABASE_URL` (fourni par Docker, ou un Postgres local).
**PostgreSQL est l'unique source de vérité au runtime.** Les fichiers `data/loan.json` et
`data/tableau.csv` ne sont que les **entrées par défaut** des commandes d'import (mettre à jour
le fichier puis relancer `import:loan` / `import:schedule`). Pour changer de tableau ou les
données structurantes du prêt : éditer/remplacer le fichier source et réimporter.

## Docker

```bash
docker compose up --build                                  # Postgres + dashboard (http://localhost:3000)
docker compose run --rm dashboard npm run import:all       # 1er remplissage de la base (prêt + échéancier + taux)
docker compose run --rm collect                            # collecte one-shot des taux (pour un cron)
```

Au premier `up`, le schéma est migré mais la base est **vide** → lancer `import:all` une fois.
Ensuite tout persiste dans le volume `pgdata`. Le dossier `data/` est monté sur le service
`dashboard` (sources d'import). Source des taux : BCE par défaut, override via
`RATE_SOURCE_URL` / `RATE_SOURCE_KEY`.
