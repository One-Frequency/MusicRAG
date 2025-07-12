# CI/CD Troubleshooting Guide

## Overview
This document outlines common issues with the GitHub Actions workflow for the MusicRAG project and their solutions.

## Recent Issues Fixed (January 2025)

### Issue 1: Go Dependencies Cache Failure
**Error Message:**
```
Setup Go
Restore cache failed: Dependencies file is not found in /home/runner/work/MusicRAG/MusicRAG. Supported file pattern: go.sum
```

**Root Cause:**
The GitHub Actions `setup-go` action was looking for `go.sum` in the repository root, but our Go module is located in the `backend/` directory.

**Solution:**
Added the `cache-dependency-path` parameter to the Setup Go action:
```yaml
- name: Setup Go
  uses: actions/setup-go@v5
  with:
    go-version: ${{ env.GO_VERSION }}
    cache-dependency-path: backend/go.sum
```

### Issue 2: AWS OIDC Authentication Failure
**Error Message:**
```
Configure AWS credentials
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Root Cause:**
The AWS STS service requires an explicit `audience` parameter when using OIDC authentication with GitHub Actions.

**Solution:**
Added the `audience` parameter to the AWS credentials configuration:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v3
  with:
    role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
    aws-region: us-east-2
    audience: sts.amazonaws.com
```

## Future Troubleshooting Steps

### If Go Cache Issues Persist

1. **Verify go.sum exists:**
   ```bash
   ls -la backend/go.sum
   ```

2. **Check Go version compatibility:**
   - Ensure the Go version in the workflow matches your local development version
   - Current version: `1.24`

3. **Alternative cache configuration:**
   If the issue persists, try using the manual cache approach:
   ```yaml
   - name: Cache Go modules
     uses: actions/cache@v3
     with:
       path: ~/go/pkg/mod
       key: ${{ runner.os }}-go-${{ hashFiles('backend/go.sum') }}
       restore-keys: |
         ${{ runner.os }}-go-
   ```

### If AWS OIDC Issues Persist

1. **Verify AWS Role Configuration:**
   - Check that `AWS_OIDC_ROLE_ARN` secret is properly set in GitHub repository settings
   - Ensure the role has the correct trust policy for GitHub OIDC

2. **Check Role Trust Policy:**
   The AWS IAM role should have a trust policy similar to:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
             "token.actions.githubusercontent.com:sub": "repo:One-Frequency/MusicRAG:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

3. **Verify ECR Permissions:**
   Ensure the assumed role has permissions for:
   - `ecr:GetAuthorizationToken`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:GetDownloadUrlForLayer`
   - `ecr:BatchGetImage`
   - `ecr:InitiateLayerUpload`
   - `ecr:UploadLayerPart`
   - `ecr:CompleteLayerUpload`
   - `ecr:PutImage`

### General Debugging Steps

1. **Enable Debug Logging:**
   Add to workflow environment variables:
   ```yaml
   env:
     ACTIONS_STEP_DEBUG: true
     ACTIONS_RUNNER_DEBUG: true
   ```

2. **Check Repository Secrets:**
   Verify these secrets are properly configured:
   - `AWS_OIDC_ROLE_ARN`: The ARN of the AWS IAM role for OIDC authentication

3. **Test Locally:**
   Before pushing to GitHub, test the Docker build locally:
   ```bash
   cd backend
   docker build -f Dockerfile -t musicrag/chat-backend:test .
   ```

4. **Check Workflow Syntax:**
   Use GitHub's workflow validator or run:
   ```bash
   # Install act for local testing
   brew install act
   act -n  # dry run to check syntax
   ```

## Workflow File Location
The main workflow file is located at: `.github/workflows/build-push.yml`

## Contact
For additional issues, check the GitHub Actions logs and compare against this troubleshooting guide. If issues persist, consider:
1. Checking AWS CloudTrail logs for authentication failures
2. Reviewing GitHub Actions documentation for the latest action versions
3. Consulting the One-Frequency team for AWS account-specific configurations

---
*Last updated: January 12, 2025*
