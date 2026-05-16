# Valify — Prompt Validation SaaS

SaaS B2B : les clients configurent des "calls" (règles de validation + schéma JSON) et appellent une API unique pour valider un message utilisateur via LLM.

## Stack
- Backend : Python 3.13 + FastAPI 0.136.1 + SQLAlchemy 2.0.49 + Alembic 1.18.4 + redis-py 7.1.1 + httpx
- Frontend : Next.js 16.2 + Tailwind v4 + shadcn/ui (React 19)
- Infra : Docker Compose (dev) + Coolify (prod) + Postgres 17 + Redis 8
- Auth : PyJWT HS256 httpOnly cookie — PAS python-jose (déprécié)
- LLM : Groq API via httpx direct (pas de SDK)
- Package manager : uv 0.11.14

## Règles absolues
- Routers : orchestration uniquement → appel service → retour HTTP
- Services : logique métier uniquement → pas de DB directe
- Repositories : DB uniquement → pas de logique
- Jamais SELECT *, jamais print(), jamais python-jose
- Token API : généré avec secrets.token_urlsafe(32), stocké hashé bcrypt, affiché en clair UNE SEULE FOIS
- Isolation org : toute query filtre sur org_id
- LLM : max 1 retry si JSON invalide, puis 422

## Fichiers de référence
- `.claude/docs/architecture.md` — structure dossiers + patterns
- `.claude/docs/database.md` — modèles + relations + JSONB schemas
- `.claude/docs/api.md` — toutes les routes + exemples request/response
- `.claude/docs/llm.md` — abstraction LLM + build_system_prompt
- `.claude/docs/frontend.md` — pages + composants + auth flow
- `.claude/docs/infra.md` — Docker Compose + env vars + Coolify
