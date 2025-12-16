/**
 * File Converter Library - Extended
 * Supports: CSV, Excel, JSON, HTML, Markdown, XML, TSV, YAML, TXT, DOCX, INI
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import yaml from 'js-yaml';
import ini from 'ini';

export const SUPPORTED_FORMATS = {
  // Data formats
  csv: { name: 'CSV', desc: 'Comma Separated', icon: 'fa-file-csv', read: true, write: true, category: 'data' },
  xlsx: { name: 'Excel', desc: 'XLSX Workbook', icon: 'fa-file-excel', read: true, write: true, category: 'data' },
  json: { name: 'JSON', desc: 'JavaScript Object', icon: 'fa-file-code', read: true, write: true, category: 'data' },
  xml: { name: 'XML', desc: 'Extensible Markup', icon: 'fa-file-code', read: true, write: true, category: 'data' },
  tsv: { name: 'TSV', desc: 'Tab Separated', icon: 'fa-file-alt', read: true, write: true, category: 'data' },
  yaml: { name: 'YAML', desc: 'YAML Format', icon: 'fa-file-code', read: true, write: true, category: 'data' },
  
  // Document formats
  html: { name: 'HTML', desc: 'Table Format', icon: 'fa-code', read: true, write: true, category: 'document' },
  md: { name: 'Markdown', desc: 'MD Table', icon: 'fa-markdown', read: false, write: true, category: 'document' },
  txt: { name: 'Text', desc: 'Plain Text', icon: 'fa-file-alt', read: true, write: true, category: 'document' },
  docx: { name: 'Word', desc: 'DOCX Document', icon: 'fa-file-word', read: true, write: true, category: 'document' },
  
  // Config formats
  ini: { name: 'INI', desc: 'Config File', icon: 'fa-cog', read: true, write: true, category: 'config' },
  
  // PDF format (write only - text extraction)
  pdf: { name: 'PDF', desc: 'PDF Document (Text)', icon: 'fa-file-pdf', read: false, write: true, category: 'document' },
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
      
    case 'yaml':
    case 'yml':
      const yamlData = yaml.load(content);
      data = Array.isArray(yamlData) ? yamlData : [yamlData];
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'txt':
      // Parse as lines or try to detect structure
      data = parseTxtFile(content);
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'docx':
      // Dynamic import for browser only
      data = await parseDocxFile(file);
      columns = data.length > 0 ? Object.keys(data[0]) : [];
      break;
      
    case 'ini':
      const iniData = ini.parse(content);
      data = parseIniToArray(iniData);
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
    
    if (['xlsx', 'xls', 'docx'].includes(extension)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'utf-8');
    }
  });
}

/**
 * Parse plain text file
 */
function parseTxtFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Try to detect if it's tab/comma separated
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.includes('\t')) {
      const result = Papa.parse(content, { header: true, skipEmptyLines: true, delimiter: '\t' });
      return result.data;
    } else if (firstLine.includes(',')) {
      const result = Papa.parse(content, { header: true, skipEmptyLines: true });
      return result.data;
    }
  }
  
  // Otherwise, treat each line as a row
  return lines.map((line, index) => ({ line: index + 1, content: line.trim() }));
}

/**
 * Parse DOCX file using mammoth
 */
async function parseDocxFile(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  
  // Split by paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => ({
    paragraph: index + 1,
    content: paragraph.trim()
  }));
}

/**
 * Parse INI to array format
 */
function parseIniToArray(iniData) {
  const result = [];
  
  for (const section of Object.keys(iniData)) {
    if (typeof iniData[section] === 'object') {
      for (const key of Object.keys(iniData[section])) {
        result.push({
          section,
          key,
          value: String(iniData[section][key])
        });
      }
    } else {
      result.push({
        section: 'root',
        key: section,
        value: String(iniData[section])
      });
    }
  }
  
  return result;
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
export async function convertToFormat(data, columns, targetFormat, filename) {
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
      
    case 'yaml':
    case 'yml':
      content = yaml.dump(filteredData, { indent: 2 });
      mimeType = 'text/yaml;charset=utf-8;';
      extension = 'yaml';
      break;
      
    case 'txt':
      content = generateTxtFile(filteredData);
      mimeType = 'text/plain;charset=utf-8;';
      break;
      
    case 'docx':
      content = await generateDocxFile(filteredData);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;
      
    case 'ini':
      content = generateIniFile(filteredData);
      mimeType = 'text/plain;charset=utf-8;';
      break;
      
    case 'pdf':
      content = await generatePdfFile(filteredData);
      mimeType = 'application/pdf';
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
 * Generate plain text file from data
 */
function generateTxtFile(data) {
  if (data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  let txt = columns.join('\t') + '\n';
  
  data.forEach(row => {
    txt += columns.map(col => String(row[col] ?? '')).join('\t') + '\n';
  });
  
  return txt;
}

/**
 * Generate DOCX file from data
 */
async function generateDocxFile(data) {
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel } = await import('docx');
  
  if (data.length === 0) {
    const doc = new Document({
      sections: [{
        children: [new Paragraph({ text: 'No data', heading: HeadingLevel.HEADING_1 })]
      }]
    });
    return await Packer.toBlob(doc);
  }
  
  const columns = Object.keys(data[0]);
  
  // Create table rows
  const headerRow = new TableRow({
    children: columns.map(col => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: col, bold: true })] })]
    }))
  });
  
  const dataRows = data.map(row => new TableRow({
    children: columns.map(col => new TableCell({
      children: [new Paragraph({ text: String(row[col] ?? '') })]
    }))
  }));
  
  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: 'Converted Data', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' }),
        table
      ]
    }]
  });
  
  return await Packer.toBlob(doc);
}

/**
 * Generate INI file from data
 */
function generateIniFile(data) {
  if (data.length === 0) return '';
  
  // Check if data has section/key/value structure
  if (data[0].section && data[0].key && data[0].value !== undefined) {
    const iniObj = {};
    data.forEach(row => {
      if (!iniObj[row.section]) iniObj[row.section] = {};
      iniObj[row.section][row.key] = row.value;
    });
    return ini.stringify(iniObj);
  }
  
  // Otherwise, create a simple structure
  const columns = Object.keys(data[0]);
  const iniObj = { data: {} };
  
  data.forEach((row, index) => {
    columns.forEach(col => {
      iniObj.data[`row${index + 1}_${col}`] = String(row[col] ?? '');
    });
  });
  
  return ini.stringify(iniObj);
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
  
  let md = '| ' + columns.join(' | ') + ' |\n';
  md += '| ' + columns.map(() => '---').join(' | ') + ' |\n';
  
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
 * Generate PDF file from data (text-only)
 */
async function generatePdfFile(data) {
  // Dynamic import jspdf for browser only
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let y = margin;
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Converted Document', margin, y);
  y += lineHeight * 2;
  
  // Check if data has simple content structure (from DOCX)
  if (data.length > 0 && (data[0].content || data[0].paragraph)) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    for (const row of data) {
      const text = row.content || row.paragraph || Object.values(row).join(' ');
      
      // Word wrap
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      
      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      y += lineHeight / 2; // Paragraph spacing
    }
  } else {
    // Table format for structured data
    const columns = Object.keys(data[0]);
    
    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const colWidth = (pageWidth - margin * 2) / Math.min(columns.length, 5);
    
    columns.slice(0, 5).forEach((col, i) => {
      doc.text(col.substring(0, 15), margin + i * colWidth, y);
    });
    y += lineHeight;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    for (const row of data) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      columns.slice(0, 5).forEach((col, i) => {
        const value = String(row[col] ?? '').substring(0, 20);
        doc.text(value, margin + i * colWidth, y);
      });
      y += lineHeight;
    }
  }
  
  // Add footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages} - Generated by FileConverter Pro`,
      margin,
      pageHeight - 10
    );
  }
  
  return doc.output('arraybuffer');
}

/**
 * Calculate memory usage estimate
 */
export function estimateMemory(data) {
  const str = JSON.stringify(data);
  return str.length / 1024;
}

