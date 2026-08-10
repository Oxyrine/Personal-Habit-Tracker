const parseDate = (dStr: string) => {
  const [y, m, d] = dStr.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Heatmap({ days, today }: { days: string[], today: string }) {
  if (!today) return null;
  
  const endDate = parseDate(today);
  const startDate = parseDate(today);
  startDate.setDate(endDate.getDate() - 364); // 365 days total
  
  const dateArray = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dateArray.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 0 = Sunday, 1 = Monday, ...
  const startDayOfWeek = startDate.getDay();
  const padStart = Array(startDayOfWeek).fill(null);
  
  const cells = [...padStart, ...dateArray];
  const completedSet = new Set(days);

  return (
    <div className="w-full overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E1E0CC transparent' }}>
      <div 
        className="grid gap-[3px]"
        style={{
          gridTemplateRows: 'repeat(7, 1fr)',
          gridAutoFlow: 'column',
          width: 'max-content'
        }}
      >
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`pad-${i}`} className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] bg-transparent rounded-[2px]" />;
          }
          const isoDate = toISO(d);
          const isDone = completedSet.has(isoDate);
          return (
            <div
              key={isoDate}
              title={isoDate}
              className={`w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-colors duration-300 ${
                isDone ? 'bg-primary' : 'bg-white/5 hover:bg-white/10'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
