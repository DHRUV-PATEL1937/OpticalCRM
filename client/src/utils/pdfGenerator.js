import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const getInvoicePDFBlob = (sale, settings) => {
  const doc = buildPDFDocument(sale, settings);
  return doc.output('blob');
};

export const generateInvoicePDF = (sale, settings) => {
  const doc = buildPDFDocument(sale, settings);
  doc.save(`${settings?.sales?.invoicePrefix || 'INV-'}${sale.invoiceNumber}.pdf`);
};

const buildPDFDocument = (sale, settings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Primary color
  doc.text(settings?.general?.storeName || 'Optical Store', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (settings?.general?.address) doc.text(settings.general.address, 14, 30);
  if (settings?.general?.phone) doc.text(`Phone: ${settings.general.phone}`, 14, 35);
  if (settings?.general?.email) doc.text(`Email: ${settings.general.email}`, 14, 40);

  // Invoice Info
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.text('INVOICE', pageWidth - 14, 22, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${settings?.sales?.invoicePrefix || 'INV-'}${sale.invoiceNumber}`, pageWidth - 14, 30, { align: 'right' });
  doc.text(`Date: ${format(new Date(sale.createdAt), 'dd MMM yyyy')}`, pageWidth - 14, 35, { align: 'right' });

  // Customer Info
  doc.setDrawColor(200);
  doc.line(14, 45, pageWidth - 14, 45);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Bill To:', 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(sale.customer?.name || 'Walk-in Customer', 14, 62);
  if (sale.customer?.phone) doc.text(`Phone: ${sale.customer.phone}`, 14, 67);

  // Items Table
  const tableColumn = ["Item", "Qty", "Unit Price", "Total"];
  const tableRows = [];

  sale.items.forEach(item => {
    let itemName = item.productName || 'Unknown Item';
    
    // Append Glass Details
    if (item.glassDetails && item.glassDetails.name) {
      itemName += `\n+ Lens: ${item.glassDetails.name}`;
    }



    let unitPriceText = `${settings?.general?.currency || 'INR'} ${item.unitPrice.toFixed(2)}`;
    let totalText = `${settings?.general?.currency || 'INR'} ${(item.quantity * item.unitPrice).toFixed(2)}`;
    
    if (item.glassDetails && item.glassDetails.price > 0) {
      unitPriceText += `\n+ ${settings?.general?.currency || 'INR'} ${item.glassDetails.price.toFixed(2)}`;
      totalText += `\n+ ${settings?.general?.currency || 'INR'} ${(item.quantity * item.glassDetails.price).toFixed(2)}`;
      totalText += `\n= ${settings?.general?.currency || 'INR'} ${item.total.toFixed(2)}`;
    }

    const itemData = [
      itemName,
      item.quantity,
      unitPriceText,
      totalText
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { top: 75 }
  });

  let currentY = doc.lastAutoTable.finalY || 75;

  // Prescription Tables
  const rxItems = sale.items.filter(i => i.prescriptionDetails && (i.prescriptionDetails.rightEye?.sph || i.prescriptionDetails.leftEye?.sph));
  
  if (rxItems.length > 0) {
    currentY += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Prescription Details', 14, currentY);
    currentY += 4;

    rxItems.forEach(item => {
      const rx = item.prescriptionDetails;
      autoTable(doc, {
        startY: currentY,
        head: [[item.productName, 'SPH', 'CYL', 'AXIS', 'ADD']],
        body: [
          ['Right (OD)', rx.rightEye?.sph || '-', rx.rightEye?.cyl || '-', rx.rightEye?.axis || '-', rx.rightEye?.add || '-'],
          ['Left (OS)', rx.leftEye?.sph || '-', rx.leftEye?.cyl || '-', rx.leftEye?.axis || '-', rx.leftEye?.add || '-'],
          ...(rx.pd ? [['PD (Pupillary Distance)', { content: rx.pd, colSpan: 4 }]] : [])
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 6;
    });
  }

  // Totals
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Subtotal:`, pageWidth - 75, currentY);
  doc.text(`${settings?.general?.currency || 'INR'} ${sale.subtotal.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  
  doc.text(`Tax:`, pageWidth - 75, currentY + 7);
  doc.text(`${settings?.general?.currency || 'INR'} ${sale.totalTax.toFixed(2)}`, pageWidth - 14, currentY + 7, { align: 'right' });
  
  doc.text(`Discount:`, pageWidth - 75, currentY + 14);
  doc.text(`${settings?.general?.currency || 'INR'} ${sale.totalDiscount.toFixed(2)}`, pageWidth - 14, currentY + 14, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount:`, pageWidth - 75, currentY + 23);
  doc.text(`${settings?.general?.currency || 'INR'} ${sale.grandTotal.toFixed(2)}`, pageWidth - 14, currentY + 23, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  const footerY = doc.internal.pageSize.height - 20;
  
  if (settings?.pdf?.termsAndConditions) {
    doc.text('Terms & Conditions:', 14, footerY - 10);
    const splitTerms = doc.splitTextToSize(settings.pdf.termsAndConditions, pageWidth - 28);
    doc.text(splitTerms, 14, footerY - 5);
  }

  if (settings?.pdf?.footerText) {
    doc.text(settings.pdf.footerText, pageWidth / 2, footerY + 10, { align: 'center' });
  } else {
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 10, { align: 'center' });
  }

  return doc;
};
