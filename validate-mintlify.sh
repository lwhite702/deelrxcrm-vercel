#!/bin/bash

# Mintlify Documentation Validation Script
# Checks if all files referenced in mint.json exist

echo "🔍 Validating Mintlify documentation structure..."

MINTLIFY_DIR="/workspaces/deelrxcrm-vercel/mintlify"
MINT_JSON="$MINTLIFY_DIR/mint.json"

if [ ! -f "$MINT_JSON" ]; then
    echo "❌ mint.json not found at $MINT_JSON"
    exit 1
fi

echo "✅ Found mint.json"

# List of files that should exist based on mint.json
declare -a files=(
    "introduction.mdx"
    "quickstart.mdx"
    "authentication.mdx"
    "pages/integrations-overview.mdx"
    "core-crm/customers.mdx"
    "core-crm/orders.mdx"
    "core-crm/products.mdx"
    "core-crm/payments.mdx"
    "extended-ops/deliveries.mdx"
    "extended-ops/loyalty.mdx"
    "extended-ops/referrals.mdx"
    "extended-ops/adjustments.mdx"
    "credit-kb/credit-overview.mdx"
    "credit-kb/knowledge-base.mdx"
    "credit-kb/best-practices.mdx"
    "admin/team-management.mdx"
    "admin/roles-permissions.mdx"
    "admin/data-management.mdx"
    "api-reference/introduction.mdx"
    "api-reference/teams/get-team.mdx"
    "api-reference/teams/update-team.mdx"
    "api-reference/customers/list-customers.mdx"
    "api-reference/customers/create-customer.mdx"
    "api-reference/customers/get-customer.mdx"
    "api-reference/customers/update-customer.mdx"
    "api-reference/credit/get-credit-status.mdx"
    "api-reference/credit/create-credit-account.mdx"
    "api-reference/credit/list-transactions.mdx"
    "api-reference/kb/list-articles.mdx"
    "api-reference/kb/create-article.mdx"
    "api-reference/kb/upload-file.mdx"
)

missing_files=()
existing_files=0

for file in "${files[@]}"; do
    if [ -f "$MINTLIFY_DIR/$file" ]; then
        echo "✅ $file"
        ((existing_files++))
    else
        echo "❌ Missing: $file"
        missing_files+=("$file")
    fi
done

echo ""
echo "📊 Summary:"
echo "   Found: $existing_files files"
echo "   Missing: ${#missing_files[@]} files"

if [ ${#missing_files[@]} -eq 0 ]; then
    echo ""
    echo "🎉 All documentation files exist!"
    echo "✅ Mintlify documentation structure is complete."
    echo ""
    echo "Next steps:"
    echo "1. Run 'cd mintlify && npm run dev' to test the documentation site"
    echo "2. Verify all content renders correctly"
    echo "3. Check for any broken links or formatting issues"
else
    echo ""
    echo "⚠️  Missing files need to be created:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi

echo ""
echo "Documentation validation complete!"