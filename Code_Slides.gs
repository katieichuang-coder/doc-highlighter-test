/**
 * Google Slides Claude Integration
 * This script adds Claude AI capabilities to Google Slides for text analysis and highlighting
 */

// Configuration - You must set your Claude API key in Script Properties
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307';

/**
 * Creates a custom menu in Google Slides when the presentation is opened
 */
function onOpen() {
  SlidesApp.getUi()
    .createMenu('Claude AI')
    .addItem('Analyze Presentation', 'showSidebar')
    .addItem('Set API Key', 'showApiKeyDialog')
    .addToUi();
}

/**
 * Displays a dialog to set the Claude API key
 */
function showApiKeyDialog() {
  var ui = SlidesApp.getUi();
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
  SlidesApp.getUi().showSidebar(html);
}

/**
 * Gets the full text content of the current presentation
 */
function getPresentationText() {
  var presentation = SlidesApp.getActivePresentation();
  var slides = presentation.getSlides();
  var fullText = '';

  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];
    var shapes = slide.getShapes();

    for (var j = 0; j < shapes.length; j++) {
      var shape = shapes[j];
      if (shape.getText) {
        var text = shape.getText().asString();
        if (text.trim().length > 0) {
          fullText += text + '\n';
        }
      }
    }
  }

  return fullText.trim();
}

/**
 * Analyzes the presentation using Claude API based on user prompt
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

    // Get presentation text
    var presentationText = getPresentationText();
    if (!presentationText || presentationText.trim().length === 0) {
      return {
        success: false,
        error: 'Presentation is empty. Please add some text to analyze.'
      };
    }

    // Construct the prompt for Claude
    var systemPrompt = 'You are a presentation analysis assistant. Your task is to analyze the provided presentation text based on the user\'s request and identify specific text segments that match their criteria. ' +
      'Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):\n' +
      '{\n' +
      '  "analysis": "Brief summary of what you found",\n' +
      '  "highlights": [\n' +
      '    {"text": "exact text from presentation to highlight", "reason": "why this matches the criteria"}\n' +
      '  ]\n' +
      '}\n\n' +
      'CRITICAL HIGHLIGHTING RULES:\n' +
      '1. For SENTENCES: Extract the FIRST 5-10 words (the beginning of the sentence)\n' +
      '2. For WORDS: Extract just the individual word\n' +
      '3. For PHRASES: Extract the exact phrase (up to 10 words)\n' +
      '4. Always extract from the START/BEGINNING of the identified text, not the middle\n' +
      '5. Copy text EXACTLY as it appears - preserve all punctuation, spacing, and capitalization\n' +
      '6. DO NOT include line breaks or newlines in the text segments\n' +
      '7. Each text segment must be SHORT (5-10 words maximum) for reliable matching\n\n' +
      'CRITICAL JSON FORMATTING RULES:\n' +
      '1. Return ONLY the JSON object, nothing else\n' +
      '2. Properly escape all special characters (use \\\" for quotes, \\\\ for backslashes)\n' +
      '3. Each "text" value must be a SHORT segment (5-10 words max)\n' +
      '4. No newlines (\\n) within text segments';

    var userMessage = 'Presentation text:\n---\n' + presentationText + '\n---\n\n' +
      'User request: ' + userPrompt + '\n\n' +
      'Analyze the presentation and identify text segments that match the criteria. ' +
      'For each match, extract the BEGINNING portion (first 5-10 words) so the start is clearly marked. ' +
      'Make sure the text matches EXACTLY as it appears in the presentation.';


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

    var message = 'Analysis complete! Highlighted ' + highlightResult.highlightCount + ' text segment(s).';
    if (highlightResult.notFoundCount > 0) {
      message += '\n\nNote: ' + highlightResult.notFoundCount + ' segment(s) could not be found in the presentation. ' +
        'Check the execution logs (View > Executions in Apps Script) for details.';
    }

    return {
      success: true,
      analysis: analysisResult.analysis,
      highlightCount: highlightResult.highlightCount,
      notFoundCount: highlightResult.notFoundCount,
      message: message
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
    Logger.log('Raw Claude response (first 500 chars): ' + responseText.substring(0, 500));

    var jsonText = null;

    // Try to extract JSON from markdown code blocks first
    var codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
      Logger.log('Found JSON in code block');
    } else {
      // Try to find a JSON object - look for the first { to last }
      var firstBrace = responseText.indexOf('{');
      var lastBrace = responseText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = responseText.substring(firstBrace, lastBrace + 1);
        Logger.log('Extracted JSON from position ' + firstBrace + ' to ' + lastBrace);
      }
    }

    if (!jsonText) {
      Logger.log('Could not find JSON in response');
      return {
        success: false,
        error: 'Could not find JSON in Claude\'s response. Please check the Apps Script logs for the full response.'
      };
    }

    Logger.log('JSON to parse (first 500 chars): ' + jsonText.substring(0, 500));

    // Try to parse the JSON
    var parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      Logger.log('Initial JSON parse failed: ' + parseError.toString());
      Logger.log('Problematic JSON: ' + jsonText);

      // Try to provide helpful error message
      return {
        success: false,
        error: 'JSON parsing error at position ' + parseError.message.match(/\d+/)?.[0] + '. The AI response contained improperly formatted JSON. Try a simpler prompt or shorter text segments.'
      };
    }

    if (!parsedResponse.highlights || !Array.isArray(parsedResponse.highlights)) {
      Logger.log('Response missing highlights array');
      Logger.log('Parsed response: ' + JSON.stringify(parsedResponse));
      return {
        success: false,
        error: 'Invalid response format from Claude - missing highlights array'
      };
    }

    Logger.log('Successfully parsed ' + parsedResponse.highlights.length + ' highlights');
    return {
      success: true,
      analysis: parsedResponse.analysis || 'Analysis completed',
      highlights: parsedResponse.highlights
    };

  } catch (error) {
    Logger.log('Error parsing Claude response: ' + error.toString());
    Logger.log('Full response: ' + responseText);
    return {
      success: false,
      error: 'Failed to parse response: ' + error.toString() + '. Check Apps Script logs (View > Executions) for details.'
    };
  }
}

/**
 * Converts text to a regex pattern with flexible punctuation matching
 * Quotes/apostrophes will match any variation
 * @param {string} text - The text to convert
 * @return {RegExp} Regular expression object
 */
function createFlexiblePunctuationPattern(text) {
  var SINGLE_QUOTE_PLACEHOLDER = '___SINGLE_QUOTE___';
  var DOUBLE_QUOTE_PLACEHOLDER = '___DOUBLE_QUOTE___';

  var pattern = text;

  // Step 1: Replace all quote variations with placeholders
  pattern = pattern.replace(/[\u0027\u2018\u2019\u0060]/g, SINGLE_QUOTE_PLACEHOLDER);
  pattern = pattern.replace(/[\u0022\u201C\u201D]/g, DOUBLE_QUOTE_PLACEHOLDER);

  // Step 2: Escape regex special characters (now quotes are safe as placeholders)
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Step 3: Replace placeholders with flexible character classes
  pattern = pattern.replace(new RegExp(SINGLE_QUOTE_PLACEHOLDER, 'g'),
    '[\u0027\u2018\u2019\u0060]');
  pattern = pattern.replace(new RegExp(DOUBLE_QUOTE_PLACEHOLDER, 'g'),
    '[\u0022\u201C\u201D]');

  return new RegExp(pattern, 'g');
}

/**
 * Finds all occurrences of a text pattern in a string
 * @param {string} text - The text to search in
 * @param {string} searchText - The text to find
 * @return {Array} Array of {start, end} positions
 */
function findTextOccurrences(text, searchText) {
  var matches = [];

  // Try exact match first
  var index = text.indexOf(searchText);
  while (index !== -1) {
    matches.push({start: index, end: index + searchText.length});
    index = text.indexOf(searchText, index + 1);
  }

  // If no exact matches and text contains quotes, try regex pattern
  if (matches.length === 0 && searchText.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
    try {
      var regex = createFlexiblePunctuationPattern(searchText);
      var match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({start: match.index, end: match.index + match[0].length});
      }
    } catch (e) {
      Logger.log('Regex search failed: ' + e.toString());
    }
  }

  return matches;
}

/**
 * Highlights text segments in the presentation
 * @param {Array} highlights - Array of highlight objects with 'text' and 'reason' properties
 * @return {Object} Result with highlight count
 */
function highlightTextSegments(highlights) {
  var presentation = SlidesApp.getActivePresentation();
  var slides = presentation.getSlides();
  var highlightCount = 0;
  var notFoundCount = 0;

  // Yellow highlight color
  var highlightColor = '#FFFF00';

  Logger.log('=== Starting highlighting process ===');
  Logger.log('Total segments to highlight: ' + highlights.length);

  for (var i = 0; i < highlights.length; i++) {
    var textToHighlight = highlights[i].text;
    var reason = highlights[i].reason || 'No reason provided';

    if (!textToHighlight) {
      Logger.log('Segment ' + (i+1) + ': Empty text, skipping');
      continue;
    }

    Logger.log('\n--- Segment ' + (i+1) + ' ---');
    Logger.log('Text to find: "' + textToHighlight + '"');
    Logger.log('Reason: ' + reason);
    Logger.log('Text length: ' + textToHighlight.length + ' characters');

    var foundAny = false;

    // Search through all slides and shapes
    for (var slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      var slide = slides[slideIndex];
      var shapes = slide.getShapes();

      for (var shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
        var shape = shapes[shapeIndex];

        if (!shape.getText) {
          continue;
        }

        var textRange = shape.getText();
        var shapeText = textRange.asString();

        // Find all occurrences of the text in this shape
        var occurrences = findTextOccurrences(shapeText, textToHighlight);

        if (occurrences.length > 0) {
          Logger.log('Found ' + occurrences.length + ' occurrence(s) in slide ' + (slideIndex + 1) + ', shape ' + (shapeIndex + 1));

          for (var k = 0; k < occurrences.length; k++) {
            var occurrence = occurrences[k];
            try {
              // Get the specific text range and apply highlight
              var rangeToHighlight = textRange.getRange(occurrence.start, occurrence.end);
              rangeToHighlight.getTextStyle().setBackgroundColor(highlightColor);
              highlightCount++;
              foundAny = true;
            } catch (highlightError) {
              Logger.log('Error highlighting at position ' + occurrence.start + '-' + occurrence.end + ': ' + highlightError.toString());
            }
          }
        }
      }
    }

    if (!foundAny) {
      Logger.log('Result: NOT FOUND in any slide');
      notFoundCount++;
    } else {
      Logger.log('Result: Successfully highlighted segment');
    }
  }

  Logger.log('\n=== Highlighting Summary ===');
  Logger.log('Total segments processed: ' + highlights.length);
  Logger.log('Successfully highlighted: ' + highlightCount + ' occurrence(s)');
  Logger.log('Not found: ' + notFoundCount + ' segment(s)');

  return {
    highlightCount: highlightCount,
    notFoundCount: notFoundCount
  };
}

/**
 * Clears all highlights from the presentation
 */
function clearHighlights() {
  try {
    var presentation = SlidesApp.getActivePresentation();
    var slides = presentation.getSlides();
    var clearedCount = 0;

    Logger.log('Clearing highlights from presentation');

    // Iterate through all slides and shapes
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var shapes = slide.getShapes();

      for (var j = 0; j < shapes.length; j++) {
        var shape = shapes[j];

        if (!shape.getText) {
          continue;
        }

        try {
          var textRange = shape.getText();
          var textLength = textRange.asString().length;

          if (textLength > 0) {
            // Clear background color for entire text range
            var fullRange = textRange.getRange(0, textLength);
            fullRange.getTextStyle().setBackgroundColor(null);
            clearedCount++;
          }
        } catch (clearError) {
          Logger.log('Error clearing highlights in slide ' + (i+1) + ', shape ' + (j+1) + ': ' + clearError.toString());
        }
      }
    }

    Logger.log('Successfully cleared highlights from ' + clearedCount + ' shapes');

    return {
      success: true,
      message: 'All highlights cleared!'
    };
  } catch (error) {
    Logger.log('Error clearing highlights: ' + error.toString());
    return {
      success: false,
      error: 'Failed to clear highlights: ' + error.toString()
    };
  }
}
