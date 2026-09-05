import React from 'react';
import { CATEGORY_LABELS, CATEGORY_TAGS, SEVA_CATEGORY_TAGS } from '../../constants/sabhaConstants';

export default function PrintModal({ printData }) {
  if (!printData) return null;

  return (
    <div className="print-container">
      {printData.type !== 'leaderboard' && (
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 12 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>જય સ્વામિનારાયણ</h1>
          <h2 style={{ fontSize: '1.2rem', marginTop: 6 }}>જ્ઞાન સત્સંગ મંડળ પાદરા</h2>
          <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: 4 }}>{printData.title}</p>
        </div>
      )}

      {printData.type === 'leaderboard' && printData.data && (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
          {/* --- PAGE 1: EARLY / ON-TIME TOP 10 (ASCENDING) --- */}
          <div style={{ minHeight: '92vh', pageBreakAfter: 'always', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src="/ravisabha_header.png"
              alt="રવિસભા હેડર"
              className="report-header-img"
            />
            
            <div style={{ textAlign: 'center', width: '100%', margin: '6px 0 16px 0' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: '#000', textAlign: 'center' }}>
                ૧. રવિસભા: સમયસર / વહેલા પહોંચનાર શ્રેષ્ઠ ૧૦ (વહેલા સરેરાશ સમય મુજબ)
              </h2>
              <div style={{ display: 'inline-block', borderBottom: '2px solid #000', paddingBottom: 4, minWidth: '200px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000' }}>
                  {printData.filterType && printData.filterType !== 'all' ? `સભ્ય પ્રકાર: ${CATEGORY_LABELS[printData.filterType] || printData.filterType}` : 'સભા સભ્ય પ્રકાર: બધા સભ્યો'}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <table className="report-print-table" style={{ margin: '0 auto', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '85px' }}>ક્રમ (સંખ્યા)</th>
                    <th style={{ textAlign: 'left', width: 'auto' }}>સભ્ય / સભ્યોનું નામ</th>
                    <th style={{ textAlign: 'center', width: '170px' }}>સરેરાશ સમય (AVG Time)</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>સભા હાજરી</th>
                  </tr>
                </thead>
                <tbody>
                  {(!printData.data.raviTopGroups || printData.data.raviTopGroups.length === 0) ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>
                        આ કેટેગરીમાં રવિસભામાં વહેલા/સમયસર પહોંચવાનો સમય નોંધાયેલ હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                      </td>
                    </tr>
                  ) : (
                    printData.data.raviTopGroups.map((group) => (
                      <tr key={group.rank}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {group.rankLabel}
                        </td>
                        <td>
                          <div key={group.rank} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {group.members.map((m, mIdx) => (
                              <div key={m._id || mIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700 }}>{m.name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#444' }}>({CATEGORY_TAGS[m.type] || m.type})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {group.avgTime}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {group.members.map(m => m.count).join(', ')} સભા
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- PAGE 2: LATE TOP 20 (FORCED SECOND PAGE) --- */}
          <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src="/ravisabha_header.png"
              alt="રવિસભા હેડર"
              className="report-header-img"
            />
            
            <div style={{ textAlign: 'center', width: '100%', margin: '6px 0 16px 0' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: '#000', textAlign: 'center' }}>
                ૨. રવિસભા: મોડા પડનાર ૨૦ સભ્યો (મોડા સરેરાશ સમય મુજબ)
              </h2>
              <div style={{ display: 'inline-block', borderBottom: '2px solid #000', paddingBottom: 4, minWidth: '200px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000' }}>
                  {printData.filterType && printData.filterType !== 'all' ? `સભ્ય પ્રકાર: ${CATEGORY_LABELS[printData.filterType] || printData.filterType}` : 'સભા સભ્ય પ્રકાર: બધા સભ્યો'}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <table className="report-print-table" style={{ margin: '0 auto', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '80px' }}>ક્રમ (સંખ્યા)</th>
                    <th style={{ textAlign: 'left', width: 'auto' }}>સભ્ય / સભ્યોનું નામ</th>
                    <th style={{ textAlign: 'left', width: '220px' }}>મોડા પડવાના મુખ્ય કારણો (Top 3)</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>સરેરાશ સમય (AVG Time)</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>મોડા પડ્યા</th>
                  </tr>
                </thead>
                <tbody>
                  {(!printData.data.raviLateGroups || printData.data.raviLateGroups.length === 0) ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>
                        આ કેટેગરીમાં રવિસભામાં મોડા પડ્યા હોય તેવા કોઈ સભ્યો મળ્યા નથી.
                      </td>
                    </tr>
                  ) : (
                    printData.data.raviLateGroups.map((group) => (
                      <tr key={group.rank}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {group.rankLabel}
                        </td>
                        <td>
                          <div key={group.rank} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {group.members.map((m, mIdx) => (
                              <div key={m._id || mIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700 }}>{m.name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#444' }}>({CATEGORY_TAGS[m.type] || m.type})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {group.members.map((m, mIdx) => (
                              <div key={m._id || mIdx} style={{ fontSize: '0.78rem', color: '#222' }}>
                                {(!m.topReasons || m.topReasons.length === 0) ? '-' : m.topReasons.map(r => r.label).join(', ')}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {group.avgTime}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {group.members.map(m => m.count).join(', ')} વખત
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {printData.type === 'particular_event' && printData.data && (
        <div>
          <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સભા હાજરી વિગત</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                <th style={{ textAlign: 'left', padding: 6 }}>હાજરી સ્થિતિ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>સમય</th>
                <th style={{ textAlign: 'left', padding: 6 }}>રીમાર્ક (નોંધ)</th>
              </tr>
            </thead>
            <tbody>
              {printData.data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 6 }}>{idx + 1}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                  <td style={{ padding: 6 }}>{CATEGORY_TAGS[item.type]}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>
                    {item.status === 'present' ? (item.isLate ? 'મોડા આવ્યા' : 'હાજર') : 'ગેરહાજર'}
                  </td>
                  <td style={{ padding: 6 }}>
                    {item.arrivalTime ? new Date(item.arrivalTime).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td style={{ padding: 6, fontStyle: 'italic' }}>{item.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printData.type === 'seva_report' && printData.data && (
        <div>
          <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સભ્યોના સેવા કલાકોનો અહેવાલ (કુલ વિગત)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                <th style={{ textAlign: 'center', padding: 6 }}>સેવા સંખ્યા</th>
                <th style={{ textAlign: 'right', padding: 6 }}>કુલ સેવા કલાક</th>
              </tr>
            </thead>
            <tbody>
              {printData.data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 6 }}>{idx + 1}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                  <td style={{ padding: 6 }}>{SEVA_CATEGORY_TAGS[item.type] || item.type}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{item.sevaCount} વખત</td>
                  <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{item.totalHours} કલાક</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printData.type === 'seva_leaderboard' && printData.data && (
        <div>
          <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>સેવા પ્રકાર વાઈઝ શ્રેષ્ઠ અહેવાલ (ટોપ ૧૦)</h2>
          {Object.entries(printData.data).map(([typeName, list]) => {
            if (!list || list.length === 0) return null;
            return (
              <div key={typeName} style={{ marginBottom: 32, pageBreakInside: 'avoid' }}>
                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: 4, fontWeight: 700, color: '#111', fontSize: '1.05rem', marginBottom: 8 }}>
                  {typeName}: શ્રેષ્ઠ ૧૦ સેવાકર્તા
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', fontSize: '0.85rem' }}>
                      <th style={{ textAlign: 'left', padding: 6, width: '8%' }}>ક્રમ</th>
                      <th style={{ textAlign: 'left', padding: 6, width: '40%' }}>નામ</th>
                      <th style={{ textAlign: 'left', padding: 6, width: '15%' }}>કોડ</th>
                      <th style={{ textAlign: 'center', padding: 6, width: '17%' }}>સેવા સંખ્યા</th>
                      <th style={{ textAlign: 'right', padding: 6, width: '20%' }}>કુલ સેવા કલાક</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
                        <td style={{ padding: 6 }}>{idx + 1}</td>
                        <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>{item.sevaCount} વખત</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{item.totalHours} કલાક</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {printData.type === 'particular_seva' && printData.data && (
        <div>
          <h3 style={{ borderBottom: '1px solid #000', paddingBottom: 4, fontWeight: 700 }}>સેવા હાજરી અને કલાકોની વિગત</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>ક્રમ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>નામ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>કોડ</th>
                <th style={{ textAlign: 'left', padding: 6 }}>પ્રકાર</th>
                <th style={{ textAlign: 'center', padding: 6 }}>હાજરી સ્થિતિ</th>
                <th style={{ textAlign: 'right', padding: 6 }}>સેવાના કલાકો</th>
              </tr>
            </thead>
            <tbody>
              {printData.data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 6 }}>{idx + 1}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: 6 }}>{item.uniqueCode}</td>
                  <td style={{ padding: 6 }}>{CATEGORY_TAGS[item.type] || item.type}</td>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 600 }}>
                    {item.status === 'present' ? 'હાજર' : 'ગેરહાજર'}
                  </td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    {item.status === 'present' ? `${item.hours} કલાક` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
