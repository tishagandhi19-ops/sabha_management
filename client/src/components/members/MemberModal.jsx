import React from 'react';
import { X } from 'lucide-react';
import { SpinnerLoader } from '../Loaders';
import { transliterateGujaratiToEnglish } from '../../utils/transliterate';

export default function MemberModal({
  isOpen,
  onClose,
  onSubmit,
  editingMember,
  memberName,
  setMemberName,
  memberEnName,
  setMemberEnName,
  memberType,
  setMemberType,
  memberCode,
  setMemberCode,
  memberMobileNumber,
  setMemberMobileNumber,
  submittingMember
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingMember ? 'સભ્યની વિગત સુધારો' : 'નવો સભ્ય ઉમેરો'}
          </h3>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="બંધ કરો"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">સભ્યનું પૂરું નામ (ગુજરાતીમાં)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="નામ લખો, ઉદા. યશ ગાંધી"
              value={memberName}
              onChange={(e) => {
                setMemberName(e.target.value);
                if (!editingMember || !memberEnName) {
                  setMemberEnName(transliterateGujaratiToEnglish(e.target.value));
                }
              }}
              required
            />
          </div>

          <div>
            <label className="form-label">અંગ્રેજી નામ (English Name - સર્ચ માટે)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="Auto English name, e.g. Yash Gandhi"
              value={memberEnName}
              onChange={(e) => setMemberEnName(e.target.value)}
            />
            <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              આ નામ ફક્ત અંગ્રેજીમાં સર્ચ કરવા માટે છે, રિપોર્ટ્સમાં ગુજરાતી નામ જ રહેશે.
            </span>
          </div>

          <div>
            <label className="form-label">સભા સભ્ય પ્રકાર</label>
            <select
              className="glass-input"
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
            >
              <option value="bal">બાળ (૧૪ થી નીચે)</option>
              <option value="kishor">કિશોર (૧૪-૧૭)</option>
              <option value="yuva">યુવા (૧૮-૫૦)</option>
              <option value="proudh">પ્રૌઢ</option>
              <option value="vadil">વડીલ (૫૦+)</option>
            </select>
          </div>

          <div>
            <label className="form-label">યુનિક આઈડી કોડ (Unique Code) (વૈકલ્પિક)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="ઉદા. YG01"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">મોબાઈલ નંબર (Mobile Number) (વૈકલ્પિક)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="મોબાઈલ નંબર લખો"
              value={memberMobileNumber}
              onChange={(e) => setMemberMobileNumber(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>રદ કરો</button>
            <button type="submit" className="btn-primary" disabled={submittingMember}>
              {submittingMember ? <SpinnerLoader size={16} /> : 'સાચવો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
