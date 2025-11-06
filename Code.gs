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
 * Converts text to a regex pattern with flexible punctuation matching
 * Quotes/apostrophes will match any variation
 * @param {string} text - The text to convert
 * @return {string} Regex pattern
 */
function createFlexiblePunctuationPattern(text) {
  // Use placeholders to handle quotes, then escape special chars, then restore quote patterns

  var SINGLE_QUOTE_PLACEHOLDER = '___SINGLE_QUOTE___';
  var DOUBLE_QUOTE_PLACEHOLDER = '___DOUBLE_QUOTE___';

  var pattern = text;

  // Step 1: Replace all quote variations with placeholders
  pattern = pattern.replace(/[\u0027\u2018\u2019\u0060]/g, SINGLE_QUOTE_PLACEHOLDER);
  pattern = pattern.replace(/[\u0022\u201C\u201D]/g, DOUBLE_QUOTE_PLACEHOLDER);

  // Step 2: Escape regex special characters (now quotes are safe as placeholders)
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Step 3: Replace placeholders with flexible character classes
  // Single backslash means JavaScript interprets Unicode escapes at string creation time
  // This creates character classes with actual quote characters: ['`] and [""]
  pattern = pattern.replace(new RegExp(SINGLE_QUOTE_PLACEHOLDER, 'g'),
    '[\u0027\u2018\u2019\u0060]');
  pattern = pattern.replace(new RegExp(DOUBLE_QUOTE_PLACEHOLDER, 'g'),
    '[\u0022\u201C\u201D]');

  return pattern;
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

    // Try exact match first
    var searchResult = body.findText(textToHighlight);
    var segmentHighlightCount = 0;

    if (searchResult === null) {
      Logger.log('Result: NOT FOUND with exact match');

      var foundWithFallback = false;

      // Fallback 1: If text contains quotes/apostrophes, use flexible regex pattern
      if (!foundWithFallback && textToHighlight.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
        Logger.log('Trying fallback: flexible regex pattern');
        try {
          var regexPattern = createFlexiblePunctuationPattern(textToHighlight);
          Logger.log('  Regex pattern: ' + regexPattern.substring(0, 100) + (regexPattern.length > 100 ? '...' : ''));

          searchResult = body.findText(regexPattern);
          if (searchResult !== null) {
            Logger.log('✓ Found with flexible regex pattern');
            foundWithFallback = true;
          }
        } catch (regexError) {
          Logger.log('  Regex pattern failed: ' + regexError.toString());
        }
      }

      // Fallback 2: If text contains newlines, try without them
      if (!foundWithFallback && textToHighlight.includes('\n')) {
        Logger.log('Trying fallback: removing newlines');
        var textWithoutNewlines = textToHighlight.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        // Try exact match
        searchResult = body.findText(textWithoutNewlines);
        if (searchResult !== null) {
          Logger.log('✓ Found without newlines');
          foundWithFallback = true;
        } else if (textWithoutNewlines.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
          // Try regex pattern on newline-removed text
          try {
            var regexPattern2 = createFlexiblePunctuationPattern(textWithoutNewlines);
            searchResult = body.findText(regexPattern2);
            if (searchResult !== null) {
              Logger.log('✓ Found without newlines + regex pattern');
              foundWithFallback = true;
            }
          } catch (regexError2) {
            Logger.log('  Regex pattern failed: ' + regexError2.toString());
          }
        }
      }

      // Fallback 3: If text is long, try first 5-7 words
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
            // Try regex pattern on shorter phrase
            try {
              var regexPattern3 = createFlexiblePunctuationPattern(shortPhrase);
              searchResult = body.findText(regexPattern3);
              if (searchResult !== null) {
                Logger.log('✓ Found shorter phrase + regex pattern');
                foundWithFallback = true;
              }
            } catch (regexError3) {
              Logger.log('  Regex pattern failed: ' + regexError3.toString());
            }
          }
        }
      }

      if (!foundWithFallback) {
        Logger.log('All fallback attempts failed - segment not found');
        notFoundCount++;

        // Log helpful debugging info
        if (textToHighlight.includes('\n')) {
          Logger.log('Note: Text contains newline characters');
        }
        if (textToHighlight.includes('  ')) {
          Logger.log('Note: Text contains multiple spaces');
        }
        if (textToHighlight.length > 100) {
          Logger.log('Note: Text is very long (' + textToHighlight.length + ' chars)');
        }
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

        // Find next occurrence
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
    var bodyText = body.editAsText();
    var textLength = bodyText.getText().length;

    Logger.log('Clearing highlights from document (length: ' + textLength + ')');

    // Clear background color for the entire document range
    if (textLength > 0) {
      bodyText.setBackgroundColor(0, textLength - 1, null);
      Logger.log('Successfully cleared highlights');
    }

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

// =============================================================================
// RUBRIC-BASED GRADING FUNCTIONS
// =============================================================================

/**
 * Color palette for different criteria (10 distinct colors)
 */
const RUBRIC_COLORS = [
  '#FFFF00', // Yellow
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FF6B6B', // Light red
  '#98D8C8', // Mint
  '#A8E6CF', // Light green
  '#B4A7D6', // Lavender
  '#FFB3BA', // Light pink
  '#BFEFFF', // Light blue
  '#FFE4B5'  // Moccasin
];

/**
 * Reads and parses a rubric document by its ID
 * @param {string} documentId - The ID of the Google Doc containing the rubric
 * @return {Object} Parsed rubric data or error
 */
function readRubricDocument(documentId) {
  try {
    Logger.log('Reading rubric document: ' + documentId);

    // Open the document
    var rubricDoc = DocumentApp.openById(documentId);
    var body = rubricDoc.getBody();

    // Find the first table in the document
    var tables = [];
    var numChildren = body.getNumChildren();

    for (var i = 0; i < numChildren; i++) {
      var child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.TABLE) {
        tables.push(child.asTable());
      }
    }

    if (tables.length === 0) {
      return {
        success: false,
        error: 'No table found in the rubric document. Please ensure your rubric contains a table.'
      };
    }

    Logger.log('Found ' + tables.length + ' table(s) in the rubric document');

    // Parse all tables and combine criteria
    var allCriteria = [];
    var allGradeLevels = [];
    var tableCount = 0;

    for (var tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      Logger.log('Parsing table ' + (tableIndex + 1) + ' of ' + tables.length);

      var table = tables[tableIndex];
      var rubricData = parseRubricTable(table, tableIndex + 1);

      if (!rubricData.success) {
        Logger.log('Warning: Skipping table ' + (tableIndex + 1) + ' - ' + rubricData.error);
        continue; // Skip invalid tables
      }

      // Merge grade levels (take from first valid table, warn if different)
      if (allGradeLevels.length === 0) {
        allGradeLevels = rubricData.gradeLevels;
      } else {
        // Check if grade levels match
        var levelsMatch = allGradeLevels.length === rubricData.gradeLevels.length &&
                          allGradeLevels.every(function(level, index) {
                            return level === rubricData.gradeLevels[index];
                          });

        if (!levelsMatch) {
          Logger.log('Warning: Table ' + (tableIndex + 1) + ' has different grade levels. Using first table\'s levels.');
          // Still add criteria but map them to the first table's grade levels
        }
      }

      // Add all criteria from this table
      for (var c = 0; c < rubricData.criteria.length; c++) {
        var criterion = rubricData.criteria[c];

        // Check for duplicate criterion names and make them unique
        var originalName = criterion.name;
        var nameIndex = 1;
        while (allCriteria.some(function(existing) { return existing.name === criterion.name; })) {
          criterion.name = originalName + ' (' + (nameIndex + 1) + ')';
          nameIndex++;
        }

        allCriteria.push(criterion);
      }

      tableCount++;
    }

    if (allCriteria.length === 0) {
      return {
        success: false,
        error: 'No valid criteria found in any table. Please check your rubric format.'
      };
    }

    Logger.log('Successfully parsed ' + tableCount + ' table(s) with ' + allCriteria.length + ' total criteria');

    return {
      success: true,
      gradeLevels: allGradeLevels,
      criteria: allCriteria
    };

  } catch (error) {
    Logger.log('Error reading rubric document: ' + error.toString());

    if (error.message && error.message.includes('not found')) {
      return {
        success: false,
        error: 'Document not found. Please check the Document ID and make sure you have access to it.'
      };
    }

    return {
      success: false,
      error: 'Failed to read rubric document: ' + error.toString()
    };
  }
}

/**
 * Parses a table into rubric criteria structure
 * Expected format:
 * | Criteria | Grade 1 | Grade 2 | Grade 3 | Grade 4 | Grade 5 |
 * |----------|---------|---------|---------|---------|---------|
 * | Grammar  | desc    | desc    | desc    | desc    | desc    |
 *
 * @param {Table} table - The table element from Google Docs
 * @param {number} tableIndex - Optional table number for logging (1-based)
 * @return {Object} Parsed rubric data
 */
function parseRubricTable(table, tableIndex) {
  try {
    var numRows = table.getNumRows();

    if (numRows < 2) {
      return {
        success: false,
        error: 'Rubric table must have at least 2 rows (header + 1 criterion).'
      };
    }

    // Parse header row to get grade levels
    var headerRow = table.getRow(0);
    var numCols = headerRow.getNumCells();

    if (numCols < 2) {
      return {
        success: false,
        error: 'Rubric table must have at least 2 columns (Criteria + at least 1 grade level).'
      };
    }

    var gradeLevels = [];
    for (var col = 1; col < numCols; col++) {
      var cellText = headerRow.getCell(col).getText().trim();
      gradeLevels.push(cellText);
    }

    var tableLabel = tableIndex ? ' (Table ' + tableIndex + ')' : '';
    Logger.log('Found grade levels' + tableLabel + ': ' + gradeLevels.join(', '));

    // Parse criteria rows
    var criteria = [];
    var currentCriterion = null;

    for (var row = 1; row < numRows; row++) {
      var rowElement = table.getRow(row);
      var criterionName = rowElement.getCell(0).getText().trim();

      // Handle sub-rows (empty criterion name)
      if (!criterionName) {
        if (currentCriterion) {
          // This is a sub-row - append to the current criterion's descriptors
          for (var col = 1; col < numCols; col++) {
            var descriptor = rowElement.getCell(col).getText().trim();
            if (descriptor) {
              var gradeLevel = gradeLevels[col - 1];
              var existing = currentCriterion.descriptors[gradeLevel];

              // Append with line break if there's existing content
              if (existing) {
                currentCriterion.descriptors[gradeLevel] = existing + '\n' + descriptor;
              } else {
                currentCriterion.descriptors[gradeLevel] = descriptor;
              }
            }
          }
          Logger.log('Added sub-row to criterion' + tableLabel + ': ' + currentCriterion.name);
        } else {
          Logger.log('Warning: Found sub-row before any criterion in table' + tableLabel + ', row ' + (row + 1));
        }
        continue; // Move to next row
      }

      // New criterion - parse normally
      var gradeDescriptors = {};
      for (var col = 1; col < numCols; col++) {
        var descriptor = rowElement.getCell(col).getText().trim();
        gradeDescriptors[gradeLevels[col - 1]] = descriptor;
      }

      currentCriterion = {
        name: criterionName,
        descriptors: gradeDescriptors
      };

      criteria.push(currentCriterion);
      Logger.log('Parsed criterion' + tableLabel + ': ' + criterionName);
    }

    if (criteria.length === 0) {
      return {
        success: false,
        error: 'No criteria found in the rubric table.'
      };
    }

    return {
      success: true,
      gradeLevels: gradeLevels,
      criteria: criteria
    };

  } catch (error) {
    Logger.log('Error parsing rubric table: ' + error.toString());
    return {
      success: false,
      error: 'Failed to parse rubric table: ' + error.toString()
    };
  }
}

/**
 * Analyzes document using rubric-based criteria
 * @param {Array} selectedCriteria - Array of selected criterion names
 * @param {string} targetGrade - The target grade level to check against
 * @param {Object} rubricData - The parsed rubric data
 * @return {Object} Analysis result
 */
function analyzeDocumentWithRubric(selectedCriteria, targetGrade, rubricData) {
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

    // Build the system prompt with rubric criteria
    var systemPrompt = 'You are a document grading assistant using a rubric. Your task is to analyze the provided document text against specific rubric criteria and identify text segments that need improvement or meet/don\'t meet the target grade level.\n\n' +
      'Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):\n' +
      '{\n' +
      '  "analysis": "Brief summary of the grading",\n' +
      '  "criteriaResults": {\n' +
      '    "Criterion Name": {\n' +
      '      "overallAssessment": "Brief assessment for this criterion",\n' +
      '      "highlights": [\n' +
      '        {"text": "exact text from document", "reason": "why this needs improvement"}\n' +
      '      ]\n' +
      '    }\n' +
      '  }\n' +
      '}\n\n' +
      'CRITICAL HIGHLIGHTING RULES:\n' +
      '1. For SENTENCES: Extract the FIRST 5-10 words (the beginning of the sentence)\n' +
      '2. For WORDS: Extract just the individual word\n' +
      '3. For PHRASES: Extract the exact phrase (up to 10 words)\n' +
      '4. Always extract from the START/BEGINNING of the identified text\n' +
      '5. Copy text EXACTLY as it appears - preserve all punctuation, spacing, and capitalization\n' +
      '6. DO NOT include line breaks or newlines in the text segments\n' +
      '7. Each text segment must be SHORT (5-10 words maximum) for reliable matching\n\n' +
      'CRITICAL JSON FORMATTING RULES:\n' +
      '1. Return ONLY the JSON object, nothing else\n' +
      '2. Properly escape all special characters (use \\\" for quotes, \\\\ for backslashes)\n' +
      '3. Each "text" value must be a SHORT segment (5-10 words max)\n' +
      '4. No newlines (\\n) within text segments';

    // Build the rubric description
    var rubricDescription = '\n\nRUBRIC CRITERIA (Target Grade: ' + targetGrade + '):\n\n';

    for (var i = 0; i < selectedCriteria.length; i++) {
      var criterionName = selectedCriteria[i];
      var criterion = rubricData.criteria.find(function(c) { return c.name === criterionName; });

      if (criterion) {
        rubricDescription += 'Criterion: ' + criterionName + '\n';
        rubricDescription += 'Target Grade (' + targetGrade + '): ' + criterion.descriptors[targetGrade] + '\n';

        // Include neighboring grade levels for context
        var gradeIndex = rubricData.gradeLevels.indexOf(targetGrade);
        if (gradeIndex > 0) {
          var lowerGrade = rubricData.gradeLevels[gradeIndex - 1];
          rubricDescription += 'Below Target (' + lowerGrade + '): ' + criterion.descriptors[lowerGrade] + '\n';
        }
        if (gradeIndex < rubricData.gradeLevels.length - 1) {
          var higherGrade = rubricData.gradeLevels[gradeIndex + 1];
          rubricDescription += 'Above Target (' + higherGrade + '): ' + criterion.descriptors[higherGrade] + '\n';
        }
        rubricDescription += '\n';
      }
    }

    var userMessage = 'Document text:\n---\n' + documentText + '\n---\n' + rubricDescription +
      '\nFor each criterion, identify text segments that do NOT meet the target grade level. ' +
      'Extract the BEGINNING portion (first 5-10 words) of each problematic segment. ' +
      'Make sure the text matches EXACTLY as it appears in the document.';

    Logger.log('Calling Claude API with rubric-based prompt');

    // Call Claude API
    var response = callClaudeAPI(apiKey, systemPrompt, userMessage);

    if (!response.success) {
      return response;
    }

    // Parse Claude's response
    var analysisResult = parseRubricResponse(response.data);

    if (!analysisResult.success) {
      return analysisResult;
    }

    // Create color mapping for selected criteria
    var colorMap = {};
    for (var i = 0; i < selectedCriteria.length; i++) {
      colorMap[selectedCriteria[i]] = RUBRIC_COLORS[i % RUBRIC_COLORS.length];
    }

    // Highlight the identified text segments with different colors
    var highlightResult = highlightTextSegmentsWithColors(analysisResult.criteriaResults, colorMap);

    var message = 'Rubric analysis complete! Highlighted ' + highlightResult.highlightCount + ' text segment(s) across ' +
                  Object.keys(analysisResult.criteriaResults).length + ' criteria.';
    if (highlightResult.notFoundCount > 0) {
      message += '\n\nNote: ' + highlightResult.notFoundCount + ' segment(s) could not be found in the document.';
    }

    return {
      success: true,
      analysis: analysisResult.analysis,
      criteriaResults: analysisResult.criteriaResults,
      colorMap: colorMap,
      highlightCount: highlightResult.highlightCount,
      notFoundCount: highlightResult.notFoundCount,
      message: message
    };

  } catch (error) {
    Logger.log('Error in analyzeDocumentWithRubric: ' + error.toString());
    return {
      success: false,
      error: 'An error occurred: ' + error.toString()
    };
  }
}

/**
 * Parses Claude's rubric-based response
 * @param {string} responseText - Claude's response text
 * @return {Object} Parsed result
 */
function parseRubricResponse(responseText) {
  try {
    Logger.log('Parsing rubric response (first 500 chars): ' + responseText.substring(0, 500));

    var jsonText = null;

    // Try to extract JSON from markdown code blocks first
    var codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // Try to find a JSON object - look for the first { to last }
      var firstBrace = responseText.indexOf('{');
      var lastBrace = responseText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = responseText.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonText) {
      return {
        success: false,
        error: 'Could not find JSON in Claude\'s response.'
      };
    }

    var parsedResponse = JSON.parse(jsonText);

    if (!parsedResponse.criteriaResults || typeof parsedResponse.criteriaResults !== 'object') {
      return {
        success: false,
        error: 'Invalid response format - missing criteriaResults object'
      };
    }

    return {
      success: true,
      analysis: parsedResponse.analysis || 'Rubric analysis completed',
      criteriaResults: parsedResponse.criteriaResults
    };

  } catch (error) {
    Logger.log('Error parsing rubric response: ' + error.toString());
    return {
      success: false,
      error: 'Failed to parse response: ' + error.toString()
    };
  }
}

/**
 * Highlights text segments with different colors based on criteria
 * @param {Object} criteriaResults - Object mapping criterion names to their highlights
 * @param {Object} colorMap - Object mapping criterion names to colors
 * @return {Object} Result with highlight count
 */
function highlightTextSegmentsWithColors(criteriaResults, colorMap) {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var highlightCount = 0;
  var notFoundCount = 0;

  Logger.log('=== Starting multi-color highlighting ===');

  for (var criterionName in criteriaResults) {
    if (!criteriaResults.hasOwnProperty(criterionName)) continue;

    var criterionData = criteriaResults[criterionName];
    var highlights = criterionData.highlights || [];
    var color = colorMap[criterionName] || '#FFFF00'; // Default to yellow

    Logger.log('\nCriterion: ' + criterionName + ' (Color: ' + color + ')');
    Logger.log('Segments to highlight: ' + highlights.length);

    for (var i = 0; i < highlights.length; i++) {
      var textToHighlight = highlights[i].text;
      var reason = highlights[i].reason || 'No reason provided';

      if (!textToHighlight) {
        continue;
      }

      Logger.log('\n--- Segment ' + (i+1) + ' for ' + criterionName + ' ---');
      Logger.log('Text: "' + textToHighlight + '"');

      // Try exact match first
      var searchResult = body.findText(textToHighlight);

      if (searchResult === null) {
        // Try fallback strategies (same as original function)
        var foundWithFallback = false;

        if (!foundWithFallback && textToHighlight.match(/['\u0027\u2018\u2019\u0060""\u0022\u201C\u201D]/)) {
          try {
            var regexPattern = createFlexiblePunctuationPattern(textToHighlight);
            searchResult = body.findText(regexPattern);
            if (searchResult !== null) {
              foundWithFallback = true;
            }
          } catch (regexError) {
            Logger.log('Regex failed: ' + regexError.toString());
          }
        }

        if (!foundWithFallback && textToHighlight.includes('\n')) {
          var textWithoutNewlines = textToHighlight.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          searchResult = body.findText(textWithoutNewlines);
          if (searchResult !== null) {
            foundWithFallback = true;
          }
        }

        if (!foundWithFallback && textToHighlight.length > 50) {
          var words = textToHighlight.split(/\s+/);
          if (words.length > 5) {
            var shortPhrase = words.slice(0, Math.min(7, words.length)).join(' ');
            searchResult = body.findText(shortPhrase);
            if (searchResult !== null) {
              foundWithFallback = true;
            }
          }
        }

        if (!foundWithFallback) {
          notFoundCount++;
        }
      }

      // Highlight all occurrences with the criterion's color
      if (searchResult !== null) {
        while (searchResult !== null) {
          var element = searchResult.getElement();
          var startOffset = searchResult.getStartOffset();
          var endOffset = searchResult.getEndOffsetInclusive();

          if (element.asText) {
            element.asText().setBackgroundColor(startOffset, endOffset, color);
            highlightCount++;
          }

          searchResult = body.findText(textToHighlight, searchResult);
        }
        Logger.log('✓ Highlighted with ' + color);
      }
    }
  }

  Logger.log('\n=== Multi-color Highlighting Summary ===');
  Logger.log('Total highlighted: ' + highlightCount);
  Logger.log('Not found: ' + notFoundCount);

  return {
    highlightCount: highlightCount,
    notFoundCount: notFoundCount
  };
}
