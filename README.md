# Google Docs Claude AI Integration

A Google Apps Script that integrates Claude AI with Google Docs to analyze and highlight text based on user prompts. This tool adds AI-powered document analysis capabilities directly into your Google Docs interface.

## Features

- **Custom Menu**: Adds a "Claude AI" menu to Google Docs with easy access to analysis tools
- **Sidebar Interface**: User-friendly sidebar for entering analysis prompts
- **AI-Powered Analysis**: Leverages Claude AI to analyze document content based on your specific needs
- **Smart Highlighting**: Automatically highlights relevant text in your document with yellow background
- **Flexible Prompts**: Analyze documents for passive voice, technical jargon, complex sentences, grammar errors, action items, and more

## How It Works

1. User opens a Google Doc and accesses the Claude AI menu
2. Opens the sidebar and enters a prompt describing what to analyze (e.g., "highlight all passive voice")
3. The script sends the document text and prompt to Claude API
4. Claude analyzes the text and identifies segments matching the criteria
5. The identified text is automatically highlighted in the document

## Setup Instructions

### Prerequisites

- A Google account with access to Google Docs
- A Claude API key from Anthropic (get one at https://console.anthropic.com/)

### Installation Steps

1. **Open Your Google Doc**
   - Open the Google Doc where you want to use this tool

2. **Open Apps Script Editor**
   - Click on `Extensions` > `Apps Script`
   - This will open the Apps Script editor in a new tab

3. **Copy the Script Files**
   - Delete any existing code in the editor
   - Copy the contents of `Code.gs` and paste it into the editor
   - Rename the file to `Code.gs` (if needed)

4. **Add the Sidebar HTML**
   - In the Apps Script editor, click the `+` button next to "Files"
   - Select `HTML` and name it `Sidebar`
   - Copy the contents of `Sidebar.html` and paste it into this new file

5. **Update Project Settings (Optional)**
   - Click on `Project Settings` (gear icon)
   - You can paste the contents of `appsscript.json` if you want to manually configure settings
   - Or simply ensure the OAuth scopes are properly set when you first run the script

6. **Save Your Project**
   - Click the save icon or press `Ctrl+S` (or `Cmd+S` on Mac)
   - Give your project a name (e.g., "Claude AI Document Analyzer")

7. **Set Your Claude API Key**
   - Go back to your Google Doc
   - Refresh the page
   - You should see a new menu called "Claude AI"
   - Click `Claude AI` > `Set API Key`
   - Enter your Claude API key
   - Click OK

8. **Grant Permissions**
   - The first time you use the tool, Google will ask you to authorize the script
   - Click "Continue" and grant the necessary permissions
   - You may see a warning that the app isn't verified - click "Advanced" and then "Go to [Your Project Name] (unsafe)"
   - This is normal for personal scripts

## Usage

### Basic Usage

1. **Open the Analyzer**
   - Click `Claude AI` > `Analyze Document` in your Google Doc menu
   - The sidebar will appear on the right side

2. **Enter Your Prompt**
   - Type what you want Claude to analyze in the text box
   - Examples:
     - "Highlight all instances of passive voice"
     - "Find and highlight all technical jargon"
     - "Highlight sentences that are too long or complex"
     - "Identify and highlight any potential grammar errors"
     - "Highlight all action items or tasks mentioned"

3. **Analyze**
   - Click the "Analyze" button
   - Wait for Claude to process your document (this may take a few seconds)
   - Matching text will be highlighted in yellow

4. **Clear Highlights**
   - Click the "Clear" button to remove all highlights from the document

### Tips for Better Results

- **Be Specific**: The more specific your prompt, the better the results
  - Good: "Highlight sentences using passive voice"
  - Less good: "Make it better"

- **Use Examples**: If you want specific types of content highlighted, provide examples in your prompt
  - "Highlight all dates mentioned, like 'January 2024' or '01/15/2024'"

- **Iterative Analysis**: You can run multiple analyses with different prompts
  - First analyze for passive voice, then clear and analyze for complex sentences

- **Document Length**: For very long documents, the analysis may take longer. Consider breaking large documents into sections.

## File Structure

```
doc-highlighter-test/
├── Code.gs              # Main Apps Script code
├── Sidebar.html         # Sidebar UI interface
├── appsscript.json      # Project configuration
└── README.md            # This file
```

## Technical Details

### Code.gs Functions

- `onOpen()`: Creates the custom menu when the document opens
- `showApiKeyDialog()`: Displays dialog for setting the Claude API key
- `showSidebar()`: Opens the analysis sidebar
- `getDocumentText()`: Retrieves the full text of the document
- `analyzeDocument(userPrompt)`: Main function that orchestrates the analysis
- `callClaudeAPI()`: Handles API communication with Claude
- `parseClaudeResponse()`: Parses Claude's JSON response
- `highlightTextSegments()`: Applies yellow highlighting to identified text
- `clearHighlights()`: Removes all highlights from the document

### API Configuration

- **Model**: claude-3-5-sonnet-20241022
- **Max Tokens**: 4096
- **API Version**: 2023-06-01
- **Endpoint**: https://api.anthropic.com/v1/messages

### Security

- Your API key is stored securely in Google Apps Script Properties
- The key is only accessible by your script and is not visible to others
- API calls are made server-side from Google's servers

## Troubleshooting

### "API Key not set" Error
- Make sure you've set your API key via `Claude AI` > `Set API Key`
- Verify your API key is valid at https://console.anthropic.com/

### No Highlights Appearing
- Check that Claude found matching text (look at the status message)
- Try making your prompt more specific
- Verify the text you're looking for actually exists in the document

### "Document is empty" Error
- Make sure your document contains text
- Try refreshing the page and running the analysis again

### Permission Errors
- Make sure you've granted all necessary permissions to the script
- Try removing permissions and re-authorizing via `Extensions` > `Apps Script` > `Run` > `onOpen`

### API Rate Limits
- If you hit rate limits, wait a few moments before trying again
- Consider upgrading your Claude API plan for higher limits

## Cost Considerations

- Each analysis makes an API call to Claude, which consumes API credits
- The cost depends on your Claude API plan and usage
- Monitor your usage at https://console.anthropic.com/

## Privacy

- Your document text is sent to Anthropic's Claude API for analysis
- Review Anthropic's privacy policy at https://www.anthropic.com/legal/privacy
- This script does not store or transmit your data anywhere else

## License

This project is provided as-is for personal and commercial use.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Claude API documentation: https://docs.anthropic.com/
- Review Google Apps Script documentation: https://developers.google.com/apps-script

## Future Enhancements

Potential features for future versions:
- Multiple highlight colors based on different criteria
- Batch processing of multiple documents
- Custom highlighting colors
- Export analysis results
- Undo/redo functionality
- More sophisticated text matching algorithms

## Credits

Built with:
- Google Apps Script
- Claude AI by Anthropic
- Google Docs API
