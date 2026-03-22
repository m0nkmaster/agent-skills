#!/usr/bin/env bash
# Sync a skill directory from this repo to an OpenClaw (or similar) remote skills tree.
# Replaces the remote skill folder to match local (--delete removes files absent locally).
#
# Usage:
#   ./scripts/sync-skill-to-openclaw.sh              # sync classdojo (default)
#   ./scripts/sync-skill-to-openclaw.sh -y           # same, no confirmation prompt
#   ./scripts/sync-skill-to-openclaw.sh some-skill   # sync another top-level skill dir
#   ./scripts/sync-skill-to-openclaw.sh -y hive      # non-interactive, skill name hive
#
# Override defaults with env vars:
#   OPENCLAW_SSH_KEY, OPENCLAW_USER, OPENCLAW_HOST, OPENCLAW_SKILLS_DIR

set -euo pipefail

YES=0
ARGS=()
for arg in "$@"; do
  case "${arg}" in
    -y|--yes) YES=1 ;;
    -h|--help)
      cat <<'EOF'
Sync a skill from this repo to the remote OpenClaw skills directory (rsync --delete).

Usage:
  ./scripts/sync-skill-to-openclaw.sh [-y] [SKILL_NAME]

  SKILL_NAME defaults to classdojo (top-level folder under repo root).

Options:
  -y, --yes    Skip confirmation prompt
  -h, --help   Show this help

Environment (optional overrides):
  OPENCLAW_SSH_KEY         default: ~/.ssh/openclaw-key.pem
  OPENCLAW_USER            default: ubuntu
  OPENCLAW_HOST            default: 13.40.86.211
  OPENCLAW_SKILLS_DIR      default: /mnt/openclaw-data/skills
EOF
      exit 0
      ;;
    *) ARGS+=("${arg}") ;;
  esac
done

SSH_KEY="${OPENCLAW_SSH_KEY:-${HOME}/.ssh/openclaw-key.pem}"
REMOTE_USER="${OPENCLAW_USER:-ubuntu}"
REMOTE_HOST="${OPENCLAW_HOST:-13.40.86.211}"
REMOTE_SKILLS="${OPENCLAW_SKILLS_DIR:-/mnt/openclaw-data/skills}"
SKILL_NAME="${ARGS[0]:-classdojo}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCAL_SKILL="${REPO_ROOT}/${SKILL_NAME}"

if [[ ! -d "${LOCAL_SKILL}" ]]; then
  echo "error: skill directory not found: ${LOCAL_SKILL}" >&2
  exit 1
fi

if [[ ! -f "${SSH_KEY}" ]]; then
  echo "error: SSH key not found: ${SSH_KEY}" >&2
  exit 1
fi

REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_SKILLS}/${SKILL_NAME}/"

echo "Local:  ${LOCAL_SKILL}/"
echo "Remote: ${REMOTE_TARGET}"
echo "rsync --delete will remove remote-only files under the skill folder."
if [[ "${YES}" -ne 1 ]]; then
  read -r -p "Continue? [y/N] " reply
  case "${reply}" in
    [yY][eE][sS]|[yY]) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

rsync -avz --delete \
  -e "ssh -i ${SSH_KEY}" \
  "${LOCAL_SKILL}/" \
  "${REMOTE_TARGET}"

echo "Done. Synced ${SKILL_NAME} to ${REMOTE_HOST}:${REMOTE_SKILLS}/${SKILL_NAME}/"
