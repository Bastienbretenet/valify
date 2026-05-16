#!/bin/sh
set -e

# Wait for postgres (Coolify depends_on already healthy, but be defensive)
echo "Waiting for database..."
python -c "
import asyncio, asyncpg, os, sys, time
from urllib.parse import urlparse

url = os.environ['DATABASE_URL'].replace('postgresql+asyncpg://', 'postgresql://')
p = urlparse(url)

async def check():
    for i in range(30):
        try:
            conn = await asyncpg.connect(host=p.hostname, port=p.port, user=p.username, password=p.password, database=p.path.lstrip('/'))
            await conn.close()
            print('DB ready')
            return
        except Exception as e:
            print(f'DB not ready ({i+1}/30): {e}', flush=True)
            await asyncio.sleep(2)
    sys.exit('DB never became ready')

asyncio.run(check())
"

echo "Running migrations..."
alembic upgrade head

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
