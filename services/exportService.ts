
import { Project } from "../types";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let val = row[header];
        
        // Handle null/undefined
        if (val === null || val === undefined) {
             val = '';
        }
        
        // Safety check: If value is still an Object/Array, stringify it or simplify it
        // This prevents "[object Object]" in the CSV
        if (typeof val === 'object') {
            val = JSON.stringify(val); // Fallback, though caller should flatten it preferably
        }

        const formatted = typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        return formatted;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generatePDF = async (elementId: string, fileName: string): Promise<boolean> => {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
        // Clone with exact A4 dimensions
        const clone = element.cloneNode(true) as HTMLElement;
        
        // Setup Clone Styles for Capture
        clone.style.position = 'absolute';
        clone.style.top = '-10000px';
        clone.style.left = '0';
        clone.style.width = '210mm'; // Exact A4 width
        // Remove min-height restriction for the clone so it fits content naturally, 
        // but the view has min-height for display. 
        // We let html2canvas capture the full scroll height.
        clone.style.height = 'auto'; 
        clone.style.margin = '0';
        clone.style.padding = '20mm'; // Ensure padding is baked in
        clone.style.transform = 'none';
        clone.style.backgroundColor = '#ffffff';

        document.body.appendChild(clone);

        // Wait a tick for DOM to settle
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(clone, {
            scale: 2, // 2x scale for Retina-like quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // 210mm @ 96DPI approx
        });
        
        document.body.removeChild(clone);
        
        const imgData = canvas.toDataURL('image/png');
        
        // PDF A4
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210; 
        const pdfHeight = 297; 
        
        const imgProps = pdf.getImageProperties(imgData);
        // Calculate the height of the image based on A4 width
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Subsequent pages
        while (heightLeft > 0) {
            position = position - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${fileName}.pdf`);
        return true;
    } catch (err) {
        console.error("PDF Generation Error", err);
        return false;
    }
};

export const printComponent = (elementId: string, title: string): boolean => {
  const content = document.getElementById(elementId);
  if (!content) {
      alert("Element content not found!");
      return false;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.id = 'print-frame-' + Date.now();
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let styleTags = '';
    styles.forEach(node => {
        styleTags += node.outerHTML;
    });

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${styleTags}
          <style>
             body { font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             @media print {
               @page { size: A4; margin: 10mm; }
               body { margin: 0; padding: 0; }
             }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        }, 1500); 
    };

    setTimeout(() => {
        const frame = document.getElementById(iframe.id);
        if (frame) document.body.removeChild(frame);
    }, 60000); 
    
    return true;
  }
  return false;
};
