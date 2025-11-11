# Claude AI Rubric Analyser for Google Slides

A Google Workspace Add-on that integrates Claude AI with Google Slides to analyse presentations against rubrics and highlight content with multiple colours based on criteria.

## Features

- **Automatic Add-on Integration**: Appears in every Google Slides presentation once installed
- **Rubric-Based Analysis**: Load rubrics from Google Docs tables and analyse presentations against specific criteria
- **Multi-Criteria Support**: Handle complex rubric structures including:
  - Simple criteria lists (Pattern A)
  - Sub-criteria with merged cells (Pattern B)
  - Multiple rubric tables in one document
- **Smart Text Extraction**: Extracts text from:
  - Regular text boxes and shapes
  - Grouped objects (flowcharts, diagrams)
  - Tables within slides
- **Colour-Coded Highlighting**: Highlights text segments with different colours for each criterion
- **Flexible Criteria Selection**: Choose which criteria to analyse
- **Auto-Grade Detection**: Automatically analyses against the highest grade level in each criterion

## How It Works

1. User opens any Google Slides presentation
2. Accesses the "Claude AI" menu (appears automatically for installed users)
3. Opens the sidebar and enters a Google Doc ID containing rubric tables
4. Loads the rubric - criteria appear as checkboxes (unchecked by default)
5. Selects which criteria to analyse
6. Claude AI analyses the presentation text against selected criteria at the highest grade level
7. Matching text is highlighted with different colours for each criterion
8. Users can clear highlights and criteria selections to start fresh

## Rubric Structure Support

### Pattern A: Single Column with Optional Sub-criteria
```
| Criterion Name        | Grade 1 | Grade 2 | Grade 3 | Grade 4 |
|-----------------------|---------|---------|---------|---------|
| Main Criterion        | ...     | ...     | ...     | ...     |
|   Sub-criterion       | ...     | ...     | ...     | ...     |
|   Another sub         | ...     | ...     | ...     | ...     |
```

### Pattern B: Two-Column with Merged Parent Cells
```
| Criterion | Sub-criterion    | 0 marks | 1 mark | 2 marks | 3 marks |
|-----------|------------------|---------|--------|---------|---------|
| Parent A  | Sub 1            | ...     | ...    | ...     | ...     |
|           | Sub 2            | ...     | ...    | ...     | ...     |
| Parent B  | Sub 1            | ...     | ...    | ...     | ...     |
```

The add-on automatically detects which pattern each table uses and parses accordingly.

## Installation

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions as a private Workspace Add-on.

### Quick Start for Users

1. Install the add-on (via shared deployment link or Apps Script project)
2. Open any Google Slides presentation
3. Look for "Claude AI" in the menu bar
4. Click "Claude AI" → "Analyse Presentation"
5. Set your API key if needed: "Claude AI" → "Set API Key"

## Usage

### 1. Load a Rubric

1. Open the sidebar: **Claude AI** → **Analyse Presentation**
2. Enter a Google Doc ID containing rubric tables
   - Example: `1jEEDM1kI1ondibbdlgm4WvnaxDBKmE9Q6Nsm2Pbyp6k`
   - The Doc must be accessible to you (at least View access)
3. Click **Load Rubric**
4. Wait for criteria to load
5. All criteria checkboxes will be unchecked by default

### 2. Select Criteria to Analyse

1. Check the boxes next to criteria you want to analyse
2. You can select one or multiple criteria
3. Each criterion will be highlighted in a different colour

### 3. Analyse the Presentation

1. Click **Analyse with Rubric**
2. Wait for Claude to analyse the presentation (may take a few seconds)
3. Text segments will be highlighted with colours matching each criterion
4. A legend will appear showing which colour corresponds to which criterion
5. The status message will show how many segments were highlighted

### 4. Clear Highlights

1. Click **Clear Highlights** to remove all highlighting
2. This also unchecks all criteria checkboxes
3. You can now select different criteria and re-analyse

## Technical Details

### Files

- **Code.gs**: Main server-side Apps Script code
  - Text extraction from shapes, groups, and tables
  - Rubric parsing with Pattern A/B detection
  - Claude API integration
  - Multi-colour highlighting
  - Clear highlights functionality
- **Sidebar.html**: Client-side UI
  - Rubric loading interface
  - Criteria selection checkboxes
  - Analysis controls
  - Colour legend display
- **appsscript.json**: Add-on manifest
  - OAuth scopes configuration
  - Add-on triggers (homepage, file scope)
  - Branding and layout

### API Configuration

- **Model**: claude-3-haiku-20240307 (fast and cost-effective)
- **API Endpoint**: https://api.anthropic.com/v1/messages
- **API Version**: 2023-06-01
- **Max Tokens**: 4096

### OAuth Scopes

- `documents`: Read rubric tables from Google Docs
- `presentations`: Read and modify Google Slides presentations
- `script.container.ui`: Display sidebar and menus
- `script.external_request`: Call Claude API

### Key Functions

#### Code.gs

- `onOpen()`: Creates the "Claude AI" menu
- `onFileScopeGranted()`: Triggered when user grants file access
- `showSidebar()`: Opens the analysis sidebar
- `showApiKeyDialog()`: Dialog for setting Claude API key
- `getPresentationText()`: Extracts all text from slides (shapes, groups, tables)
- `extractTextFromGroup()`: Recursively extracts text from grouped objects
- `extractTextFromTable()`: Extracts text from table cells
- `loadRubricFromDoc()`: Loads and parses rubric tables from Google Docs
- `parseRubricTable()`: Parses rubric table structure (auto-detects Pattern A/B)
- `analyzeDocumentWithRubric()`: Orchestrates Claude analysis
- `callClaudeAPI()`: Handles API communication
- `highlightTextSegmentsWithColors()`: Applies multi-colour highlighting
- `highlightInGroup()`: Highlights text within grouped objects
- `highlightInTable()`: Highlights text within table cells
- `clearHighlights()`: Removes all highlighting from all element types

### Highlight Colours

The add-on cycles through these colours for different criteria:

1. 🟡 Yellow (#FFFF00)
2. 🟢 Green (#00FF00)
3. 🔵 Light Blue (#00FFFF)
4. 🟣 Magenta (#FF00FF)
5. 🟠 Orange (#FF9900)
6. 🟣 Light Purple (#CC99FF)
7. 🩵 Light Pink (#FF99CC)
8. ⚪ Light Gray (#CCCCCC)

## Troubleshooting

### Rubric Won't Load

- Verify the Google Doc ID is correct
- Ensure you have at least View access to the Doc
- Check that the Doc contains properly formatted tables
- Look at the status message for specific error details

### No Text Highlighted

- Verify the presentation contains text that matches the criteria
- Try different criteria or broader selections
- Check that your API key is valid
- Look for error messages in the status area

### API Key Issues

- Set your API key: **Claude AI** → **Set API Key**
- Verify at https://console.anthropic.com/
- If using a shared key, contact your administrator
- API key is stored securely in Script Properties or User Properties

### Highlighting Not Working in Groups/Tables

- Ensure you're using the latest version of the add-on
- Groups (flowcharts/diagrams) and tables are supported
- Text must be in shapes within groups (not as images)

### "Add-on Not Available" Error

- Refresh the browser and reopen the presentation
- Check that the add-on is properly installed
- Try reinstalling via Test deployments
- Contact your add-on administrator

### Permission Errors

- Grant all requested permissions during installation
- If you see "App isn't verified", click Advanced → Continue
- For private add-ons, this warning is expected
- Re-authorize if permissions were revoked

## Cost Considerations

- Each analysis makes an API call to Claude
- Using claude-3-haiku (economical model)
- Cost depends on presentation length and number of criteria
- Monitor usage at https://console.anthropic.com/
- If using shared API key, costs are centralized

## Privacy and Security

- Presentation text and rubric content are sent to Claude API
- API key stored securely in Google Apps Script Properties
- No data stored or transmitted elsewhere
- Review Anthropic's privacy policy: https://www.anthropic.com/legal/privacy
- For sensitive content, consider data handling policies

## Limitations

- Maximum presentation text length depends on Claude API limits
- Very large presentations may need to be analysed in sections
- Highlighting accuracy depends on exact text matching
- Complex formatting may affect text extraction
- Images and embedded objects (non-text) are not analysed

## Updates and Maintenance

The add-on administrator can push updates:

1. Updates deploy automatically to all users
2. Users may need to refresh their browser to see changes
3. Check version history in Apps Script for changes
4. Report issues to your add-on administrator

## Support

For issues or questions:

- Contact your add-on administrator
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
- Review Claude API docs: https://docs.anthropic.com/
- Review Google Apps Script docs: https://developers.google.com/apps-script
- Review Google Slides API docs: https://developers.google.com/slides

## Future Enhancements

Potential features for future versions:

- Custom colour selection for criteria
- Export analysis results to a report
- Batch analysis of multiple presentations
- More rubric table patterns
- Integration with Google Classroom
- Comments/notes on highlighted segments
- Comparison between multiple presentations

## Credits

Built with:

- Google Apps Script
- Google Slides API
- Google Docs API
- Claude AI by Anthropic

## License

This project is provided as-is for educational and commercial use within your organization.
