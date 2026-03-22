#!/usr/bin/env python3
"""
ClassDojo Login

Authenticates with ClassDojo and saves session cookies locally.
"""

import requests
import json
import os
import sys
import argparse
import getpass
from pathlib import Path
from typing import Optional

SESSION_FILENAME = "~./.classdojo_session.json"

LOGIN_URL_HOME = "https://home.classdojo.com/api/session"
# Email one-time code step (new device / location) completes on teach host (see HAR capture).
LOGIN_URL_TEACH = "https://teach.classdojo.com/api/session"

LOGIN_HEADERS = {
    "Accept": "*/*",
    "Content-Type": "application/json",
    "Referer": "https://www.classdojo.com/",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/145.0.0.0 Safari/537.36"
    ),
    "X-Client-Identifier": "Web",
    "X-Client-Version": "202603200551.14735.0-home",
}

def login(
    email: str,
    password: str,
    session_path: Path = None,
    print_json: bool = False,
    code: Optional[str] = None,
) -> bool:
    """Log in to ClassDojo and persist cookies.

    If ClassDojo challenges with an email one-time code (e.g. new location), POST the same
    credentials with ``code`` set to the 6-digit value; that request uses the teach host.
    """
    if session_path is None:
        session_path = Path(SESSION_FILENAME)

    session_path.parent.mkdir(parents=True, exist_ok=True)

    params = {"duration": "long"}
    if code:
        url = LOGIN_URL_TEACH
        payload = {"login": email, "password": password, "code": code.strip()}
    else:
        url = LOGIN_URL_HOME
        payload = {
            "login": email,
            "email": email,
            "password": password,
            "resumeAddClassFlow": False,
        }

    try:
        resp = requests.post(url, json=payload, headers=LOGIN_HEADERS, params=params)
    except Exception as e:
        print(f"Login request failed: {e}", file=sys.stderr)
        return False

    if resp.status_code != 200:
        detail = ""
        try:
            body = resp.json()
            detail = body.get("message", resp.text[:200])
        except Exception:
            detail = resp.text[:200]
        print(f"Login failed (HTTP {resp.status_code}): {detail}", file=sys.stderr)
        if resp.status_code == 401 and not code:
            print(
                "If ClassDojo emailed a 6-digit code (unusual sign-in), run again with "
                "--code and the code from your email.",
                file=sys.stderr,
            )
        return False

    cookies = {c.name: c.value for c in resp.cookies}

    with open(session_path, "w") as f:
        json.dump(cookies, f, indent=2)

    if print_json:
        print(json.dumps(cookies, indent=2))
    else:
        print(f"Logged in. Session saved to {session_path} ({len(cookies)} cookies).")

    return True

def main():
    parser = argparse.ArgumentParser(description="Log in to ClassDojo")
    parser.add_argument("--email", help="ClassDojo email address")
    parser.add_argument("--password", help="ClassDojo password (avoid for special chars; prefer --password-stdin)")
    parser.add_argument(
        "--password-stdin",
        action="store_true",
        help="Read password from stdin to avoid shell escaping issues",
    )
    parser.add_argument(
        "--password-prompt",
        action="store_true",
        help="Prompt securely for password without echo",
    )
    parser.add_argument("--session-path", type=Path, help="Where to save the session file")
    parser.add_argument("--print-json", action="store_true", help="Print raw cookie JSON to stdout")
    parser.add_argument(
        "--code",
        help="6-digit email one-time code when ClassDojo challenges your login (after password step)",
    )
    args = parser.parse_args()

    email = args.email or os.getenv("CLASSDOJO_EMAIL")
    password = None
    code = args.code or os.getenv("CLASSDOJO_OTP_CODE")

    if args.password is not None:
        password = args.password
    elif args.password_stdin:
        password = sys.stdin.read().rstrip("\n")
    elif args.password_prompt:
        password = getpass.getpass("ClassDojo password: ")
    else:
        password = os.getenv("CLASSDOJO_PASSWORD")

    if not email or not password:
        print(
            "Provide --email and password via --password, --password-stdin, --password-prompt, "
            "or set CLASSDOJO_EMAIL / CLASSDOJO_PASSWORD.",
            file=sys.stderr,
        )
        sys.exit(1)

    ok = login(email, password, args.session_path, args.print_json, code=code)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
