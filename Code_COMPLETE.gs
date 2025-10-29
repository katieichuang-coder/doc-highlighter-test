/**
 * Google Docs Claude Integration
 * This script adds Claude AI capabilities to Google Docs for text analysis and highlighting
 */

// Configuration - You must set your Claude API key in Script Properties
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307';

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
      'Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):\n' +
      '{\n' +
      '  "analysis": "Brief summary of what you found",\n' +
      '  "highlights": [\n' +
      '    {"text": "exact text from document to highlight", "reason": "why this matches the criteria"}\n' +
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

    var userMessage = 'Document text:\n---\n' + documentText + '\n---\n\n' +
      'User request: ' + userPrompt + '\n\n' +
      'Analyze the document and identify text segments that match the criteria. ' +
      'For each match, extract the BEGINNING portion (first 5-10 words) so the start is clearly marked. ' +
      'Make sure the text matches EXACTLY as it appears in the document.';


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
      message += '\n\nNote: ' + highlightResult.notFoundCount + ' segment(s) could not be found in the document. ' +
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
 * Replaces apostrophes in text with paired opening/closing apostrophes
 * @param {string} text - The text to modify
 * @param {string} openApostrophe - The opening apostrophe character
 * @param {string} closeApostrophe - The closing apostrophe character
 * @return {string} Modified text
 */
function replaceWithPairedApostrophes(text, openApostrophe, closeApostrophe) {
  var apostropheToggle = true;  // true = next apostrophe is opening
  var newText = '';

  for (var i = 0; i < text.length; i++) {
    var char = text.charAt(i);
    // Match any apostrophe or single quote character
    if (char.match(/['\u0027\u2018\u2019\u0060]/)) {
      newText += apostropheToggle ? openApostrophe : closeApostrophe;
      apostropheToggle = !apostropheToggle;  // Toggle for next apostrophe
    } else {
      newText += char;
    }
  }
  return newText;
}

/**
 * Replaces double quotes in text with paired opening/closing quotes
 * @param {string} text - The text to modify
 * @param {string} openQuote - The opening quote character
 * @param {string} closeQuote - The closing quote character
 * @return {string} Modified text
 */
function replaceWithPairedQuotes(text, openQuote, closeQuote) {
  var quoteToggle = true;  // true = next quote is opening
  var newText = '';

  for (var i = 0; i < text.length; i++) {
    var char = text.charAt(i);
    // Match any double quote character
    if (char.match(/["\u0022\u201C\u201D]/)) {
      newText += quoteToggle ? openQuote : closeQuote;
      quoteToggle = !quoteToggle;  // Toggle for next quote
    } else {
      newText += char;
    }
  }
  return newText;
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

    // Search for the text in the document
    var searchResult = body.findText(textToHighlight);
    var segmentHighlightCount = 0;

    if (searchResult === null) {
      Logger.log('Result: NOT FOUND with exact match');

      // Try fallback strategies
      var foundWithFallback = false;

      // Define all possible apostrophe and quote variations upfront
      var apostropheVariations = [
        '\u0027', // ' straight apostrophe
        '\u2019', // ' right single quote (most common in Google Docs)
        '\u2018', // ' left single quote
        '\u0060'  // ` backtick
      ];

      // For paired single quotes/apostrophes (opening and closing different)
      var apostrophePairs = [
        {open: '\u0027', close: '\u0027'},  // 'text'
        {open: '\u2018', close: '\u2019'},  // 'text'  ← Most common in Google Docs!
        {open: '\u2019', close: '\u2018'},  // 'text' (reversed)
        {open: '\u2018', close: '\u2018'},  // 'text' (both left)
        {open: '\u2019', close: '\u2019'}   // 'text' (both right)
      ];

      // For paired double quotes (opening and closing different)
      var quotePairs = [
        {open: '\u0022', close: '\u0022'},  // "text"
        {open: '\u201C', close: '\u201D'},  // "text"  ← Most common in Google Docs!
        {open: '\u201D', close: '\u201C'},  // "text" (reversed)
        {open: '\u201C', close: '\u201C'},  // "text" (both left)
        {open: '\u201D', close: '\u201D'}   // "text" (both right)
      ];

      // Fallback 1: If text contains apostrophes/quotes, try different variations
      if (!foundWithFallback && textToHighlight.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
        Logger.log('Trying fallback: apostrophe/quote variations');

        // Log character codes in original text for debugging
        var charCodes = '';
        for (var c = 0; c < Math.min(textToHighlight.length, 50); c++) {
          var char = textToHighlight.charAt(c);
          if (char.match(/['"''""\u0027\u2018\u2019\u0060\u0022\u201C\u201D]/)) {
            charCodes += '\n  [' + c + '] "' + char + '" = U+' + textToHighlight.charCodeAt(c).toString(16).toUpperCase();
          }
        }
        if (charCodes) {
          Logger.log('Quote characters found in text:' + charCodes);
        }

        var quoteVariations = [
          '\u0022', // " straight quote
          '\u201D', // " right double quote
          '\u201C'  // " left double quote
        ];

        // Try apostrophe-only replacements first (most common case)
        if (textToHighlight.match(/['\u0027\u2018\u2019\u0060]/)) {
          for (var a = 0; a < apostropheVariations.length && !foundWithFallback; a++) {
            var testText = textToHighlight.replace(/['\u0027\u2018\u2019\u0060]/g, apostropheVariations[a]);
            if (testText !== textToHighlight) {
              searchResult = body.findText(testText);
              if (searchResult !== null) {
                Logger.log('✓ Found with apostrophe only: U+' + apostropheVariations[a].charCodeAt(0).toString(16).toUpperCase());
                foundWithFallback = true;
              }
            }
          }
        }

        // Try quote-only replacements
        if (!foundWithFallback && textToHighlight.match(/["\u0022\u201C\u201D]/)) {
          for (var q = 0; q < quoteVariations.length && !foundWithFallback; q++) {
            var testText = textToHighlight.replace(/["\u0022\u201C\u201D]/g, quoteVariations[q]);
            if (testText !== textToHighlight) {
              searchResult = body.findText(testText);
              if (searchResult !== null) {
                Logger.log('✓ Found with quote only: U+' + quoteVariations[q].charCodeAt(0).toString(16).toUpperCase());
                foundWithFallback = true;
              }
            }
          }
        }

        // Try all combinations of apostrophe + quote replacements (simple replacement)
        if (!foundWithFallback) {
          for (var a = 0; a < apostropheVariations.length && !foundWithFallback; a++) {
            for (var q = 0; q < quoteVariations.length && !foundWithFallback; q++) {
              var testText = textToHighlight
                .replace(/[\u0027\u2018\u2019\u0060]/g, apostropheVariations[a])
                .replace(/[\u0022\u201C\u201D]/g, quoteVariations[q]);

              if (testText !== textToHighlight) {
                searchResult = body.findText(testText);
                if (searchResult !== null) {
                  Logger.log('✓ Found with apostrophe: U+' + apostropheVariations[a].charCodeAt(0).toString(16).toUpperCase() +
                            ', quote: U+' + quoteVariations[q].charCodeAt(0).toString(16).toUpperCase());
                  foundWithFallback = true;
                }
              }
            }
          }
        }

        // Try PAIRED apostrophe and quote combinations (opening/closing different)
        // This handles Google Docs' smart quotes: 'text' and "text"
        if (!foundWithFallback) {
          Logger.log('Trying fallback: paired apostrophe/quote combinations');
          var attemptNum = 0;

          for (var ap = 0; ap < apostrophePairs.length && !foundWithFallback; ap++) {
            for (var qp = 0; qp < quotePairs.length && !foundWithFallback; qp++) {
              attemptNum++;
              var testText = textToHighlight;

              // Apply paired apostrophe replacement if text contains apostrophes
              if (testText.match(/['\u0027\u2018\u2019\u0060]/)) {
                testText = replaceWithPairedApostrophes(testText,
                  apostrophePairs[ap].open,
                  apostrophePairs[ap].close);
              }

              // Apply paired quote replacement if text contains double quotes
              if (testText.match(/["\u0022\u201C\u201D]/)) {
                testText = replaceWithPairedQuotes(testText,
                  quotePairs[qp].open,
                  quotePairs[qp].close);
              }

              Logger.log('  Attempt ' + attemptNum + ': apostrophe pair=' +
                        apostrophePairs[ap].open.charCodeAt(0).toString(16).toUpperCase() + '/' +
                        apostrophePairs[ap].close.charCodeAt(0).toString(16).toUpperCase() +
                        ', quote pair=' + quotePairs[qp].open.charCodeAt(0).toString(16).toUpperCase() + '/' +
                        quotePairs[qp].close.charCodeAt(0).toString(16).toUpperCase());
              Logger.log('    Searching for: "' + testText.substring(0, 50) + (testText.length > 50 ? '...' : '') + '"');

              if (testText !== textToHighlight) {
                searchResult = body.findText(testText);
                if (searchResult !== null) {
                  Logger.log('✓ Found with PAIRED quotes (Attempt ' + attemptNum + '): ' +
                            'apostrophe ' + apostrophePairs[ap].open.charCodeAt(0).toString(16).toUpperCase() +
                            '/' + apostrophePairs[ap].close.charCodeAt(0).toString(16).toUpperCase() +
                            ', quote ' + quotePairs[qp].open.charCodeAt(0).toString(16).toUpperCase() +
                            '/' + quotePairs[qp].close.charCodeAt(0).toString(16).toUpperCase());
                  foundWithFallback = true;
                }
              }
            }
          }

          if (!foundWithFallback) {
            Logger.log('All ' + attemptNum + ' paired combinations failed');
          }
        }
      }

      // Fallback 2: If text contains newlines, try without them
      if (!foundWithFallback && textToHighlight.includes('\n')) {
        Logger.log('Trying fallback: removing newlines');
        var textWithoutNewlines = textToHighlight.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        // First try exact match
        searchResult = body.findText(textWithoutNewlines);
        if (searchResult !== null) {
          Logger.log('✓ Found without newlines');
          foundWithFallback = true;
        } else if (textWithoutNewlines.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
          // Try apostrophe variations on newline-removed text
          for (var a2 = 0; a2 < apostropheVariations.length && !foundWithFallback; a2++) {
            var testText2 = textWithoutNewlines.replace(/[\u0027\u2018\u2019\u0060]/g, apostropheVariations[a2]);
            searchResult = body.findText(testText2);
            if (searchResult !== null) {
              Logger.log('✓ Found without newlines + apostrophe variation');
              foundWithFallback = true;
            }
          }

          // Also try paired quotes on newline-removed text
          if (!foundWithFallback) {
            for (var ap2 = 0; ap2 < apostrophePairs.length && !foundWithFallback; ap2++) {
              for (var qp2 = 0; qp2 < quotePairs.length && !foundWithFallback; qp2++) {
                var testText2 = textWithoutNewlines;

                if (testText2.match(/['\u0027\u2018\u2019\u0060]/)) {
                  testText2 = replaceWithPairedApostrophes(testText2,
                    apostrophePairs[ap2].open,
                    apostrophePairs[ap2].close);
                }

                if (testText2.match(/["\u0022\u201C\u201D]/)) {
                  testText2 = replaceWithPairedQuotes(testText2,
                    quotePairs[qp2].open,
                    quotePairs[qp2].close);
                }

                if (testText2 !== textWithoutNewlines) {
                  searchResult = body.findText(testText2);
                  if (searchResult !== null) {
                    Logger.log('✓ Found without newlines + paired quotes');
                    foundWithFallback = true;
                  }
                }
              }
            }
          }
        }
      }

      // Fallback 3: If still not found and text is long, try extracting first meaningful phrase
      if (!foundWithFallback && textToHighlight.length > 50) {
        Logger.log('Trying fallback: extracting first 5-7 words');
        var words = textToHighlight.split(/\s+/);
        if (words.length > 5) {
          var shortPhrase = words.slice(0, Math.min(7, words.length)).join(' ');

          // Try exact match
          searchResult = body.findText(shortPhrase);
          if (searchResult !== null) {
            Logger.log('✓ Found shorter phrase');
            foundWithFallback = true;
          } else if (shortPhrase.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
            // Try apostrophe variations
            for (var a3 = 0; a3 < apostropheVariations.length && !foundWithFallback; a3++) {
              var testText3 = shortPhrase.replace(/[\u0027\u2018\u2019\u0060]/g, apostropheVariations[a3]);
              searchResult = body.findText(testText3);
              if (searchResult !== null) {
                Logger.log('✓ Found shorter phrase + apostrophe variation');
                foundWithFallback = true;
              }
            }

            // Also try paired quotes on shorter phrase
            if (!foundWithFallback) {
              for (var ap3 = 0; ap3 < apostrophePairs.length && !foundWithFallback; ap3++) {
                for (var qp3 = 0; qp3 < quotePairs.length && !foundWithFallback; qp3++) {
                  var testText3 = shortPhrase;

                  if (testText3.match(/['\u0027\u2018\u2019\u0060]/)) {
                    testText3 = replaceWithPairedApostrophes(testText3,
                      apostrophePairs[ap3].open,
                      apostrophePairs[ap3].close);
                  }

                  if (testText3.match(/["\u0022\u201C\u201D]/)) {
                    testText3 = replaceWithPairedQuotes(testText3,
                      quotePairs[qp3].open,
                      quotePairs[qp3].close);
                  }

                  if (testText3 !== shortPhrase) {
                    searchResult = body.findText(testText3);
                    if (searchResult !== null) {
                      Logger.log('✓ Found shorter phrase + paired quotes');
                      foundWithFallback = true;
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!foundWithFallback) {
        Logger.log('All fallback attempts failed - segment not found');
        notFoundCount++;
      }
    }

    // If we found the text (either direct or fallback), highlight it
    if (searchResult !== null) {
      while (searchResult !== null) {
        var element = searchResult.getElement();
        var startOffset = searchResult.getStartOffset();
        var endOffset = searchResult.getEndOffsetInclusive();

        // Apply yellow background to the found text
        if (element.asText) {
          element.asText().setBackgroundColor(startOffset, endOffset, highlightColor);
          segmentHighlightCount++;
          highlightCount++;
        }

        // Find next occurrence (use original textToHighlight for subsequent searches)
        searchResult = body.findText(textToHighlight, searchResult);
      }
      Logger.log('Result: FOUND and highlighted ' + segmentHighlightCount + ' occurrence(s)');
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
