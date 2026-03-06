# Security Best Practices 🔒

## Protecting Your API Keys

This project is configured to keep your API keys safe from accidental commits.

## How It Works

### 1. Environment Variables (.env file)
Your API key is stored in a `.env` file that is **gitignored** (never committed).

```bash
# .env (gitignored - safe for real keys)
ALPHA_VANTAGE_API_KEY=your_real_key_here
```

### 2. Example File (.env.example)
The `.env.example` file shows the structure but contains no real keys.

```bash
# .env.example (committed to git - no real keys)
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

## Setup Instructions

### First Time Setup
```bash
# 1. Copy the example file
cd backend
cp .env.example .env

# 2. Edit .env and add your real API key
# (Use any text editor)

# 3. Install python-dotenv
pip install python-dotenv
```

### Getting Your API Key
1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Copy the key they send you
4. Paste it into your `.env` file

## Verification

### Before You Commit - Always Check:

```bash
# See what files will be committed
git status

# See the actual changes
git diff

# Make sure .env is NOT in the list!
```

### Double-Check Your .gitignore

Your `.gitignore` should include:
```
.env
*.env
!.env.example
```

This means:
- ✅ `.env.example` WILL be committed (it's safe)
- ❌ `.env` will NOT be committed (contains your keys)

### Test It

```bash
# This should show .env is ignored
git status

# .env should not appear in "Changes to be committed"
```

## What If I Already Committed My Key?

If you accidentally committed an API key:

### 1. Rotate Your Key Immediately
- Go to Alpha Vantage dashboard
- Generate a new API key
- Update your `.env` file

### 2. Remove from Git History

```bash
# Remove the file from git (but keep it locally)
git rm --cached backend/.env

# Commit the removal
git commit -m "Remove .env from git tracking"

# Push
git push
```

### 3. Consider Using BFG Repo-Cleaner

For complete history cleanup (advanced):
```bash
# Install BFG
brew install bfg

# Clean history
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

## Additional Security Tips

### 1. Never Hardcode Keys
❌ **Bad:**
```python
API_KEY = "abc123xyz"  # Don't do this!
```

✅ **Good:**
```python
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
```

### 2. Use Different Keys for Different Projects
- Easier to rotate if compromised
- Better tracking of usage

### 3. Check Before You Push
```bash
# Always review before pushing
git diff HEAD

# Or use interactive adding
git add -p
```

### 4. Set Up Pre-commit Hooks (Optional)

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "ERROR: Attempting to commit .env file!"
    echo "This file should be in .gitignore"
    exit 1
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Quick Reference

```bash
# ✅ Safe to commit
.env.example          # Template file
main.py              # Uses os.getenv()
requirements.txt     # No secrets here

# ❌ Never commit
.env                 # Contains real keys
config_local.py      # Local configuration
*_secret.py          # Anything with "secret"
```

## Resources

- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [python-dotenv Documentation](https://github.com/theskumar/python-dotenv)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)

---

**Remember**: If you ever suspect your API key was exposed, rotate it immediately!
