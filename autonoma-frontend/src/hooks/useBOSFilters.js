import { useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import useAuth from 'hooks/useAuth';
import { useMasterDataStore } from 'store/useMasterDataStore';
import { fetcher } from 'utils/axios';

export default function useBOSFilters(perms) {
  const { user } = useAuth();
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const selectedMemberId = globalFilters.memberId;

  // ── Employees: Zustand master-data cache (shared across all pages, fetched once) ──
  const fetchLookups  = useMasterDataStore((s) => s.fetchLookups);
  const masterData    = useMasterDataStore((s) => s.data);
  const masterStatus  = useMasterDataStore((s) => s.status);

  // Trigger fetch if not yet loaded (no-op if already LOADED or LOADING)
  useEffect(() => { fetchLookups(['EMPLOYEES']); }, [fetchLookups]);

  const employees   = masterData.employees || [];
  const empsLoaded  = masterStatus.EMPLOYEES === 'LOADED';

  // ── Manager mapping: SWR with a 10-min dedup so it's fetched once per session ──
  const { data: mappingData } = useSWR(
    user ? '/api/master/hr/employees/manager-mapping' : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 600000 }
  );
  const managerMappings = Array.isArray(mappingData) ? mappingData : [];
  const myTeamLoaded    = empsLoaded && mappingData !== undefined;

  // ── Derive the logged-in user's direct reports (memoised) ────────────────────
  const myTeamEmployees = useMemo(() => {
    if (!user || employees.length === 0) return [];
    const loggedInEmpId = user?.empId;
    const teamEmpIds = new Set(
      managerMappings
        .filter((m) => m.status === 'Active' && String(m.verticalHeadId) === String(loggedInEmpId))
        .map((m) => String(m.empId))
    );
    const myName = (user?.name || '').toLowerCase().trim();
    const myEmpCode = (user?.empCode || user?.employeeCode || '').toLowerCase().trim();
    const myUsername = (user?.id || '').toLowerCase().trim();

    return employees.filter((e) => {
      if (teamEmpIds.has(String(e.id))) return true;

      const vh = (e.verticalHead || e.verticalHeadName || '').toLowerCase().trim();
      const rm = (e.reportingManager || e.reportingManagerName || '').toLowerCase().trim();
      const bm = (e.businessManager || e.businessManagerName || '').toLowerCase().trim();
      const hm = (e.homeManager || e.homeManagerName || '').toLowerCase().trim();
      const hr = (e.hr || e.hrName || '').toLowerCase().trim();
      
      const vhId = String(e.verticalHeadId || '');
      const rmId = String(e.reportingManagerId || '');
      const bmId = String(e.businessManagerId || '');
      const hmId = String(e.homeManagerId || '');
      const hrId = String(e.hrId || '');

      const isNameMatch = [vh, rm, bm, hm, hr].some(m => {
          if (!m) return false;
          return m === myName || m === myEmpCode || m === myUsername || 
                 m.includes(myUsername) || (myName && m.includes(myName)) || (myName && myName.includes(m));
      });
      
      const isIdMatch = [vhId, rmId, bmId, hmId, hrId].some(id => {
          if (!id) return false;
          return id === String(loggedInEmpId) || id === myUsername || id === String(user?.id);
      });

      return isNameMatch || isIdMatch;
    });
  }, [employees, managerMappings, user]);


  const isVerticalHead = myTeamEmployees && myTeamEmployees.length > 0;

  // Generate standardized options list based on permissions and vertical head status
  const getFilterOptions = useCallback(() => {
    const options = [{ value: 'Mine', label: 'Mine' }];
    if (perms?.manager || isVerticalHead) {
      options.push({ value: 'Team', label: 'Team' });
    }
    if (perms?.additional1) {
      options.push({ value: 'Company', label: 'Company' });
    }
    return options;
  }, [perms?.manager, perms?.additional1, isVerticalHead]);

  // Helper to match a record's owner/assignee against the selected scope
  const matchScope = useCallback((scope, recordOwnerId, recordOwnerName) => {
    if (!scope) return true;
    const scopeLower = scope.toLowerCase();

    // If a specific member is selected, we only match that member (regardless of scope = Mine / Team / Company)
    if (selectedMemberId && selectedMemberId !== 'All') {
      const member = employees.find((e) => String(e.id) === String(selectedMemberId) || String(e.userId) === String(selectedMemberId) || String(e.empId) === String(selectedMemberId));

      const recordOwnerIdStr = recordOwnerId !== undefined && recordOwnerId !== null ? String(recordOwnerId).trim() : '';
      if (recordOwnerIdStr && (
        recordOwnerIdStr === String(selectedMemberId) ||
        (member && (recordOwnerIdStr === String(member.id) || recordOwnerIdStr === String(member.userId) || recordOwnerIdStr === String(member.empId)))
      )) {
        return true;
      }

      if (recordOwnerName) {
        const nameLower = String(recordOwnerName).toLowerCase().trim();
        const memName = member ? String(member.employeeName || member.name || '').toLowerCase().trim() : '';
        const memCode = member ? String(member.empCode || member.employeeCode || '').toLowerCase().trim() : '';
        const memUsername = member ? String(member.userId || member.id || '').toLowerCase().trim() : '';
        const selIdLower = String(selectedMemberId).toLowerCase().trim();

        if (
          (memName && (nameLower === memName || nameLower.includes(memName) || memName.includes(nameLower))) ||
          (memCode && (nameLower === memCode || nameLower.includes(memCode) || memCode.includes(nameLower))) ||
          (memUsername && (nameLower === memUsername || nameLower.includes(memUsername) || memUsername.includes(nameLower))) ||
          (nameLower === selIdLower || nameLower.includes(selIdLower))
        ) {
          return true;
        }
      }
      return false;
    }

    // Company / Both / All scopes show everything
    if (scopeLower === 'company' || scopeLower === 'both' || scopeLower === 'all') {
      return true;
    }

    const loggedInEmpId = user?.empId;
    const loggedInUsername = String(user?.userId || user?.id || '')
      .toLowerCase()
      .trim();
    const loggedInName = String(user?.name || '')
      .toLowerCase()
      .trim();

    const getParts = (nameStr) => {
      if (!nameStr) return { name: '', code: '' };
      const str = String(nameStr).toLowerCase().trim();
      if (str.includes(' - ')) {
        const parts = str.split(' - ');
        return { name: parts[0].trim(), code: parts[1].trim() };
      }
      return { name: str, code: str };
    };

    // Check if the record is owned by the logged-in user
    const isMine = () => {
      const matchesEmpId =
        loggedInEmpId !== undefined && loggedInEmpId !== null && loggedInEmpId !== '' && String(recordOwnerId) === String(loggedInEmpId);
      const ownerParts = getParts(recordOwnerName);
      const matchesUsername = loggedInUsername && (ownerParts.name === loggedInUsername || ownerParts.code === loggedInUsername);
      const matchesName = loggedInName && (ownerParts.name === loggedInName || ownerParts.code === loggedInName);
      const loggedInEmpCode = String(user?.empCode || user?.employeeCode || '')
        .toLowerCase()
        .trim();
      const matchesEmpCode = loggedInEmpCode && (ownerParts.name === loggedInEmpCode || ownerParts.code === loggedInEmpCode);
      return matchesEmpId || matchesUsername || matchesName || matchesEmpCode;
    };

    if (scopeLower === 'mine') {
      return isMine();
    }

    if (scopeLower === 'team') {
      // If it's my own, it counts as my team
      if (isMine()) return true;

      // Check if it belongs to any vertical head reportee
      return myTeamEmployees.some((emp) => {
        const empIdStr = String(emp.id);
        const empCodeLower = String(emp.empCode || '')
          .toLowerCase()
          .trim();
        const empNameLower = String(emp.employeeName || '')
          .toLowerCase()
          .trim();

        const ownerIdStr = String(recordOwnerId);
        const ownerParts = getParts(recordOwnerName);

        return (
          (empIdStr && ownerIdStr === empIdStr) ||
          (empCodeLower && (ownerParts.name === empCodeLower || ownerParts.code === empCodeLower)) ||
          (empNameLower && (ownerParts.name === empNameLower || ownerParts.code === empNameLower))
        );
      });
    }

    return true;
  }, [selectedMemberId, employees, user, myTeamEmployees]);

  return useMemo(() => ({
    employees,
    myTeamEmployees,
    myTeamLoaded,
    isVerticalHead,
    getFilterOptions,
    matchScope
  }), [employees, myTeamEmployees, myTeamLoaded, isVerticalHead, getFilterOptions, matchScope]);
}
