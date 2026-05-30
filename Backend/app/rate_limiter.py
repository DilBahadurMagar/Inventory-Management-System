import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """
    Thread-safe-adjacent in-memory sliding window rate limiter.
    Does not require external Redis server.
    """
    def __init__(self, times: int, seconds: int, name: str = "general"):
        self.times = times
        self.seconds = seconds
        self.name = name
        self.history = defaultdict(list)  # ip -> list of timestamps

    def get_client_ip(self, request: Request) -> str:
        # Resolve client IP, prioritizing standard proxy header
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"

    def __call__(self, request: Request):
        # Allow health checks without rate limiting
        if request.url.path == "/health":
            return

        client_ip = self.get_client_ip(request)
        now = time.time()
        window_start = now - self.seconds

        # Clean sliding window history
        client_history = self.history[client_ip]
        self.history[client_ip] = [t for t in client_history if t > window_start]

        # Check limit
        if len(self.history[client_ip]) >= self.times:
            oldest_timestamp = self.history[client_ip][0]
            retry_after = max(1, int(oldest_timestamp + self.seconds - now) + 1)
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded on '{self.name}'. Limit: {self.times} requests per {self.seconds} seconds.",
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.times),
                    "X-RateLimit-Remaining": "0",
                }
            )

        # Append current request time
        self.history[client_ip].append(now)


# Global instances for reuse across routers
limiter_general = InMemoryRateLimiter(times=100, seconds=60, name="general")
limiter_auth = InMemoryRateLimiter(times=5, seconds=60, name="auth")
