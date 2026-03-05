#!/usr/bin/env bash
set -euo pipefail

# Pipeline Skills Installer
#
# Copies skills from this registry into a target repo's .claude/skills/ directory.
#
# Usage:
#   bin/install.sh <target-repo> <skill> [skill...]
#   bin/install.sh <target-repo> --collection <name>
#   bin/install.sh <target-repo> --list
#   bin/install.sh --list-collections
#
# Examples:
#   bin/install.sh ~/projects/my-app prd discovery architecture
#   bin/install.sh ~/projects/my-app --collection core
#   bin/install.sh ~/projects/my-app --collection full
#   bin/install.sh ~/projects/my-app --list          # show what's installed

REGISTRY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REGISTRY_DIR/.claude/skills"
REGISTRY_FILE="$REGISTRY_DIR/registry.yaml"

usage() {
  echo "Usage:"
  echo "  $(basename "$0") <target-repo> <skill> [skill...]"
  echo "  $(basename "$0") <target-repo> --collection <name>"
  echo "  $(basename "$0") <target-repo> --list"
  echo "  $(basename "$0") --list-collections"
  echo ""
  echo "Collections:"
  list_collections
  exit 1
}

list_collections() {
  # Parse collection names from registry.yaml
  awk '/^  [a-z]/ && /:$/ { gsub(/:/, ""); print "  " $1 }' "$REGISTRY_FILE"
}

get_collection_skills() {
  local collection="$1"
  # Extract skills for a given collection from registry.yaml
  awk -v col="$collection:" '
    /^  [a-z].*:$/ { in_col = ($1 == col); next }
    in_col && /^    - / { gsub(/^    - /, ""); print; next }
    in_col && /^  [a-z]/ { exit }
    in_col && /^[a-z]/ { exit }
  ' "$REGISTRY_FILE"
}

list_available() {
  echo "Available skills:"
  for dir in "$SKILLS_DIR"/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    name=$(basename "$dir")
    desc=$(awk '/^description:/ { gsub(/^description: *"?/, ""); gsub(/"$/, ""); print; exit }' "$dir/SKILL.md")
    printf "  %-24s %s\n" "$name" "$desc"
  done
}

list_installed() {
  local target="$1"
  local target_skills="$target/.claude/skills"
  if [ ! -d "$target_skills" ]; then
    echo "No skills installed in $target"
    return
  fi
  echo "Installed skills in $target:"
  for dir in "$target_skills"/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    name=$(basename "$dir")
    # Check if it came from this registry
    if [ -f "$dir/.registry-source" ]; then
      source_info=" (from pipeline-skills)"
    else
      source_info=""
    fi
    printf "  %s%s\n" "$name" "$source_info"
  done
}

install_skill() {
  local skill="$1"
  local target="$2"
  local source="$SKILLS_DIR/$skill"
  local dest="$target/.claude/skills/$skill"

  if [ ! -d "$source" ] || [ ! -f "$source/SKILL.md" ]; then
    echo "  ERROR: skill '$skill' not found in registry"
    return 1
  fi

  mkdir -p "$dest"
  cp -R "$source"/* "$dest"/

  # Stamp with source info for tracking
  echo "pipeline-skills" > "$dest/.registry-source"

  echo "  $skill"
}

# --- Main ---

if [ $# -eq 0 ]; then
  list_available
  echo ""
  usage
fi

if [ "$1" = "--list-collections" ]; then
  echo "Collections:"
  list_collections
  exit 0
fi

TARGET="$1"
shift

if [ ! -d "$TARGET" ]; then
  echo "ERROR: target directory '$TARGET' does not exist"
  exit 1
fi

if [ $# -eq 0 ]; then
  usage
fi

if [ "$1" = "--list" ]; then
  list_installed "$TARGET"
  exit 0
fi

# Resolve skill list
SKILLS=()
if [ "$1" = "--collection" ]; then
  if [ $# -lt 2 ]; then
    echo "ERROR: --collection requires a name"
    exit 1
  fi
  COLLECTION="$2"
  while IFS= read -r skill; do
    [ -n "$skill" ] && SKILLS+=("$skill")
  done < <(get_collection_skills "$COLLECTION")
  if [ ${#SKILLS[@]} -eq 0 ]; then
    echo "ERROR: collection '$COLLECTION' not found or empty"
    echo ""
    echo "Available collections:"
    list_collections
    exit 1
  fi
  echo "Installing collection '$COLLECTION' (${#SKILLS[@]} skills) into $TARGET:"
else
  SKILLS=("$@")
  echo "Installing ${#SKILLS[@]} skill(s) into $TARGET:"
fi

ERRORS=0
for skill in "${SKILLS[@]}"; do
  install_skill "$skill" "$TARGET" || ERRORS=$((ERRORS + 1))
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "$ERRORS skill(s) failed to install."
  exit 1
fi

echo ""
echo "Done. ${#SKILLS[@]} skill(s) installed."
