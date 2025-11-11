# Claude AI Rubric-Based Grading for Google Docs

This Google Apps Script adds rubric-based grading capabilities to Google Docs, allowing teachers to grade student work against standardized rubrics with color-coded highlighting.

## Features

- **Two Analysis Modes**:
  - **Text Prompt Mode**: Free-form analysis based on custom prompts
  - **Rubric Mode**: Structured grading against predefined rubric criteria

- **Rubric Support**:
  - Load rubrics from Google Docs with table structures
  - Select specific criteria to analyze
  - Choose target grade levels
  - Color-coded highlighting (different color per criterion)
  - Visual legend showing criterion-to-color mapping

- **Smart Text Matching**:
  - Handles quote/apostrophe variations (smart quotes vs straight quotes)
  - Multiple fallback strategies for reliable highlighting
  - Works with complex punctuation

## Setup

### 1. Create Your Script

1. Open your Google Doc
2. Go to **Extensions > Apps Script**
3. Delete any existing code
4. Copy and paste `Code.gs` into the editor
5. Create a new HTML file called `Sidebar`
6. Copy and paste `Sidebar.html` into the HTML editor
7. Create a new file called `appsscript.json`
8. Copy and paste the contents of `appsscript.json`
9. Save all files

### 2. Set Your Claude API Key

1. In your Google Doc, go to **Claude AI > Set API Key**
2. Enter your Claude API key from https://console.anthropic.com/
3. The key will be stored securely

## How to Use

### Text Prompt Mode (Free-form Analysis)

1. Open your Google Doc
2. Go to **Claude AI > Analyze Document**
3. Select the **Text Prompt** tab
4. Enter your analysis prompt (e.g., "Highlight passive voice")
5. Click **Analyze**
6. Claude will highlight matching text segments in yellow

### Rubric Mode (Structured Grading)

#### Step 1: Create Your Rubric Document

Create a Google Doc with a table in this format:

```
| Criteria    | Grade 1       | Grade 2     | Grade 3   | Grade 4      | Grade 5        |
|-------------|---------------|-------------|-----------|--------------|----------------|
| Grammar     | Many errors   | Some errors | Few errors| Rare errors  | No errors      |
| Clarity     | Unclear       | Mixed       | Clear     | Very clear   | Extremely clear|
| Evidence    | No evidence   | Weak        | Some      | Strong       | Comprehensive  |
| Organization| Disorganized  | Somewhat    | Organized | Well-org.    | Exceptionally  |
```

**Requirements**:
- First row = header with grade levels
- First column = criterion names
- Cells contain descriptions for each grade level

**Flexible Structure**:
- You can use any column headers (Grade 1-5, Level A-E, Beginning/Developing/Mastering, etc.)
- You can have any number of grade levels (minimum 2)
- You can have any number of criteria (minimum 1)

#### Step 2: Get the Document ID

1. Open your rubric Google Doc
2. Copy the ID from the URL:
   ```
   https://docs.google.com/document/d/DOCUMENT_ID_HERE/edit
   ```
3. The ID is the long string between `/d/` and `/edit`

#### Step 3: Load and Use the Rubric

1. Open the student document you want to grade
2. Go to **Claude AI > Analyze Document**
3. Select the **Rubric Mode** tab
4. Paste your rubric Document ID
5. Click **Load Rubric**
6. Select which criteria to analyze (all selected by default)
7. Choose the target grade level
8. Click **Analyze with Rubric**

#### Step 4: Review Results

- Each criterion is highlighted in a different color
- The color legend appears at the bottom showing which color matches which criterion
- Claude identifies text segments that don't meet the target grade level
- Each highlight represents an area for improvement

## Example Use Cases

### Use Case 1: Essay Grading

**Rubric**:
```
| Criteria         | Below Standard | Approaching | Meets Standard | Exceeds        |
|------------------|----------------|-------------|----------------|----------------|
| Thesis Statement | Unclear/absent | Weak        | Clear & focused| Strong & nuanced|
| Evidence         | No citations   | Minimal     | Adequate       | Comprehensive  |
| Organization     | Unclear flow   | Some flow   | Logical flow   | Seamless flow  |
| Grammar          | Many errors    | Some errors | Few errors     | No errors      |
```

**Workflow**:
1. Load the rubric
2. Select criteria: Thesis Statement, Evidence, Grammar
3. Set target: "Meets Standard"
4. Analyze
5. Review color-coded highlights for each criterion

### Use Case 2: Writing Skills Assessment

**Rubric**:
```
| Criteria     | Grade 1      | Grade 2       | Grade 3      | Grade 4       | Grade 5        |
|--------------|--------------|---------------|--------------|---------------|----------------|
| Vocabulary   | Simple words | Basic variety | Good variety | Rich variety  | Sophisticated  |
| Sentence Var.| All simple   | Some variety  | Good variety | Strong variety| Excellent var. |
| Voice        | Passive/weak | Mixed         | Active       | Strong active | Powerful active|
```

**Workflow**:
1. Load the rubric
2. Select all criteria
3. Set target: "Grade 4"
4. Analyze
5. Each criterion highlighted in different color

## Color Palette

The script uses 10 distinct colors for criteria:
1. Yellow (#FFFF00)
2. Gold (#FFD700)
3. Orange (#FFA500)
4. Light Red (#FF6B6B)
5. Mint (#98D8C8)
6. Light Green (#A8E6CF)
7. Lavender (#B4A7D6)
8. Light Pink (#FFB3BA)
9. Light Blue (#BFEFFF)
10. Moccasin (#FFE4B5)

If you select more than 10 criteria, colors will repeat.

## Tips for Best Results

1. **Keep criteria descriptions clear and specific**: Vague descriptors lead to inconsistent analysis

2. **Use consistent terminology**: Use the same terms in your document and rubric

3. **Select relevant criteria only**: Analyzing too many criteria at once may reduce accuracy

4. **Review manually**: Claude's analysis is a starting point; always review and adjust manually

5. **Iterate on rubrics**: Refine your rubric based on results to improve future analyses

## Troubleshooting

### Rubric Won't Load

- **Check Document ID**: Make sure you copied the entire ID
- **Check Permissions**: Ensure the rubric document is accessible (same account or shared with you)
- **Check Table Format**: Verify your rubric has a properly formatted table with headers

### Few/No Highlights

- **Check Target Grade**: Make sure the target grade matches a column header exactly
- **Check Criteria Selection**: Ensure at least one criterion is selected
- **Check Document Content**: Verify the document has text that matches the criteria
- **Simplify Criteria**: Try analyzing one criterion at a time

### Wrong Text Highlighted

- **Refine Rubric Descriptions**: Make descriptions more specific and distinct
- **Adjust Target Grade**: Try a different target grade level
- **Use Text Prompt Mode**: For more control, use custom prompts instead

### Highlights Not Clearing

- Make sure you're using the "Clear Highlights" button
- Refresh the document if issues persist
- Check Apps Script logs (View > Executions) for errors

## Comparison: Text Prompt vs Rubric Mode

| Feature | Text Prompt Mode | Rubric Mode |
|---------|------------------|-------------|
| **Best For** | One-off analysis, custom criteria | Consistent grading, multiple documents |
| **Setup Time** | None | Create rubric document once |
| **Consistency** | Varies by prompt | Consistent across all grading |
| **Flexibility** | Very flexible | Structured by rubric |
| **Color Coding** | Single color (yellow) | Multi-color by criterion |
| **Legend** | No legend needed | Automatic legend display |
| **Use Case** | Quick checks, exploratory analysis | Formal grading, standardized assessment |

## Example Rubrics

### Elementary Writing (Grades 1-5)

```
| Criteria        | Grade 1     | Grade 2       | Grade 3         | Grade 4           | Grade 5              |
|-----------------|-------------|---------------|-----------------|-------------------|----------------------|
| Capitalization  | No capitals | Some capitals | Most capitals   | Consistent caps   | Perfect capitals     |
| Punctuation     | No periods  | Some periods  | Most punctuation| Varied punctuation| Advanced punctuation |
| Spelling        | Phonetic    | Common words  | Most words      | Complex words     | Sophisticated words  |
```

### High School Essay (Proficiency Levels)

```
| Criteria          | Below Basic | Basic         | Proficient      | Advanced        |
|-------------------|-------------|---------------|-----------------|-----------------|
| Argumentation     | No argument | Weak argument | Clear argument  | Compelling arg. |
| Source Integration| No sources  | Listed only   | Basic citations | Seamless integ. |
| Analysis Depth    | Summary only| Shallow       | Good analysis   | Deep analysis   |
```

## Permissions

The script requires these Google permissions:
- **auth/documents**: To read and modify the current document
- **auth/script.container.ui**: To show the sidebar interface
- **auth/script.external_request**: To call the Claude API

You'll be asked to authorize these permissions on first use.

## API Usage

- This script uses the Claude Haiku model for cost-effectiveness
- Each analysis = 1 API call
- Loading rubrics does NOT use the API (only analyzes table structure)
- Estimated cost: ~$0.001-0.01 per document analysis depending on length

## Support

For issues or questions:
1. Check the Apps Script logs: **Extensions > Apps Script > View > Executions**
2. Review the troubleshooting section above
3. Verify your API key is set correctly
4. Check that your rubric table is properly formatted

## Version Notes

- **v2.0**: Added Rubric Mode with multi-color highlighting
- **v1.0**: Initial release with Text Prompt Mode

---

**Note**: This is a teaching aid to help identify areas for improvement. Always review Claude's suggestions and make final grading decisions yourself.
