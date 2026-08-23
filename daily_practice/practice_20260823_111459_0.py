import time
import random
import functools

def retry(exceptions, tries=3, delay=1, backoff=2, jitter=True):
    """
    Decorator to retry a function call with exponential backoff.
    
    TODO: Add support for async functions? Might need a separate async_retry wrapper.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            mdelay = delay
            mtries = tries
            
            while mtries > 1:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    # debug log - remove or move to logging before merging
                    # print(f"[DEBUG] Failed with {e.__class__.__name__}. Retrying...")
                    
                    sleep_time = mdelay
                    if jitter:
                        # Introduce random jitter to prevent thundering herd problem
                        sleep_time *= random.uniform(0.5, 1.5)
                    
                    # Refactor note: Should probably integrate python's standard 'logging' 
                    # module here instead of raw print statements, but this is fine for CLI scripts.
                    print(f"Retrying {func.__name__} in {sleep_time:.2f} seconds... ({mtries - 1} tries left)")
                    time.sleep(sleep_time)
                    
                    mtries -= 1
                    mdelay *= backoff
            
            # Last attempt: if it fails, let the exception propagate up
            return func(*args, **kwargs)
        return wrapper
    return decorator


# --- Quick Scratchpad / Manual Verification ---
if __name__ == "__main__":
    # Mocking a flaky third-party API call
    counter = 0
    
    @retry(ValueError, tries=4, delay=0.5, backoff=2)
    def fetch_user_data(user_id):
        global counter
        counter += 1
        if counter < 3:
            raise ValueError("Simulated HTTP 503 - Service Unavailable")
        return {"id": user_id, "name": "John Doe", "status": "active"}

    print("Starting flaky request test...")
    try:
        result = fetch_user_data(42)
        print("Success! Result:", result)
    except ValueError as e:
        print("Failed permanently:", e)