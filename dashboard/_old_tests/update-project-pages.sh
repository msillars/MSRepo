#!/bin/bash
# Batch update all project pages to support SQL database

# List of project HTML files to update
files=(
    "work.html"
    "photography.html"
    "life-admin.html"
    "relationships.html"
    "living.html"
    "health.html"
    "creating-this-dashboard.html"
)

cd "/Users/matthew/Desktop/Claude/Management System/management-system/dashboard"

for file in "${files[@]}"; do
    echo "Updating $file..."
    
    # Create backup
    cp "$file" "${file}.backup"
    
    # Replace the script loading section
    # OLD: <script src="ideas-data.js"></script>
    # NEW: SQL scripts + database-init-helper.js + ideas-data.js
    
    sed -i '' 's|<script src="ideas-data.js"></script>|<script src="https://sql.js.org/dist/sql-wasm.js"></script>\
    <script src="sql-database.js"></script>\
    <script src="database-init-helper.js"></script>\
    <script src="ideas-data.js"></script>|g' "$file"
    
    # Replace the initialization script section
    # OLD: initializeProjectPage('project-id');
    # NEW: waitForDatabaseThen(() => { initializeProjectPage('project-id'); });
    
    # Extract project ID from the current initializeProjectPage call
    project_id=$(grep -o "initializeProjectPage('[^']*')" "$file" | sed "s/initializeProjectPage('\(.*\)')/\1/")
    
    if [ ! -z "$project_id" ]; then
        # Replace the initialization with wrapped version
        sed -i '' "s|initializeProjectPage('$project_id');|waitForDatabaseThen(() => {\
            initializeProjectPage('$project_id');\
        });|g" "$file"
        echo "  ✓ Updated $file (project: $project_id)"
    else
        echo "  ✗ Could not find project ID in $file"
    fi
done

echo ""
echo "All project pages updated!"
echo "Backups saved with .backup extension"
