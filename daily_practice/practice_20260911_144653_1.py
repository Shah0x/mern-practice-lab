# TODO: Handle list types inside the dict. Currently, it just skips or treats them as raw values.
# Maybe we convert lists to indexed keys? e.g., {'tags': ['a', 'b']} -> {'tags_0': 'a', 'tags_1': 'b'}

def flatten_dict(d, parent_key='', sep='_'):
    """
    Flattens a nested dictionary.
    
    Example:
    {'a': 1, 'b': {'c': 2, 'd': {'e': 3}}} -> {'a': 1, 'b_c': 2, 'b_d_e': 3}
    """
    items = []
    for k, v in d.items():
        # Clean up key just in case there are spaces or weird chars
        # Refactor: maybe use regex if this gets too messy
        safe_key = str(k).strip().replace(" ", "_")
        new_key = f"{parent_key}{sep}{safe_key}" if parent_key else safe_key
        
        # print(f"DEBUG: processing {new_key} with value {v}") # legacy debug spam
        
        if isinstance(v, dict):
            # Recursively flatten
            # FIXME: This will blow up with RecursionError if there are circular refs. 
            # Hope our config files aren't circular...
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
            
    return dict(items)

# Quick ad-hoc test
if __name__ == "__main__":
    test_data = {
        "api": {
            "v1": {
                "endpoint": "https://api.local",
                "timeout": 30
            },
            "retries": 3
        },
        "debug mode": True
    }
    
    # Expected output: {'api_v1_endpoint': '...', 'api_v1_timeout': 30, 'api_retries': 3, 'debug_mode': True}
    flattened = flatten_dict(test_data)
    print("Flattened output:")
    print(flattened)
    
    # Assert check, quick and dirty
    assert flattened["api_v1_endpoint"] == "https://api.local"
    assert flattened["debug_mode"] is True
    print("All quick tests passed!")