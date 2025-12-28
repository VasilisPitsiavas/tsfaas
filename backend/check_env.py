#!/usr/bin/env python3
"""
Check if backend/.env file has all required Stripe configuration.
Run this script to verify your environment setup.
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'

def check_env_file():
    """Check if .env file exists and has required variables."""
    env_path = Path(__file__).parent / '.env'
    
    print(f"{BOLD}Checking backend/.env file...{RESET}\n")
    
    if not env_path.exists():
        print(f"{RED}❌ .env file not found at: {env_path}{RESET}")
        print(f"{YELLOW}💡 Create it by copying .env.example:{RESET}")
        print(f"   cp .env.example .env")
        print(f"\n{YELLOW}Then edit .env and add your Stripe credentials.{RESET}\n")
        return False
    
    print(f"{GREEN}✅ .env file found{RESET}\n")
    
    # Load environment variables
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Required Stripe variables
    required_vars = {
        'STRIPE_SECRET_KEY': {
            'description': 'Stripe Secret Key (Test Mode)',
            'pattern': 'sk_test_',
            'source': 'Stripe Dashboard → Developers → API keys → Secret key'
        },
        'STRIPE_WEBHOOK_SECRET': {
            'description': 'Stripe Webhook Secret',
            'pattern': 'whsec_',
            'source': 'Stripe CLI: `stripe listen` output OR Stripe Dashboard → Webhooks'
        },
        'STRIPE_PRICE_ID': {
            'description': 'Stripe Price ID',
            'pattern': 'price_',
            'source': 'Stripe Dashboard → Products → Your product → Price ID'
        },
    }
    
    # Optional but recommended
    optional_vars = {
        'FRONTEND_URL': {
            'description': 'Frontend URL for redirects',
            'default': 'http://localhost:3000'
        },
        'SUPABASE_URL': {
            'description': 'Supabase Project URL',
            'pattern': 'https://'
        },
        'SUPABASE_SERVICE_ROLE_KEY': {
            'description': 'Supabase Service Role Key',
            'pattern': 'eyJ'
        }
    }
    
    all_good = True
    
    print(f"{BOLD}Required Stripe Variables:{RESET}\n")
    
    for var_name, var_info in required_vars.items():
        value = env_vars.get(var_name, '')
        
        if not value:
            print(f"{RED}❌ {var_name}{RESET}")
            print(f"   Missing! {var_info['description']}")
            print(f"   Get it from: {var_info['source']}\n")
            all_good = False
        elif var_info.get('pattern') and not value.startswith(var_info['pattern']):
            print(f"{YELLOW}⚠️  {var_name}{RESET}")
            print(f"   Value: {value[:20]}...")
            print(f"   {YELLOW}Warning: Should start with '{var_info['pattern']}'{RESET}")
            print(f"   Get it from: {var_info['source']}\n")
        else:
            masked_value = value[:10] + '...' + value[-4:] if len(value) > 14 else value[:10] + '...'
            print(f"{GREEN}✅ {var_name}{RESET}")
            print(f"   {var_info['description']}: {masked_value}\n")
    
    print(f"{BOLD}Optional Variables:{RESET}\n")
    
    for var_name, var_info in optional_vars.items():
        value = env_vars.get(var_name, '')
        
        if not value:
            if 'default' in var_info:
                print(f"{YELLOW}⚠️  {var_name}{RESET}")
                print(f"   Not set (will use default: {var_info['default']})\n")
            else:
                print(f"{YELLOW}⚠️  {var_name}{RESET}")
                print(f"   Not set: {var_info['description']}\n")
        else:
            print(f"{GREEN}✅ {var_name}{RESET}")
            print(f"   {var_info['description']}: {value[:50]}...\n")
    
    # Additional checks
    print(f"{BOLD}Additional Checks:{RESET}\n")
    
    # Check if Stripe secret key is test mode
    stripe_key = env_vars.get('STRIPE_SECRET_KEY', '')
    if stripe_key and stripe_key.startswith('sk_live_'):
        print(f"{RED}❌ STRIPE_SECRET_KEY is LIVE mode!{RESET}")
        print(f"   {RED}⚠️  WARNING: Using live keys in development is dangerous!{RESET}")
        print(f"   Switch to TEST mode key (starts with sk_test_)\n")
        all_good = False
    elif stripe_key and stripe_key.startswith('sk_test_'):
        print(f"{GREEN}✅ Using TEST mode Stripe key (safe for development){RESET}\n")
    
    # Check webhook secret format
    webhook_secret = env_vars.get('STRIPE_WEBHOOK_SECRET', '')
    if webhook_secret:
        if webhook_secret.startswith('whsec_'):
            print(f"{GREEN}✅ Webhook secret format is correct{RESET}\n")
        else:
            print(f"{YELLOW}⚠️  Webhook secret should start with 'whsec_'{RESET}\n")
    
    # Summary
    print(f"{BOLD}{'='*60}{RESET}\n")
    
    if all_good:
        print(f"{GREEN}✅ All required Stripe variables are configured!{RESET}\n")
        print(f"{GREEN}You're ready to test the billing integration.{RESET}\n")
        print(f"{BOLD}Next steps:{RESET}")
        print(f"1. Start backend: cd backend && uvicorn main:app --reload")
        print(f"2. Start Stripe CLI: stripe listen --forward-to localhost:8000/api/billing/webhook")
        print(f"3. Test checkout at: http://localhost:3000/pricing\n")
        return True
    else:
        print(f"{RED}❌ Some required variables are missing or incorrect.{RESET}\n")
        print(f"{YELLOW}Please fix the issues above and run this script again.{RESET}\n")
        return False

if __name__ == '__main__':
    success = check_env_file()
    sys.exit(0 if success else 1)

