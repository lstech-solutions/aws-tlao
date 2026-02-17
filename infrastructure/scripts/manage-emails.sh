#!/bin/bash

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$INFRA_DIR/sensitive/config.yaml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check config file
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file not found${NC}"
    echo "Please create $CONFIG_FILE from the example"
    exit 1
fi

# Load config
get_config() {
    local key=$1
    grep "^$key:" "$CONFIG_FILE" | sed 's/.*: *"\?\([^"]*\)"\?/\1/' | tr -d '"'
}

DOMAIN_NAME=$(get_config "name")
AWS_REGION=$(get_config "region")
LAMBDA_FUNCTION="${DOMAIN_NAME}-email-forwarder"

show_help() {
    echo -e "${BLUE}Email Forwarding Management${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  list                    - List current email forwarding rules"
    echo "  add <from> <to>        - Add a new forwarding rule"
    echo "  remove <from>          - Remove a forwarding rule"
    echo "  test <email>           - Test if an email has a forwarding rule"
    echo "  sync                   - Sync config file to Lambda"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 add support@tláo.com support@lstech.solutions"
    echo "  $0 remove support@tláo.com"
    echo "  $0 test admin@tláo.com"
    echo "  $0 sync"
}

# Convert IDN to punycode
to_punycode() {
    local email=$1
    if [[ $email == *"tláo.com"* ]]; then
        echo "${email/tláo.com/$DOMAIN_NAME}"
    else
        echo "$email"
    fi
}

# Convert punycode to IDN
from_punycode() {
    local email=$1
    echo "${email/$DOMAIN_NAME/tláo.com}"
}

# Get current mappings from Lambda
get_lambda_mappings() {
    aws lambda get-function-configuration \
        --function-name "$LAMBDA_FUNCTION" \
        --region "$AWS_REGION" \
        --query 'Environment.Variables.FORWARDING_MAPPINGS' \
        --output text 2>/dev/null || echo ""
}

# Get mappings from config file
get_config_mappings() {
    local mappings=""
    while IFS= read -r line; do
        if [[ $line =~ ^[[:space:]]*\"(.+)\":[[:space:]]*\"(.+)\" ]]; then
            from="${BASH_REMATCH[1]}"
            to="${BASH_REMATCH[2]}"
            if [ -z "$mappings" ]; then
                mappings="$from=$to"
            else
                mappings="$mappings,$from=$to"
            fi
        fi
    done < <(sed -n '/forwarding:/,/from_email:/p' "$CONFIG_FILE" | grep -E '^\s+".*":\s+".*"')
    echo "$mappings"
}

# Update Lambda mappings
update_lambda() {
    local new_mappings=$1
    
    echo -e "${YELLOW}Updating Lambda function...${NC}"
    
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_FUNCTION" \
        --environment "Variables={FORWARDING_MAPPINGS='$new_mappings',FROM_EMAIL='noreply@$DOMAIN_NAME'}" \
        --region "$AWS_REGION" \
        --output text > /dev/null
    
    echo -e "${GREEN}✓ Lambda function updated${NC}"
}

# List current rules
list_rules() {
    echo -e "${BLUE}Current Email Forwarding Rules:${NC}"
    echo ""
    
    local mappings=$(get_lambda_mappings)
    
    if [ -z "$mappings" ] || [ "$mappings" == "None" ]; then
        echo "No forwarding rules configured in Lambda"
        echo ""
        echo "Config file rules:"
        mappings=$(get_config_mappings)
        if [ -z "$mappings" ]; then
            echo "  No rules in config file either"
        else
            IFS=',' read -ra RULES <<< "$mappings"
            for rule in "${RULES[@]}"; do
                IFS='=' read -r from to <<< "$rule"
                from_display=$(from_punycode "$from")
                echo "  $from_display → $to"
            done
            echo ""
            echo -e "${YELLOW}Run '$0 sync' to apply config file rules${NC}"
        fi
        return
    fi
    
    IFS=',' read -ra RULES <<< "$mappings"
    for rule in "${RULES[@]}"; do
        IFS='=' read -r from to <<< "$rule"
        from_display=$(from_punycode "$from")
        echo "  $from_display → $to"
    done
}

# Sync config to Lambda
sync_rules() {
    echo -e "${BLUE}Syncing config file to Lambda...${NC}"
    
    local config_mappings=$(get_config_mappings)
    
    if [ -z "$config_mappings" ]; then
        echo -e "${RED}Error: No forwarding rules in config file${NC}"
        exit 1
    fi
    
    update_lambda "$config_mappings"
    echo -e "${GREEN}✓ Successfully synced config to Lambda${NC}"
}

# Add a new rule
add_rule() {
    local from=$(to_punycode "$1")
    local to=$2
    
    if [ -z "$from" ] || [ -z "$to" ]; then
        echo -e "${RED}Error: Both from and to addresses are required${NC}"
        echo "Usage: $0 add <from> <to>"
        exit 1
    fi
    
    echo -e "${YELLOW}Adding forwarding rule: $1 → $to${NC}"
    
    local current_mappings=$(get_lambda_mappings)
    local new_mappings=""
    
    # Check if rule already exists
    if [[ "$current_mappings" == *"$from="* ]]; then
        echo -e "${RED}Error: Forwarding rule for $1 already exists${NC}"
        echo "Use 'remove' first to update the rule"
        exit 1
    fi
    
    if [ -z "$current_mappings" ] || [ "$current_mappings" == "None" ]; then
        new_mappings="$from=$to"
    else
        new_mappings="$current_mappings,$from=$to"
    fi
    
    update_lambda "$new_mappings"
    echo -e "${GREEN}✓ Successfully added: $1 → $to${NC}"
    echo ""
    echo -e "${YELLOW}Note: This only updates Lambda. To persist, add to $CONFIG_FILE${NC}"
}

# Remove a rule
remove_rule() {
    local from=$(to_punycode "$1")
    
    if [ -z "$from" ]; then
        echo -e "${RED}Error: From address is required${NC}"
        echo "Usage: $0 remove <from>"
        exit 1
    fi
    
    echo -e "${YELLOW}Removing forwarding rule for: $1${NC}"
    
    local current_mappings=$(get_lambda_mappings)
    
    if [ -z "$current_mappings" ] || [ "$current_mappings" == "None" ]; then
        echo -e "${RED}Error: No forwarding rules configured${NC}"
        exit 1
    fi
    
    # Remove the rule
    local new_mappings=""
    IFS=',' read -ra RULES <<< "$current_mappings"
    for rule in "${RULES[@]}"; do
        if [[ ! "$rule" == "$from="* ]]; then
            if [ -z "$new_mappings" ]; then
                new_mappings="$rule"
            else
                new_mappings="$new_mappings,$rule"
            fi
        fi
    done
    
    if [ "$new_mappings" == "$current_mappings" ]; then
        echo -e "${RED}Error: Forwarding rule for $1 not found${NC}"
        exit 1
    fi
    
    update_lambda "$new_mappings"
    echo -e "${GREEN}✓ Successfully removed forwarding rule for: $1${NC}"
    echo ""
    echo -e "${YELLOW}Note: This only updates Lambda. To persist, remove from $CONFIG_FILE${NC}"
}

# Test if email has forwarding
test_rule() {
    local email=$(to_punycode "$1")
    
    if [ -z "$email" ]; then
        echo -e "${RED}Error: Email address is required${NC}"
        echo "Usage: $0 test <email>"
        exit 1
    fi
    
    local current_mappings=$(get_lambda_mappings)
    
    if [ -z "$current_mappings" ] || [ "$current_mappings" == "None" ]; then
        echo -e "${RED}No forwarding rules configured${NC}"
        exit 1
    fi
    
    IFS=',' read -ra RULES <<< "$current_mappings"
    for rule in "${RULES[@]}"; do
        IFS='=' read -r from to <<< "$rule"
        if [ "$from" == "$email" ]; then
            echo -e "${GREEN}✓ $1 forwards to: $to${NC}"
            return 0
        fi
    done
    
    echo -e "${RED}✗ No forwarding rule found for: $1${NC}"
    return 1
}

# Main
case "${1:-}" in
    list)
        list_rules
        ;;
    add)
        add_rule "$2" "$3"
        ;;
    remove)
        remove_rule "$2"
        ;;
    test)
        test_rule "$2"
        ;;
    sync)
        sync_rules
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
