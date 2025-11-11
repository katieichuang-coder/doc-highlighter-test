# Deployment Guide: Claude AI Rubric Analyser for Slides (Private Workspace Add-on)

This guide walks you through deploying the Claude AI Rubric Analyser as a **private** Google Workspace Add-on for Google Slides that you can share with specific users.

## Overview

This deployment will create a private add-on that:
- Appears automatically in the Add-ons menu for all Google Slides presentations
- Can be installed by specific users you share the deployment link with
- Uses your existing Google Cloud Project
- Persists across all slides for installed users

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
   https://www.googleapis.com/auth/documents.readonly
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

### 3.1 Create a Deployment

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Add-on**
4. Fill in the deployment details:
   - **Add-on title**: Claude AI Rubric Analyser for Slides
   - **Description**: AI-powered rubric analysis and highlighting for Google Slides presentations
   - **Post-install tip** (optional): "Click 'Claude AI' menu or open the sidebar to get started"
   - **Help URL** (optional): Link to documentation
   - **Version**: New version
   - **Version description**: "Initial production deployment"
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
   - Current scopes are minimal (documents.readonly for rubrics, presentations for slides)
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
