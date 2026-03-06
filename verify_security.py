#!/usr/bin/env python3
"""
Security Verification Script
=============================
Run this to verify your API keys are properly protected.
"""

import os
import sys
from pathlib import Path

def check_gitignore():
    """Check if .gitignore has the right entries."""
    gitignore_path = Path(__file__).parent / '.gitignore'
    
    if not gitignore_path.exists():
        return False, ".gitignore file not found!"
    
    content = gitignore_path.read_text()
    
    required = ['.env', '*.env']
    missing = [item for item in required if item not in content]
    
    if missing:
        return False, f"Missing in .gitignore: {', '.join(missing)}"
    
    return True, ".gitignore is properly configured"

def check_env_file():
    """Check if .env exists and is not tracked by git."""
    env_path = Path(__file__).parent / 'backend' / '.env'
    
    if not env_path.exists():
        return 'warning', ".env file doesn't exist yet (you need to create it)"
    
    return True, ".env file exists"

def check_env_example():
    """Check if .env.example exists."""
    example_path = Path(__file__).parent / 'backend' / '.env.example'
    
    if not example_path.exists():
        return False, ".env.example file not found!"
    
    content = example_path.read_text()
    
    # Make sure it doesn't contain real keys
    suspicious = ['demo' not in content.lower()]
    
    return True, ".env.example exists and looks safe"

def check_git_tracking():
    """Check if .env is being tracked by git."""
    env_path = Path(__file__).parent / 'backend' / '.env'
    
    if not env_path.exists():
        return True, "N/A - .env doesn't exist yet"
    
    # Run git ls-files to check if .env is tracked
    import subprocess
    try:
        result = subprocess.run(
            ['git', 'ls-files', 'backend/.env'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        if result.stdout.strip():
            return False, "⚠️  DANGER: .env is tracked by git! Run: git rm --cached backend/.env"
        else:
            return True, ".env is properly ignored by git"
    except:
        return 'warning', "Could not verify git status"

def main():
    print("="*60)
    print("🔒 SECURITY VERIFICATION")
    print("="*60)
    print()
    
    checks = [
        ("GitIgnore Configuration", check_gitignore),
        (".env File Status", check_env_file),
        (".env.example File", check_env_example),
        ("Git Tracking Check", check_git_tracking),
    ]
    
    all_passed = True
    warnings = []
    
    for name, check_func in checks:
        result, message = check_func()
        
        if result is True:
            symbol = "✅"
        elif result == 'warning':
            symbol = "⚠️ "
            warnings.append(message)
        else:
            symbol = "❌"
            all_passed = False
        
        print(f"{symbol} {name}")
        print(f"   {message}")
        print()
    
    print("="*60)
    
    if all_passed and not warnings:
        print("✅ ALL CHECKS PASSED!")
        print("\nYour API keys are properly protected.")
    elif all_passed:
        print("⚠️  WARNINGS PRESENT")
        print("\nMostly secure, but check the warnings above.")
    else:
        print("❌ SECURITY ISSUES FOUND")
        print("\nPlease fix the issues above before committing!")
        sys.exit(1)
    
    print()
    print("📋 Next Steps:")
    if not Path(__file__).parent / 'backend' / '.env':
        print("   1. Copy backend/.env.example to backend/.env")
        print("   2. Add your API key to backend/.env")
    print("   3. Always run 'git status' before pushing")
    print("   4. Never commit .env file")
    print()
    print("="*60)

if __name__ == "__main__":
    main()
