# Testing Google Workspace Add-on Deployment

This guide helps you test the CardService-based Workspace Add-on deployment to verify it extends across all presentations.

## Prerequisites

1. Your Apps Script project must contain:
   - Code.gs (with both `showSidebar()` and `showSidebarCard()` functions)
   - Sidebar.html (for menu-based access)
   - appsscript.json (with `homepageTrigger` calling `showSidebarCard`)

2. You've set up OAuth consent screen in Google Cloud Console

## Step 1: Create a Google Workspace Add-on Test Deployment

**IMPORTANT**: Do NOT create an "Editor Add-on" deployment. That's container-bound.

1. **Open your Apps Script project** at script.google.com

2. **Click Deploy** → **New deployment**

3. **Click the gear icon** next to "Select type"

4. **Select "Add-on"** (NOT "Editor Add-on", NOT "Web app")
   - This creates a Google Workspace Add-on deployment

5. **Fill in details**:
   - **Description**: "Test deployment for Slides add-on"
   - Click **Deploy**

6. **Copy the Deployment ID** (you'll need this)

## Step 2: Install the Test Deployment

1. **Click Deploy** → **Test deployments**

2. **You should see your deployment listed**

3. **Click "Install"** next to the deployment

4. **Grant permissions** when prompted

## Step 3: Test in Google Slides

### Test A: Open an EXISTING presentation

1. Open a presentation you've NEVER used this add-on with before
2. The add-on should load automatically
3. You should see the CardService sidebar appear on the right
4. The sidebar should show "Claude AI Analyser" with rubric loading options

### Test B: Open a BRAND NEW presentation

1. Create a completely new Google Slides presentation
2. The add-on should appear automatically
3. CardService sidebar should be visible

### Test C: Menu access (backward compatibility)

1. The "Claude AI" menu should also appear in the menu bar
2. Click "Claude AI" → "Analyse Presentation"
3. This should open the HtmlService Sidebar.html (the original UI)

## Expected Behavior

**For Workspace Add-on deployment:**
- ✅ CardService sidebar appears automatically when opening ANY presentation
- ✅ Works in all presentations (new or existing)
- ✅ Menu still works for backward compatibility

**For Editor Add-on deployment (what you have now):**
- ❌ Only works in specific presentations you selected
- ❌ Doesn't extend to other presentations

## Troubleshooting

### "I don't see the 'Add-on' option in deployment types"

This might mean:
- Your account doesn't support Workspace Add-ons
- The manifest isn't configured correctly

Check that appsscript.json has the `addOns` section with `slides` configuration.

### "The add-on doesn't appear in new presentations"

1. **Check deployment type**: Go to Deploy → Manage deployments
   - If it says "Editor Add-on", that's container-bound (won't extend)
   - You need "Add-on" type

2. **Check if Test Deployment is active**: Go to Deploy → Test deployments
   - Make sure it's installed
   - Try uninstalling and reinstalling

3. **Wait a few minutes**: Sometimes it takes time for the add-on to propagate

4. **Clear browser cache**: Force refresh with Ctrl+Shift+R

5. **Check execution logs**: In Apps Script editor, go to Executions
   - Look for errors when opening presentations

### "I see 'Add-on' but it's asking for Marketplace listing info"

That's for production deployments. Use **Test deployments** instead:
- Deploy → Test deployments → Install

## What's Different Between Deployment Types

| Feature | Editor Add-on | Google Workspace Add-on |
|---------|--------------|-------------------------|
| Extends to all presentations | ❌ No | ✅ Yes |
| UI System | Can use HtmlService | Must use CardService |
| Configuration | Select specific presentations | Configured via manifest |
| Trigger | onOpen() menu | homepageTrigger in manifest |
| Use case | Container-bound scripts | Marketplace add-ons |

## Next Steps

If Test Deployment works:
- ✅ Your code is correct
- ✅ Marketplace deployment will work the same way
- ✅ Wait for Marketplace approval

If Test Deployment doesn't work:
- Share error messages from execution logs
- Check that CardService functions exist
- Verify manifest configuration
