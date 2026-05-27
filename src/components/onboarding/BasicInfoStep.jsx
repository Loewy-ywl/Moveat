import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const BasicInfoStep = ({ height, setHeight, weight, setWeight, age, setAge, gender, setGender }) => (
  <div className="space-y-4">
    <div>
      <Label>身高 (cm)</Label>
      <Input placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} />
    </div>
    <div>
      <Label>体重 (kg)</Label>
      <Input placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
    </div>
    <div>
      <Label>年龄</Label>
      <Input placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} />
    </div>
    <div>
      <Label>性别</Label>
      <div className="flex gap-4 mt-2">
        <Button 
          variant="outline" 
          className={`flex-1 ${gender === '男' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}`} 
          onClick={() => setGender('男')}
        >
          男
        </Button>
        <Button 
          variant="outline" 
          className={`flex-1 ${gender === '女' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}`} 
          onClick={() => setGender('女')}
        >
          女
        </Button>
      </div>
    </div>
  </div>
);

export default BasicInfoStep;
