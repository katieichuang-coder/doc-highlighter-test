/**
 * Google Docs Claude Integration
 * This script adds Claude AI capabilities to Google Docs for text analysis and highlighting
 */

// Configuration - You must set your Claude API key in Script Properties
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20240620';

/**
 * Creates a custom menu in Google Docs when the document is opened
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Claude AI')
    .addItem('Analyze Document', 'showSidebar')
    .addItem('Set API Key', 'showApiKeyDialog')
    .addToUi();
}

/**
 * Displays a dialog to set the Claude API key
 */
function showApiKeyDialog() {
  var ui = DocumentApp.getUi();
  var result = ui.prompt(
    'Set Claude API Key',
    'Enter your Claude API key (it will be stored securely):',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() == ui.Button.OK) {
    var apiKey = result.getResponseText();
    PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', apiKey);
    ui.alert('API Key saved successfully!');
  }
}

/**
 * Opens the sidebar for user input
 */
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Claude AI Analyzer')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

/**
 * Gets the full text content of the current document
 */
function getDocumentText() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  return body.getText();
}

/**
 * Analyzes the document using Claude API based on user prompt
 * @param {string} userPrompt - The user's analysis request
 * @return {Object} Result object with success status and data
 */
function analyzeDocument(userPrompt) {
  try {
    // Get API key from script properties
    var apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
    if (!apiKey) {
      return {
        success: false,
        error: 'API Key not set. Please go to Claude AI > Set API Key to configure your API key.'
      };
    }

    // Get document text
    var documentText = getDocumentText();
    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        error: 'Document is empty. Please add some text to analyze.'
      };
    }

    // Construct the prompt for Claude
    var systemPrompt = 'You are a document analysis assistant. Your task is to analyze the provided document text based on the user\'s request and identify specific text segments that match their criteria. ' +
      'Return your response in the following JSON format:\n' +
      '{\n' +
      '  "analysis": "Brief summary of what you found",\n' +
      '  "highlights": [\n' +
      '    {"text": "exact text from document to highlight", "reason": "why this matches the criteria"},\n' +
      '    ...\n' +
      '  ]\n' +
      '}\n' +
      'Only include text segments that exist EXACTLY as written in the document. Be precise with the text matching.';

    var userMessage = 'Document text:\n---\n' + documentText + '\n---\n\n' +
      'User request: ' + userPrompt + '\n\n' +
      'Please analyze the document and identify text segments that match the user\'s request.';

    // Call Claude API
    var response = callClaudeAPI(apiKey, systemPrompt, userMessage);

    if (!response.success) {
      return response;
    }

    // Parse Claude's response
    var analysisResult = parseClaudeResponse(response.data);

    if (!analysisResult.success) {
      return analysisResult;
    }

    // Highlight the identified text segments
    var highlightResult = highlightTextSegments(analysisResult.highlights);

    return {
      success: true,
      analysis: analysisResult.analysis,
      highlightCount: highlightResult.highlightCount,
      message: 'Analysis complete! Highlighted ' + highlightResult.highlightCount + ' text segment(s).'
    };

  } catch (error) {
    Logger.log('Error in analyzeDocument: ' + error.toString());
    return {
      success: false,
      error: 'An error occurred: ' + error.toString()
    };
  }
}

/**
 * Calls the Claude API
 * @param {string} apiKey - Claude API key
 * @param {string} systemPrompt - System prompt for Claude
 * @param {string} userMessage - User message
 * @return {Object} Response object
 */
function callClaudeAPI(apiKey, systemPrompt, userMessage) {
  try {
    var payload = {
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(CLAUDE_API_URL, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (responseCode !== 200) {
      Logger.log('API Error: ' + responseBody);
      return {
        success: false,
        error: 'Claude API error (HTTP ' + responseCode + '): ' + responseBody
      };
    }

    var jsonResponse = JSON.parse(responseBody);

    if (!jsonResponse.content || !jsonResponse.content[0] || !jsonResponse.content[0].text) {
      return {
        success: false,
        error: 'Unexpected API response format'
      };
    }

    return {
      success: true,
      data: jsonResponse.content[0].text
    };

  } catch (error) {
    Logger.log('Error calling Claude API: ' + error.toString());
    return {
      success: false,
      error: 'Failed to call Claude API: ' + error.toString()
    };
  }
}

/**
 * Parses Claude's response to extract analysis and highlights
 * @param {string} responseText - Claude's response text
 * @return {Object} Parsed result
 */
function parseClaudeResponse(responseText) {
  try {
    // Try to extract JSON from the response
    var jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse Claude\'s response. Response: ' + responseText
      };
    }

    var parsedResponse = JSON.parse(jsonMatch[0]);

    if (!parsedResponse.highlights || !Array.isArray(parsedResponse.highlights)) {
      return {
        success: false,
        error: 'Invalid response format from Claude'
      };
    }

    return {
      success: true,
      analysis: parsedResponse.analysis || 'Analysis completed',
      highlights: parsedResponse.highlights
    };

  } catch (error) {
    Logger.log('Error parsing Claude response: ' + error.toString());
    return {
      success: false,
      error: 'Failed to parse response: ' + error.toString()
    };
  }
}

/**
 * Highlights text segments in the document
 * @param {Array} highlights - Array of highlight objects with 'text' and 'reason' properties
 * @return {Object} Result with highlight count
 */
function highlightTextSegments(highlights) {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var highlightCount = 0;

  // Yellow highlight color
  var highlightColor = '#FFFF00';

  for (var i = 0; i < highlights.length; i++) {
    var textToHighlight = highlights[i].text;
    if (!textToHighlight) continue;

    // Search for the text in the document
    var searchResult = body.findText(textToHighlight);

    while (searchResult !== null) {
      var element = searchResult.getElement();
      var startOffset = searchResult.getStartOffset();
      var endOffset = searchResult.getEndOffsetInclusive();

      // Apply yellow background to the found text
      if (element.asText) {
        element.asText().setBackgroundColor(startOffset, endOffset, highlightColor);
        highlightCount++;
      }

      // Find next occurrence
      searchResult = body.findText(textToHighlight, searchResult);
    }
  }

  return {
    highlightCount: highlightCount
  };
}

/**
 * Clears all highlights from the document
 */
function clearHighlights() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var text = body.editAsText();

    // Reset background color for entire document
    text.setBackgroundColor(null);

    return {
      success: true,
      message: 'All highlights cleared!'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to clear highlights: ' + error.toString()
    };
  }
}
