#!/bin/bash
# Phase 4B - Git workflow management script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Function to create and switch to branch
create_branch() {
    local branch_name=$1
    print_status "Creating and switching to branch: $branch_name"
    
    # Fetch latest changes
    git fetch origin
    
    # Create branch from main
    git checkout -b "$branch_name" origin/main
    
    print_success "Created branch: $branch_name"
}

# Function to commit changes
commit_changes() {
    local message=$1
    
    print_status "Staging changes..."
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    print_status "Committing changes..."
    git commit -m "$message"
    
    print_success "Changes committed: $message"
}

# Function to push branch
push_branch() {
    local branch_name=$1
    
    print_status "Pushing branch to origin..."
    git push -u origin "$branch_name"
    
    print_success "Branch pushed: $branch_name"
}

# Function to create PR (requires GitHub CLI)
create_pr() {
    local title=$1
    local body=$2
    
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI not found. Please create PR manually at:"
        echo "https://github.com/$(git config remote.origin.url | sed 's/.*github.com[/:]\([^/]*\/[^.]*\).*/\1/')/compare/$CURRENT_BRANCH"
        return 0
    fi
    
    print_status "Creating pull request..."
    gh pr create --title "$title" --body "$body" --base main --head "$CURRENT_BRANCH"
    
    print_success "Pull request created"
}

# Function to merge branch (with safety checks)
merge_branch() {
    local branch_name=$1
    
    print_status "Switching to main branch..."
    git checkout main
    
    print_status "Pulling latest changes..."
    git pull origin main
    
    print_status "Merging branch: $branch_name"
    git merge --no-ff "$branch_name" -m "Merge $branch_name into main"
    
    print_status "Pushing merged changes..."
    git push origin main
    
    print_success "Branch merged successfully"
    
    # Cleanup
    print_status "Cleaning up local branch..."
    git branch -d "$branch_name"
    
    print_status "Cleaning up remote branch..."
    git push origin --delete "$branch_name"
    
    print_success "Cleanup completed"
}

# Main script logic
case "${1:-help}" in
    "new")
        if [ -z "$2" ]; then
            print_error "Branch name required"
            echo "Usage: $0 new <branch-name>"
            exit 1
        fi
        create_branch "$2"
        ;;
    
    "commit")
        if [ -z "$2" ]; then
            print_error "Commit message required"
            echo "Usage: $0 commit \"<commit-message>\""
            exit 1
        fi
        commit_changes "$2"
        ;;
    
    "push")
        push_branch "$CURRENT_BRANCH"
        ;;
    
    "pr")
        title="${2:-feat: Phase 4B - Core Integrations & Ops}"
        body="${3:-## Phase 4B Implementation

This PR implements core integrations and operational features:

### ✅ Authentication Guards
- RBAC system with tenant-based permissions
- Session-based auth integration
- Role validation middleware

### ✅ Background Jobs  
- Enhanced Inngest functions
- Credit reminders and payment processing
- Admin automation workflows

### ✅ Notification System
- Knock + Resend dual provider setup
- Rich HTML email templates
- Intelligent fallback logic

### ✅ Feature Gates
- Statsig client/server integration
- Predefined feature constants
- Safe rollout controls

### ✅ Monitoring & Health
- Comprehensive health checks
- Sentry error tracking
- Rate limiting protection

### ✅ Documentation
- Complete technical documentation
- Operational procedures
- Integration guides

### Testing
- [ ] Build compilation verified
- [ ] Integration smoke tests passed
- [ ] Environment variables configured
- [ ] Health checks validated

### Deployment Checklist
- [ ] Sentry DSN configured
- [ ] Knock API keys set
- [ ] Resend API key configured  
- [ ] Statsig server key added
- [ ] Database permissions verified}"
        create_pr "$title" "$body"
        ;;
    
    "merge")
        if [ -z "$2" ]; then
            print_error "Branch name required"
            echo "Usage: $0 merge <branch-name>"
            exit 1
        fi
        merge_branch "$2"
        ;;
    
    "status")
        print_status "Git Status:"
        git status --short
        echo
        print_status "Current Branch: $CURRENT_BRANCH"
        print_status "Last Commit:"
        git log -1 --oneline
        ;;
    
    "help")
        echo "Phase 4B Git Workflow Management"
        echo
        echo "Usage: $0 <command> [args]"
        echo
        echo "Commands:"
        echo "  new <branch>     Create new branch from main"
        echo "  commit <msg>     Stage and commit all changes"
        echo "  push             Push current branch to origin"
        echo "  pr [title] [body] Create pull request (requires gh CLI)"
        echo "  merge <branch>   Merge branch into main (destructive)"
        echo "  status           Show git status and branch info"
        echo "  help             Show this help message"
        echo
        echo "Examples:"
        echo "  $0 new dev-feature-x"
        echo "  $0 commit \"Add new authentication system\""
        echo "  $0 push"
        echo "  $0 pr \"feat: New auth system\" \"Implements RBAC...\""
        echo "  $0 status"
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac