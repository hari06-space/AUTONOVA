/**
 * Organization: Nutech
 * Owner: Logaraj S
 * Created At: 2026-08-30
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: Shared Salary Balancing Engine for Offer Letter, ATS and Interview Final Process.
 *              Evaluates salary components via EmployeeSubSections and balances gross salary
 *              differences against Special Allowance / Basic Pay.
 */

import { reevaluateComponents } from '../modules/hr/EmployeeSubSections';

const isEnabledFlag = (val) =>
  val === undefined || val === null || val === true || String(val) === '1' || String(val).toLowerCase() === 'true' || val === 'YES';

/**
 * Re-evaluates salary components and balances total earnings to match the target gross salary.
 *
 * @param {Object} currentForm - Current form values including component values & statutory flags
 * @param {Array} activeComps - List of active payroll components from master structure
 * @param {string} [modifiedField] - Name of field explicitly modified by user (preserved as priority)
 * @param {number|string} [targetGross] - Target gross salary to balance against
 * @param {Object} [overrides] - Optional formula overrides forwarded to reevaluateComponents
 * @returns {Object} Re-evaluated and balanced form values
 */
export const reevaluateAndBalanceComponents = (currentForm, activeComps, modifiedField, targetGross, overrides) => {
  if (!currentForm || !activeComps || !Array.isArray(activeComps)) {
    return currentForm || {};
  }

  const evaluated = reevaluateComponents(currentForm, activeComps, modifiedField, overrides);
  const finalForm = { ...evaluated };

  Object.keys(evaluated).forEach(key => {
    if (typeof evaluated[key] === 'boolean' || ['providentFund', 'esiAllowed', 'professionalTax', 'fullRecord'].includes(key)) {
      finalForm[key] = evaluated[key];
    }
  });

  if (modifiedField && currentForm[modifiedField] !== undefined && currentForm[modifiedField] !== null) {
    finalForm[modifiedField] = currentForm[modifiedField];
  }

  if (targetGross !== undefined && targetGross !== null) {
    const targetG = parseFloat(targetGross) || 0;
    const isPFEnabled = isEnabledFlag(finalForm.providentFund);
    const isESIEnabled = isEnabledFlag(finalForm.esiAllowed);
    const isPTaxEnabled = isEnabledFlag(finalForm.professionalTax);
    const isLTAEnabled = isEnabledFlag(finalForm.ltaEligible);
    const isLOMEnabled = isEnabledFlag(finalForm.lossOfMinutesDeduct);
    const isPermEnabled = isEnabledFlag(finalForm.permissionRequest);

    const localFilterEnabled = (c) => {
      const cc = (c.componentCode || '').toUpperCase();
      const cn = (c.displayName || c.componentName || '').toUpperCase();
      if ((cc.includes('PF') || cn.includes('PF') || cn.includes('PROVIDENT')) && !isPFEnabled) return false;
      if ((cc.includes('ESI') || cn.includes('ESI')) && !isESIEnabled) return false;
      if ((cc.includes('PT') || cc.includes('PROF_TAX') || cc.includes('PROFESSIONAL_TAX') || cn.includes('PTAX') || cn.includes('PROFESSIONAL TAX') || cn.includes('PROF. TAX')) && !isPTaxEnabled) return false;
      if ((cc.includes('LTA') || cn.includes('LTA') || cn.includes('LEAVE TRAVEL')) && !isLTAEnabled) return false;
      if ((cc.includes('LOM') || cc.includes('LOSS_OF_MINUTES') || cn.includes('LOM') || cn.includes('LOSS OF MINUTES') || cn.includes('LABOUR WELFARE')) && !isLOMEnabled) return false;
      if ((cc.includes('PERMISSION') || cc.includes('PERM') || cn.includes('PERMISSION')) && !isPermEnabled) return false;
      return true;
    };

    const getGrossVal = () => {
      const earns = activeComps.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && localFilterEnabled(c));
      return earns.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (parseFloat(finalForm[c.componentCode]) || 0), 0);
    };

    const finalGross = getGrossVal();
    const diff = targetG - finalGross;

    if (Math.abs(diff) > 0.000001) {
      const earningsList = activeComps.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1'));
      let adjustComp = null;
      const specialCodes = ['SPECIAL_ALLOWANCE', 'SPLALLOWANCE', 'SPECIALALLOWANCE', 'SPL_ALLOWANCE'];
      for (let c of earningsList) {
        if (specialCodes.includes((c.componentCode || '').toUpperCase().replace(/[^A-Z_]/g, ''))) {
          adjustComp = c;
          break;
        }
      }
      if (!adjustComp) {
        for (let c of earningsList) {
          if (c.calculationType === 'MANUAL' && c.componentCode !== 'DAILY_RATE' && c.componentCode !== 'BASIC') {
            adjustComp = c;
            break;
          }
        }
      }
      if (!adjustComp) {
        adjustComp = earningsList.find(c => c.componentCode === 'BASIC');
      }
      if (!adjustComp && earningsList.length > 0) {
        adjustComp = earningsList[earningsList.length - 1];
      }
      if (adjustComp) {
        const code = adjustComp.componentCode;
        finalForm[code] = ((parseFloat(finalForm[code]) || 0) + diff).toFixed(2);
      }
    }
  }

  return finalForm;
};

export default reevaluateAndBalanceComponents;
