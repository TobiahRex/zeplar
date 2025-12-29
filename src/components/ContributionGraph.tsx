import { useMemo } from "react";

interface ContributionGraphProps {
  activityByDate: Record<string, number>;
  patternsStudied?: number;
  totalCards?: number;
}

// Color scale based on cards reviewed - brighter for dark background
function getActivityColor(count: number): string {
  if (count === 0) return "bg-[rgba(255,255,255,0.08)]"; // subtle gray - visible on dark bg
  if (count <= 5) return "bg-[#0e4429]"; // light green
  if (count <= 10) return "bg-[#006d32]"; // medium green
  if (count <= 15) return "bg-[#26a641]"; // green
  return "bg-[#39d353]"; // bright green
}

export function ContributionGraph({
  activityByDate,
  patternsStudied,
  totalCards,
}: ContributionGraphProps) {
  // Generate full year grid including future dates
  const days = useMemo(() => {
    const result: Array<{
      date: string;
      count: number;
      dayOfWeek: number;
      isFuture: boolean;
    }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Start from the Sunday of the week 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    // Adjust to the previous Sunday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - dayOfWeek);
    }

    // End at the end of current week (Saturday)
    const endDate = new Date(today);
    const daysUntilSaturday = 6 - today.getDay();
    endDate.setDate(today.getDate() + daysUntilSaturday);

    // Generate all days from start to end
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getDay(); // 0 = Sunday
      const isFuture = current > today;

      result.push({
        date: dateStr,
        count: activityByDate[dateStr] || 0,
        dayOfWeek,
        isFuture,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [activityByDate]);

  // Group days into weeks (Sunday to Saturday)
  const weeks = useMemo(() => {
    const result: (typeof days)[] = [];

    // Group days into weeks of exactly 7 days
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      if (week.length > 0) {
        result.push(week);
      }
    }

    return result;
  }, [days]);

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = "";
    let lastWeekIndex = -4; // Minimum spacing of 4 weeks between labels

    weeks.forEach((week, weekIndex) => {
      if (week.length === 0) return;

      const firstDay = week[0];
      const date = new Date(firstDay.date);
      const month = date.toLocaleDateString("en-US", { month: "short" });

      // Only add label if month changed AND we have enough spacing
      if (month !== lastMonth && weekIndex - lastWeekIndex >= 4) {
        labels.push({ month, weekIndex });
        lastMonth = month;
        lastWeekIndex = weekIndex;
      } else if (month !== lastMonth) {
        // Month changed but too close - just update lastMonth
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div className="flex justify-center">
      <div className="inline-block space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Activity (Last Year)</h2>
          {(patternsStudied !== undefined || totalCards !== undefined) && (
            <div className="text-xs text-muted-foreground">
              {patternsStudied !== undefined && (
                <span className="mr-4">{patternsStudied} patterns studied</span>
              )}
              {totalCards !== undefined && (
                <span>{totalCards} total reviews</span>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        <div>
          {/* Month labels */}
          <div className="flex gap-[2px] mb-1">
            <div className="w-6" /> {/* Spacer for day labels */}
            <div className="flex gap-[2px] relative">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="absolute text-[10px] text-muted-foreground"
                  style={{ left: `${label.weekIndex * 12}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-[2px] mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] text-[10px] text-muted-foreground pr-1">
              <div className="h-[10px]">Sun</div>
              <div className="h-[10px]" />
              <div className="h-[10px]">Tue</div>
              <div className="h-[10px]" />
              <div className="h-[10px]">Thu</div>
              <div className="h-[10px]" />
              <div className="h-[10px]">Sat</div>
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  const color = getActivityColor(day.count);
                  const formattedDate = new Date(day.date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  );

                  return (
                    <div
                      key={dayIndex}
                      className={`w-[10px] h-[10px] ${color} rounded-[2px] hover:ring-1 hover:ring-white cursor-pointer transition-transform hover:scale-125`}
                      title={`${day.count} cards on ${formattedDate}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div
                className="w-[10px] h-[10px] bg-[rgba(255,255,255,0.08)] rounded-[2px] border border-[rgba(255,255,255,0.1)]"
                title="0 cards"
              />
              <div
                className="w-[10px] h-[10px] bg-[#0e4429] rounded-[2px]"
                title="1-5 cards"
              />
              <div
                className="w-[10px] h-[10px] bg-[#006d32] rounded-[2px]"
                title="6-10 cards"
              />
              <div
                className="w-[10px] h-[10px] bg-[#26a641] rounded-[2px]"
                title="11-15 cards"
              />
              <div
                className="w-[10px] h-[10px] bg-[#39d353] rounded-[2px]"
                title="16+ cards"
              />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
