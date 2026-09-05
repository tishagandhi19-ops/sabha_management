import React from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { SpinnerLoader, DeterminateProgress } from '../Loaders';
import { CATEGORY_TAGS } from '../../constants/sabhaConstants';

export default function BulkMemberModal({
  isOpen,
  onClose,
  bulkImportTab,
  setBulkImportTab,
  excelFileName,
  parsedExcelMembers,
  handleExcelFileChange,
  handleBulkExcelImport,
  bulkText,
  setBulkText,
  handleBulkImport,
  importingBulk,
  bulkImportProgress,
  bulkResult
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 550 }}>
        <div className="modal-header" style={{ marginBottom: 16 }}>
          <h3 className="modal-title">
            એકસાથે સભ્યો ઉમેરો (બલ્ક અપલોડ)
          </h3>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="બંધ કરો"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <button
            type="button"
            className={`tab-btn ${bulkImportTab === 'excel' ? 'active' : ''}`}
            onClick={() => setBulkImportTab('excel')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: bulkImportTab === 'excel' ? '2px solid var(--color-primary)' : 'none',
              color: bulkImportTab === 'excel' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: bulkImportTab === 'excel' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Excel ફાઇલ અપલોડ
          </button>
          <button
            type="button"
            className={`tab-btn ${bulkImportTab === 'text' ? 'active' : ''}`}
            onClick={() => setBulkImportTab('text')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: bulkImportTab === 'text' ? '2px solid var(--color-primary)' : 'none',
              color: bulkImportTab === 'text' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: bulkImportTab === 'text' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            કોપી-પેસ્ટ લખાણ
          </button>
        </div>

        {bulkImportTab === 'excel' && (
          <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>એક્સેલ શીટ ફોર્મેટ સૂચના:</strong> એક્સેલમાં આ કોલમ હોવી જરૂરી છે: <br />
              - <code>FullNameGuj</code> (નામ માટે) <br />
              - <code>Age</code> (ઉંમર માટે) <br />
              - <code>mobile no 1</code> (મોબાઈલ નંબર - વૈકલ્પિક) <br />
              - <code>SMK</code> (યુનિક કોડ - વૈકલ્પિક)
            </p>
          </div>
        )}

        {bulkImportTab === 'text' && (
          <div style={{ background: 'var(--tint-info)', borderLeft: '3px solid var(--color-info)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>ફોર્મેટ સૂચના:</strong> નીચેના બોક્સમાં દરેક લાઈનમાં એક સભ્યની વિગત આ ક્રમમાં લખો: <br />
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', margin: '4px 0', fontFamily: 'monospace' }}>નામ, પ્રકાર, યુનિક કોડ</code> <br />
              પ્રકારમાં માત્ર <strong>kishor, yuva, proudh, vadil</strong> માંથી જ લખવું. <br />
              <em>ઉદાહરણ:</em> <br />
              <code style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                યશ ગાંધી, yuva, YG01 <br />
                અમિત પટેલ, kishor, KP02
              </code>
            </p>
          </div>
        )}

        {importingBulk && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>અપલોડ થઈ રહ્યું છે...</span>
              <span>{bulkImportProgress}%</span>
            </div>
            <DeterminateProgress value={bulkImportProgress} />
          </div>
        )}

        {bulkResult && (
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
            <p style={{ marginTop: 2 }}>સફળતાપૂર્વક ઉમેરાયેલ સભ્યો: {bulkResult.successCount}</p>
            {bulkResult.errorsCount > 0 && (
              <div style={{ marginTop: 8, color: 'var(--color-danger)' }}>
                <p style={{ fontWeight: 600 }}>ભૂલોવાળી લાઇનો ({bulkResult.errorsCount}):</p>
                <div style={{ maxHeight: 80, overflowY: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {bulkResult.errors.map((e, idx) => (
                    <p key={idx} style={{ fontSize: '0.75rem' }}>લાઈન {e.line}: {e.msg}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bulkImportTab === 'excel' && (
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
              onClick={() => document.getElementById('excel-file-input').click()}
            >
              <input
                id="excel-file-input"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelFileChange}
                style={{ display: 'none' }}
                disabled={importingBulk}
              />
              <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', marginBottom: 8, opacity: 0.8 }} />
              {excelFileName ? (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>{excelFileName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>ક્લિક કરી નવી ફાઈલ પસંદ કરો</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>એક્સેલ ફાઇલ પસંદ કરવા અહીં ક્લિક કરો</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>સપોર્ટેડ ફોર્મેટ: .xlsx, .xls</p>
                </div>
              )}
            </div>

            {parsedExcelMembers.length > 0 && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  અપલોડ માટે તૈયાર સભ્યોની લિસ્ટ ({parsedExcelMembers.length}):
                </p>
                {parsedExcelMembers.slice(0, 5).map((m, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{idx + 1}. {m.name} ({CATEGORY_TAGS[m.type] || m.type})</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{m.uniqueCode || 'ઓટો કોડ'} | {m.mobileNumber || 'મોબાઈલ નથી'}</span>
                  </div>
                ))}
                {parsedExcelMembers.length > 5 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
                    ...અને બીજા {parsedExcelMembers.length - 5} સભ્યો
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {bulkImportTab === 'text' && (
          <textarea
            rows={8}
            className="glass-input"
            placeholder="નામ, પ્રકાર, કોડ..."
            style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', marginBottom: 16 }}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            disabled={importingBulk}
          />
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={importingBulk}>રદ કરો</button>
          <button
            type="button"
            className="btn-primary"
            onClick={bulkImportTab === 'excel' ? handleBulkExcelImport : handleBulkImport}
            disabled={importingBulk || (bulkImportTab === 'excel' ? parsedExcelMembers.length === 0 : !bulkText.trim())}
          >
            {importingBulk ? <SpinnerLoader size={16} /> : 'સબમિટ કરો'}
          </button>
        </div>
      </div>
    </div>
  );
}
