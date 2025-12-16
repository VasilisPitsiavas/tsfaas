# 🐳 Docker Environment Variables Guide

## ✅ Yes! Docker Compose Uses `.env` File Automatically

When you run `docker-compose up`, Docker Compose **automatically reads** the `.env` file from the same directory as `docker-compose.yml`.

---

## 📝 How It Works

### 1. **Automatic Loading**
Docker Compose automatically loads variables from `.env` file in the project root:
```
/Users/vasilispitsiavas/Documents/projects25/tsfaas/.env
```

### 2. **Variable Substitution**
In `docker-compose.yml`, variables are referenced using `${VARIABLE_NAME}` syntax:

```yaml
environment:
  - SUPABASE_URL=${SUPABASE_URL:-https://jtarenapymmkqmmrjoih.supabase.co}
  - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
  - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://jtarenapymmkqmmrjoih.supabase.co}
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

### 3. **Syntax Explained**

#### `${VARIABLE:-default}` (With Fallback)
- Uses value from `.env` file if it exists
- Falls back to `default` if variable is not set in `.env`
- Example: `SUPABASE_URL=${SUPABASE_URL:-https://default.supabase.co}`

#### `${VARIABLE}` (Required)
- Uses value from `.env` file
- **No fallback** - will be empty if not set
- Example: `SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}`

---

## 📋 Required Variables in `.env`

Your `.env` file should contain:

```bash
# Supabase Configuration for Docker
# Backend (used by docker-compose)
SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Frontend (used by docker-compose)
NEXT_PUBLIC_SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🔍 Verify Your Configuration

### Check if variables are loaded:
```bash
# See resolved values (what Docker Compose will use)
docker-compose config | grep SUPABASE

# Or check specific service
docker-compose config | grep -A 10 "backend:"
```

### Test if .env is being read:
```bash
# Add a test variable to .env
echo "TEST_VAR=hello" >> .env

# Check if it's loaded
docker-compose config | grep TEST_VAR
```

---

## ⚠️ Important Notes

### 1. **File Location**
- `.env` must be in the **same directory** as `docker-compose.yml`
- Docker Compose looks for `.env` in the current working directory

### 2. **Variable Names**
- Variable names in `.env` must **match exactly** what's in `docker-compose.yml`
- Case-sensitive: `SUPABASE_URL` ≠ `supabase_url`

### 3. **No Quotes Needed**
In `.env` file, don't use quotes:
```bash
# ✅ Correct
SUPABASE_URL=https://example.supabase.co

# ❌ Wrong
SUPABASE_URL="https://example.supabase.co"
```

### 4. **Security**
- `.env` file is in `.gitignore` (won't be committed)
- Never commit secrets to git
- Use `.env.example` as a template

---

## 🚀 Quick Start

### 1. Create `.env` file (if not exists):
```bash
cp .env.example .env
```

### 2. Edit `.env` with your values:
```bash
# Edit with your favorite editor
nano .env
# or
code .env
```

### 3. Start Docker Compose:
```bash
docker-compose up --build
```

Docker Compose will automatically:
- ✅ Read `.env` file
- ✅ Substitute variables in `docker-compose.yml`
- ✅ Pass them to containers as environment variables

---

## 🔧 Troubleshooting

### Variables not loading?

1. **Check file location:**
   ```bash
   ls -la .env  # Should be in project root
   ```

2. **Check file format:**
   ```bash
   cat .env  # Should be KEY=value format, no spaces around =
   ```

3. **Check variable names:**
   ```bash
   # Compare with docker-compose.yml
   grep '\${' docker-compose.yml
   ```

4. **Verify with config command:**
   ```bash
   docker-compose config | grep SUPABASE
   ```

### Variables showing as empty?

- Make sure `.env` file exists
- Check for typos in variable names
- Ensure no extra spaces: `KEY=value` not `KEY = value`
- Restart Docker Compose after editing `.env`

---

## 📚 Example `.env` File

```bash
# Supabase Configuration for Docker
# Copy this file to .env and fill in your values

# Backend (used by docker-compose)
SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend (used by docker-compose)
NEXT_PUBLIC_SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Summary

- ✅ **Yes**, Docker Compose uses `.env` file automatically
- ✅ Place `.env` in the same directory as `docker-compose.yml`
- ✅ Use `${VARIABLE}` syntax in `docker-compose.yml`
- ✅ Variables are automatically passed to containers
- ✅ Use `docker-compose config` to verify values

**Your `.env` file is already configured and being used!** 🎉
