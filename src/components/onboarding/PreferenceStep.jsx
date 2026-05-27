import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const prefs = ['中餐', '轻食', '健身餐', '低碳', '高蛋白'];
const freqs = ['1-2次', '3-4次', '5次以上'];

const PreferenceStep = ({ selectedPrefs, togglePref, forbidden, setForbidden, frequency, setFrequency }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>饮食偏好（多选）</Label>
      <div className="grid grid-cols-2 gap-2">
        {prefs.map((t) => (
          <div 
            key={t} 
            onClick={() => togglePref(t)} 
            className={`border rounded-lg p-3 text-center text-sm cursor-pointer transition-colors ${
              selectedPrefs.includes(t) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-accent'
            }`}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
    <div>
      <Label>忌口信息</Label>
      <Input 
        placeholder="例如：海鲜过敏、不吃香菜" 
        value={forbidden} 
        onChange={(e) => setForbidden(e.target.value)} 
      />
    </div>
    <div>
      <Label>每周运动频率</Label>
      <div className="flex gap-2 mt-2">
        {freqs.map((f) => (
          <button 
            key={f} 
            onClick={() => setFrequency(f)} 
            className={`flex-1 border rounded-lg py-2 text-sm transition-colors ${
              frequency === f ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-accent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default PreferenceStep;
