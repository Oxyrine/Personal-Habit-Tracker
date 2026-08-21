import { motion } from "motion/react";

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

const formatLabel = (iso: string) =>
  parseDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface HeatmapProps {
  days: string[];
  today: string;
  createdOn: string;
  onToggleDay?: (iso: string) => void;
}

export default function Heatmap({ days, today, createdOn, onToggleDay }: HeatmapProps) {
  if (!today) return null;

  const endDate = parseDate(today);
  const startDate = parseDate(today);
  startDate.setDate(endDate.getDate() - 29); // 30 days total
  const createdDate = parseDate(createdOn);

  const dateArray = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dateArray.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 0 = Sunday, 1 = Monday, ...
  const startDayOfWeek = startDate.getDay();
  const padStart: (Date | null)[] = Array(startDayOfWeek).fill(null);

  const cells: (Date | null)[] = [...padStart, ...dateArray];
  const completedSet = new Set(days);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const firstDate = week.find((d): d is Date => d !== null);
    if (!firstDate || firstDate.getMonth() === lastMonth) return "";
    lastMonth = firstDate.getMonth();
    return firstDate.toLocaleDateString(undefined, { month: 'short' });
  });

  return (
    <div className="w-full overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E1E0CC transparent' }}>
      <div className="flex gap-[3px] mb-1" style={{ width: 'max-content' }}>
        {monthLabels.map((label, i) => (
          <div key={i} className="w-[10px] sm:w-[12px] shrink-0 text-[10px] text-gray-500 whitespace-nowrap">
            {label}
          </div>
        ))}
      </div>

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
          const beforeCreation = d < createdDate;
          const clickable = !beforeCreation && !!onToggleDay;

          const colorClass = beforeCreation
            ? 'bg-white/[0.03]'
            : isDone
              ? 'bg-primary'
              : 'bg-white/5 hover:bg-white/10';

          const sharedClass = `w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-colors duration-300 ${colorClass}`;

          if (clickable) {
            return (
              <motion.button
                key={isoDate}
                type="button"
                title={formatLabel(isoDate)}
                onClick={() => onToggleDay!(isoDate)}
                whileTap={{ scale: 0.8 }}
                className={`${sharedClass} cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary`}
              />
            );
          }
          return (
            <div
              key={isoDate}
              title={beforeCreation ? undefined : formatLabel(isoDate)}
              className={sharedClass}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.03] inline-block" /> Before start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-[10px] h-[10px] rounded-[2px] bg-white/5 inline-block" /> Missed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-[10px] h-[10px] rounded-[2px] bg-primary inline-block" /> Done
        </span>
      </div>
    </div>
  );
}
