import { Link, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, Users } from 'lucide-react';
import { getBranches } from '../../lib/data';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reps', label: 'Sales Reps', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const branches = getBranches();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shrink-0 max-md:hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">DealerPulse</h1>
            <p className="text-xs text-gray-500">Performance Dashboard</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
        <div className="pt-3">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Branches</p>
        </div>
        {branches.map(branch => {
          const isActive = location.pathname === `/branch/${branch.id}`;
          return (
            <Link
              key={branch.id}
              to={`/branch/${branch.id}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="truncate">{branch.name}</span>
              <span className="ml-auto text-xs text-gray-400">{branch.city}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
