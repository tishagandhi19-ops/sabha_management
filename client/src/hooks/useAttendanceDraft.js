import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage Sparse Delta local storage draft persistence for attendance.
 * Only EDITED records (records that differ from the saved DB baseline state)
 * are stored in localStorage under key `${type}_draft_${entityId}`.
 * Data already in DB is fetched normally from server and uses ZERO local storage space.
 */
export function useAttendanceDraft(type, entityId) {
  const draftKey = type && entityId ? `${type}_draft_${entityId}` : null;
  const [hasDraft, setHasDraft] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  // Check if a draft exists on initial render or entityId change
  useEffect(() => {
    if (!draftKey) {
      setHasDraft(false);
      setDraftCount(0);
      return;
    }
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const count = Object.keys(parsed).length;
        setHasDraft(count > 0);
        setDraftCount(count);
      } else {
        setHasDraft(false);
        setDraftCount(0);
      }
    } catch (e) {
      setHasDraft(false);
      setDraftCount(0);
    }
  }, [draftKey]);

  // Read current stored sparse draft
  const getDraft = useCallback(() => {
    if (!draftKey) return null;
    try {
      const stored = localStorage.getItem(draftKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error reading attendance draft from localStorage:', e);
      return null;
    }
  }, [draftKey]);

  // Save sparse delta records (ONLY items that DIFFER from DB baseline)
  const saveDraft = useCallback((records, baseDbRecords = {}) => {
    if (!draftKey || !records || Object.keys(records).length === 0) return;
    try {
      const sparseDraft = {};

      Object.keys(records).forEach(memberId => {
        const rec = records[memberId];
        if (!rec) return;

        const dbRec = baseDbRecords[memberId] || (type === 'sabha'
          ? { status: 'absent', remark: '' }
          : { status: 'absent', hours: 0 });

        if (type === 'sabha') {
          // Store only if status or remark differs from DB state
          const statusDiffers = rec.status !== dbRec.status;
          const remarkDiffers = (rec.remark || '').trim() !== (dbRec.remark || '').trim();

          if (statusDiffers || remarkDiffers) {
            sparseDraft[memberId] = rec;
          }
        } else if (type === 'seva') {
          // Store only if status or hours differs from DB state
          const statusDiffers = rec.status !== dbRec.status;
          const hoursDiffers = (parseFloat(rec.hours) || 0) !== (parseFloat(dbRec.hours) || 0);

          if (statusDiffers || hoursDiffers) {
            sparseDraft[memberId] = rec;
          }
        }
      });

      const count = Object.keys(sparseDraft).length;
      if (count > 0) {
        localStorage.setItem(draftKey, JSON.stringify(sparseDraft));
        setHasDraft(true);
        setDraftCount(count);
      } else {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        setDraftCount(0);
      }
    } catch (e) {
      console.error('Error saving sparse attendance draft to localStorage:', e);
    }
  }, [draftKey, type]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setDraftCount(0);
    } catch (e) {
      console.error('Error clearing attendance draft from localStorage:', e);
    }
  }, [draftKey]);

  return {
    hasDraft,
    draftCount,
    getDraft,
    saveDraft,
    clearDraft
  };
}
