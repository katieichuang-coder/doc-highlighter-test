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
            // Use setBackgroundColorTransparent() to properly clear highlights
            try {
              var fullRange = textRange.getRange(0, textLength);
              var textStyle = fullRange.getTextStyle();

              // This is the correct way to clear backgrounds in Slides!
              textStyle.setBackgroundColorTransparent();

              clearedCount++;
              Logger.log('Cleared highlights in slide ' + (i+1) + ', shape ' + (j+1));
            } catch (clearError) {
              Logger.log('Failed to clear slide ' + (i+1) + ', shape ' + (j+1) + ': ' + clearError.toString());
            }
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
 * NOTE: Rubric must be a Google Doc (not Slides), even when grading presentations
 * @param {string} documentId - The ID of the Google Doc containing the rubric
 * @return {Object} Parsed rubric data or error
 */
function readRubricDocument(documentId) {
  try {
    Logger.log('Reading rubric document: ' + documentId);

    // Open the document (rubric is always a Google Doc with a table)
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
 * Supports two patterns:
 * Pattern A (single criterion column):
 * | Criteria | Grade 1 | Grade 2 | Grade 3 |
 * |----------|---------|---------|---------|
 * | Grammar  | desc    | desc    | desc    |
 *
 * Pattern B (two criterion columns with sub-criteria):
 * | Parent | Sub-Criterion | Grade 1 | Grade 2 | Grade 3 |
 * |--------|---------------|---------|---------|---------|
 * | Method | Summary       | desc    | desc    | desc    |
 * |        | Data process  | desc    | desc    | desc    |
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

    // Parse header row to determine table structure and grade levels
    var headerRow = table.getRow(0);
    var numCols = headerRow.getNumCells();

    if (numCols < 2) {
      return {
        success: false,
        error: 'Rubric table must have at least 2 columns.'
      };
    }

    // Detect if we have 2 criterion columns (Pattern B) or 1 criterion column (Pattern A)
    // Pattern B: Parent | Sub-Criterion | Grade 0 | Grade 1 | ...
    // Pattern A: Criteria | Grade 0 | Grade 1 | ...
    var hasTwoCriterionColumns = false;
    var gradeStartCol = 1; // Default: grades start at column 1

    // Strategy 1: Check if second column header looks like a sub-criterion column
    if (numCols >= 3) {
      var col1Header = headerRow.getCell(1).getText().trim().toLowerCase();
      var col2Header = headerRow.getCell(2).getText().trim().toLowerCase();

      // Check if column 1 is empty/sub-criteria header AND column 2 looks like a grade
      var col1LooksLikeSubCriteria = (col1Header === '' ||
          col1Header.includes('sub') ||
          col1Header.includes('criterion') ||
          col1Header.includes('criteria') ||
          col1Header.includes('item') ||
          col1Header.includes('aspect'));

      var col2LooksLikeGrade = (col2Header.includes('grade') ||
          col2Header.includes('level') ||
          col2Header.includes('mark') ||
          /\d/.test(col2Header));

      if (col1LooksLikeSubCriteria && col2LooksLikeGrade) {
        hasTwoCriterionColumns = true;
        gradeStartCol = 2;
        Logger.log('Pattern B detected via header: col1="' + col1Header + '", col2="' + col2Header + '"');
      }
    }

    // Strategy 2: If not detected via header, check data rows for sub-criteria in column 1
    // But ONLY if column 1 header doesn't look like a grade level
    if (!hasTwoCriterionColumns && numCols >= 3 && numRows >= 2) {
      var col1Header = headerRow.getCell(1).getText().trim().toLowerCase();

      // Don't apply Strategy 2 if column 1 header is clearly a grade level
      var col1HeaderLooksLikeGrade = (col1Header.includes('grade') ||
          col1Header.includes('level') ||
          col1Header.includes('mark') ||
          col1Header.includes('point') ||
          col1Header.includes('score') ||
          /\d/.test(col1Header)); // Contains a digit

      if (!col1HeaderLooksLikeGrade) {
        // Sample first few data rows to see if column 1 has sub-criteria content
        var sampleSize = Math.min(3, numRows - 1);
        var col1HasContent = false;

        for (var sampleRow = 1; sampleRow <= sampleSize; sampleRow++) {
          var sampleRowElement = table.getRow(sampleRow);
          var col1Text = sampleRowElement.getCell(1).getText().trim();
          var col2Text = sampleRowElement.getCell(2).getText().trim();

          // If column 1 has content and column 2 has content, might be Pattern B
          if (col1Text && col2Text) {
            col1HasContent = true;
            break;
          }
        }

        if (col1HasContent) {
          hasTwoCriterionColumns = true;
          gradeStartCol = 2;
          Logger.log('Pattern B detected via data rows: column 1 contains sub-criteria');
        }
      } else {
        Logger.log('Strategy 2 skipped: column 1 header looks like a grade level: "' + col1Header + '"');
      }
    }

    // Parse grade levels
    var gradeLevels = [];
    for (var col = gradeStartCol; col < numCols; col++) {
      var cellText = headerRow.getCell(col).getText().trim();
      gradeLevels.push(cellText);
    }

    var tableLabel = tableIndex ? ' (Table ' + tableIndex + ')' : '';
    Logger.log('Table structure' + tableLabel + ': ' + (hasTwoCriterionColumns ? '2 criterion columns' : '1 criterion column'));
    Logger.log('Found grade levels' + tableLabel + ': ' + gradeLevels.join(', '));

    // Parse criteria rows
    var criteria = [];
    var currentParent = null;

    for (var row = 1; row < numRows; row++) {
      var rowElement = table.getRow(row);

      var parentName = '';
      var subName = '';

      if (hasTwoCriterionColumns) {
        // Pattern B: Two criterion columns
        parentName = rowElement.getCell(0).getText().trim();
        subName = rowElement.getCell(1).getText().trim();

        // Handle merged parent cells (empty means use previous parent)
        if (!parentName && currentParent) {
          parentName = currentParent;
        } else if (parentName) {
          currentParent = parentName;
        }

        // Skip rows with no sub-criterion name
        if (!subName) {
          continue;
        }

        // Combine parent and sub names
        var finalName = parentName ? parentName + '-' + subName : subName;

      } else {
        // Pattern A: Single criterion column (existing logic)
        var rawCriterionName = rowElement.getCell(0).getText();
        var criterionName = rawCriterionName.trim();

        // Skip empty rows
        if (!criterionName) {
          continue;
        }

        // Check if this is an indented sub-criterion
        var isIndented = rawCriterionName !== criterionName &&
                         (rawCriterionName.startsWith(' ') || rawCriterionName.startsWith('\t'));

        if (isIndented && currentParent) {
          var finalName = currentParent + '-' + criterionName;
        } else {
          var finalName = criterionName;
          currentParent = criterionName;
        }
      }

      // Parse grade descriptors
      var gradeDescriptors = {};
      var hasDescriptors = false;
      for (var col = gradeStartCol; col < numCols; col++) {
        var descriptor = rowElement.getCell(col).getText().trim();
        var gradeIndex = col - gradeStartCol;
        gradeDescriptors[gradeLevels[gradeIndex]] = descriptor;
        if (descriptor) {
          hasDescriptors = true;
        }
      }

      // Only add criteria with descriptors
      if (hasDescriptors) {
        criteria.push({
          name: finalName,
          descriptors: gradeDescriptors
        });
        Logger.log('Parsed criterion' + tableLabel + ': ' + finalName);
      }
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
 * Analyzes presentation using rubric-based criteria
 * Automatically uses the highest grade level (last in array) as the target
 * @param {Array} selectedCriteria - Array of selected criterion names
 * @param {Object} rubricData - The parsed rubric data
 * @return {Object} Analysis result
 */
function analyzeDocumentWithRubric(selectedCriteria, rubricData) {
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

    // Automatically detect the highest grade level (last in the array)
    var targetGrade = rubricData.gradeLevels[rubricData.gradeLevels.length - 1];
    Logger.log('Auto-detected target grade: ' + targetGrade);

    // Build the system prompt with rubric criteria
    var systemPrompt = 'You are a presentation grading assistant using a rubric. Your task is to analyze the provided presentation text against specific rubric criteria and identify text segments that need improvement or meet/don\'t meet the target grade level.\n\n' +
      'Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):\n' +
      '{\n' +
      '  "analysis": "Brief summary of the grading",\n' +
      '  "criteriaResults": {\n' +
      '    "Criterion Name": {\n' +
      '      "overallAssessment": "Brief assessment for this criterion",\n' +
      '      "highlights": [\n' +
      '        {"text": "exact text from presentation", "reason": "why this needs improvement"}\n' +
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
    var rubricDescription = '\n\nRUBRIC CRITERIA (Target: Highest Grade Level - ' + targetGrade + '):\n\n';

    for (var i = 0; i < selectedCriteria.length; i++) {
      var criterionName = selectedCriteria[i];
      var criterion = rubricData.criteria.find(function(c) { return c.name === criterionName; });

      if (criterion) {
        rubricDescription += 'Criterion: ' + criterionName + '\n';
        rubricDescription += 'Highest Level (' + targetGrade + '): ' + criterion.descriptors[targetGrade] + '\n';

        // Include lower grade levels for context
        var gradeIndex = rubricData.gradeLevels.indexOf(targetGrade);
        if (gradeIndex > 0) {
          var lowerGrade = rubricData.gradeLevels[gradeIndex - 1];
          rubricDescription += 'Below Highest (' + lowerGrade + '): ' + criterion.descriptors[lowerGrade] + '\n';
        }
        if (gradeIndex > 1) {
          var lowestGrade = rubricData.gradeLevels[0];
          rubricDescription += 'Lowest Level (' + lowestGrade + '): ' + criterion.descriptors[lowestGrade] + '\n';
        }
        rubricDescription += '\n';
      }
    }

    var userMessage = 'Presentation text:\n---\n' + presentationText + '\n---\n' + rubricDescription +
      '\nFor each criterion, identify text segments that do NOT meet the highest grade level (' + targetGrade + '). ' +
      'Extract the BEGINNING portion (first 5-10 words) of each problematic segment. ' +
      'Make sure the text matches EXACTLY as it appears in the presentation.';

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
      message += '\n\nNote: ' + highlightResult.notFoundCount + ' segment(s) could not be found in the presentation.';
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
 * Highlights text segments with different colors based on criteria (Slides version)
 * @param {Object} criteriaResults - Object mapping criterion names to their highlights
 * @param {Object} colorMap - Object mapping criterion names to colors
 * @return {Object} Result with highlight count
 */
function highlightTextSegmentsWithColors(criteriaResults, colorMap) {
  var presentation = SlidesApp.getActivePresentation();
  var slides = presentation.getSlides();
  var highlightCount = 0;
  var notFoundCount = 0;

  Logger.log('=== Starting multi-color highlighting for Slides ===');

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
                // Get the specific text range and apply highlight with criterion color
                var rangeToHighlight = textRange.getRange(occurrence.start, occurrence.end);
                rangeToHighlight.getTextStyle().setBackgroundColor(color);
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

// =============================================================================
// DIAGNOSTIC FUNCTIONS (for development/testing)
// =============================================================================

/**
 * Diagnostic function to analyze rubric document structure
 * Run this from the Apps Script editor to see the table structure
 * Go to View > Logs to see the output
 *
 * @param {string} documentId - The rubric document ID (optional, uses hardcoded ID if not provided)
 */
function diagnoseRubricStructure(documentId) {
  if (!documentId) {
    documentId = '1jEEDM1kI1ondibbdlgm4WvnaxDBKmE9Q6Nsm2Pbyp6k';
  }

  try {
    Logger.log('=== RUBRIC STRUCTURE ANALYSIS ===');
    Logger.log('Document ID: ' + documentId);
    Logger.log('');

    var rubricDoc = DocumentApp.openById(documentId);
    var body = rubricDoc.getBody();

    // Find all tables
    var tables = [];
    var numChildren = body.getNumChildren();

    for (var i = 0; i < numChildren; i++) {
      var child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.TABLE) {
        tables.push(child.asTable());
      }
    }

    Logger.log('Found ' + tables.length + ' table(s) in document');
    Logger.log('');

    // Analyze each table
    for (var tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      var table = tables[tableIndex];
      Logger.log('=== TABLE ' + (tableIndex + 1) + ' ===');

      var numRows = table.getNumRows();
      Logger.log('Number of rows: ' + numRows);

      if (numRows === 0) {
        Logger.log('Table is empty');
        Logger.log('');
        continue;
      }

      // Analyze header row
      var headerRow = table.getRow(0);
      var numCols = headerRow.getNumCells();
      Logger.log('Number of columns: ' + numCols);
      Logger.log('');

      Logger.log('HEADER ROW:');
      for (var col = 0; col < numCols; col++) {
        var cellText = headerRow.getCell(col).getText().trim();
        Logger.log('  Column ' + col + ': "' + cellText + '"');
      }
      Logger.log('');

      // Analyze first few data rows to understand structure
      var rowsToShow = Math.min(5, numRows - 1);
      Logger.log('FIRST ' + rowsToShow + ' DATA ROWS:');

      for (var row = 1; row <= rowsToShow; row++) {
        Logger.log('  Row ' + row + ':');
        var rowElement = table.getRow(row);
        var rowCols = rowElement.getNumCells();

        for (var col = 0; col < rowCols; col++) {
          var cell = rowElement.getCell(col);
          var cellText = cell.getText().trim();

          // Show cell content with quotes to see whitespace
          if (cellText === '') {
            Logger.log('    Column ' + col + ': [EMPTY]');
          } else {
            // Show first 50 chars
            var displayText = cellText.length > 50 ? cellText.substring(0, 50) + '...' : cellText;
            Logger.log('    Column ' + col + ': "' + displayText + '"');
          }
        }
        Logger.log('');
      }

      Logger.log('');
    }

    Logger.log('=== ATTEMPTING TO PARSE WITH CURRENT FUNCTION ===');
    var result = readRubricDocument(documentId);

    if (result.success) {
      Logger.log('✓ Successfully parsed!');
      Logger.log('Grade Levels: ' + result.gradeLevels.join(', '));
      Logger.log('Number of criteria: ' + result.criteria.length);
      Logger.log('');
      Logger.log('PARSED CRITERIA:');
      for (var i = 0; i < result.criteria.length; i++) {
        var criterion = result.criteria[i];
        Logger.log('  ' + (i+1) + '. ' + criterion.name);
      }
    } else {
      Logger.log('✗ Parsing failed: ' + result.error);
    }

    Logger.log('');
    Logger.log('=== END ANALYSIS ===');

  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}