import React from 'react';
import { UserCheck, Users, TrendingUp } from 'lucide-react';

export default function BottomNav({
  user,
  activeTab,
  sevaModuleTab,
  onTabChange
}) {
  const isSevaUser = user?.role === 'seva_admin';

  const visibleNavItems = [
    { key: 'attendance', label: 'હાજરી', icon: UserCheck },
    { key: 'members', label: 'સભ્યો', icon: Users },
    { key: 'reports', label: 'રીપોર્ટ્સ', icon: TrendingUp }
  ];

  const currentTabKey = isSevaUser ? sevaModuleTab : activeTab;

  if (visibleNavItems.length <= 1) {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="મુખ્ય નેવિગેશન">
      {visibleNavItems.map(item => (
        <button
          key={item.key}
          className={`bottom-nav-item ${currentTabKey === item.key ? 'active' : ''}`}
          onClick={() => onTabChange(item.key)}
          aria-current={currentTabKey === item.key ? 'page' : undefined}
        >
          <item.icon size={20} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
