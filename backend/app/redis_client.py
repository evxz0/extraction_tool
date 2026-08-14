import time
import logging
from typing import Optional, Dict, Tuple
from app.config import settings

logger = logging.getLogger(__name__)


class InMemoryRedisClient:
    """Thread-safe and test-friendly in-memory Redis client with TTL support."""
    def __init__(self):
        self._store: Dict[str, Tuple[str, Optional[float]]] = {}

    def _is_expired(self, key: str) -> bool:
        if key not in self._store:
            return True
        _, expiry = self._store[key]
        if expiry is not None and time.time() > expiry:
            del self._store[key]
            return True
        return False

    def get(self, key: str) -> Optional[str]:
        if self._is_expired(key):
            return None
        return self._store[key][0]

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        expiry = time.time() + ex if ex else None
        self._store[key] = (str(value), expiry)
        return True

    def delete(self, key: str) -> int:
        if key in self._store:
            del self._store[key]
            return 1
        return 0

    def exists(self, key: str) -> int:
        return 0 if self._is_expired(key) else 1

    def flush_all(self):
        self._store.clear()


class RedisManager:
    """Wrapper that seamlessly bridges Upstash Redis, Standard Redis, or InMemory fallback."""
    def __init__(self):
        self._client = None
        self._client_type = "in_memory"
        self._init_client()

    def _init_client(self):
        # 1. Try Upstash REST Redis
        if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
            try:
                from upstash_redis import Redis as UpstashRedis
                self._client = UpstashRedis(
                    url=settings.UPSTASH_REDIS_REST_URL,
                    token=settings.UPSTASH_REDIS_REST_TOKEN
                )
                self._client_type = "upstash"
                logger.info("Connected to Upstash Redis")
                return
            except Exception as e:
                logger.warning(f"Failed to connect to Upstash Redis: {e}. Falling back...")

        # 2. Try Standard Redis
        if settings.REDIS_URL:
            try:
                import redis
                self._client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self._client.ping()
                self._client_type = "redis"
                logger.info("Connected to Standard Redis")
                return
            except Exception as e:
                logger.warning(f"Failed to connect to Standard Redis: {e}. Falling back...")

        # 3. In-memory fallback
        self._client = InMemoryRedisClient()
        self._client_type = "in_memory"
        logger.info("Using InMemoryRedisClient session store")

    def get(self, key: str) -> Optional[str]:
        try:
            val = self._client.get(key)
            if val is not None:
                return str(val) if not isinstance(val, str) else val
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        try:
            if self._client_type == "upstash":
                return bool(self._client.set(key, value, ex=ex))
            elif self._client_type == "redis":
                return bool(self._client.set(key, value, ex=ex))
            else:
                return bool(self._client.set(key, value, ex=ex))
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False

    def delete(self, key: str) -> int:
        try:
            return int(self._client.delete(key) or 0)
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return 0

    def exists(self, key: str) -> int:
        try:
            return int(self._client.exists(key) or 0)
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return 0

    def flush_all(self):
        if hasattr(self._client, "flush_all"):
            self._client.flush_all()
        elif hasattr(self._client, "flushdb"):
            self._client.flushdb()


session_redis = RedisManager()
