import axios from 'utils/axios';
import { getPhotoUrl } from 'ui-component/bos/BOSUtils';

/**
 * Formats QR text string for Visitor Gate Pass
 */
export const formatQrText = (row) => {
  if (!row) return '';
  const formatQrDateTime = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${date} ${hours}:${mins}:${secs}.0`;
    } catch {
      return '-';
    }
  };

  return `Gate Pass No :${row.gatePassNo || '-'}
Gate Pass Date :${row.gatePassDate ? (typeof row.gatePassDate === 'string' ? row.gatePassDate.split('T')[0] : new Date(row.gatePassDate).toISOString().split('T')[0]) : '-'}
Visitor Name :${row.visitorName || '-'}
Visitor Mobile No:${row.mobileNo || '-'}
Address:${row.address || '-'}
Food Required:${row.foodAllowance === 'YES' ? 'Yes' : 'No'}
No Of Persons:${row.noOfPersons || '1.0'}
Kit:${row.kit ? 'ALLOWED' : 'NOT ALLOWED'}
To Meet:${row.personToMeet || '-'}
Purpose:${row.purpose || '-'}
In Time:${formatQrDateTime(row.inTime || row.createdDate)}
Out Time:${formatQrDateTime(row.outTime)}`;
};

/**
 * Centralized HTML Email Template Generator for Visitor Gate Pass
 */
export const buildVisitorGatePassEmailHtml = (row, company) => {
  const compName = company?.companyName || '';
  const compPhone = company?.phoneNo || company?.mobileNo || '';
  const compEmail = company?.emailId || '';
  const compWebsite = company?.website || '';
  const compGst = company?.gstIn && company.gstIn.trim() !== '' && company.gstIn !== '-' ? company.gstIn : '';
  const compAddr = company?.address ? `${company.address}${company.city ? `, ${company.city}` : ''}` : '';
  const passNo = row?.gatePassNo || '-';

  let logoUrl = null;

  const formatDateVal = (dateVal) => {
    if (!dateVal) return null;
    try {
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [y, m, d] = dateVal.split('-');
        return `${d}/${m}/${y}`;
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return null;
    }
  };

  const formatTimeVal = (dateVal) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
    } catch {
      return null;
    }
  };

  const qrRawText = formatQrText(row);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrRawText)}`;

  const passDate = formatDateVal(row?.gatePassDate);
  const visitorDateStr = formatDateVal(row?.visitorDate || row?.createdDate);
  const inTimeStr = formatTimeVal(row?.inTime || row?.createdDate);
  const outTimeStr = formatTimeVal(row?.outTime);

  const rawLocation = company?.gmaplink || company?.gmapLink || company?.googleMapLink || company?.location;
  const addressParts = [company?.address, company?.city, company?.state, company?.country, company?.pincode].filter(Boolean).join(', ');
  const mapNavUrl = rawLocation && rawLocation.startsWith('http')
    ? rawLocation
    : (addressParts && compName ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${compName}, ${addressParts}`)}` : null);

  const detailRows = [
    { label: 'Gate Pass No', value: passNo, color: '#2563eb', show: Boolean(passNo && passNo !== '-') },
    { label: 'Gate Pass Date', value: passDate, show: Boolean(passDate) },
    { label: 'Visitor Date', value: visitorDateStr, show: Boolean(visitorDateStr) },
    { label: 'In Time', value: inTimeStr, color: '#16a34a', show: Boolean(inTimeStr) },
    { label: 'Out Time', value: outTimeStr, show: Boolean(outTimeStr) },
    { label: 'Person to Meet', value: row?.personToMeet, show: Boolean(row?.personToMeet && row.personToMeet.trim() !== '') },
    { label: 'Party Name', value: row?.personName, show: Boolean(row?.personName && row.personName.trim() !== '' && row.personName.toUpperCase() !== 'NIL') },
    { label: 'Purpose', value: row?.purpose, show: Boolean(row?.purpose && row.purpose.trim() !== '') },
    { label: 'No. of Persons', value: row?.noOfPersons, show: Boolean(row?.noOfPersons) },
    { label: 'Food Required', value: row?.foodAllowance === 'YES' ? 'Yes' : (row?.foodAllowance === 'NO' ? 'No' : null), show: Boolean(row?.foodAllowance) },
    { label: 'Gadgets', value: row?.kit !== undefined && row?.kit !== null ? (row.kit ? 'ALLOWED' : 'NOT ALLOWED') : null, show: row?.kit !== undefined && row?.kit !== null }
  ].filter(r => r.show && r.value != null);

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; background-color: #ffffff;">
      <!-- Email Header Banner -->
      <div style="background-color: #1e3a8a; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); color: #ffffff; padding: 24px 28px; text-align: center;">
        ${logoUrl ? `
          <img src="${logoUrl}" alt="Company Logo" style="max-height: 48px; max-width: 180px; object-fit: contain; background-color: #ffffff; padding: 5px 14px; border-radius: 8px; display: inline-block; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.3);" onerror="this.style.display='none';" />
        ` : ''}
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd; margin-bottom: 4px;">OFFICIAL VISITOR GATE PASS</div>
        ${compName ? `<h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${compName}</h2>` : ''}
        ${compAddr ? `<div style="font-size: 12px; color: #e2e8f0; margin-top: 4px;">${compAddr}</div>` : ''}
        ${compPhone ? `<div style="font-size: 12px; color: #e2e8f0; margin-top: 2px;">Phone: ${compPhone}</div>` : ''}
        ${compGst ? `<div style="font-size: 12px; color: #e2e8f0; margin-top: 2px;">GSTIN: ${compGst}</div>` : ''}
        ${compEmail || compWebsite ? `<div style="font-size: 12px; color: #e2e8f0; margin-top: 2px;">${compEmail ? `Email: ${compEmail}` : ''} ${compEmail && compWebsite ? '|' : ''} ${compWebsite ? `Web: ${compWebsite}` : ''}</div>` : ''}
        ${passNo && passNo !== '-' ? `
        <div style="display: inline-block; margin-top: 12px; background-color: #2563eb; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #60a5fa;">
          Pass No: ${passNo}
        </div>
        ` : ''}
      </div>

      <!-- Body Content -->
      <div style="padding: 28px; color: #1e293b; font-size: 14px; line-height: 1.6; background-color: #ffffff;">
        <p style="margin-top: 0; font-size: 16px; color: #0f172a;">Dear <strong>${row?.visitorName || 'Visitor'}</strong>,</p>
        <p style="color: #475569; margin-bottom: 20px;">Your Official Visitor Gate Pass has been generated successfully. Please find the verified details and your QR Pass below:</p>

        <!-- QR Code Card -->
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">DIGITAL ENTRY QR PASS</div>
                <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${row?.visitorName || '-'}</div>
                ${row?.mobileNo ? `<div style="font-size: 13px; color: #475569;">Mobile: <strong style="color: #0f172a;">${row.mobileNo}</strong></div>` : ''}
                ${visitorDateStr ? `<div style="font-size: 13px; color: #475569; margin-top: 3px;">Visitor Date: <strong style="color: #2563eb;">${visitorDateStr}</strong></div>` : ''}
              </td>
              <td style="width: 136px; text-align: center; vertical-align: middle;">
                <div style="background-color: #ffffff; padding: 8px; border-radius: 10px; border: 1px solid #cbd5e1; display: inline-block;">
                  <img src="${qrApiUrl}" width="120" height="120" alt="Visitor Pass QR Code" style="display: block; width: 120px; height: 120px; border: 0;" />
                  <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 4px;">SCAN AT GATE</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        ${detailRows.length > 0 ? `
        <!-- Detailed Pass Info Table -->
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <div style="background-color: #e2e8f0; padding: 10px 16px; font-weight: 800; font-size: 13px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1;">
            Visitor Pass Specifications
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background-color: #ffffff;">
            ${detailRows.map(row => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 16px; font-weight: 700; color: #475569; width: 42%; background-color: #f1f5f9;">${row.label}:</td>
              <td style="padding: 10px 16px; font-weight: 800; color: ${row.color || '#0f172a'}; background-color: #ffffff;">${row.value}</td>
            </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <!-- Visitor Instructions Section -->
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 24px; background-color: #ffffff;">
          <div style="background-color: #e2e8f0; padding: 10px 16px; font-weight: 800; font-size: 13px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1;">
            Instructions for Visitors
          </div>
          <div style="padding: 4px 0; font-size: 12px; color: #1e293b; line-height: 1.5;">
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">1. All bags and personal items will be security screened, and visitors may pass through a metal detector.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">2. Familiarize yourself with emergency exits, evacuation routes, and assembly points; follow staff instructions in emergencies.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">3. In an emergency, use emergency exits and assemble at the EMERGENCY ASSEMBLE POINT near the security area.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">4. Photographing without authorization is strictly prohibited.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">5. Do not connect electronic devices to the company network without authorization.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">6. Report hazards, injuries, or unsafe conditions to staff and adhere to posted health and safety guidelines.</div>
            <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 16px; font-weight: 600;">7. Report to security and ensure all personal belongings are taken upon departure.</div>
            <div style="padding: 8px 16px; font-weight: 700; color: #dc2626;">8. You are under surveillance</div>
          </div>
        </div>

        <!-- Digital Pass Banner Notice -->
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
          <div style="font-size: 13px; color: #1e40af; font-weight: 600; line-height: 1.5;">
            📲 <strong>Digital Entry Pass:</strong> Please present the QR code above to security personnel at the entrance gate.
          </div>
        </div>

        ${mapNavUrl ? `
        <!-- Google Maps Navigation Button Banner -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 13px; color: #166534; font-weight: 700; margin-bottom: 8px;">📍 Need Directions to the Venue?</div>
          <a href="${mapNavUrl}" target="_blank" rel="noreferrer" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid #15803d;">
            Open Location in Google Maps ➔
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Generates Visitor Gate Pass PDF Base64 string dynamically from HTML content
 */
export const generateVisitorGatePassPdfBase64 = async (row, company) => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const compName = company?.companyName || 'COMPANY NAME';
    const compAddr = `${company?.address || ''}${company?.city ? `, ${company.city}` : ''}${company?.pincode ? `, ${company.pincode}` : ''}`;
    const compState = `${company?.state || ''}${company?.country ? `, ${company.country}` : ''}`;
    const passNo = row?.gatePassNo || 'Doc';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px'; // exact A4 width in pixels at 96 DPI
    container.style.minHeight = '1123px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '16px';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = 'Times New Roman, serif';
    container.style.zIndex = '999999';
    container.style.opacity = '1';
    container.style.visibility = 'visible';
    container.style.pointerEvents = 'none';

    const formatDt = (dateVal) => {
      if (!dateVal) return '-';
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '-';
        const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${date} ${hours}:${mins}`;
      } catch {
        return '-';
      }
    };

    const rawLoc = company?.gmaplink || company?.gmapLink || company?.googleMapLink || company?.location;
    const hasLoc = rawLoc && typeof rawLoc === 'string' && rawLoc.trim() !== '' && rawLoc.trim() !== '-';
    const locUrl = hasLoc ? (rawLoc.trim().startsWith('http') ? rawLoc.trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawLoc.trim())}`) : null;

    const pdfRows = [
      { label: 'Gate Pass No', value: row?.gatePassNo, show: Boolean(row?.gatePassNo) },
      { label: 'Visitor Name', value: row?.visitorName, show: Boolean(row?.visitorName) },
      { label: 'Visitor Mobile No', value: row?.mobileNo, show: Boolean(row?.mobileNo) },
      { label: 'Visitor Address', value: row?.address, show: Boolean(row?.address) },
      { label: 'Party Name', value: row?.personName, show: Boolean(row?.personName && row.personName.trim() !== '' && row.personName.toUpperCase() !== 'NIL') },
      { label: 'Food Required', value: row?.foodAllowance === 'YES' ? 'Yes' : (row?.foodAllowance === 'NO' ? 'No' : null), show: Boolean(row?.foodAllowance) },
      { label: 'No Of Person', value: row?.noOfPersons, show: Boolean(row?.noOfPersons) },
      { label: 'Gadgets', value: row?.kit !== undefined && row?.kit !== null ? (row.kit ? 'ALLOWED' : 'NOT ALLOWED') : null, show: row?.kit !== undefined && row?.kit !== null },
      { label: 'To Meet', value: row?.personToMeet, show: Boolean(row?.personToMeet && row.personToMeet.trim() !== '') },
      { label: 'Purpose', value: row?.purpose, show: Boolean(row?.purpose && row.purpose.trim() !== '') },
      { label: 'In Time', value: formatDt(row?.inTime || row?.createdDate), show: Boolean(row?.inTime || row?.createdDate) },
      { label: 'Out Time', value: formatDt(row?.outTime), show: Boolean(row?.outTime) }
    ].filter(r => r.show && r.value != null);

    container.innerHTML = `
      <div style="display: flex; margin-bottom: 8px; border: 1px solid #000; padding: 8px; position: relative; background-color: #ffffff;">
        <div style="width: 150px; height: 100px; display: flex; align-items: center; justify-content: center;">
          ${company?.logoFileName ? `<img src="${company.logoFileName}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `<span style="font-size: 10px;">No Logo</span>`}
        </div>
        <div style="flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: center; padding: 0 16px;">
          ${compName ? `<div style="font-weight: bold; font-size: 18px; color: #000; margin-bottom: 4px;">${compName}</div>` : ''}
          ${(compAddr || compState) ? `<div style="font-size: 12px; font-weight: bold; color: #000;">${compAddr}${compAddr && compState ? '<br/>' : ''}${compState}</div>` : ''}
          ${compPhone ? `<div style="font-size: 12px; font-weight: bold; color: #000;">Phone : ${compPhone}</div>` : ''}
          ${compGst ? `<div style="font-size: 12px; font-weight: bold; color: #000;">GSTIN : ${compGst}</div>` : ''}
          ${(compEmail || compWebsite) ? `<div style="font-size: 12px; font-weight: bold; margin-top: 4px; color: #000;">${compEmail ? `Email : ${compEmail}` : ''} ${(compEmail && compWebsite) ? '&nbsp;&nbsp;' : ''} ${compWebsite ? `Web Site : ${compWebsite}` : ''}</div>` : ''}
          ${hasLoc ? `<div style="font-size: 12px; font-weight: bold; margin-top: 2px; color: #000;">Location : <a href="${locUrl}" target="_blank" rel="noreferrer" style="color: #1976d2; text-decoration: underline;">${rawLoc}</a></div>` : ''}
        </div>
      </div>
      <div style="background-color: #4fc3f7; border: 1px solid #000; border-top: none; text-align: center; padding: 4px 0;">
        <div style="font-weight: bold; font-size: 14px; color: #000;">VISITOR PASS</div>
      </div>
      <div style="display: flex; border: 1px solid #000; border-top: none; background-color: #ffffff;">
        <div style="width: 60%; border-right: 1px solid #000;">
          ${pdfRows.map((r, idx) => `
            <div style="display: flex; ${idx < pdfRows.length - 1 ? 'border-bottom: 1px solid #000;' : ''} min-height: 24px; align-items: center;">
              <div style="width: 40%; border-right: 1px solid #000; padding-left: 8px; font-weight: bold; font-size: 12px; color: #000;">${r.label}</div>
              <div style="width: 60%; padding-left: 8px; font-size: 12px; color: #000;">${r.value}</div>
            </div>
          `).join('')}
        </div>
        <div style="width: 40%; display: flex; flex-direction: column;">
          <div style="flex: 1; border-bottom: 1px solid #000; display: flex; align-items: center; justify-content: center; height: 100px; position: relative;">
             <span style="transform: rotate(-30deg); opacity: 0.3; font-weight: bold; font-size: 20px; color: #000;">SECURITY SIGN</span>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; height: 100px; position: relative;">
             <span style="transform: rotate(-30deg); opacity: 0.3; font-weight: bold; font-size: 20px; color: #000;">VISITOR SIGN</span>
          </div>
        </div>
      </div>
      <div style="background-color: #4fc3f7; border: 1px solid #000; border-top: none; text-align: center; padding: 4px 0;">
        <div style="font-weight: bold; font-size: 14px; color: #000;">INSTRUCTIONS</div>
      </div>
      <div style="border: 1px solid #000; border-top: none; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">1. All bags and personal items will be security screened, and visitors may pass through a metal detector.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">2. Familiarize yourself with emergency exits, evacuation routes, and assembly points; follow staff instructions in emergencies.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">3. In an emergency, use emergency exits and assemble at the EMERGENCY ASSEMBLE POINT near the security area.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">4. Photographing without authorization is strictly prohibited.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">5. Do not connect electronic devices to the company network without authorization.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">6. Report hazards, injuries, or unsafe conditions to staff and adhere to posted health and safety guidelines.</div>
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">7. Report to security and ensure all personal belongings are taken upon departure.</div>
        <div style="padding: 4px 8px; font-weight: bold; font-size: 11px; color: #000;">8. You are under surveillance</div>
      </div>
    `;

    document.body.appendChild(container);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `GatePass_${passNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBase64 = await html2pdf().set(opt).from(container).outputPdf('datauristring');
    document.body.removeChild(container);
    return pdfBase64;
  } catch (err) {
    console.error('Failed to generate PDF in background:', err);
    return null;
  }
};

/**
 * Centralized function to trigger / send Visitor Gate Pass Email from anywhere in the application
 * @param {Object} row - Visitor Gate Pass record object
 * @param {Object} company - Company Details object
 * @param {Object} options - Optional parameters ({ to, pdfBase64, subject })
 */
export const triggerVisitorGatePassEmail = async (row, company, options = {}) => {
  const targetEmail = options.to || row?.emailId;
  if (!targetEmail || !targetEmail.trim()) {
    console.warn('[VisitorGatePassEmail] Recipient email address is missing');
    return null;
  }

  const compName = company?.companyName || 'Autonoma ERP';
  const passNo = row?.gatePassNo || 'Doc';
  const emailSubject = options.subject || `Visitor Gate Pass - ${passNo} - ${compName}`;
  const htmlBody = options.htmlBody || buildVisitorGatePassEmailHtml(row, company);

  // PDF attachment disabled as requested by user
  /*
  let pdfBase64 = options.pdfBase64;
  if (!pdfBase64) {
    pdfBase64 = await generateVisitorGatePassPdfBase64(row, company);
  }
  */

  const payload = {
    to: targetEmail.trim(),
    subject: emailSubject,
    htmlBody: htmlBody,
    pdfBase64: null, // PDF attachment commented out
    fileName: options.fileName || `GatePass_${passNo}.pdf`
  };

  try {
    const res = await axios.post('/api/order/visitor-gate-pass/send-email', payload);
    return res.data;
  } catch (err) {
    console.error('[VisitorGatePassEmail] Trigger error:', err);
    throw err;
  }
};
