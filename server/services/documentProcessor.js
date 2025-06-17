const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const marked = require('marked');

/**
 * Process a PDF document
 * 
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function processPdfDocument(filePath) {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    const pdfData = await pdfParse(dataBuffer);
    
    return pdfData.text;
  } catch (error) {
    console.error('Error processing PDF document:', error);
    throw error;
  }
}

/**
 * Process a Markdown document
 * 
 * @param {string} content - Markdown content
 * @returns {string} - Plain text content
 */
function processMarkdownDocument(content) {
  try {
    // Remove HTML tags after converting Markdown to HTML
    const html = marked.parse(content);
    const $ = cheerio.load(html);
    return $.text();
  } catch (error) {
    console.error('Error processing Markdown document:', error);
    throw error;
  }
}

/**
 * Fetch and process a webpage
 * 
 * @param {string} url - URL of the webpage to process
 * @returns {Promise<{title: string, content: string}>} - Title and content
 */
async function processWebpage(url) {
  try {
    // Fetch the webpage
    const response = await axios.get(url);
    
    // Parse with cheerio
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, [role=banner], [role=navigation]').remove();
    
    // Extract title
    const title = $('title').text() || url;
    
    // Extract main content (prefer main, article, or body)
    let content = $('main').text() || 
                 $('article').text() || 
                 $('body').text();
    
    // Clean the content
    content = content.replace(/\\s+/g, ' ').trim();
    
    return { title, content };
  } catch (error) {
    console.error('Error processing webpage:', error);
    throw error;
  }
}

/**
 * Process a document regardless of type
 * 
 * @param {string} documentType - Type of document ('pdf', 'text', 'markdown', 'webpage')
 * @param {string} source - Source of the document (filepath or URL)
 * @param {Object} options - Additional options
 * @returns {Promise<{title: string, content: string}>} - Processed document
 */
async function processDocument(documentType, source, options = {}) {
  try {
    let content = '';
    let title = options.title || path.basename(source);
    
    switch(documentType) {
      case 'pdf':
        content = await processPdfDocument(source);
        break;
      case 'text':
        content = fs.readFileSync(source, 'utf8');
        break;
      case 'markdown':
        const markdownContent = fs.readFileSync(source, 'utf8');
        content = processMarkdownDocument(markdownContent);
        break;
      case 'webpage':
        const webpage = await processWebpage(source);
        title = webpage.title;
        content = webpage.content;
        break;
      case 'notion':
      case 'zendesk':
      case 'help_scout':
      case 'intercom':
        // These would require API integrations
        throw new Error(`${documentType} integration not implemented yet`);
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
    
    return { title, content };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

module.exports = {
  processPdfDocument,
  processMarkdownDocument,
  processWebpage,
  processDocument
};
