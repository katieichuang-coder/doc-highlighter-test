# Google Slides Claude Integration

This is a Google Apps Script that integrates Claude AI with Google Slides to analyze text and highlight segments in your presentations.

## Features

- **AI-Powered Analysis**: Use Claude AI to analyze your presentation text
- **Smart Highlighting**: Automatically highlights text segments across all slides
- **Flexible Text Matching**: Handles different quote/apostrophe variations (smart quotes, straight quotes)
- **Custom Prompts**: Ask Claude to find passive voice, jargon, grammar errors, action items, and more
- **Easy to Use**: Simple sidebar interface with one-click analysis and clearing

## Setup Instructions

### 1. Create a New Google Slides Presentation

Or open an existing one where you want to add the Claude AI integration.

### 2. Open Apps Script Editor

1. In your Google Slides, go to **Extensions > Apps Script**
2. This will open the Apps Script editor

### 3. Add the Script Files

Create three files in the Apps Script editor:

#### File 1: `Code.gs`
Copy the entire contents of `Code_Slides.gs` into this file.

#### File 2: `Sidebar.html`
Copy the contents of `Sidebar.html` into this file.

#### File 3: `appsscript.json`
1. Click the gear icon (⚙️) "Project Settings" in the left sidebar
2. Scroll down and check "Show 'appsscript.json' manifest file in editor"
3. Go back to the Editor tab
4. You'll now see `appsscript.json` in the file list
5. Copy the contents from `appsscript.json` (with presentations scope)

### 4. Set Up Claude API Key

1. Get your Claude API key from [console.anthropic.com](https://console.anthropic.com/)
2. In your presentation, refresh the page
3. You should see a new menu: **Claude AI**
4. Click **Claude AI > Set API Key**
5. Enter your API key (it will be stored securely)

### 5. Grant Permissions

The first time you run the script:
1. Click **Claude AI > Analyze Presentation**
2. Google will ask you to authorize the script
3. Click "Review Permissions"
4. Select your Google account
5. Click "Advanced" > "Go to [Project Name] (unsafe)"
6. Click "Allow"

## How to Use

### Analyze Your Presentation

1. Open the sidebar: **Claude AI > Analyze Presentation**
2. Enter a prompt describing what you want to find (e.g., "Highlight all instances of passive voice")
3. Click **Analyze**
4. Claude will analyze your presentation and highlight matching text in yellow

### Clear Highlights

Click the **Clear Highlights** button in the sidebar to remove all yellow highlights.

## Example Prompts

- "Highlight all instances of passive voice"
- "Find and highlight all technical jargon"
- "Highlight sentences that are too long or complex"
- "Identify and highlight any potential grammar errors"
- "Highlight all action items or tasks mentioned"
- "Find overused words or phrases"
- "Highlight weak or vague language"

## How It Works

### Text Extraction
The script extracts text from all slides and shapes in your presentation and sends it to Claude for analysis.

### Smart Matching
Claude identifies text segments, and the script:
1. Tries exact text matching first
2. Falls back to flexible regex patterns that handle different quote styles
3. Searches through all slides and shapes
4. Highlights matching text with yellow background

### Differences from Google Docs Version

| Feature | Google Docs | Google Slides |
|---------|-------------|---------------|
| **API** | DocumentApp | SlidesApp |
| **Structure** | Single body | Multiple slides & shapes |
| **Search** | Built-in `findText()` | Custom text search |
| **Highlighting** | Direct on Text | On TextRange per shape |
| **Complexity** | Simple | More complex (multi-slide) |

## Troubleshooting

### "Not found" segments
If some text segments aren't highlighted:
- Check the execution logs: **View > Executions**
- The text might have unusual formatting or line breaks
- Try using shorter search phrases (first 5-7 words of sentences)

### OAuth Errors
If you get "insufficient permissions":
- Make sure `appsscript.json` has the `presentations` scope
- Try removing and re-adding the script permissions in Google Account settings

### API Errors
- Verify your Claude API key is correct
- Check you have API credits remaining at console.anthropic.com
- Make sure you're using a supported Claude model

## Files

- **Code_Slides.gs**: Main script file (rename to Code.gs in Apps Script)
- **Sidebar.html**: User interface
- **appsscript.json**: Configuration with OAuth scopes

## Model

By default, this uses `claude-3-haiku-20240307` for fast and cost-effective analysis. You can change the model by editing the `CLAUDE_MODEL` constant in `Code_Slides.gs`.

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions:
- Check the execution logs in Apps Script (View > Executions)
- Review the troubleshooting section above
- Check the GitHub repository for updates

---

**Built with Claude AI** 🤖
