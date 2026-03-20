#!/usr/bin/env python3
"""
ClassDojo API Client

Makes authenticated requests to the ClassDojo parent portal API.
Session cookies are loaded automatically from the local session file.
"""

import requests
import json
import sys
from pathlib import Path

SESSION_FILENAME = "~./.classdojo_session.json"

def _session_search_paths() -> list:
    """Return candidate paths for the session file, most specific first."""
    home = Path.home()
    return [
        Path(SESSION_FILENAME),
        home / ".cursor" / "skills" / "classdojo" / SESSION_FILENAME,
        home / SESSION_FILENAME,
    ]

def load_session_cookies() -> dict:
    """Load session cookies from the first session file found."""
    for path in _session_search_paths():
        if path.exists():
            try:
                with open(path, "r") as f:
                    cookies = json.load(f)
                if cookies:
                    return cookies
            except (json.JSONDecodeError, OSError):
                continue
    return {}

DEFAULT_HEADERS = {
    "Accept": "*/*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Referer": "https://home.classdojo.com/",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/145.0.0.0 Safari/537.36"
    ),
    "X-Client-Identifier": "Web",
    "X-Client-Version": "202603200551.14735.0-home",
    "X-Sign-Attachment-Urls": "true",
}

def session_check() -> dict:
    """Check whether a valid session exists and return status JSON."""
    cookies = load_session_cookies()
    if not cookies:
        return {"authenticated": False, "reason": "No session file found."}

    # Lightweight call to validate the session
    session = requests.Session()
    session.cookies.update(cookies)
    session.headers.update(DEFAULT_HEADERS)
    try:
        resp = session.get(
            "https://home.classdojo.com/api/session",
            params={"includeExtras": "location", "supportsChildAsParent": "true"},
        )
        if resp.status_code == 200:
            return {"authenticated": True}
        else:
            return {"authenticated": False, "reason": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"authenticated": False, "reason": str(e)}

def api_request(endpoint: str) -> dict:
    """Make an authenticated GET request to the ClassDojo API."""
    cookies = load_session_cookies()
    if not cookies:
        return {
            "error": "Not authenticated",
            "message": "No session found. Please log in first.",
        }

    session = requests.Session()
    session.cookies.update(cookies)
    session.headers.update(DEFAULT_HEADERS)

    url = f"https://home.classdojo.com/api{endpoint}"
    try:
        resp = session.get(url)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 401:
            return {
                "error": "Session expired",
                "message": "Please log in again.",
            }
        else:
            return {"error": f"HTTP {resp.status_code}", "body": resp.text[:500]}
    except Exception as e:
        return {"error": "Request failed", "message": str(e)}

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python client.py session-check")
        print("  python client.py <endpoint>")
        print()
        print("Examples:")
        print('  python client.py session-check')
        print('  python client.py "/parent/5ec3b7790dfcbc1819952ec4/message-thread/page?limit=20"')
        sys.exit(1)

    command = sys.argv[1]

    if command == "session-check":
        result = session_check()
    else:
        result = api_request(command)

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
