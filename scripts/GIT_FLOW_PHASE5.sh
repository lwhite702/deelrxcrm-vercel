#!/bin/bash

# Phase 5 Git Workflow - DeelRx CRM Hardening & Go-Live
# This script manages the git workflow for Phase 5 deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAIN_BRANCH="main"
DEV_BRANCH="dev-phase5"
PRODUCTION_BRANCH="production"

echo -e "${BLUE}DeelRx CRM - Phase 5 Git Flow${NC}"
echo "=========================================="

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}Error: Not in a git repository${NC}"
        exit 1
    fi
}

# Function to check if branch exists
branch_exists() {
    git show-ref --verify --quiet refs/heads/$1
}

# Function to check current branch
get_current_branch() {
    git branch --show-current
}

# Function to stash changes if any
stash_changes() {
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${YELLOW}Stashing uncommitted changes...${NC}"
        git stash push -m "Phase 5 workflow auto-stash $(date)"
        echo "Stashed changes. Run 'git stash pop' to restore if needed."
    fi
}

# Function to create and push Phase 5 feature branch
create_phase5_branch() {
    echo -e "${BLUE}Creating Phase 5 feature branch...${NC}"
    
    # Ensure we're on main and up to date
    git checkout $MAIN_BRANCH
    git pull origin $MAIN_BRANCH
    
    # Create dev-phase5 branch if it doesn't exist
    if ! branch_exists $DEV_BRANCH; then
        git checkout -b $DEV_BRANCH
        echo -e "${GREEN}Created new branch: $DEV_BRANCH${NC}"
    else
        git checkout $DEV_BRANCH
        echo -e "${YELLOW}Switched to existing branch: $DEV_BRANCH${NC}"
    fi
    
    # Push branch to remote
    git push -u origin $DEV_BRANCH
}

# Function to commit Phase 5 changes
commit_phase5_changes() {
    echo -e "${BLUE}Committing Phase 5 changes...${NC}"
    
    # Ensure we're on the correct branch
    if [[ $(get_current_branch) != $DEV_BRANCH ]]; then
        echo -e "${YELLOW}Switching to $DEV_BRANCH branch...${NC}"
        git checkout $DEV_BRANCH
    fi
    
    # Stage all changes
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo -e "${YELLOW}No changes to commit${NC}"
        return 0
    fi
    
    # Create comprehensive commit message
    commit_message="feat: Phase 5 - Security Hardening & Go-Live Preparation

Security Infrastructure:
- Implemented strict CSP headers with nonce support
- Added IP and user-based rate limiting with Upstash Redis
- Field-level encryption for sensitive data (AES-256-GCM)
- Idempotency enforcement for external API calls
- Boot-time environment variable validation

Progressive Rollout:
- Statsig feature gates for gradual feature deployment
- Kill switches for critical system components
- A/B testing infrastructure for new features
- Automated rollback capabilities

Operational Excellence:
- Health check endpoints with comprehensive validation
- Enhanced Sentry integration with error tracking
- Audit logging for all admin and financial actions
- Activity event tracking for user interactions

Documentation & Compliance:
- Comprehensive security and operations documentation
- Go-live checklist with detailed verification steps
- Updated smoke testing procedures
- SOC 2, GDPR, and PCI DSS compliance measures

Infrastructure:
- Upstash Redis integration for caching and rate limiting
- Environment configuration management
- Backup and disaster recovery procedures
- Monitoring and alerting systems

BREAKING CHANGES:
- Enhanced security headers may require frontend adjustments
- Rate limiting may affect high-frequency API usage
- New environment variables required for security features"

    # Commit changes
    git commit -m "$commit_message"
    echo -e "${GREEN}Phase 5 changes committed successfully${NC}"
    
    # Push to remote
    git push origin $DEV_BRANCH
    echo -e "${GREEN}Changes pushed to remote branch${NC}"
}

# Function to create release branch for Phase 5
create_release_branch() {
    local release_branch="release/phase5-v5.0.0"
    
    echo -e "${BLUE}Creating release branch: $release_branch${NC}"
    
    # Create release branch from dev-phase5
    git checkout $DEV_BRANCH
    git pull origin $DEV_BRANCH
    git checkout -b $release_branch
    
    # Update version in package.json
    if [[ -f package.json ]]; then
        npm version 5.0.0 --no-git-tag-version
        git add package.json
        git commit -m "chore: bump version to 5.0.0 for Phase 5 release"
    fi
    
    # Push release branch
    git push -u origin $release_branch
    echo -e "${GREEN}Release branch created and pushed: $release_branch${NC}"
}

# Function to merge to main branch
merge_to_main() {
    echo -e "${BLUE}Merging Phase 5 to main branch...${NC}"
    
    # Switch to main and update
    git checkout $MAIN_BRANCH
    git pull origin $MAIN_BRANCH
    
    # Merge dev-phase5 branch
    git merge $DEV_BRANCH --no-ff -m "Merge Phase 5: Security Hardening & Go-Live Preparation

This release includes comprehensive security hardening, progressive rollout
capabilities, operational excellence improvements, and full go-live preparation
for production deployment.

Major Features:
- Security infrastructure with CSP, rate limiting, and encryption
- Feature gates and kill switches for safe deployments
- Health monitoring and audit logging systems
- Comprehensive documentation and compliance measures"
    
    # Push to main
    git push origin $MAIN_BRANCH
    echo -e "${GREEN}Phase 5 merged to main branch${NC}"
}

# Function to create production deployment
deploy_to_production() {
    echo -e "${BLUE}Preparing production deployment...${NC}"
    
    # Create production branch if it doesn't exist
    if ! branch_exists $PRODUCTION_BRANCH; then
        git checkout -b $PRODUCTION_BRANCH $MAIN_BRANCH
        git push -u origin $PRODUCTION_BRANCH
        echo -e "${GREEN}Created production branch${NC}"
    else
        git checkout $PRODUCTION_BRANCH
        git merge $MAIN_BRANCH --ff-only
        git push origin $PRODUCTION_BRANCH
        echo -e "${GREEN}Updated production branch${NC}"
    fi
    
    # Create git tag for Phase 5
    local tag_name="v5.0.0-phase5"
    git tag -a $tag_name -m "Phase 5 Release: Security Hardening & Go-Live

This tag marks the completion of Phase 5 - Security Hardening & Go-Live.

Key Features:
- Enterprise-grade security implementation
- Progressive rollout and feature flag system
- Comprehensive operational monitoring
- Full compliance and audit capabilities
- Production-ready deployment infrastructure

This release is ready for production deployment."

    git push origin $tag_name
    echo -e "${GREEN}Created and pushed tag: $tag_name${NC}"
}

# Function to show git status and summary
show_status() {
    echo -e "\n${BLUE}Git Status Summary:${NC}"
    echo "==================="
    echo "Current branch: $(get_current_branch)"
    echo "Repository status:"
    git status --short
    
    echo -e "\n${BLUE}Recent commits:${NC}"
    git log --oneline -5
    
    echo -e "\n${BLUE}Branches:${NC}"
    git branch -v
}

# Main workflow function
main() {
    check_git_repo
    
    echo "Phase 5 Git Workflow Options:"
    echo "1. Create Phase 5 feature branch"
    echo "2. Commit Phase 5 changes"
    echo "3. Create release branch"
    echo "4. Merge to main"
    echo "5. Deploy to production"
    echo "6. Full workflow (all steps)"
    echo "7. Show git status"
    echo "8. Exit"
    
    read -p "Select option (1-8): " choice
    
    case $choice in
        1)
            stash_changes
            create_phase5_branch
            ;;
        2)
            commit_phase5_changes
            ;;
        3)
            create_release_branch
            ;;
        4)
            merge_to_main
            ;;
        5)
            deploy_to_production
            ;;
        6)
            echo -e "${YELLOW}Running full Phase 5 deployment workflow...${NC}"
            stash_changes
            create_phase5_branch
            commit_phase5_changes
            create_release_branch
            merge_to_main
            deploy_to_production
            echo -e "${GREEN}Full Phase 5 workflow completed!${NC}"
            ;;
        7)
            show_status
            ;;
        8)
            echo -e "${GREEN}Exiting Phase 5 git workflow${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please select 1-8.${NC}"
            exit 1
            ;;
    esac
    
    show_status
}

# Run main function
main