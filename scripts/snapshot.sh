#!/bin/bash
# Repository Snapshot Script
# Creates a timestamped backup before making changes

set -e

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="/tmp"
REPO_NAME="deelrxcrm-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${REPO_NAME}.tar.gz"

echo "📦 Creating repository snapshot..."
echo "Timestamp: ${TIMESTAMP}"
echo "Backup location: ${BACKUP_PATH}"

# Get the repository root
REPO_ROOT=$(git rev-parse --show-toplevel)
REPO_BASENAME=$(basename "${REPO_ROOT}")

cd "$(dirname "${REPO_ROOT}")"

# Create tarball excluding .git, node_modules, and build artifacts
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='out' \
    --exclude='.turbo' \
    --exclude='*.log' \
    -czf "${BACKUP_PATH}" \
    "${REPO_BASENAME}"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

echo "✅ Snapshot created successfully!"
echo "📁 Location: ${BACKUP_PATH}"
echo "📊 Size: ${BACKUP_SIZE}"
echo ""
echo "To restore from backup:"
echo "  cd $(dirname "${REPO_ROOT}")"
echo "  tar -xzf ${BACKUP_PATH}"
echo ""

# Also create a restore script
RESTORE_SCRIPT="${BACKUP_DIR}/restore-${REPO_NAME}.sh"
cat > "${RESTORE_SCRIPT}" << EOF
#!/bin/bash
# Restore script for ${REPO_NAME}
# Generated on ${TIMESTAMP}

set -e

echo "🔄 Restoring repository from backup..."
echo "Backup: ${BACKUP_PATH}"

if [ ! -f "${BACKUP_PATH}" ]; then
    echo "❌ Backup file not found: ${BACKUP_PATH}"
    exit 1
fi

# Extract to current directory
tar -xzf "${BACKUP_PATH}"

echo "✅ Repository restored to: \$(pwd)/${REPO_BASENAME}"
echo "Remember to:"
echo "  cd ${REPO_BASENAME}"
echo "  pnpm install"
echo "  git status  # to see what changed"
EOF

chmod +x "${RESTORE_SCRIPT}"

echo "🔧 Restore script created: ${RESTORE_SCRIPT}"
echo "💡 Run this script if you need to restore the backup"