/**
 * File Converter Library
 * Handles conversion between CSV, Excel, JSON, HTML, Markdown, XML, TSV formats
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export const SUPPORTED_FORMATS = {
  csv: { name: 'CSV', desc: 'Comma Separated', icon: 'fa-file-csv', read: true, write: true },
  xlsx: { name: 'Excel', desc: 'XLSX Workbook', icon: 'fa-file-excel', read: true, write: true },
  json: { name: 'JSON', desc: 'JavaScript Object', icon: 'fa-file-code', read: true, write: true },
  html: { name: 'HTML', desc: 'Table Format', icon: 'fa-code', read: true, write: true },
  md: { name: 'Markdown', desc: 'MD Table', icon: 'fa-markdown', read: false, write: true },
  xml: { name: 'XML', desc: 'Extensible Markup', icon: 'fa-file-code', read: true, write: true },
  tsv: { name: 'TSV', desc: 'Tab Separated', icon: 'fa-file-alt', read: true, write: true },
};

/**
 * Parse file content to data array
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const content = await readFileContent(file, extension);
  
  let data = [];
  let columns = [];
  
  switch (extension) {
    case 'csv':
      const csvResult = Papa.parse(content, { header: true, skipEmptyLines: true });
      data = csvResult.data;
      columns = csvResult.meta.fields || [];
      break;
      
    case 'tsv':
      const tsvResult = Papa.parse(content, { header: true, skipEmptyLines: true, delimiter: '\t' });
      data = tsvResult.data;
      columns = tsvResult.meta.fields || [];
      break;
      
    case 'xlsx':
    case 'xls':
      const workbook = XLSX.read(content, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'json':
      const jsonData = JSON.parse(content);
      data = Array.isArray(jsonData) ? jsonData : [jsonData];
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'html':
      data = parseHTMLTable(content);
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'xml':
      const parser = new XMLParser({ ignoreAttributes: false });
      const xmlData = parser.parse(content);
      data = extractXMLData(xmlData);
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    default:
      throw new Error(`Format tidak didukung: ${extension}`);
  }
  
  return { data, columns, format: extension };
}

/**
 * Read file content based on type
 */
async function readFileContent(file, extension) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    
    if (['xlsx', 'xls'].includes(extension)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'utf-8');
    }
  });
}

/**
 * Parse HTML table to data array
 */
function parseHTMLTable(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  
  if (!table) return [];
  
  const headers = [];
  const headerCells = table.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
  headerCells.forEach(cell => headers.push(cell.textContent.trim()));
  
  const data = [];
  const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    if (cells.length === 0) return;
    
    const rowData = {};
    cells.forEach((cell, index) => {
      const header = headers[index] || `column_${index}`;
      rowData[header] = cell.textContent.trim();
    });
    data.push(rowData);
  });
  
  return data;
}

/**
 * Extract data from XML structure
 */
function extractXMLData(xmlData) {
  // Try to find the data array in XML
  const findArray = (obj) => {
    if (Array.isArray(obj)) return obj;
    if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        const result = findArray(obj[key]);
        if (result) return result;
      }
    }
    return null;
  };
  
  const dataArray = findArray(xmlData);
  return dataArray || (typeof xmlData === 'object' ? [xmlData] : []);
}

/**
 * Convert data to target format and return as downloadable blob
 */
export function convertToFormat(data, columns, targetFormat, filename) {
  let content;
  let mimeType;
  let extension = targetFormat;
  
  // Filter columns if specified
  const filteredData = columns 
    ? data.map(row => {
        const filtered = {};
        columns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filtered[col] = row[col];
          }
        });
        return filtered;
      })
    : data;
  
  switch (targetFormat) {
    case 'csv':
      content = Papa.unparse(filteredData);
      mimeType = 'text/csv;charset=utf-8;';
      break;
      
    case 'tsv':
      content = Papa.unparse(filteredData, { delimiter: '\t' });
      mimeType = 'text/tab-separated-values;charset=utf-8;';
      break;
      
    case 'xlsx':
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
      
    case 'json':
      content = JSON.stringify(filteredData, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      break;
      
    case 'html':
      content = generateHTMLTable(filteredData);
      mimeType = 'text/html;charset=utf-8;';
      break;
      
    case 'md':
      content = generateMarkdownTable(filteredData);
      mimeType = 'text/markdown;charset=utf-8;';
      break;
      
    case 'xml':
      const builder = new XMLBuilder({ 
        format: true, 
        ignoreAttributes: false,
        indentBy: '  '
      });
      content = builder.build({ root: { item: filteredData } });
      mimeType = 'application/xml;charset=utf-8;';
      break;
      
    default:
      throw new Error(`Format output tidak didukung: ${targetFormat}`);
  }
  
  const blob = new Blob([content], { type: mimeType });
  const baseName = filename.replace(/\.[^/.]+$/, '');
  
  return {
    blob,
    filename: `${baseName}.${extension}`,
    size: blob.size,
    rows: filteredData.length,
    columns: filteredData.length > 0 ? Object.keys(filteredData[0]).length : 0
  };
}

/**
 * Generate HTML table from data
 */
function generateHTMLTable(data) {
  if (data.length === 0) return '<table></table>';
  
  const columns = Object.keys(data[0]);
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Converted Data</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #6366f1; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    tr:hover { background-color: #ddd; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => `<tr>${columns.map(col => `<td>${escapeHtml(String(row[col] ?? ''))}</td>`).join('')}</tr>`).join('\n      ')}
    </tbody>
  </table>
</body>
</html>`;
  
  return html;
}

/**
 * Generate Markdown table from data
 */
function generateMarkdownTable(data) {
  if (data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  
  // Header
  let md = '| ' + columns.join(' | ') + ' |\n';
  // Separator
  md += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
  // Rows
  data.forEach(row => {
    md += '| ' + columns.map(col => String(row[col] ?? '').replace(/\|/g, '\\|')).join(' | ') + ' |\n';
  });
  
  return md;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Calculate memory usage estimate
 */
export function estimateMemory(data) {
  const str = JSON.stringify(data);
  return str.length / 1024; // KB
}
