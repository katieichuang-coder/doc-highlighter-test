# Deploying as a Domain-Wide Add-on

This guide is for deploying the add-on so it appears in **ALL presentations automatically** for users.

## ⚠️ Important: Choose the Right Approach

**If your users have personal Gmail accounts (not Google Workspace):**
→ **Skip to [Approach 2: Google Workspace Marketplace](#approach-2-google-workspace-marketplace-unlisted)** (Unlisted)

**If your users have Google Workspace accounts AND you have admin access:**
→ **Use [Approach 1: Domain-Wide Installation](#approach-1-domain-wide-installation-workspace-only)** (Recommended)

---

## Overview

There are two approaches to make an add-on appear in all presentations:

1. **Domain-wide installation** - Requires Google Workspace accounts for all users + admin access
2. **Google Workspace Marketplace (Unlisted)** - Works with personal Gmail accounts or Workspace accounts

## Approach 1: Domain-Wide Installation (Workspace Only)

**⚠️ Requirements:**
- **All users must have Google Workspace accounts** (not personal Gmail)
- **Admin access** to the Google Workspace domain
- Users cannot be personal Gmail users

This is the most reliable method for organization-specific add-ons where all users are on the same Workspace domain.

### Step 1: Prepare the Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a **standalone** project (not bound to a specific presentation)
3. Add the required files:
   - Code.gs (copy from repository)
   - appsscript.json (copy from repository)
   - **Note**: This add-on uses CardService UI, so there's no Sidebar.html file needed
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

**✅ Best for users with personal Gmail accounts or mixed account types**

This approach publishes the add-on to the Workspace Marketplace as an unlisted/public add-on. Users can install it once via a link, and then it appears automatically in ALL their presentations.

**Note**: Marketplace listings require Google review before approval. During the review period (which can take several days to weeks):
- Use the container-bound script approach (see [DEPLOYMENT.md](DEPLOYMENT.md)) as an interim solution
- Add test presentations to an Editor Add-on deployment for testing
- Users can manually copy the script to presentations they need to use immediately

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
   - **Private**: Only users in your Google Workspace domain can install (requires Workspace)
   - **Unlisted**: Anyone with the link can install (works with personal Gmail accounts)
   - **Public**: Listed in Marketplace (requires full review and approval)

   **For personal Gmail users**: Choose **Unlisted** or **Public**. Private will not work.

### Step 3: Publish the Listing

1. **Submit for review**:
   - Click **Publish** in the Marketplace SDK configuration
   - Google will review your add-on (can take days to weeks)
   - You'll receive email updates about the review status

2. **During review period**:
   - Use container-bound script deployment (see [DEPLOYMENT.md](DEPLOYMENT.md))
   - Or add specific test presentations to an Editor Add-on deployment
   - Users can manually copy the script to their presentations

3. **After approval**:
   - You'll receive a direct installation URL for unlisted add-ons
   - Or the add-on will appear in Marketplace search if public

4. **Share with users**:
   - Send them the installation link
   - They click **Install** and grant permissions
   - The add-on now appears in ALL their Google Slides presentations

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
| **User account type** | ⚠️ Workspace only | ✅ Personal Gmail or Workspace |
| **Appears automatically** | ✅ Yes | ✅ Yes (after user installs) |
| **Admin required** | ✅ Yes | ❌ No |
| **User action required** | ❌ No | ✅ Yes (one-time install) |
| **Google review** | ❌ No | ✅ Yes (days to weeks) |
| **Control** | Full admin control | User can uninstall |
| **Setup complexity** | Moderate | High |
| **Best for** | Workspace organizations | Personal Gmail users / Public |

---

## Important Notes

### For Domain-Wide Installation:

- ⚠️ **All users must have Google Workspace accounts** - this will NOT work for personal Gmail users
- You **must** have Admin privileges on the Workspace domain
- Users cannot uninstall domain-wide apps (admin control)
- No Google review required
- Changes to the add-on require updating the deployment

### For Marketplace Unlisted/Public:

- ✅ **Works with personal Gmail accounts** and Workspace accounts
- Users install themselves (one-time action via a link)
- Users can uninstall if needed
- **Requires Google review** (can take days to weeks)
- Requires maintaining marketplace listing and complying with Marketplace policies

### Interim Solution While Waiting for Marketplace Approval:

While your Marketplace listing is under review, use one of these temporary solutions:

1. **Container-bound script** (Recommended for interim use):
   - Follow instructions in [DEPLOYMENT.md](DEPLOYMENT.md)
   - Users can make a copy of a template presentation with the add-on
   - Quick to set up, but requires manual installation per presentation

2. **Editor Add-on with specific presentations**:
   - Create a Test Deployment as an Editor Add-on
   - Add specific test presentations to the deployment
   - Useful for testing with a small group

Once Marketplace approval is complete, users can uninstall the temporary solution and install the official Marketplace version.

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

**If users have personal Gmail accounts (not Workspace):**
→ **Use Approach 2** (Marketplace unlisted/public)
→ While waiting for approval, use container-bound script (DEPLOYMENT.md)

**If all users have Google Workspace accounts AND you have Admin access:**
→ **Use Approach 1** (Domain-wide installation)
→ Fastest deployment, no review required

**If users have Workspace accounts but you don't have Admin access:**
→ **Use Approach 2** (Marketplace unlisted)
→ Or request your Workspace admin to do Approach 1

**If you need a quick solution right now:**
→ Use container-bound script approach (see DEPLOYMENT.md)
→ Users make a copy of a template presentation with the add-on installed
