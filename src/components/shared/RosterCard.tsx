import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import type { SalesRep } from '../../lib/types';

interface RosterCardProps {
  manager: SalesRep;
  officers: SalesRep[];
  managerMetrics?: { conversionRate: number; wonLeads: number };
  officerMetrics?: Record<string, { conversionRate: number; wonLeads: number }>;
}

export default function RosterCard({ manager, officers, managerMetrics, officerMetrics }: RosterCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Roster</h3>
      <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Branch Manager</div>
      <Link
        to={`/rep/${manager.id}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors mb-5"
      >
        <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center shrink-0">
          <UserRound className="w-4 h-4 text-brand-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{manager.name}</p>
          <p className="text-xs text-gray-500">Joined {manager.joined}</p>
        </div>
        {managerMetrics && (
          <div className="text-right text-xs shrink-0">
            <p className="font-semibold text-gray-900">{managerMetrics.wonLeads} won</p>
            <p className="text-gray-500">{managerMetrics.conversionRate.toFixed(1)}% conv</p>
          </div>
        )}
      </Link>

      <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">
        Sales Officers ({officers.length})
      </div>
      <div className="space-y-2">
        {officers.map(officer => (
          <Link
            key={officer.id}
            to={`/rep/${officer.id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <UserRound className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{officer.name}</p>
              <p className="text-xs text-gray-500">Joined {officer.joined}</p>
            </div>
            {officerMetrics?.[officer.id] && (
              <div className="text-right text-xs shrink-0">
                <p className="font-semibold text-gray-900">{officerMetrics[officer.id].wonLeads} won</p>
                <p className="text-gray-500">{officerMetrics[officer.id].conversionRate.toFixed(1)}%</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
