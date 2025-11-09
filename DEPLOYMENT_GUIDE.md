# Claude AI Rubric Analyzer - Deployment Guide

This guide explains how to productionize and deploy the Claude AI Rubric Analyzer add-ons for Google Docs and Google Slides.

## Overview

You have two separate add-ons:
1. **Claude AI Rubric Analyzer for Docs** - Works with Google Docs
2. **Claude AI Rubric Analyzer for Slides** - Works with Google Slides

Both can be deployed as Google Workspace Add-ons to make them available across all documents/presentations for you and other users.

---

## Deployment Options

### Option 1: Private Deployment (Recommended for Testing)
Deploy for yourself or specific users in your organization.

**Best for:**
- Testing before public release
- Internal team use
- Educational institutions (teacher-only tools)

### Option 2: Public Marketplace Deployment
Publish to Google Workspace Marketplace for anyone to install.

**Best for:**
- Sharing with the world
- Commercial products
- Open source tools

### Option 3: Domain-Wide Deployment
Install automatically for all users in a Google Workspace domain.

**Best for:**
- Organization-wide rollout
- IT-managed deployments
- Enterprise use cases

---

## Step-by-Step Deployment Instructions

### Prerequisites

1. **Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (e.g., "Claude AI Rubric Analyzer")
   - Note your Project Number

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Enable:
     - Google Docs API
     - Google Slides API
     - Google Workspace Marketplace SDK (if publishing publicly)

3. **OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose User Type:
     - **Internal** (for organization-only) - No review required
     - **External** (for public) - Requires Google review
   - Fill in required information:
     - App name: "Claude AI Rubric Analyzer"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/documents.currentonly`
     - `https://www.googleapis.com/auth/presentations.currentonly`
     - `https://www.googleapis.com/auth/script.container.ui`
     - `https://www.googleapis.com/auth/script.external_request`

---

### Step 1: Create Standalone Script Projects

You need to convert your container-bound scripts to standalone scripts.

#### For Google Docs Add-on:

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Name it: "Claude AI Rubric Analyzer for Docs"
4. Copy all files from the **Docs branch**:
   - `Code.gs`
   - `Sidebar.html`
   - `appsscript.json`
5. Click "Project Settings" (gear icon)
6. Under "Google Cloud Platform (GCP) Project":
   - Click "Change project"
   - Enter your GCP Project Number
   - Click "Set project"

#### For Google Slides Add-on:

1. Create another new project
2. Name it: "Claude AI Rubric Analyzer for Slides"
3. Copy all files from the **Slides branch**:
   - `Code_Slides.gs` → Rename to `Code.gs`
   - `Sidebar.html`
   - `appsscript.json`
4. Link to the same GCP project (or create a separate one)

---

### Step 2: Test the Add-on

Before deploying, test it works correctly:

1. In the Apps Script editor, click "Deploy" > "Test deployments"
2. Click "Install"
3. This opens a test document/presentation
4. Check that:
   - The "Claude AI" menu appears
   - The sidebar loads correctly
   - You can set the API key
   - Analysis and highlighting work
5. Test with multiple documents/slides to ensure cross-document functionality

---

### Step 3: Create a Deployment

#### Private/Test Deployment:

1. Click "Deploy" > "New deployment"
2. Click the gear icon next to "Select type"
3. Select "Add-on"
4. Configuration:
   - **Version**: New version
   - **Description**: "Initial deployment for testing"
   - **Deployment type**: Select one:
     - **Test deployment** - Only you can install
     - **Deployment** - Can be shared via link
5. Click "Deploy"
6. Copy the deployment link

**To share with specific users:**
- Share the deployment link
- They click it to install
- Works only for users you've given permission to via the OAuth consent screen

#### Public Marketplace Deployment:

1. Complete all test deployment steps first
2. Go to "Publish" > "Deploy from manifest"
3. Fill out the Google Workspace Marketplace SDK form:
   - Add screenshots (required)
   - Add detailed description
   - Add support information
   - Add privacy policy URL (required for public apps)
   - Add terms of service URL
4. Submit for review (takes 3-7 days)
5. Once approved, users can install from the Marketplace

---

### Step 4: Configure User Properties

Since the add-on uses Claude API keys, users need to set their own keys:

**Current approach (individual API keys):**
- Each user sets their own Claude API key via the menu
- Stored in Script Properties (user-specific)
- Good for: Small teams, teachers, individual users

**Alternative approach (shared service account):**
- Store API key in Script Properties at project level
- All users share one API key
- Good for: Organizations with billing
- **To implement**:
  - Replace `PropertiesService.getScriptProperties()` with `PropertiesService.getDocumentProperties()` or use a centralized key management

---

### Step 5: Ongoing Maintenance

#### Updating the Add-on:

1. Make changes in the Apps Script editor
2. Test with "Test deployments"
3. When ready, create new deployment:
   - Click "Deploy" > "Manage deployments"
   - Click "Edit" on existing deployment
   - Create new version
   - Add version notes
   - Click "Deploy"

#### Monitoring Usage:

1. Go to "Project Settings" > "Apps Script API"
2. Enable execution logging
3. View logs: "Executions" tab
4. Monitor API usage in Google Cloud Console

#### User Support:

- Users may need help setting Claude API keys
- Consider creating a help document or video
- Add contact information in the add-on sidebar

---

## Security Best Practices

### 1. OAuth Scopes
The add-ons use `*.currentonly` scopes which:
- Only access the current document/presentation
- Require user consent for each file
- Are more secure than full access scopes

### 2. API Key Storage
- API keys stored in Script Properties are encrypted
- User-specific keys are more secure than shared keys
- Consider implementing key rotation

### 3. External API Calls
- The add-on calls Claude API via HTTPS
- Ensure you comply with Anthropic's terms of service
- Consider rate limiting for shared deployments

### 4. Data Privacy
- The add-on sends document text to Claude API
- Ensure users are aware (add disclaimer in sidebar)
- Consider adding privacy policy

---

## Troubleshooting

### "Authorization required" error
- User hasn't granted permissions
- Click "Claude AI" menu > Select any option
- Accept all permission requests

### "API key not set" error
- User needs to set their Claude API key
- Click "Claude AI" > "Set API Key"
- Enter valid Claude API key

### Add-on doesn't appear in menu
- Refresh the document/presentation
- Check if add-on is installed: Extensions > Add-ons > Manage add-ons
- Try reinstalling the add-on

### GCP Project issues
- Ensure all required APIs are enabled
- Check OAuth consent screen is configured
- Verify project is linked correctly

---

## Cost Considerations

### Google Cloud Platform
- Apps Script is free for reasonable use
- API calls to Google Docs/Slides API are free
- No GCP costs for small deployments

### Claude API
- Users need their own Claude API keys (or organization provides)
- Costs based on usage (tokens processed)
- Monitor usage via Anthropic Console

### Google Workspace Marketplace
- Listing is free
- Google takes no commission
- You handle billing if you charge users

---

## Recommended Deployment Path

For most users, we recommend this path:

1. **Week 1-2: Test Deployment**
   - Create standalone script projects
   - Link to GCP project
   - Deploy as test version
   - Share with 2-3 trusted users
   - Gather feedback

2. **Week 3-4: Private Deployment**
   - Fix any issues from testing
   - Deploy as private add-on
   - Share with wider team (10-50 users)
   - Create documentation
   - Monitor usage and errors

3. **Month 2+: Public Deployment (Optional)**
   - Polish UI and error messages
   - Create privacy policy
   - Add screenshots and marketing materials
   - Submit to Marketplace
   - Wait for review approval

---

## Quick Start for Internal Team Use

If you just want to share with your team quickly:

1. **Keep as Container-Bound Script** (simplest option)
   - Share the Google Doc/Slide as a template
   - Users make a copy
   - Script automatically copies with it
   - No deployment needed!
   - Limitations: Each document has its own copy of the script

2. **Create a Template Gallery**
   - Create sample docs/slides with script attached
   - Share templates with team
   - Users copy and start using immediately

---

## Additional Resources

- [Google Workspace Add-ons Documentation](https://developers.google.com/workspace/add-ons)
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [Publishing Add-ons](https://developers.google.com/workspace/marketplace/how-to-publish)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

---

## Support and Questions

If you need help with deployment:

1. Check Google's [Troubleshooting Guide](https://developers.google.com/workspace/add-ons/how-tos/troubleshooting)
2. Review [Apps Script Community](https://groups.google.com/g/google-apps-script-community)
3. Contact Anthropic Support for Claude API issues

---

## Next Steps

- [ ] Choose your deployment path (private, public, or template)
- [ ] Set up Google Cloud Project
- [ ] Configure OAuth consent screen
- [ ] Create standalone script projects
- [ ] Test deployments
- [ ] Share with initial users
- [ ] Gather feedback and iterate
- [ ] Consider Marketplace submission

Good luck with your deployment!
