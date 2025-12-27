# GitHub Setup Guide

## Quick Start (5 minutes)

### 1. Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `management-system`
3. Description: "Personal management system for life domains"
4. Privacy: **Private** (recommended) or Public
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 2. Copy Your Repository URL

GitHub will show you something like:
```
https://github.com/YOUR-USERNAME/management-system.git
```

Copy this URL!

### 3. Push Your Code

Open Terminal/Command Prompt in your management-system folder and run:

```bash
# Connect your local repo to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/management-system.git

# Rename branch to 'main' (GitHub standard)
git branch -M main

# Push your code
git push -u origin main
```

**First time?** GitHub will ask you to authenticate:
- Username: your GitHub username
- Password: use a Personal Access Token (not your GitHub password)
  
To create a token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- Give it a name like "Management System"
- Select scope: `repo` (full control of private repositories)
- Copy the token and use it as your password

### 4. Done! 🎉

Your code is now on GitHub. Visit:
```
https://github.com/YOUR-USERNAME/management-system
```

## Daily Workflow

### After Making Changes

```bash
# See what changed
git status

# Add all changes
git add -A

# Commit with a message
git commit -m "Updated dashboard with new stats"

# Push to GitHub
git push
```

### Getting Updates on Another Machine

```bash
# First time: clone the repo
git clone https://github.com/YOUR-USERNAME/management-system.git

# Later: pull updates
git pull
```

## Useful Commands

```bash
# See commit history
git log --oneline

# See what changed in files
git diff

# Undo changes (before commit)
git checkout -- filename.html

# Create a new branch for experiments
git checkout -b experimental-feature

# Switch back to main
git checkout main
```

## File Structure (What Gets Pushed)

✅ **Included in GitHub:**
- Dashboard code
- Scripts
- Documentation
- Project structure

❌ **Excluded (via .gitignore):**
- Your personal data files
- Reports with file paths
- Configuration files
- Large files

## Tips

1. **Commit often** - small, focused commits are better than big ones
2. **Write clear messages** - "Fixed duplicate detection bug" not "updates"
3. **Pull before push** - if working from multiple machines
4. **Private repos** - keep your personal stuff private!

## Troubleshooting

**"Remote already exists"**
```bash
git remote remove origin
# Then try adding it again
```

**"Authentication failed"**
- Use a Personal Access Token, not your password
- Make sure token has `repo` scope

**"Diverged branches"**
```bash
git pull --rebase
git push
```

---

Need help? GitHub docs: https://docs.github.com/en/get-started
