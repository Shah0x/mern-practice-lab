import time
from collections import deque
from threading import Lock

class SlidingWindowRateLimiter:
    """
    A simple in-memory rate limiter using the sliding window log algorithm.
    Thread-safe for basic concurrent API client usage.
    """
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Store deques of timestamps per client key
        self._requests = {}
        self._lock = Lock()

    def allow_request(self, client_id: str) -> bool:
        current_time = time.time()
        boundary = current_time - self.window_seconds

        with self._lock:
            if client_id not in self._requests:
                self._requests[client_id] = deque()

            timestamps = self._requests[client_id]

            # Debug log - uncomment for local verbose tracing
            # print(f"[DEBUG] '{client_id}' log pre-eviction count: {len(timestamps)}")

            # Clean up timestamps that fall outside the rolling window
            while timestamps and timestamps[0] < boundary:
                timestamps.popleft()

            # Decide if request is within limits
            if len(timestamps) < self.max_requests:
                timestamps.append(current_time)
                return True
            
            # TODO: Return estimated wait/cool-off time for client retry headers
            return False

    def get_tracked_clients(self) -> int:
        # FIXME: Memory leak risk. Inactive clients are never cleared from self._requests.
        # We need a background thread scavenger or lazy eviction logic for dead keys.
        return len(self._requests)


# --- Manual verification loop ---
if __name__ == "__main__":
    # Allow 3 requests every 2 seconds
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=2.0)
    user = "dev_api_user"

    print(f"Simulating rapid requests for: {user}")
    for i in range(5):
        allowed = limiter.allow_request(user)
        print(f"  Req {i+1}: {'ALLOWED' if allowed else 'BLOCKED'}")
        time.sleep(0.3)  # total 1.2s, should block on 4th and 5th

    print("Sleeping for 1.5 seconds to let window slide...")
    time.sleep(1.5)

    # Should be allowed now
    print(f"  Req 6: {'ALLOWED' if limiter.allow_request(user) else 'BLOCKED'}")