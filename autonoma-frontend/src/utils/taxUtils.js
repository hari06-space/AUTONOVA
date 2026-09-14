/**
 * Utility functions for Tax Calculations
 */

const DEFAULT_COMPANY_STATE_CODE = 33; // Tamil Nadu

/**
 * Determines if the transaction is inter-state (IGST) or intra-state (CGST/SGST)
 * @param {number|string} customerStateCode - The state code of the customer
 * @param {number|string} [companyStateCode=33] - The state code of the company
 * @returns {boolean} True if inter-state (IGST applicable), False if intra-state (CGST/SGST applicable)
 */
export const isInterStateTransaction = (customerStateCode, companyStateCode = DEFAULT_COMPANY_STATE_CODE) => {
    if (!customerStateCode) return false; // Default to intra-state if customer state code is missing
    return Number(customerStateCode) !== Number(companyStateCode);
};

/**
 * Calculates the applicable tax percentages based on HSN data and state codes
 * @param {object} hsnData - The data object from HsnCodeMaster containing cgstPer, sgstPer, igstPer
 * @param {number|string} customerStateCode - The state code of the customer
 * @param {number|string} [companyStateCode=33] - The state code of the company
 * @returns {object} { cgstPer, sgstPer, igstPer }
 */
export const calculateApplicableTaxes = (hsnData, customerStateCode, companyStateCode = DEFAULT_COMPANY_STATE_CODE) => {
    if (!hsnData) return { cgstPer: 0, sgstPer: 0, igstPer: 0 };
    
    const isInterState = isInterStateTransaction(customerStateCode, companyStateCode);
    
    if (isInterState) {
        return {
            cgstPer: 0,
            sgstPer: 0,
            igstPer: hsnData?.igstPer || 0
        };
    } else {
        return {
            cgstPer: hsnData?.cgstPer || 0,
            sgstPer: hsnData?.sgstPer || 0,
            igstPer: 0
        };
    }
};
