import React from 'react';
import { Users, LogOut, UserCheck, TrendingUp } from 'lucide-react';

export default function Navbar({
  user,
  logout,
  activeTab,
  sevaModuleTab,
  onTabChange,
  isAttendanceSheetOpen
}) {
  const isSevaUser = user?.role === 'seva_admin';

  const visibleNavItems = [
    { key: 'attendance', label: 'હાજરી', icon: UserCheck },
    { key: 'members', label: 'સભ્યો', icon: Users },
    { key: 'reports', label: 'રીપોર્ટ્સ', icon: TrendingUp }
  ];

  const currentTabKey = isSevaUser ? sevaModuleTab : activeTab;

  if (isAttendanceSheetOpen) {
    return null;
  }

  return (
    <header className="glass-panel app-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="brand-mark" aria-hidden="true">
            <Users size={22} />
          </span>
          <div>
            <h1 className="app-title">પાદરા જ્ઞાન સત્સંગ</h1>
          </div>
        </div>

        <button className="icon-btn" onClick={logout} title="લોગઆઉટ">
          <LogOut size={20} color="#ef4444" />
        </button>
      </div>

      {/* Desktop primary navigation */}
      {visibleNavItems.length > 1 && (
        <nav className="main-nav" aria-label="મુખ્ય નેવિગેશન">
          {visibleNavItems.map(item => (
            <button
              key={item.key}
              className={`main-nav-item ${currentTabKey === item.key ? 'active' : ''}`}
              onClick={() => onTabChange(item.key)}
              aria-current={currentTabKey === item.key ? 'page' : undefined}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
