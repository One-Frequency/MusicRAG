# MusicRAG Development Setup Guide

A comprehensive guide for setting up the MusicRAG development environment using industry best practices and standardized tooling.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Project Access Setup](#gcp-project-access-setup)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Configuration](#project-configuration)
5. [Running the Applications](#running-the-applications)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)
8. [Additional Resources](#additional-resources)

---

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2 recommended for Windows)
- **Terminal**: Modern terminal with shell support (zsh, bash)
- **Git**: Version 2.30+
- **Internet**: Stable connection for package downloads and cloud services

### Required Accounts & Access

- **Gmail/Google Account**: For GCP access
- **GitHub Account**: For repository access
- **Azure Account**: For OpenAI and Search services (if not using shared credentials)

---

## GCP Project Access Setup

### For Project Administrators

To grant a new developer access to the GCP project `one-frequency-games`:

1. **Navigate to IAM & Admin** in Google Cloud Console:

   ```
   https://console.cloud.google.com/iam-admin/iam?project=one-frequency-games
   ```

2. **Add a new member**:

   - Click "Grant Access" or "Add"
   - Enter the developer's Gmail address
   - Assign appropriate roles:

   **For Full Developers:**

   ```
   - Project Editor
   - Service Account User
   - Cloud SQL Client (if using Cloud SQL)
   - Storage Object Viewer (if using GCS)
   ```

   **For Junior/Contract Developers:**

   ```
   - Project Viewer
   - Service Account User
   - Cloud SQL Client (if using Cloud SQL)
   ```

3. **Enable APIs** (if not already enabled):
   ```bash
   # Required APIs for the project
   - Cloud Resource Manager API
   - Identity and Access Management (IAM) API
   - Cloud SQL Admin API (if using Cloud SQL)
   - Cloud Storage API (if using GCS)
   ```

### For New Developers

Once granted access, authenticate with GCP:

```bash
# Install gcloud CLI (will be covered in next section)
# Then authenticate
gcloud auth application-default login
```

**Expected Success Output:**

```
Credentials saved to file: [/Users/username/.config/gcloud/application_default_credentials.json]

These credentials will be used by any library that requests Application Default Credentials (ADC).

Quota project "one-frequency-games" was added to ADC which can be used by Google client libraries for billing and quota. Note that some services may still bill the project owning the resource.
```

---

## Development Environment Setup

### 1. Install asdf Version Manager

All developers must use `asdf` for consistent runtime versions across the team.

**macOS (Homebrew):**

```bash
brew install asdf
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.zshrc
echo -e "\n. $(brew --prefix asdf)/etc/bash_completion.d/asdf.bash" >> ~/.zshrc
source ~/.zshrc
```

**macOS (Git):**

```bash
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc
echo -e '\n. "$HOME/.asdf/completions/asdf.bash"' >> ~/.zshrc
source ~/.zshrc
```

**Linux:**

```bash
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
echo -e '\n. "$HOME/.asdf/completions/asdf.bash"' >> ~/.bashrc
source ~/.bashrc
```

### 2. Install Required Runtime Plugins

```bash
# Add plugins for all required runtimes
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add golang https://github.com/kennyp/asdf-golang.git
asdf plugin add gcloud https://github.com/jthegedus/asdf-gcloud.git

# Import Node.js release team's OpenPGP keys (for Node.js verification)
bash -c '${ASDF_DATA_DIR:=$HOME/.asdf}/plugins/nodejs/bin/import-release-team-keyring'
```

### 3. Install Required Tool Versions

Navigate to the project root and install the exact versions specified:

```bash
# Clone the repository first
git clone git@github.com:One-Frequency/MusicRAG.git
cd MusicRAG

# Install Node.js (version specified in .node-version)
asdf install nodejs 22.17.0
asdf global nodejs 22.17.0

# Install Go (version specified in backend/go.mod)
asdf install golang 1.24.4
asdf global golang 1.24.4

# Install Google Cloud CLI (latest stable)
asdf install gcloud latest
asdf global gcloud latest

# Verify installations
node --version    # Should output: v22.17.0
npm --version     # Should output: npm version bundled with Node 22.17.0
go version       # Should output: go version go1.24.4
gcloud version   # Should output: Google Cloud SDK version info
```

### 4. Configure Git (if not already done)

```bash
git config --global user.name "Your Full Name"
git config --global user.email "your.email@company.com"

# Set up SSH key for GitHub (recommended)
ssh-keygen -t ed25519 -C "your.email@company.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add the public key to your GitHub account
cat ~/.ssh/id_ed25519.pub
# Copy and paste this into GitHub → Settings → SSH Keys
```

---

## Project Configuration

### 1. Environment Files Setup

**Frontend Environment (.env):**

Create `frontend/.env`:

```bash
# Navigation to frontend directory
cd frontend

# Create environment file
cat > .env << 'EOF'
# Enterprise Cognito Configuration
REACT_APP_USER_POOL_ID=us-east-2_JKsb0fPHX
REACT_APP_USER_POOL_CLIENT_ID=4qbitb6voa560333ajlg090dh6
REACT_APP_IDENTITY_POOL_ID=us-east-2:8af4b173-d6f5-4b86-a354-cebc4ccd0d41
REACT_APP_COGNITO_DOMAIN=https://onefrequency-enterprise-dev.auth.us-east-2.amazoncognito.com
REACT_APP_AUTH_REDIRECT_URI=https://app.onefrequency.ai/auth/callback
REACT_APP_AUTH_LOGOUT_URI=https://app.onefrequency.ai/auth/logout

# Enterprise Features
REACT_APP_ENTERPRISE_MODE=true
REACT_APP_RBAC_ENABLED=true

# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_API_VERSION=v1

# Development Configuration
REACT_APP_ENV=development
REACT_APP_DEBUG=true
EOF
```

**Backend Environment (.env):**

The backend `.env` file already exists with Azure configurations. Verify it contains:

```bash
cd ../backend

# Verify the .env file contains these Azure configurations:
# AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, etc.

# Add additional enterprise configurations if needed
cat >> .env << 'EOF'

# Enterprise Cognito Configuration
USER_POOL_ID=us-east-2_JKsb0fPHX
USER_POOL_CLIENT_ID=4qbitb6voa560333ajlg090dh6
COGNITO_REGION=us-east-2
JWKS_URL=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_JKsb0fPHX/.well-known/jwks.json

# Enterprise Features
ENTERPRISE_MODE=true
RBAC_ENABLED=true

# Server Configuration
PORT=8080
GIN_MODE=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database Configuration (if using a database)
# DATABASE_URL=postgresql://user:password@localhost:5432/musicrag
EOF
```

### 2. Authenticate with GCP

```bash
# Set the project
gcloud config set project one-frequency-games

# Authenticate for application default credentials
gcloud auth application-default login

# Verify authentication
gcloud auth list
gcloud config list project
```

### 3. Install Dependencies

**Frontend Dependencies:**

```bash
cd frontend

# Install using npm (comes with Node.js)
npm install

# Verify installation
npm ls --depth=0
```

**Backend Dependencies:**

```bash
cd ../backend

# Download Go modules
go mod download

# Verify Go modules
go mod verify
go list -m all
```

---

## Running the Applications

### 1. Backend Development Server

```bash
cd backend

# Build and run the Go application
go run main.go

# Alternative: Build binary first
go build -o musicrag-backend
./musicrag-backend
```

**Expected Output:**

```
[GIN-debug] [WARNING] Creating an Engine instance with the Logger and Recovery middleware already attached.
[GIN-debug] GET    /health                   --> main.main.func1 (3 handlers)
[GIN-debug] POST   /api/v1/chat              --> github.com/One-Frequency/MusicRAG/backend/internal/api.(*Handlers).ChatHandler-fm (4 handlers)
[GIN-debug] Listening and serving HTTP on :8080
```

### 2. Frontend Development Server

```bash
cd frontend

# Start the Vite development server
npm run dev
```

**Expected Output:**

```
  VITE v7.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3. Verify Both Services

**Backend Health Check:**

```bash
curl http://localhost:8080/health
# Expected: 200 OK with health status
```

**Frontend Access:**

```bash
open http://localhost:5173
# Or manually navigate in browser
```

---

## Development Workflow

### 1. Daily Development Process

```bash
# 1. Start your development session
cd MusicRAG
git pull origin main

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Start backend (Terminal 1)
cd backend
go run main.go

# 4. Start frontend (Terminal 2)
cd frontend
npm run dev

# 5. Make your changes and test

# 6. Run linting and type checking
cd frontend
npm run lint
npm run type-check
npm run format

# 7. Commit and push
git add .
git commit -m "feat: your descriptive commit message"
git push origin feature/your-feature-name
```

### 2. Code Quality Standards

**Frontend:**

```bash
# Before committing, always run:
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run type-check    # TypeScript compilation check
npm run build         # Production build test
```

**Backend:**

```bash
# Before committing, always run:
go fmt ./...          # Format Go code
go vet ./...          # Go vet analysis
go test ./...         # Run tests
go mod tidy           # Clean up dependencies
```

### 3. Testing Your Changes

**Backend API Testing:**

```bash
# Test authentication endpoint
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test chat endpoint (with auth token)
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello, what can you help me with?"}'
```

**Frontend Testing:**

```bash
# Run unit tests (when available)
npm test

# Build production version
npm run build
npm run preview  # Preview production build
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Node.js Version Issues

**Problem**: `npm install` fails with version errors

```bash
# Solution: Ensure correct Node.js version
asdf current nodejs    # Should show 22.17.0
asdf reshim nodejs     # Refresh shims if needed
rm -rf node_modules package-lock.json
npm install
```

#### 2. Go Module Issues

**Problem**: `go run main.go` fails with module errors

```bash
# Solution: Clean and reinstall modules
go clean -modcache
go mod download
go mod tidy
```

#### 3. GCP Authentication Issues

**Problem**: "Application Default Credentials" not found

```bash
# Solution: Re-authenticate
gcloud auth application-default revoke
gcloud auth application-default login
gcloud config set project one-frequency-games
```

#### 4. Port Conflicts

**Problem**: "Port already in use" errors

```bash
# Find and kill processes using ports
lsof -ti:8080 | xargs kill -9  # Backend port
lsof -ti:5173 | xargs kill -9  # Frontend port
lsof -ti:3000 | xargs kill -9  # Alternative frontend port
```

#### 5. CORS Issues

**Problem**: Frontend can't connect to backend

```bash
# Verify backend CORS configuration in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Ensure frontend is using correct API URL
# In frontend/.env:
REACT_APP_API_BASE_URL=http://localhost:8080
```

#### 6. Azure Service Connection Issues

**Problem**: Azure OpenAI or Search API calls fail

```bash
# Verify environment variables are loaded
cd backend
cat .env | grep AZURE

# Test Azure connectivity
curl -H "api-key: YOUR_AZURE_API_KEY" \
  "https://music-rag-resource.cognitiveservices.azure.com/openai/deployments?api-version=2023-05-15"
```

### Performance Optimization

#### Frontend Development

```bash
# Enable React Developer Tools
# Install browser extension: React Developer Tools

# Monitor bundle size
npm run build
npx vite-bundle-analyzer dist

# Profile performance
npm run dev -- --profile
```

#### Backend Development

```bash
# Enable Go race detection (development only)
go run -race main.go

# Profile memory and CPU usage
go run main.go -cpuprofile=cpu.prof -memprofile=mem.prof

# Analyze profiles
go tool pprof cpu.prof
go tool pprof mem.prof
```

---

## Additional Resources

### Documentation Links

- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Go Documentation**: https://golang.org/doc/
- **Gin Framework**: https://gin-gonic.com/docs/
- **Vite Documentation**: https://vitejs.dev/guide/
- **asdf Documentation**: https://asdf-vm.com/guide/getting-started.html

### Project-Specific Resources

- **Technical Specification**: `TECHNICAL_SPECIFICATION.md`
- **Integration Guide**: `FRONTEND_BACKEND_INTEGRATION_GUIDE.md`
- **Azure OpenAI Documentation**: https://docs.microsoft.com/en-us/azure/cognitive-services/openai/
- **Azure Cognitive Search**: https://docs.microsoft.com/en-us/azure/search/

### Team Communication

- **GitHub Issues**: Use for bug reports and feature requests
- **Pull Requests**: Use for code review and collaboration
- **Project Board**: Track progress on GitHub Projects

### Security Best Practices

1. **Never commit secrets**: Use environment variables for all credentials
2. **Rotate API keys**: Regularly update Azure and AWS credentials
3. **Use HTTPS**: Always use secure connections in production
4. **Validate input**: Sanitize all user inputs on both frontend and backend
5. **Update dependencies**: Regularly update npm and Go modules for security patches

---

## Quick Reference Commands

### Daily Commands

```bash
# Start development
cd MusicRAG
git pull origin main

# Backend (Terminal 1)
cd backend && go run main.go

# Frontend (Terminal 2)
cd frontend && npm run dev

# Code quality
npm run lint:fix && npm run format  # Frontend
go fmt ./... && go vet ./...        # Backend
```

### Troubleshooting Commands

```bash
# Reset Node.js environment
asdf current nodejs && npm cache clean --force

# Reset Go environment
go clean -modcache && go mod download

# Reset GCP authentication
gcloud auth application-default login

# Check running processes
lsof -i :8080,5173,3000
```

### Project Information

```bash
# Project: MusicRAG
# Frontend: React + TypeScript + Vite (Port 5173)
# Backend: Go + Gin Framework (Port 8080)
# Node Version: 22.17.0
# Go Version: 1.24.4
# Package Manager: npm (Node.js), go mod (Go)
# Version Manager: asdf
```

---

**Note**: This guide assumes you have basic familiarity with command-line interfaces, Git, and web development concepts. If you encounter issues not covered here, please create a GitHub issue with detailed error messages and system information.

**Last Updated**: January 2025
**Guide Version**: 1.0.0
