const GoalStep = ({ goal, setGoal }) => (
  <div className="space-y-3">
    {['减脂', '增肌', '保持体型'].map((g) => (
      <button 
        key={g} 
        onClick={() => setGoal(g)} 
        className={`w-full p-4 rounded-xl border text-left transition-colors ${
          goal === g ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-accent'
        }`}
      >
        <div className="font-medium">{g}</div>
      </button>
    ))}
  </div>
);

export default GoalStep;
