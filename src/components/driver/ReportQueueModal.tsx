import { useState } from 'react';
import { X, Flag, Users, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { Station } from '../../types';

interface ReportQueueModalProps {
  stations: Station[];
  onClose: () => void;
}

export function ReportQueueModal({ stations, onClose }: ReportQueueModalProps) {
  const [selectedStation, setSelectedStation] = useState('');
  const [queueLength, setQueueLength] = useState<'Short' | 'Medium' | 'Long' | ''>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStation || !queueLength) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-600" /> Report Queue
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-gray-900 mb-2">Report Submitted!</h4>
              <p className="text-gray-600 text-sm mb-4">Thank you for helping other drivers. Your report has been submitted.</p>
              <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Help other drivers by reporting the current queue status at a station.</p>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Select Station</label>
                <select
                  value={selectedStation}
                  onChange={e => setSelectedStation(e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Choose a station...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s?.name} ({s?.distance} km)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  <Users className="w-4 h-4 inline mr-1" /> Queue Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Short', 'Medium', 'Long'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setQueueLength(q)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        queueLength === q
                          ? q === 'Short' ? 'border-green-500 bg-green-50 text-green-700'
                            : q === 'Medium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">{q}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  <MessageSquare className="w-4 h-4 inline mr-1" /> Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedStation || !queueLength || isSubmitting}
                className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
