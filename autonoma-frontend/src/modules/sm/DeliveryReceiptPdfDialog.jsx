import { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import { IconPrinter, IconX } from '@tabler/icons-react';
import { btnSave, btnCancel } from 'ui-component/bos';

function numberToWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  };
  
  return inWords(Math.floor(num)).trim() + ' Rupees Only';
}

export default function DeliveryReceiptPdfDialog({ open, onClose, receipt }) {
  const printAreaRef = useRef();

  if (!receipt) return null;

  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Receipt - ${receipt.invoiceNo || 'DC'}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #1e293b; margin: 0; padding: 15px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .header-table td { vertical-align: top; }
            .doc-title { font-size: 18px; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; }
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #cbd5e1; }
            .info-grid td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11.5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .items-table th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 700; font-size: 11px; text-align: left; }
            .items-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .summary-table td { padding: 4px 8px; font-size: 11.5px; }
            .sign-box { border-top: 1px dashed #94a3b8; width: 180px; text-align: center; padding-top: 5px; font-weight: 600; font-size: 11px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .bold { font-weight: 700; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const lines = receipt.invoiceDetails || [];
  const charges = receipt.invoiceCharges || [];
  const grandTotal = parseFloat(receipt.grandTotal || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Delivery Receipt Preview</Typography>
        <IconButton size="small" onClick={onClose}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Box
          ref={printAreaRef}
          sx={{
            bgcolor: '#fff',
            p: 4,
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            color: '#1e293b'
          }}
        >
          {/* Header */}
          <table style={{ width: '100%', marginBottom: 15 }}>
            <tbody>
              <tr>
                <td style={{ width: '60%', verticalAlign: 'top' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    NUTECH WIND PARTS PVT LTD
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                    Plot No. 12, Industrial Estate, Guindy, Chennai - 600032, Tamil Nadu, India
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                    GSTIN: 33AAACN1234F1Z5 | Phone: +91 44 2250 1234
                  </Typography>
                </td>
                <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'top' }}>
                  <Box sx={{ border: '2px solid #2563eb', p: 1, borderRadius: '4px', bgcolor: '#eff6ff', display: 'inline-block', textAlign: 'left', minWidth: 200 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af', display: 'block' }}>
                      DELIVERY CHALLAN / DC
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      No: {receipt.invoiceNo}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#334155', display: 'block' }}>
                      Date: {receipt.invoiceDate ? new Date(receipt.invoiceDate).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                </td>
              </tr>
            </tbody>
          </table>

          <Divider sx={{ my: 1.5, borderColor: '#cbd5e1' }} />

          {/* Customer & Address Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15, border: '1px solid #cbd5e1' }}>
            <tbody>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ width: '50%', padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '12px' }}>
                  CONSIGNEE (BILLED TO)
                </td>
                <td style={{ width: '50%', padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '12px' }}>
                  DISPATCH / DELIVERY DETAILS
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {receipt.customerName || 'Customer'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                    Payment Terms: <b>{receipt.paymentTerms || '30 Days'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                    Delivery Terms: <b>{receipt.deliveryTerms || 'Ex-Works'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                    Currency: <b>{receipt.currencyCode || 'INR'}</b>
                  </Typography>
                </td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                    Customer PO / Ref: <b>{receipt.customerPo || 'N/A'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569' }}>
                    Remarks / Transporter: <b>{receipt.remarks || 'Standard Dispatch'}</b>
                  </Typography>
                  {receipt.refInvoiceNo && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#16a34a', fontWeight: 700, mt: 0.5 }}>
                      Linked Invoice: {receipt.refInvoiceNo} ({receipt.refInvoiceDate ? new Date(receipt.refInvoiceDate).toLocaleDateString() : ''})
                    </Typography>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <Table size="small" sx={{ mb: 2, border: '1px solid #cbd5e1' }}>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 35, py: 0.75, border: '1px solid #cbd5e1' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 0.75, border: '1px solid #cbd5e1' }}>Part Number & Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 60, py: 0.75, border: '1px solid #cbd5e1' }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 80, py: 0.75, border: '1px solid #cbd5e1' }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 100, py: 0.75, border: '1px solid #cbd5e1' }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 70, py: 0.75, border: '1px solid #cbd5e1' }}>Disc %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 110, py: 0.75, border: '1px solid #cbd5e1' }}>Total ({receipt.currencyCode || 'INR'})</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ py: 0.6, border: '1px solid #cbd5e1' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ py: 0.6, border: '1px solid #cbd5e1' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{item.partNo}</Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>{item.partName}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.6, border: '1px solid #cbd5e1' }}>{item.uom || 'NOS'}</TableCell>
                  <TableCell align="right" sx={{ py: 0.6, fontWeight: 700, border: '1px solid #cbd5e1' }}>{item.qty}</TableCell>
                  <TableCell align="right" sx={{ py: 0.6, border: '1px solid #cbd5e1' }}>{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ py: 0.6, border: '1px solid #cbd5e1' }}>{parseFloat(item.discountPer || 0).toFixed(2)}%</TableCell>
                  <TableCell align="right" sx={{ py: 0.6, fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1' }}>
                    {parseFloat(item.netAmount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Valuation Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              <tr>
                <td style={{ width: '55%', verticalAlign: 'top', paddingRight: 20 }}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>
                      Amount in Words:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, color: '#1e40af' }}>
                      {numberToWords(grandTotal)}
                    </Typography>
                  </Box>
                </td>
                <td style={{ width: '45%', verticalAlign: 'top' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b', fontSize: '11px' }}>Subtotal:</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, fontSize: '11px' }}>{parseFloat(receipt.subTotal || 0).toFixed(2)}</td>
                      </tr>
                      {parseFloat(receipt.discountAmount || 0) > 0 && (
                        <tr>
                          <td style={{ padding: '3px 0', color: '#ef4444', fontSize: '11px' }}>Discount:</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#ef4444', fontSize: '11px' }}>-{parseFloat(receipt.discountAmount || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b', fontSize: '11px' }}>CGST (9%):</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, fontSize: '11px' }}>{parseFloat(receipt.cgstAmount || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b', fontSize: '11px' }}>SGST (9%):</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, fontSize: '11px' }}>{parseFloat(receipt.sgstAmount || 0).toFixed(2)}</td>
                      </tr>
                      {parseFloat(receipt.additionalCharges || 0) > 0 && (
                        <tr>
                          <td style={{ padding: '3px 0', color: '#64748b', fontSize: '11px' }}>Additional Charges:</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, fontSize: '11px' }}>{parseFloat(receipt.additionalCharges || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '6px 0', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>Grand Total ({receipt.currencyCode || 'INR'}):</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <Box sx={{ mt: 5, pt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'center', width: 200, borderTop: '1px dashed #94a3b8', pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>Receiver&apos;s Signature & Seal</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: 220, borderTop: '1px dashed #94a3b8', pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>For NUTECH WIND PARTS PVT LTD</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '10px' }}>Authorized Signatory</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#fff' }}>
        <Button variant="contained" sx={btnCancel} onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          sx={btnSave}
          startIcon={<IconPrinter size={18} />}
          onClick={handlePrint}
        >
          Print / Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
