# Valify

SaaS de validation de prompts par LLM. Les clients configurent des "calls" (champs attendus + schéma de retour JSON) et appellent une API unique pour valider n'importe quel message utilisateur.

[Démo live](https://valify.bastienbretenet.fr)
---

## Démarrage

```bash
cp .env.example .env
# Ajouter OPENROUTER_API_KEY= dans .env

docker compose up --build

# Première fois uniquement — appliquer les migrations
docker compose exec backend alembic upgrade head
```

- Frontend : http://localhost:3000
- Backend : http://localhost:8000
- Swagger : http://localhost:8000/docs

---

## Utilisation

### 1. Créer un compte

Aller sur http://localhost:3000/register — l'inscription crée automatiquement un compte et une organisation.

### 2. Créer un projet et un call

Depuis le dashboard, créer un projet puis configurer un "call" avec :
- Les champs attendus (`expected_fields`) en JSON
- Le schéma de retour (`return_schema`) en JSON

### 3. Générer un token API

Dans **Settings → Tokens**, générer un token. Il s'affiche **une seule fois**.

### 4. Appeler l'API

```bash
curl -X POST http://localhost:8000/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "api_token": "sk_live_xxxx",
    "project": "mon-projet",
    "call": "validate-booking",
    "message": "Book me a flight to Paris"
  }'
```

```json
{
  "valid": false,
  "missing": ["departure_date", "passengers"],
  "extracted": { "destination": "Paris" },
  "suggested_reply": "Pour quelle date et combien de passagers ?",
  "confidence": 0.94
}
```

---

## Commandes utiles

```bash
docker compose up                  # démarrer
docker compose down                # arrêter
docker compose logs -f backend     # logs backend
docker compose logs -f frontend    # logs frontend

# Migrations
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic downgrade -1
```

---

## Stack

| Composant | Techno |
|---|---|
| Backend | Python 3.13 + FastAPI 0.136.1 |
| ORM | SQLAlchemy 2.0.49 + Alembic 1.18.4 |
| Base de données | PostgreSQL 17 |
| Cache / Rate limiting | Redis 8 + redis-py 7.1.1 |
| LLM | Open Router API (google/gemini-2.0-flash-001) |
| Frontend | Next.js 16.2 + Tailwind v4 + shadcn/ui |
| Auth | JWT httpOnly cookie (PyJWT) |
| Infra | Docker Compose + Coolify |

---

## Structure

```
backend/               # FastAPI
frontend/              # Next.js
docker-compose.yml     # Dev
docker-compose.prod.yml
.env.example
```
