# Deploying as a Domain-Wide Add-on (Google Workspace Admin Required)

This guide is for deploying the add-on so it appears in **ALL presentations automatically** for specific users.

## Requirements

- **Google Workspace account** (not personal Gmail)
- **Admin access** to your Google Workspace domain
- The add-on needs to be deployed and then installed domain-wide

## Overview

There are two approaches to make an add-on appear in all presentations:

1. **Domain-wide installation** (Workspace Admin installs for all/specific users)
2. **Google Workspace Marketplace** (Unlisted private add-on)

## Approach 1: Domain-Wide Installation (Recommended)

This is the most reliable method for private, organization-specific add-ons.

### Step 1: Prepare the Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a **standalone** project (not bound to a specific presentation)
3. Add all three files:
   - Code.gs (copy from repository)
   - Sidebar.html (copy from repository)
   - appsscript.json (copy from repository)
4. Save the project with a clear name: "Claude AI Rubric Analyser"

### Step 2: Link to Google Cloud Project

1. In Apps Script, click **Project Settings** (gear icon)
2. Under "Google Cloud Platform (GCP) Project", note the default project number OR:
3. Create a new GCP project at console.cloud.google.com
4. Link your Apps Script project to it

### Step 3: Deploy the Add-on

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Click gear icon next to "Select type"
3. Choose **Add-on**
4. Enter description: "Claude AI Rubric Analyser for Slides"
5. Click **Deploy**
6. **Copy the Deployment ID** - you'll need this

### Step 4: Configure OAuth Consent Screen (GCP)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Select **Internal** (this makes it available only to your organization)
5. Fill in:
   - App name: "Claude AI Rubric Analyser for Slides"
   - User support email: Your email
   - Authorized domains: Your workspace domain (e.g., yourcompany.com)
   - Developer contact: Your email
6. Click **Save and Continue**

### Step 5: Add Required Scopes

1. On the Scopes page, click **Add or Remove Scopes**
2. Add these scopes:
   ```
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/presentations
   https://www.googleapis.com/auth/script.container.ui
   https://www.googleapis.com/auth/script.external_request
   ```
3. Click **Update** → **Save and Continue**

### Step 6: Admin Console - Install Domain-Wide

**This requires Google Workspace Admin privileges**

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Apps** → **Google Workspace Marketplace apps**
3. Click **Add app** → **Add custom app**
4. Choose **Add by deployment ID**
5. Enter your **Deployment ID** from Step 3
6. Click **Install**
7. Choose installation scope:
   - **Everyone**: All users in your domain get the add-on
   - **Specific organizational units**: Select groups/departments
8. Grant permissions when prompted
9. Click **Continue** → **Finish**

### Step 7: Verify Installation

Users should now see the add-on:

1. Open any Google Slides presentation
2. Check **Extensions** menu (or **Add-ons** menu in older versions)
3. "Claude AI" should appear automatically
4. Click it to use the add-on

**Note**: It may take up to 24 hours for the add-on to appear for all users after domain-wide installation.

---

## Approach 2: Google Workspace Marketplace (Unlisted)

This approach publishes the add-on to the Workspace Marketplace as an unlisted/private add-on.

### Step 1: Enable Workspace Marketplace SDK

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for "Google Workspace Marketplace SDK"
5. Click **Enable**

### Step 2: Configure Marketplace SDK

1. After enabling, click **Manage**
2. Go to **Configuration** tab
3. Fill in the marketplace listing:
   - App name: "Claude AI Rubric Analyser for Slides"
   - Description: Your description
   - Category: Education / Productivity
   - Language: English (Australia)
   - Support: Your email
   - Terms of Service URL: (can be a simple page)
   - Privacy Policy URL: (can be a simple page)
4. Under **App Integration**:
   - Application Type: Add-on
   - Editor Add-on: Google Slides
   - Deployment ID: Your deployment ID from Apps Script
5. Under **App Visibility**:
   - Select **Private** or **Unlisted**
   - If Private: Only users in your domain can install
   - If Unlisted: Anyone with the link can install

### Step 3: Publish the Listing

1. Submit for review or publish as unlisted
2. If unlisted, you'll get a direct installation URL
3. Share this URL with your users
4. They click the link and install the add-on

### Step 4: Users Install

1. Users receive the installation link
2. They click **Install** on the listing page
3. Grant permissions
4. The add-on now appears in ALL their Google Slides presentations

---

## Troubleshooting

### "Add-on doesn't appear in Extensions menu"

- **Check**: Is it installed domain-wide in Admin Console?
- **Check**: Has enough time passed? (Can take up to 24 hours)
- **Try**: Log out and log back in
- **Try**: Clear browser cache
- **Try**: Open a brand new presentation (not an existing one)

### "Permission denied" when accessing add-on

- **Check**: OAuth consent screen is set to "Internal"
- **Check**: User is logged in with workspace account (not personal Gmail)
- **Check**: All required scopes are added in GCP

### "Can't find deployment ID in Admin Console"

- **Check**: Deployment was created as "Add-on" type (not Web app)
- **Check**: Using the correct GCP project
- **Try**: Create a new deployment and use the new ID

### Admin Console doesn't have "Add custom app" option

- **Reason**: Your Google Workspace edition might not support custom add-ons
- **Solution**: Use Approach 2 (Marketplace unlisted) instead

---

## Comparison: Domain-Wide vs Marketplace

| Feature | Domain-Wide Install | Marketplace Unlisted |
|---------|-------------------|---------------------|
| **Appears automatically** | ✅ Yes | ✅ Yes (after user installs) |
| **Admin required** | ✅ Yes | ❌ No |
| **User action required** | ❌ No | ✅ Yes (one-time install) |
| **Control** | Full admin control | User can uninstall |
| **Setup complexity** | Moderate | High |
| **Best for** | Organization deployment | External users / testing |

---

## Important Notes

### For Domain-Wide Installation:

- You **must** have Google Workspace (not personal Gmail)
- You **must** have Admin privileges
- Users cannot uninstall domain-wide apps (admin control)
- Changes to the add-on require updating the deployment

### For Marketplace Unlisted:

- Can work with personal accounts (if published)
- Users install themselves (one-time action)
- Users can uninstall if needed
- Requires maintaining marketplace listing

### Script Properties for Shared API Key

For both approaches, to use a shared Claude API key:

1. In Apps Script project, go to **Project Settings**
2. Add **Script Property**:
   - Name: `CLAUDE_API_KEY`
   - Value: Your Claude API key
3. Save

All users will now use this shared key automatically.

---

## Why Test Deployments Don't Work

**Test Deployments** are for developers to test add-ons before publishing. They:
- Only work for the developer/testers added to the project
- Are not meant for production use
- Don't appear automatically in all presentations
- Expire after a period of time

For production deployment where the add-on appears in all presentations, you **must** use either:
1. Domain-wide installation (Admin Console), OR
2. Marketplace listing (unlisted/private)

---

## Next Steps

If you have Google Workspace Admin access:
→ **Use Approach 1** (Domain-wide installation)

If you don't have Admin access:
→ **Use Approach 2** (Marketplace unlisted)
→ Or request your admin to do Approach 1

If neither works:
→ You'll need to use the container-bound approach (per-presentation installation)
