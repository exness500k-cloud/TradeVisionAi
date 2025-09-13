import random

# List of API keys
API_KEYS = [
    "API_KEY_1",  # Replace with your actual API keys
    "API_KEY_2",
    "API_KEY_3"
]

# Dictionary to track the usage of each key
api_usage = {key: 0 for key in API_KEYS}
LIMIT = 100  # Set your limit here

def get_available_api_key():
    """Return the next available API key that hasn't reached its limit."""
    for key in API_KEYS:
        if api_usage[key] < LIMIT:
            return key
    return None  # All keys have reached their limit

def request_signal():
    """Function to request a signal using the current API key."""
    current_key = get_available_api_key()

    if current_key is None:
        print("All API keys have reached their limit.")
        return None

    # Simulate a request (Replace this with actual API call logic)
    print(f"Using API Key: {current_key}")
    response = {"signal": random.randint(1, 100)}  # Placeholder for actual API response

    # Track usage
    api_usage[current_key] += 1

    return response

# Main execution loop
def main():
    # Simulating multiple requests
    for _ in range(120):
        signal = request_signal()
        if signal:
            print("Signal received:", signal["signal"])

if __name__ == "__main__":
    main()