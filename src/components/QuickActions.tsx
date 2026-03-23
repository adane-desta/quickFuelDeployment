import { Map, List, RefreshCw, Flag } from 'lucide-react';

interface QuickActionsProps {
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  onRefresh: () => void;
  onReportQueue?: () => void;
}

export function QuickActions({ viewMode, onViewModeChange, onRefresh, onReportQueue }: QuickActionsProps) {
  return (
    <div className="bg-white px-4 py-3 border-b border-gray-200">
      <div className="flex gap-2">
        <button
          onClick={() => onViewModeChange(viewMode === 'list' ? 'map' : 'list')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {viewMode === 'list' ? (
            <><Map className="w-4 h-4" /><span>Map View</span></>
          ) : (
            <><List className="w-4 h-4" /><span>List View</span></>
          )}
        </button>
        
        <button
          onClick={onRefresh}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Refresh Stations"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onReportQueue}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          title="Report Queue"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
