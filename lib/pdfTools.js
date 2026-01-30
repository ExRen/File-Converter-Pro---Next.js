/**
 * PDF Tools Library
 * Handles PDF manipulation: merge, split, compress, rotate, convert
 */

import { PDFDocument, degrees, rgb, StandardFonts, PDFName, PDFRawStream } from 'pdf-lib';

/**
 * PDF Tools configuration
 */
export const PDF_TOOLS = {
  merge: { 
    name: 'Merge PDF', 
    desc: 'Combine multiple PDFs into one',
    icon: 'fa-object-group',
    color: '#e74c3c',
    multiple: true
  },
  split: { 
    name: 'Split PDF', 
    desc: 'Extract pages from PDF',
    icon: 'fa-cut',
    color: '#e74c3c',
    multiple: false
  },
  compress: { 
    name: 'Compress PDF', 
    desc: 'Reduce PDF file size',
    icon: 'fa-compress-arrows-alt',
    color: '#27ae60',
    multiple: false
  },
  rotate: { 
    name: 'Rotate PDF', 
    desc: 'Rotate PDF pages',
    icon: 'fa-redo',
    color: '#9b59b6',
    multiple: false
  },
  imgToPdf: { 
    name: 'Image to PDF', 
    desc: 'Convert images to PDF',
    icon: 'fa-file-image',
    color: '#f39c12',
    multiple: true,
    accept: '.jpg,.jpeg,.png'
  },
  pdfToImg: { 
    name: 'PDF to Image', 
    desc: 'Convert PDF to images',
    icon: 'fa-images',
    color: '#3498db',
    multiple: false
  },
  watermark: { 
    name: 'Add Watermark', 
    desc: 'Add text watermark to PDF',
    icon: 'fa-copyright',
    color: '#9b59b6',
    multiple: false
  },
  pageNumbers: { 
    name: 'Page Numbers', 
    desc: 'Add page numbers to PDF',
    icon: 'fa-list-ol',
    color: '#9b59b6',
    multiple: false
  },
};

/**
 * PDF Quality Levels
 */
export const COMPRESSION_LEVELS = {
  low: { name: 'Low', value: 0.1, desc: 'Fast, minimal reduction' },
  medium: { name: 'Recommended', value: 0.5, desc: 'Great balance' },
  extreme: { name: 'Extreme', value: 0.9, desc: 'Maximum compression' }
};

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(files) {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Split PDF into individual pages or selected pages
 */
export async function splitPDF(file, pageRanges = null) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const results = [];
  
  if (pageRanges) {
    // Split by specific ranges
    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, range.pages.map(p => p - 1));
      pages.forEach(page => newPdf.addPage(page));
      const pdfBytes = await newPdf.save();
      results.push({
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: `split_${range.name}.pdf`
      });
    }
  } else {
    // Split into individual pages
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdf, [i]);
      newPdf.addPage(page);
      const pdfBytes = await newPdf.save();
      results.push({
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: `page_${i + 1}.pdf`
      });
    }
  }
  
  return { results, totalPages };
}

/**
 * Extract specific pages from PDF
 */
export async function extractPages(file, pageNumbers) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  const newPdf = await PDFDocument.create();
  const validPages = pageNumbers.filter(p => p >= 1 && p <= pdf.getPageCount());
  const pages = await newPdf.copyPages(pdf, validPages.map(p => p - 1));
  pages.forEach(page => newPdf.addPage(page));
  
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Compress PDF by reducing quality and optimizing streams
 * @param {File} file - PDF file to compress
 * @param {string} level - Compression level: 'low', 'medium', 'extreme'
 * @param {Function} onProgress - Callback for progress updates
 */
export async function compressPDF(file, level = 'medium', onProgress = null) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load with basic optimization
  const pdf = await PDFDocument.load(arrayBuffer, { 
    ignoreEncryption: true,
    updateMetadata: false
  });
  
  // Optimization settings based on level
  const settings = {
    useObjectStreams: true,
    addDefaultPage: false,
    preserveEncryption: false
  };

  if (level === 'extreme') {
    if (onProgress) onProgress('Optimizing metadata...');
    // Aggressive optimization
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');
    
    // Phase 2: Image Downsampling (The real meat of compression)
    if (onProgress) onProgress('Scanning for images...');
    await processImagesInPDF(pdf, 0.4, 1200, onProgress);
    
  } else if (level === 'medium') {
    pdf.setProducer('FileConverter Pro');
    // Moderate downsampling
    await processImagesInPDF(pdf, 0.7, 2000, onProgress);
  }
  
  if (onProgress) onProgress('Saving optimized PDF...');
  const pdfBytes = await pdf.save(settings);
  
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    originalSize: file.size,
    newSize: pdfBytes.length,
    reduction: Math.round(Math.max(0, (1 - pdfBytes.length / file.size) * 100))
  };
}

/**
 * Internal helper to downsample images inside PDF
 */
async function processImagesInPDF(pdf, quality = 0.5, maxWidth = 1500, onProgress = null) {
  const objects = pdf.context.enumerateIndirectObjects();
  let imageCount = 0;
  let processedCount = 0;

  // Count images first
  for (const [ref, obj] of objects) {
    if (obj instanceof PDFRawStream) {
      const subtype = obj.dict.get(PDFName.of('Subtype'));
      if (subtype === PDFName.of('Image')) imageCount++;
    }
  }

  if (imageCount === 0) return;

  for (const [ref, obj] of objects) {
    if (obj instanceof PDFRawStream) {
      const subtype = obj.dict.get(PDFName.of('Subtype'));
      if (subtype === PDFName.of('Image')) {
        processedCount++;
        if (onProgress) onProgress(`Optimizing image ${processedCount}/${imageCount}...`);

        try {
          const width = obj.dict.get(PDFName.of('Width')).numberValue;
          const height = obj.dict.get(PDFName.of('Height')).numberValue;
          
          // Only downsample if it's a large image
          if (width > maxWidth || quality < 0.9) {
            const bytes = obj.contents;
            // Use browser canvas to re-compress
            const compressedBytes = await recompressImage(bytes, obj.dict, quality, maxWidth);
            
            if (compressedBytes && compressedBytes.length < bytes.length) {
              obj.contents = compressedBytes;
              obj.dict.set(PDFName.of('Length'), pdf.context.obj(compressedBytes.length));
              // Clear filters if we converted to JPEG
              obj.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
            }
          }
        } catch (err) {
          console.warn('Failed to compress internal image:', err);
        }
      }
    }
  }
}

/**
 * Re-compress image bytes using Browser Canvas
 */
async function recompressImage(bytes, dict, quality, maxWidth) {
  return new Promise((resolve) => {
    // Create a blob from existing bytes
    // We need to know the format, but browser can usually detect from bytes
    const blob = new Blob([bytes]);
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((resultBlob) => {
        if (!resultBlob) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(resultBlob);
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Rotate PDF pages
 */
export async function rotatePDF(file, rotation = 90, pageNumbers = null) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  const pagesToRotate = pageNumbers ? pageNumbers.map(p => p - 1) : pages.map((_, i) => i);
  
  pagesToRotate.forEach(i => {
    if (i >= 0 && i < pages.length) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotation));
    }
  });
  
  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Convert images to PDF
 */
export async function imagesToPDF(files) {
  const pdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let image;
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      image = await pdf.embedJpg(uint8Array);
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      image = await pdf.embedPng(uint8Array);
    } else {
      continue; // Skip unsupported formats
    }
    
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  
  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Convert PDF to images (returns data URLs)
 * Note: This loads pdfjs from CDN to avoid canvas module issues
 */
export async function pdfToImages(file, scale = 2) {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    throw new Error('PDF to Image conversion is only available in browser');
  }
  
  // Load pdfjs from CDN dynamically
  const PDFJS_VERSION = '3.11.174';
  const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
  
  // Load the library if not already loaded
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${PDFJS_CDN}/pdf.min.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const images = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    images.push({
      blob,
      name: `page_${i}.png`,
      dataUrl: canvas.toDataURL('image/png')
    });
  }
  
  return images;
}

/**
 * Add watermark to PDF
 */
export async function addWatermark(file, text, options = {}) {
  const {
    fontSize = 50,
    opacity = 0.3,
    rotation = -45,
    color = { r: 0.5, g: 0.5, b: 0.5 }
  } = options;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }
  
  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(file, options = {}) {
  const {
    position = 'bottom-center', // bottom-left, bottom-center, bottom-right, top-left, top-center, top-right
    fontSize = 12,
    format = 'Page {n} of {total}'
  } = options;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const totalPages = pages.length;
  
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const text = format.replace('{n}', index + 1).replace('{total}', totalPages);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    
    let x, y;
    
    switch (position) {
      case 'bottom-left':
        x = 40;
        y = 30;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = 30;
        break;
      case 'bottom-right':
        x = width - textWidth - 40;
        y = 30;
        break;
      case 'top-left':
        x = 40;
        y = height - 40;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - 40;
        break;
      case 'top-right':
        x = width - textWidth - 40;
        y = height - 40;
        break;
      default:
        x = (width - textWidth) / 2;
        y = 30;
    }
    
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  
  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Get PDF info
 */
export async function getPDFInfo(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle() || '',
    author: pdf.getAuthor() || '',
    subject: pdf.getSubject() || '',
    creator: pdf.getCreator() || '',
  };
}
