import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { runMrpCalculation } from '../../services/api';
import useStore from '../../store/useStore';
import PageHeader from '../../components/ui/PageHeader';

const PHASES = [
  { id: 0, label: 'Clear Board',    desc: 'Deleting all Pending suggestions' },
  { id: 1, label: 'Netting',        desc: 'Gross demand minus on-hand stock' },
  { id: 2, label: 'Lot Sizing',     desc: 'Applying minimum order rules' },
  { id: 3, label: 'BOM Explosion',  desc: 'Cascading through sub-assemblies' },
];

export default function MrpDashboard() {
  const navigate    = useNavigate();
  const { mrpRunning, setMrpRunning } = useStore();
  const [donePhases,  setDonePhases]  = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [result,      setResult]      = useState(null);

  const runMrp = async () => {
    if (mrpRunning) return;
    setMrpRunning(true);
    setDonePhases([]);
    setActivePhase(null);
    setResult(null);

    // Animate phases while API is running
    const phaseInterval = setInterval(() => {
      setActivePhase(prev => {
        const next = (prev === null ? 0 : prev + 1);
        if (next >= PHASES.length) { clearInterval(phaseInterval); return prev; }
        setDonePhases(d => prev !== null ? [...d, prev] : d);
        return next;
      });
    }, 600);

    try {
      const data = await runMrpCalculation();
      clearInterval(phaseInterval);
      setDonePhases([0, 1, 2, 3]);
      setActivePhase(null);
      setResult(data);
      toast.success(`MRP complete! ${data.generated} suggestions generated.`);
    } catch (e) {
      clearInterval(phaseInterval);
      setDonePhases([]);
      setActivePhase(null);
      toast.error('MRP run failed. Check backend.');
    } finally {
      setMrpRunning(false);
    }
  };

  const allDone = donePhases.length === PHASES.length && !mrpRunning;

  return (
    <div>
      <PageHeader title="MRP Engine" subtitle="Material Requirements Planning calculation" />

      <div className="p-6 max-w-2xl mx-auto">
        {/* Hero card */}
        <div className="card p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Rocket size={28} className="text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Run MRP Calculation</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Triggers a full netting, lot-sizing, and BOM explosion cycle across all open demand.
            Previous <span className="font-medium text-amber-600">Pending</span> suggestions will be cleared first.
          </p>
          <button
            className="btn-primary h-12 px-8 text-base font-semibold disabled:opacity-50"
            onClick={runMrp}
            disabled={mrpRunning}
          >
            {mrpRunning ? (
              <><Loader2 size={18} className="animate-spin" /> Calculating…</>
            ) : (
              <><Rocket size={18} /> Run MRP Process</>
            )}
          </button>
        </div>

        {/* Phase tracker */}
        <div className="card p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Calculation Phases</h3>
          <div className="space-y-3">
            {PHASES.map(ph => {
              const done   = donePhases.includes(ph.id);
              const active = activePhase === ph.id;
              return (
                <div key={ph.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  active ? 'bg-amber-50 border border-amber-200' :
                  done   ? 'bg-brand-50 border border-brand-100' :
                           'bg-gray-50 border border-transparent'
                }`}>
                  {done   ? <CheckCircle2 size={18} className="text-brand-400 flex-shrink-0" /> :
                   active ? <Loader2 size={18} className="animate-spin text-amber-500 flex-shrink-0" /> :
                            <Circle size={18} className="text-gray-300 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${done ? 'text-brand-600' : active ? 'text-amber-700' : 'text-gray-400'}`}>
                      Phase {ph.id}: {ph.label}
                    </div>
                    <div className="text-xs text-gray-400">{ph.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {allDone && result && (
          <div className="card p-5 border-l-4 border-brand-400">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={18} className="text-brand-400" />
                  <span className="text-sm font-semibold text-gray-800">Calculation Complete</span>
                </div>
                <p className="text-sm text-gray-500">
                  {result.generated} suggestion{result.generated !== 1 ? 's' : ''} generated and ready for review.
                </p>
              </div>
              <button className="btn-primary text-sm" onClick={() => navigate('/mrp/suggestions')}>
                View Results <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
