#!/bin/bash
# setup.sh - Initial setup script for Time Tracking MCP

set -e

echo "🚀 Time Tracking MCP Setup"
echo "=========================="
echo ""

# Get tracking directory
read -p "Where should time tracking files be stored? [~/Documents/time-tracking]: " TRACKING_DIR
TRACKING_DIR=${TRACKING_DIR:-~/Documents/time-tracking}
TRACKING_DIR="${TRACKING_DIR/#\~/$HOME}"

# Create directory
echo "📁 Creating directory: $TRACKING_DIR"
mkdir -p "$TRACKING_DIR"

# Get companies
echo ""
read -p "Enter company names (comma-separated) [HeliMods]: " COMPANIES
COMPANIES=${COMPANIES:-HeliMods}

# Create company directories and configs
IFS=',' read -ra COMPANY_ARRAY <<< "$COMPANIES"
for company in "${COMPANY_ARRAY[@]}"; do
    company=$(echo "$company" | xargs)  # Trim whitespace
    company_dir="$TRACKING_DIR/$company"

    echo "📂 Setting up: $company"
    mkdir -p "$company_dir"

    # Create config if it doesn't exist
    config_file="$company_dir/config.json"
    if [ ! -f "$config_file" ]; then
        echo "  Creating config.json..."
        cat > "$config_file" << EOF
{
  "company": "$(echo $company | sed 's/.*/\u&/')",
  "commitments": {
    "development": {
      "limit": 20,
      "unit": "hours/week"
    },
    "meeting": {
      "limit": 5,
      "unit": "hours/week"
    },
    "total": {
      "limit": 25,
      "unit": "hours/week"
    }
  },
  "projects": {},
  "tagMappings": {
    "dev": "development",
    "sync": "meeting"
  }
}
EOF
    else
        echo "  Config already exists, skipping..."
    fi
done

# Get company abbreviations
echo ""
echo "Company abbreviations allow quick time logging (e.g., 'hm 2h on task')."
read -p "Enter abbreviations for companies (format: Company1:abbr1:abbr2,Company2:abbr3) [optional]: " COMPANY_ABBREVS

# Get timezone
echo ""
read -p "Timezone offset from UTC (e.g., 10 for AEST, -5 for EST) [0]: " TZ_OFFSET
TZ_OFFSET=${TZ_OFFSET:-0}

read -p "Timezone string (e.g., AEST, UTC, PST) [UTC]: " TZ_STRING
TZ_STRING=${TZ_STRING:-UTC}

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Build the project:"
echo "   npm install"
echo "   npm run build"
echo ""
echo "2. Add to Claude config:"
echo ""
echo "   For Claude Desktop:"
echo "   File: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo '   {'
echo '     "mcpServers": {'
echo '       "TimeTracking": {'
echo "         \"command\": \"$(which node)\","
echo "         \"args\": [\"$(pwd)/dist/server.js\"],"
echo '         "env": {'
echo "           \"TIME_TRACKING_DIR\": \"$TRACKING_DIR\","
echo "           \"COMPANIES\": \"$COMPANIES\","
if [ -n "$COMPANY_ABBREVS" ]; then
echo "           \"COMPANY_ABBREVIATIONS\": \"$COMPANY_ABBREVS\","
fi
echo "           \"DISPLAY_TIMEZONE_OFFSET\": \"$TZ_OFFSET\","
echo "           \"DISPLAY_TIMEZONE_STRING\": \"$TZ_STRING\""
echo '         }'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "   For Claude Code CLI:"
echo "   File: ~/.config/claude-code/settings.json"
echo ""
echo '   {'
echo '     "mcpServers": {'
echo '       "TimeTracking": {'
echo '         "command": "node",'
echo "         \"args\": [\"$(pwd)/dist/server.js\"],"
echo '         "env": {'
echo "           \"TIME_TRACKING_DIR\": \"$TRACKING_DIR\","
echo "           \"COMPANIES\": \"$COMPANIES\","
if [ -n "$COMPANY_ABBREVS" ]; then
echo "           \"COMPANY_ABBREVIATIONS\": \"$COMPANY_ABBREVS\","
fi
echo "           \"DISPLAY_TIMEZONE_OFFSET\": \"$TZ_OFFSET\","
echo "           \"DISPLAY_TIMEZONE_STRING\": \"$TZ_STRING\""
echo '         }'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "3. Restart Claude Desktop or Claude Code CLI"
echo ""
echo "4. Try it out:"
echo '   "Just spent 2 hours on project work"'
echo ""
echo "📂 Your time tracking files: $TRACKING_DIR"
echo ""