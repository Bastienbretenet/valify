# Valify

SaaS de validation de prompts par LLM. Les clients configurent des "calls" (champs attendus + schéma de retour JSON) et appellent une API unique pour valider n'importe quel message utilisateur.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Une clé API [Groq](https://console.groq.com)

---

## Démarrage

```bash
cp .env.example .env
# Ajouter GROQ_API_KEY=gsk_xxxx dans .env

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
| LLM | Groq API (llama-3.1-8b-instant) |
| Frontend | Next.js 16.2 + Tailwind v4 + shadcn/ui |
| Auth | JWT httpOnly cookie (PyJWT) |
| Infra | Docker Compose + Coolify |

---

## Structure

```
CLAUDE.md              # Instructions pour Claude Code
docs/                  # Documentation technique par domaine
backend/               # FastAPI
frontend/              # Next.js
docker-compose.yml     # Dev
docker-compose.prod.yml
.env.example
```

---

## Déploiement (Coolify)

1. Pusher le repo sur Git
2. Dans Coolify, créer une nouvelle app depuis `docker-compose.prod.yml`
3. Configurer les variables d'environnement (voir `.env.example`)
4. Déployer — HTTPS automatique via le reverse proxy Coolify
