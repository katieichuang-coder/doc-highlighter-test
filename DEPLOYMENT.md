# Deployment Guide: Claude AI Rubric Analyser for Slides

This guide provides deployment options for the Claude AI Rubric Analyser.

## Choose Your Deployment Method

**Choose based on your requirement:**

### 🎯 Need the add-on in ALL presentations automatically?
→ **See [DEPLOYMENT_WORKSPACE_ADMIN.md](DEPLOYMENT_WORKSPACE_ADMIN.md)** for domain-wide deployment options.

This requires either:
- Google Workspace Admin access to install domain-wide via Admin Console, OR
- Publishing as an unlisted add-on to Google Workspace Marketplace

### 📄 Only need the add-on in specific presentations?
→ **Continue below** for the container-bound script method (simpler and more reliable).

---

## Container-Bound Script (Per-Presentation Installation)

This is the **easiest and most reliable method** for per-presentation deployment. The add-on is attached to specific presentations but can be easily copied.

### Method 1: Direct Installation in a Presentation

**Best for: Quick setup, testing, or single-user use**

1. **Open Google Slides**
   - Open any Google Slides presentation where you want to use the add-on
   - This presentation will become your "template"

2. **Open Apps Script**
   - Click **Extensions** → **Apps Script**
   - This opens the script editor

3. **Add Code.gs**
   - Delete any existing code in the editor
   - Copy the entire contents of `Code.gs` from this repository
   - Paste it into the editor
   - The file should already be named "Code.gs"
   - **Note**: This add-on uses CardService (not HtmlService), so there's no Sidebar.html file needed

4. **Configure the Manifest**
   - Click **Project Settings** (gear icon in left sidebar)
   - Check "Show 'appsscript.json' manifest file in editor"
   - Go back to the Editor (click **<>** icon)
   - You should now see `appsscript.json` in the files list
   - Click it and replace the entire contents with the `appsscript.json` from this repository

5. **Save the Project**
   - Click the save icon (💾) or press Ctrl+S (Cmd+S on Mac)
   - Name your project: "Claude AI Rubric Analyser"

6. **Close and Reopen the Presentation**
   - Close the presentation completely
   - Reopen it
   - You should see "Claude AI" in the menu bar (under Extensions or as a top-level menu)

7. **Set Your API Key**
   - Click **Claude AI** → **Set API Key**
   - Enter your Claude API key
   - Click OK

8. **Grant Permissions**
   - First time you use it, you'll see an authorization dialog
   - Click **Continue** and **Allow**
   - If you see "App isn't verified", click **Advanced** → **Go to [Project Name] (unsafe)**
   - This is normal for personal scripts

### Method 2: Make a Template Presentation

Once you have the add-on working in one presentation:

1. **Create your template**
   - The presentation with the add-on installed is now your template
   - Add any standard slides, layouts, or branding you want

2. **Share the template**
   - Option A: Share the presentation with others (they get edit/view access)
   - Option B: Make a copy for each user: File → Make a copy
   - Option C: Use as a template: Each time you need the add-on, make a copy of this presentation

3. **Everyone who makes a copy gets the add-on**
   - The script is copied along with the presentation
   - They'll need to authorize it the first time they use it
   - They'll need their own Claude API key (or you can set up a shared key in the script)

### Using the Shared API Key Approach

If you want all users to use the same API key (centralized billing):

1. In the Apps Script editor, click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Property name: `CLAUDE_API_KEY`
5. Value: Your actual Claude API key
6. Click **Save**

Now the add-on will use this key for all users who copy the presentation.

---

## Alternative: Test Deployments for Development

**⚠️ For Development and Testing Only**

This section describes Test Deployments, which are intended for developers to test add-on functionality before production deployment. **Test Deployments are NOT suitable for making the add-on appear in all presentations for end users.**

**If you need the add-on to appear in ALL presentations automatically, see [DEPLOYMENT_WORKSPACE_ADMIN.md](DEPLOYMENT_WORKSPACE_ADMIN.md) instead.**

Test Deployments are useful for:
- Testing add-on functionality during development
- Trying out changes before committing to production
- Developer testing with a small number of collaborators

### Overview

Test deployments allow you to:
- Test the add-on functionality during development
- Share with a small number of collaborators for testing
- Verify OAuth scopes and permissions work correctly
- Debug issues before production deployment

**Note**: For production deployment where the add-on appears in all presentations, see [DEPLOYMENT_WORKSPACE_ADMIN.md](DEPLOYMENT_WORKSPACE_ADMIN.md).

## Prerequisites

- Google Cloud Project (you mentioned keeping the existing one)
- Apps Script project with the code from this repository
- Claude API key from Anthropic
- Google Workspace account (recommended for easier deployment)

## Step 1: Prepare Your Apps Script Project

### 1.1 Create/Update the Apps Script Project

If you haven't already:

1. Go to [script.google.com](https://script.google.com)
2. Create a new project or open your existing one
3. Copy all files from this repository:
   - `Code.gs` → Copy to Code.gs in Apps Script
   - `Sidebar.html` → Create HTML file named "Sidebar" and paste content
   - `appsscript.json` → Replace the manifest (click ⚙️ Project Settings → Show "appsscript.json" manifest file)

### 1.2 Set Up Script Properties

Your Claude API key should be stored as a Script Property:

1. In Apps Script editor, click ⚙️ **Project Settings**
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Property: `CLAUDE_API_KEY`
5. Value: `your-actual-api-key-here`
6. Click **Save**

Alternatively, users can set their own API keys using the "Set API Key" menu option after installation.

## Step 2: Configure Google Cloud Project

### 2.1 Link to Your Google Cloud Project

1. In Apps Script editor, click ⚙️ **Project Settings**
2. Under "Google Cloud Platform (GCP) Project", click **Change project**
3. Enter your existing GCP project number
4. Click **Set project**

### 2.2 Configure OAuth Consent Screen

This is critical for allowing users to install your add-on:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:
   - **User Type**: Choose "Internal" (if you have Google Workspace) or "External"
   - **App name**: "Claude AI Rubric Analyser for Slides"
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **App logo**: Upload a logo (optional but recommended)
   - **Authorized domains**: Add your domain if using Internal
5. Click **Save and Continue**

### 2.3 Add OAuth Scopes

1. On the **Scopes** page, click **Add or Remove Scopes**
2. Add these scopes (they match appsscript.json):
   ```
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/presentations
   https://www.googleapis.com/auth/script.container.ui
   https://www.googleapis.com/auth/script.external_request
   ```
3. Click **Update** and then **Save and Continue**

### 2.4 Add Test Users (if External)

If you selected "External" user type:

1. On the **Test users** page, click **Add Users**
2. Add email addresses of users who should be able to install the add-on
3. Click **Save and Continue**

Note: For production, you'll need to submit for verification or stay in "Testing" mode with up to 100 test users.

## Step 3: Deploy the Add-on

**Important**: Before deploying, ensure your `appsscript.json` includes the `urlFetchWhitelist` at the root level for the Claude API (already included in this project):
```json
{
  "timeZone": "Australia/Sydney",
  "oauthScopes": [...],
  "urlFetchWhitelist": [
    "https://api.anthropic.com/"
  ],
  "addOns": {...}
}
```
Note: `urlFetchWhitelist` must be at the root level, not inside `addOns.common`.

### 3.1 Create a Deployment

**Note**: The deployment interface may vary. Some users see a detailed form, others see a simplified version with just a description field. Both work for creating deployments.

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Add-on**
4. Fill in the deployment details (fields available may vary):
   - **Description** (required): "AI-powered rubric analysis and highlighting for Google Slides presentations"
   - **Add-on title** (if shown): Claude AI Rubric Analyser for Slides
   - **Post-install tip** (optional, if shown): "Click 'Claude AI' menu or open the sidebar to get started"
   - **Help URL** (optional, if shown): Link to documentation
   - **Version** (if shown): New version
   - **Version description** (if shown): "Initial production deployment"
5. Click **Deploy**

### 3.2 Get the Deployment ID and Install Link

After deployment:

1. You'll see a **Deployment ID** - save this!
2. The install link format is:
   ```
   https://workspace.google.com/marketplace/app/<deployment_id>
   ```

However, for **private add-ons** (not published to Marketplace), you'll need to use the **Test deployment** method:

1. Go to **Deploy** → **Test deployments**
2. Click **Install** to install it for yourself
3. To share with others, they need to:
   - Be added as editors/viewers of your Apps Script project, OR
   - Use the installation method below for unpublished add-ons

### 3.3 Alternative: Head Deployment (Recommended for Private Add-ons)

For easier sharing with specific users:

1. Click **Deploy** → **New deployment**
2. Select type: **Add-on**
3. Choose **Install add-on** for immediate installation
4. For sharing with others:
   - Share the Apps Script project with them (as Viewer or Editor)
   - They can then deploy it for themselves using Test deployments

## Step 4: Share the Add-on with Users

### Option A: Share Apps Script Project

1. In Apps Script editor, click the **Share** button (top right)
2. Add user emails with **Viewer** or **Editor** access
3. Each user can then:
   - Open the shared Apps Script project
   - Click **Deploy** → **Test deployments**
   - Click **Install** to install the add-on for themselves

### Option B: Create an Installable Link (Advanced)

For a more streamlined experience, you can create a Cloud Function or web app that automates the installation, but this is more complex.

### Option C: Publish Privately (Google Workspace Only)

If you have Google Workspace:

1. Go to [Google Workspace Marketplace SDK](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com)
2. Enable the API
3. Configure the marketplace listing as **Private** to your domain
4. Complete the OAuth configuration and marketplace listing
5. Users in your domain can install from Workspace Marketplace

## Step 5: User Installation

### For Users Installing the Add-on:

1. **If shared via Apps Script project**:
   - Open the shared Apps Script project link
   - Click **Deploy** → **Test deployments**
   - Click **Install**
   - Authorize the add-on when prompted

2. **First-time use**:
   - Open any Google Slides presentation
   - Look for **"Claude AI"** in the Add-ons menu or Extensions menu
   - Click **"Claude AI"** → **"Analyse Presentation"**
   - The sidebar will open automatically
   - Set your API key using **"Claude AI"** → **"Set API Key"** (if not using shared script property)

3. **Grant permissions**:
   - First time using, you'll see an authorization dialog
   - Click **Continue** and **Allow** to grant necessary permissions
   - If you see "App isn't verified", click **Advanced** → **Go to [App Name] (unsafe)**

## Step 6: Verify Installation

### Test the Add-on:

1. Open a new Google Slides presentation
2. Check that **"Claude AI"** appears in the menu bar
3. Click **"Claude AI"** → **"Analyse Presentation"**
4. The sidebar should open on the right
5. Test loading a rubric:
   - Enter a Google Doc ID containing rubric tables
   - Click "Load Rubric"
   - Verify criteria appear as checkboxes
6. Test analysis:
   - Select some criteria
   - Click "Analyse with Rubric"
   - Verify text highlighting works

## Configuration Notes

### Using Shared vs. User API Keys

**Option 1: Shared API Key (Centralised)**
- Set `CLAUDE_API_KEY` in Script Properties (Project Settings)
- All users use the same API key
- Easier management, all API usage billed to one account
- Users don't need their own Claude API keys

**Option 2: User API Keys (Distributed)**
- Each user sets their own API key using "Set API Key" menu
- API keys stored in User Properties (per-user)
- Each user manages their own API costs
- More privacy, but requires all users to have Claude API accounts

You can support both: Script Property as fallback, User Property takes precedence.

### Updating the Add-on

When you need to update the code:

1. Make changes in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click ✏️ (edit) next to your deployment
4. Select **New version**
5. Add version description
6. Click **Deploy**

Users will automatically get the updates the next time they open Google Slides.

## Troubleshooting

### Users Can't See the Add-on

- Verify they've installed it via Test deployments
- Check they're logged in with the correct Google account
- Try having them refresh their browser or open a new Slides presentation
- Check that they've granted all required permissions

### "Unauthorized" or Permission Errors

- Verify OAuth consent screen is configured correctly
- Check that all required scopes are added
- For External apps in Testing mode, ensure users are added as Test Users
- Have users re-authorize by removing and reinstalling the add-on

### API Key Issues

- If using Script Properties, verify the property name is exactly `CLAUDE_API_KEY`
- If users set their own keys, they use the "Set API Key" menu option
- Test API key at https://console.anthropic.com/

### Add-on Not Loading

- Check Apps Script executions at Apps Script → **Executions**
- Look for errors in the execution log
- Verify appsscript.json has correct trigger configurations
- Check browser console for JavaScript errors (F12)

## Security Considerations

### For Private Deployment:

1. **API Key Security**:
   - Never commit API keys to version control
   - Use Script Properties or User Properties
   - Regularly rotate API keys

2. **Access Control**:
   - Only share with trusted users
   - Use Google Workspace Internal apps if possible
   - Monitor API usage for anomalies

3. **Data Privacy**:
   - Presentation and rubric text is sent to Claude API
   - Review Anthropic's privacy policy with users
   - Consider data sensitivity before use

4. **Scope Minimization**:
   - Current scopes are minimal (documents for rubrics, presentations for slides)
   - Don't add unnecessary scopes

## Cost Management

- Each analysis makes an API call to Claude (currently using claude-3-haiku-20240307)
- Monitor usage at [Anthropic Console](https://console.anthropic.com/)
- Consider setting up usage alerts
- If using shared API key, track costs centrally

## Support and Maintenance

### For Add-on Administrator:

- Monitor Apps Script executions for errors
- Keep track of API usage and costs
- Update code as needed
- Communicate changes to users

### For Users:

- Report issues to the add-on administrator
- Check the "Claude AI" menu for updates
- Ensure API key is valid (if using personal keys)

## Next Steps

After successful deployment:

1. ✅ Install and test the add-on yourself
2. ✅ Share with a small group of test users
3. ✅ Gather feedback and iterate
4. ✅ Document any organisation-specific usage guidelines
5. ✅ Roll out to all intended users
6. ✅ Set up monitoring and support process

## Additional Resources

- [Google Apps Script Add-ons Documentation](https://developers.google.com/apps-script/add-ons)
- [Google Slides API Documentation](https://developers.google.com/slides)
- [Claude API Documentation](https://docs.anthropic.com/)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)

## File Checklist

Ensure all these files are in your Apps Script project:

- ✅ `Code.gs` - Main server-side code
- ✅ `Sidebar.html` - Sidebar UI
- ✅ `appsscript.json` - Manifest configuration

## Notes

- This is configured as a **Slides-only** add-on (not for Docs)
- The add-on loads automatically when any Slides presentation is opened
- Users can access via the "Claude AI" menu or the sidebar
- Rubrics are loaded from Google Docs (read-only access)
- All highlighting happens in Google Slides presentations
