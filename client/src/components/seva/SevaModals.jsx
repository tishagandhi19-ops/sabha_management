import React from 'react';
import { X, FileSpreadsheet, Trash2 } from 'lucide-react';
import { SpinnerLoader, DeterminateProgress } from '../Loaders';
import { SEVA_CATEGORY_TAGS } from '../../constants/sabhaConstants';
import { transliterateGujaratiToEnglish } from '../../utils/transliterate';

export function SevaModal({
  isOpen,
  onClose,
  onSubmit,
  sevaDate,
  setSevaDate,
  sevaTypeId,
  setSevaTypeId,
  sevaTypes,
  newSevaTypeNameInput,
  setNewSevaTypeNameInput,
  sevaLeader,
  setSevaLeader,
  creatingSeva
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="modal-title">નવી સેવા આયોજિત કરો</h3>
          <button className="icon-btn" onClick={onClose} aria-label="બંધ કરો">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">સેવાની તારીખ (Date)</label>
            <input
              type="date"
              className="glass-input"
              value={sevaDate}
              onChange={(e) => setSevaDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">સેવાનો પ્રકાર (Seva Type)</label>
            <select
              className="glass-input"
              value={sevaTypeId}
              onChange={(e) => setSevaTypeId(e.target.value)}
              required
            >
              <option value="">-- સેવાનો પ્રકાર પસંદ કરો --</option>
              {sevaTypes.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
              <option value="new_type" style={{ background: '#111827', fontWeight: 'bold', color: 'var(--color-primary)' }}>+ નવો પ્રકાર ઉમેરો...</option>
            </select>
          </div>

          {sevaTypeId === 'new_type' && (
            <div className="animate-fade-in">
              <label className="form-label">નવા સેવાનો પ્રકાર લખો (New Seva Type Name)</label>
              <input
                type="text"
                className="glass-input"
                placeholder="ઉદા. રસોઈ સેવા, સફાઈ સેવા"
                value={newSevaTypeNameInput}
                onChange={(e) => setNewSevaTypeNameInput(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="form-label">સેવા લીડરનું નામ (Leader - Optional)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="લીડરનું નામ લખો"
              value={sevaLeader}
              onChange={(e) => setSevaLeader(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>રદ કરો</button>
            <button type="submit" className="btn-primary" disabled={creatingSeva}>
              {creatingSeva ? <SpinnerLoader size={16} /> : 'સાચવો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SevaTypeModal({
  isOpen,
  onClose,
  onSubmit,
  newSevaTypeName,
  setNewSevaTypeName,
  creatingSevaType,
  sevaTypes,
  onDeleteSevaType
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3 className="modal-title">સેવા પ્રકાર વ્યવસ્થાપન</h3>
          <button className="icon-btn" onClick={onClose} aria-label="બંધ કરો">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            className="glass-input"
            placeholder="નવો સેવાનો પ્રકાર, ઉદા. રસોઈ સેવા"
            value={newSevaTypeName}
            onChange={(e) => setNewSevaTypeName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={creatingSevaType}>
            {creatingSevaType ? <SpinnerLoader size={16} /> : 'ઉમેરો'}
          </button>
        </form>

        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>હાલના સેવા પ્રકારો:</h4>
        <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sevaTypes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>કોઈ પ્રકાર ઉમેરેલ નથી.</p>
          ) : (
            sevaTypes.map(t => (
              <div
                key={t._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 8px 8px 14px'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{t.name}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={() => onDeleteSevaType(t._id)}
                  aria-label={`${t.name} કાઢી નાખો`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-secondary" onClick={onClose}>બંધ કરો</button>
        </div>
      </div>
    </div>
  );
}

export function SevaMemberModal({
  isOpen,
  onClose,
  onSubmit,
  editingSevaMember,
  sevaMemberName,
  setSevaMemberName,
  sevaMemberEnName,
  setSevaMemberEnName,
  sevaMemberType,
  setSevaMemberType,
  sevaMemberUniqueCode,
  setSevaMemberUniqueCode,
  sevaMemberMobileNumber,
  setSevaMemberMobileNumber,
  submittingSevaMember
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingSevaMember ? 'સેવા સભ્ય વિગતો સુધારો' : 'નવો સેવા સભ્ય ઉમેરો'}
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="બંધ કરો">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">નામ (ગુજરાતી)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="નામ લખો, ઉદા. મોનિકા પટેલ"
              value={sevaMemberName}
              onChange={(e) => {
                setSevaMemberName(e.target.value);
                if (!editingSevaMember || !sevaMemberEnName) {
                  setSevaMemberEnName(transliterateGujaratiToEnglish(e.target.value));
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
              placeholder="Auto English name, e.g. Monika Patel"
              value={sevaMemberEnName}
              onChange={(e) => setSevaMemberEnName(e.target.value)}
            />
            <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              આ નામ ફક્ત અંગ્રેજીમાં સર્ચ કરવા માટે છે, રિપોર્ટ્સમાં ગુજરાતી નામ જ રહેશે.
            </span>
          </div>

          <div>
            <label className="form-label">પ્રકાર (Gender Category)</label>
            <select
              className="glass-input"
              value={sevaMemberType}
              onChange={(e) => setSevaMemberType(e.target.value)}
              required
            >
              <option value="bal">બાળ (૧૪ થી નીચે)</option>
              <option value="kisori">કિશોરી (૧૪-૧૭)</option>
              <option value="yuvti">યુવતી (૧૮-૫૦)</option>
              <option value="prutha">પ્રૌઢા</option>
              <option value="vadil">વડીલ (૫૦+)</option>
            </select>
          </div>

          <div>
            <label className="form-label">યુનિક આઈડી કોડ (Unique ID Code) (વૈકલ્પિક)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="SEVA001"
              value={sevaMemberUniqueCode}
              onChange={(e) => setSevaMemberUniqueCode(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">મોબાઈલ નંબર (Mobile Number) (વૈકલ્પિક)</label>
            <input
              type="text"
              className="glass-input"
              placeholder="મોબાઈલ નંબર લખો"
              value={sevaMemberMobileNumber}
              onChange={(e) => setSevaMemberMobileNumber(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>રદ કરો</button>
            <button type="submit" className="btn-primary" disabled={submittingSevaMember}>
              {submittingSevaMember ? <SpinnerLoader size={20} /> : 'સાચવો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BulkSevaMemberModal({
  isOpen,
  onClose,
  bulkSevaImportTab,
  setBulkSevaImportTab,
  excelSevaFileName,
  parsedExcelSevaMembers,
  handleExcelSevaFileChange,
  handleBulkExcelSevaImport,
  bulkSevaMemberText,
  setBulkSevaMemberText,
  handleBulkSevaMemberImport,
  importingBulkSeva,
  bulkSevaImportProgress,
  bulkSevaMemberResult
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 650, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="modal-header" style={{ marginBottom: 16 }}>
          <h3 className="modal-title">એકસાથે સેવા સભ્યો ઉમેરો (બલ્ક અપલોડ)</h3>
          <button className="icon-btn" onClick={onClose} aria-label="બંધ કરો">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <button
            type="button"
            className={`tab-btn ${bulkSevaImportTab === 'excel' ? 'active' : ''}`}
            onClick={() => setBulkSevaImportTab('excel')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: bulkSevaImportTab === 'excel' ? '2px solid var(--color-primary)' : 'none',
              color: bulkSevaImportTab === 'excel' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: bulkSevaImportTab === 'excel' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Excel ફાઇલ અપલોડ
          </button>
          <button
            type="button"
            className={`tab-btn ${bulkSevaImportTab === 'text' ? 'active' : ''}`}
            onClick={() => setBulkSevaImportTab('text')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: bulkSevaImportTab === 'text' ? '2px solid var(--color-primary)' : 'none',
              color: bulkSevaImportTab === 'text' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: bulkSevaImportTab === 'text' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            કોપી-પેસ્ટ લખાણ
          </button>
        </div>

        {bulkSevaImportTab === 'excel' && (
          <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>એક્સેલ શીટ ફોર્મેટ સૂચના (મહિલા સેવા):</strong> એક્સેલમાં Gender/Zender કોલમ હોવી જરૂરી છે. ફક્ત સ્ત્રી/Female સભ્યો જ ઉમેરાશે. <br />
              - <code>FullNameGuj</code> (નામ) <br />
              - <code>Age</code> (ઉંમર) <br />
              - <code>Gender</code> (Female / Stri / F) <br />
              - <code>mobile no 1</code> (મોબાઈલ નંબર - વૈકલ્પિક) <br />
              - <code>SMK</code> (યુનિક કોડ - વૈકલ્પિક)
            </p>
          </div>
        )}

        {bulkSevaImportTab === 'text' && (
          <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>ફોર્મેટ સૂચના:</strong> નીચેના બોક્સમાં દરેક લાઈનમાં એક સભ્યની વિગત આ ક્રમમાં લખો: <br />
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', margin: '4px 0', fontFamily: 'monospace' }}>નામ, પ્રકાર, યુનિક કોડ</code> <br />
              પ્રકારમાં માત્ર <strong>kisori, yuvti, prutha, vadil</strong> માંથી જ લખવું. <br />
              <em>ઉદાહરણ:</em> <br />
              <code style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                મોનિકા પટેલ, yuvti, SEVA01 <br />
                પૂજા શાહ, kisori, SEVA02
              </code>
            </p>
          </div>
        )}

        {importingBulkSeva && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>અપલોડ થઈ રહ્યું છે...</span>
              <span>{bulkSevaImportProgress}%</span>
            </div>
            <DeterminateProgress value={bulkSevaImportProgress} />
          </div>
        )}

        {bulkSevaMemberResult && (
          <div
            className="glass-card"
            style={{
              padding: 12,
              marginBottom: 12,
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '0.85rem'
            }}
          >
            <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>અપલોડ રિપોર્ટ:</p>
            <p style={{ marginTop: 2 }}>સફળતાપૂર્વક ઉમેરાયેલ સભ્યો: {bulkSevaMemberResult.successCount}</p>
            {bulkSevaMemberResult.errorsCount > 0 && (
              <div style={{ marginTop: 8, color: 'var(--color-danger)' }}>
                <p style={{ fontWeight: 600 }}>ભૂલોવાળી લાઇનો ({bulkSevaMemberResult.errorsCount}):</p>
                <div style={{ maxHeight: 80, overflowY: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {bulkSevaMemberResult.errors.map((e, idx) => (
                    <p key={idx} style={{ fontSize: '0.75rem' }}>લાઈન {e.line}: {e.msg}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bulkSevaImportTab === 'excel' && (
          <div>
            <div
              style={{
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                marginBottom: 16,
                position: 'relative'
              }}
              onClick={() => document.getElementById('excel-seva-file-input').click()}
            >
              <input
                id="excel-seva-file-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelSevaFileChange}
                style={{ display: 'none' }}
                disabled={importingBulkSeva}
              />
              <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', marginBottom: 8, opacity: 0.8 }} />
              {excelSevaFileName ? (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>{excelSevaFileName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>ક્લિક કરી નવી ફાઈલ પસંદ કરો</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>એક્સેલ ફાઇલ પસંદ કરવા અહીં ક્લિક કરો</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>સપોર્ટેડ ફોર્મેટ: .xlsx, .xls</p>
                </div>
              )}
            </div>

            {parsedExcelSevaMembers.length > 0 && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  અપલોડ માટે તૈયાર મહિલા સભ્યોની લિસ્ટ ({parsedExcelSevaMembers.length}):
                </p>
                {parsedExcelSevaMembers.slice(0, 5).map((m, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{idx + 1}. {m.name} ({SEVA_CATEGORY_TAGS[m.type] || m.type})</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{m.uniqueCode || 'ઓટો કોડ'} | {m.mobileNumber || 'મોબાઈલ નથી'}</span>
                  </div>
                ))}
                {parsedExcelSevaMembers.length > 5 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
                    ...અને બીજા {parsedExcelSevaMembers.length - 5} સભ્યો
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {bulkSevaImportTab === 'text' && (
          <textarea
            rows={8}
            className="glass-input"
            placeholder="નામ, પ્રકાર, કોડ..."
            style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', marginBottom: 16 }}
            value={bulkSevaMemberText}
            onChange={(e) => setBulkSevaMemberText(e.target.value)}
            disabled={importingBulkSeva}
          />
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={importingBulkSeva}>રદ કરો</button>
          <button
            type="button"
            className="btn-primary"
            onClick={bulkSevaImportTab === 'excel' ? handleBulkExcelSevaImport : handleBulkSevaMemberImport}
            disabled={importingBulkSeva || (bulkSevaImportTab === 'excel' ? parsedExcelSevaMembers.length === 0 : !bulkSevaMemberText.trim())}
          >
            {importingBulkSeva ? <SpinnerLoader size={16} /> : 'સબમિટ કરો'}
          </button>
        </div>
      </div>
    </div>
  );
}
