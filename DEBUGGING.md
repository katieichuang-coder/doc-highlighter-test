# Debugging Guide: Add-on Not Appearing

## Issue: "Claude AI" Menu Not Appearing in Google Slides

If the add-on menu doesn't appear after installation, follow these debugging steps:

### Step 1: Check Execution Logs

1. Open your Apps Script project (script.google.com)
2. Click **Executions** in the left sidebar (clock icon)
3. Look for any executions when you opened a Slides presentation
4. Check for errors - they'll appear in red

**What to look for:**
- `onOpen` function executions
- Any error messages
- Authorization errors

### Step 2: Manually Test the onOpen Function

This will tell you if the code works at all:

1. In Apps Script editor, select the `onOpen` function from the dropdown at the top
2. Click **Run** (play button)
3. Watch for:
   - Authorization prompt (grant permissions if asked)
   - Any errors in the execution log
   - Success message

**Expected result:** The function should run without errors. Note: It won't actually add the menu because you're not in a Slides context, but it should complete without errors.

### Step 3: Check Deployment Type

**Important:** For Google Workspace Add-ons, you must use **Test Deployment**, not regular deployment.

1. In Apps Script editor, go to **Deploy** → **Test deployments**
2. You should see an active test deployment
3. Click **Install** (if not already installed)
4. This creates a special test installation

**Common mistake:** Deploying as "Web app" or creating a regular deployment won't make the add-on appear in Slides. You need a Test Deployment.

### Step 4: Verify Installation

After using Test Deployment:

1. **Close all Google Slides tabs** completely
2. Open a **new** Google Slides presentation
3. Wait 5-10 seconds for the add-on to load
4. Check under **Extensions** menu (not Add-ons menu) - look for "Claude AI"
5. If still not there, check **Add-ons** menu

**Note:** In newer Google Workspace, add-ons appear under Extensions, not Add-ons menu.

### Step 5: Force Refresh

Sometimes the add-on needs a hard refresh:

1. In your Apps Script project:
   - Go to **Deploy** → **Test deployments**
   - Click the three dots next to your deployment
   - Click **Uninstall**
2. Click **Install** again
3. Close **all** browser tabs with Google Slides
4. Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
5. Open a fresh Google Slides presentation

### Step 6: Check the Manifest

Ensure your `appsscript.json` is correct:

```json
{
  "timeZone": "Australia/Sydney",
  "oauthScopes": [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "urlFetchWhitelist": [
    "https://api.anthropic.com/"
  ],
  "addOns": {
    "common": {
      "name": "Claude AI Rubric Analyzer for Slides",
      "logoUrl": "https://ssl.gstatic.com/docs/common/product/slides_icon_1920.png",
      "homepageTrigger": {
        "runFunction": "showSidebar",
        "enabled": true
      }
    },
    "slides": {
      "homepageTrigger": {
        "runFunction": "showSidebar"
      },
      "onFileScopeGrantedTrigger": {
        "runFunction": "onFileScopeGranted"
      }
    }
  }
}
```

**Key points:**
- Both `common.homepageTrigger` and `slides.homepageTrigger` should reference `showSidebar`
- The `slides` section should exist
- No syntax errors

### Step 7: Alternative Testing Method

If test deployments aren't working, try the standalone script approach:

1. Open a Google Slides presentation
2. Go to **Extensions** → **Apps Script**
3. Delete any code
4. Copy and paste your `Code.gs` content
5. Save (name it something like "Claude AI Test")
6. Create HTML file named "Sidebar" with your Sidebar.html content
7. Close and reopen the presentation
8. The menu should appear now

**Why this works:** This creates a container-bound script that always runs with that specific presentation.

### Step 8: Check Browser Console

1. Open a Google Slides presentation
2. Press F12 (or Cmd+Option+I on Mac) to open Developer Tools
3. Go to the **Console** tab
4. Look for any JavaScript errors
5. Refresh the page and watch for errors during load

### Step 9: Verify OAuth Authorization

1. Go to https://myaccount.google.com/permissions
2. Look for your add-on in the list
3. Check if it has the required permissions
4. If it's there but without permissions, remove it and reinstall

### Common Issues and Solutions

#### Issue: "Add-on loads but no menu appears"

**Solution:** The `onOpen` function might have an error. Check:
```javascript
function onOpen(e) {
  SlidesApp.getUi()
    .createMenu('Claude AI')
    .addItem('Analyse Presentation', 'showSidebar')
    .addItem('Set API Key', 'showApiKeyDialog')
    .addToUi();
}
```

Add debug logging:
```javascript
function onOpen(e) {
  console.log('onOpen triggered');
  try {
    SlidesApp.getUi()
      .createMenu('Claude AI')
      .addItem('Analyse Presentation', 'showSidebar')
      .addItem('Set API Key', 'showApiKeyDialog')
      .addToUi();
    console.log('Menu created successfully');
  } catch (error) {
    console.error('Error in onOpen:', error);
  }
}
```

#### Issue: "Test deployment not available"

**Solution:** You need to link to a Google Cloud Project first:
1. In Apps Script, click ⚙️ **Project Settings**
2. Under "Google Cloud Platform (GCP) Project", click **Change project**
3. Enter your project number
4. Try test deployments again

#### Issue: "Menu appears sometimes but not always"

**Solution:** This is a caching issue:
1. Add a version number to your deployment description
2. Uninstall and reinstall the test deployment
3. Clear browser cache between tests

#### Issue: "Menu appears in one account but not another"

**Solution:** Each user needs to install the test deployment:
1. Share the Apps Script project with the user
2. They need to open the project
3. They need to go to Deploy → Test deployments → Install

### Quick Diagnostic Checklist

Run through this checklist:

- [ ] Apps Script project is linked to a GCP project
- [ ] Test deployment is created (not regular deployment)
- [ ] Test deployment is installed (click Install button)
- [ ] All browser tabs with Slides are closed and reopened
- [ ] Opened a NEW presentation (not an existing one)
- [ ] Waited 10+ seconds after opening presentation
- [ ] Checked both Extensions and Add-ons menus
- [ ] No errors in Apps Script Executions log
- [ ] No errors in browser console (F12)
- [ ] OAuth permissions granted at myaccount.google.com/permissions

### Testing Script

Add this temporary diagnostic function to your Code.gs to verify everything works:

```javascript
function testDiagnostic() {
  Logger.log('Script is accessible');

  try {
    var ui = SlidesApp.getUi();
    Logger.log('SlidesApp.getUi() works');

    ui.alert('Diagnostic', 'If you see this, the script can access the UI', ui.ButtonSet.OK);

    return {
      success: true,
      message: 'All systems operational'
    };
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
```

Run this function from the Apps Script editor while you have a Slides presentation open.

### Getting Help

If none of these steps work, gather this information:

1. Screenshot of your Test deployments page
2. Screenshot of Apps Script Executions log
3. Screenshot of browser console (F12) when opening a presentation
4. Copy of any error messages
5. Your appsscript.json content

This will help identify the specific issue.

## Expected Behavior

When working correctly:

1. Open any Google Slides presentation
2. Menu bar shows: File, Edit, View, Insert, Slide, Arrange, Tools, **Extensions**, Help
3. Click Extensions → You should see "Claude AI" at the bottom
4. Clicking "Claude AI" shows submenu with "Analyse Presentation" and "Set API Key"

**Note:** In some Google Workspace versions, it might appear under "Add-ons" instead of "Extensions".
