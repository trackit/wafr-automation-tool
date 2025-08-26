import { components } from '@shared/api-schema';
import { Calendar, Computer, Earth, Search, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Treemap,
} from 'recharts';
import {
  getChartColorByIndex,
  getThemeColors,
  darkenColor,
} from '../../lib/theme-colors';

const extractAccountId = (roleArn: string | undefined) => {
  if (!roleArn) return '';
  const match = roleArn.match(/arn:aws:iam::(\d+):/);
  return match ? match[1] : '';
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.1) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function formatRegion(raw: string): string {
  return raw
    .split('-')
    .map((part) =>
      // Si c'est un code court (ex. "us", "eu"), on met tout en MAJ
      part.length <= 2
        ? part.toUpperCase()
        : // sinon on ne met que la première lettre en MAJ
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ');
}

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

function AssessmentOverview({
  assessment,
}: {
  assessment: components['schemas']['AssessmentContent'] | null;
}) {
  const [totalRegionsCount, setTotalRegionsCount] = useState<number>(0);
  const [assessmentRegions, setAssessmentRegions] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [assessmentSeverities, setAssessmentSeverities] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [totalSeveritiesCount, setTotalSeveritiesCount] = useState<number>(0);
  const [assessmentResourceTypes, setAssessmentResourceTypes] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [enabledResourceTypes, setEnabledResourceTypes] = useState<Set<string>>(
    new Set()
  );
  const [pillarCompletionData, setPillarCompletionData] = useState<
    Array<{ pillar: string; completion: number }>
  >([]);

  console.log(assessment);
  console.log(assessmentRegions);
  console.log(assessmentSeverities);
  console.log(assessmentResourceTypes);
  console.log(pillarCompletionData);

  useMemo(() => {
    if (assessment?.graphData?.regions) {
      setAssessmentRegions(
        Object.entries(assessment.graphData.regions)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map(([name, value]) => ({ name, value: value as number }))
      );
    }
    if (assessment?.graphData?.severities) {
      setAssessmentSeverities(
        Object.entries(assessment.graphData.severities)
          .sort((a, b) => SEVERITIES.indexOf(a[0]) - SEVERITIES.indexOf(b[0]))
          .map(([name, value]) => ({ name, value: value as number }))
      );
    }
    if (assessment?.graphData?.resourceTypes) {
      const resourceTypes = Object.entries(assessment.graphData.resourceTypes)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([name, value], index) => ({
          name,
          value: value as number,
          color: getChartColorByIndex(index),
        }));
      setAssessmentResourceTypes(resourceTypes);
      // Initialize all resource types as enabled
      setEnabledResourceTypes(new Set(resourceTypes.map((rt) => rt.name)));
    }
  }, [assessment?.graphData]);

  useMemo(() => {
    setTotalRegionsCount(
      assessmentRegions.reduce((sum, item) => sum + item.value, 0)
    );
  }, [assessmentRegions]);

  useMemo(() => {
    setTotalSeveritiesCount(
      assessmentSeverities.reduce((sum, item) => sum + item.value, 0)
    );
  }, [assessmentSeverities]);

  // Calculate pillar completion percentages
  useMemo(() => {
    if (assessment?.pillars) {
      const pillarData = assessment.pillars
        .filter((pillar) => !pillar.disabled) // Only include enabled pillars
        .map((pillar) => {
          const questions = pillar.questions || [];
          const totalQuestions = questions.filter((q) => !q.disabled).length;

          if (totalQuestions === 0) {
            return {
              pillar: pillar.label || pillar.id || 'Unknown',
              completion: 100,
            };
          }

          let completedQuestions = 0;

          for (const question of questions) {
            if (question.disabled) continue;

            // Check if the question has any high severity best practices
            const hasHighSeverityPractices = question.bestPractices?.some(
              (bestPractice) => bestPractice.risk === 'High'
            );

            if (hasHighSeverityPractices) {
              // Check if all high severity best practices in this question have checked true
              const allHighSeverityPracticesComplete =
                question.bestPractices?.every(
                  (bestPractice) =>
                    bestPractice.risk !== 'High' ||
                    bestPractice.checked === true
                ) ?? false;

              if (allHighSeverityPracticesComplete) {
                completedQuestions++;
              }
            } else {
              completedQuestions++;
            }
          }

          const completionPercentage = Math.round(
            (completedQuestions / totalQuestions) * 100
          );
          return {
            pillar: pillar.label || pillar.id || 'Unknown',
            completion: completionPercentage,
          };
        });

      setPillarCompletionData(pillarData);
    }
  }, [assessment?.pillars]);

  // Calculate overall completion percentage
  const overallCompletion = useMemo(() => {
    if (!assessment?.pillars) return 0;

    let completedQuestions = 0;
    let totalQuestions = 0;

    for (const pillar of assessment.pillars) {
      if (pillar.disabled) continue;

      const questions = pillar.questions || [];
      for (const question of questions) {
        if (question.disabled) continue;

        totalQuestions++;

        // Check if the question has any high severity best practices
        const hasHighSeverityPractices = question.bestPractices?.some(
          (bestPractice) => bestPractice.risk === 'High'
        );

        if (hasHighSeverityPractices) {
          // Check if all high severity best practices in this question have checked true
          const allHighSeverityPracticesComplete =
            question.bestPractices?.every(
              (bestPractice) =>
                bestPractice.risk !== 'High' || bestPractice.checked === true
            ) ?? false;

          if (allHighSeverityPracticesComplete) {
            completedQuestions++;
          }
        } else {
          completedQuestions++;
        }
      }
    }

    return totalQuestions > 0
      ? Math.round((completedQuestions / totalQuestions) * 100)
      : 0;
  }, [assessment?.pillars]);

  // Get severity-specific colors for the pie chart
  const getSeverityColor = (severity: string): string => {
    const colors = getThemeColors();

    switch (severity.toLowerCase()) {
      case 'low':
        return colors.info;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      case 'critical':
        // Darker version of error color
        return darkenColor(colors.error, 30);
      default:
        return colors.neutral;
    }
  };

  // Get colors for resource types in the treemap
  const getResourceTypeColor = (index: number): string => {
    return getChartColorByIndex(index);
  };

  // Toggle resource type visibility
  const toggleResourceType = (resourceTypeName: string) => {
    setEnabledResourceTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resourceTypeName)) {
        newSet.delete(resourceTypeName);
      } else {
        newSet.add(resourceTypeName);
      }
      return newSet;
    });
  };

  // Filter resource types based on enabled state
  const filteredResourceTypes = useMemo(() => {
    return assessmentResourceTypes.filter((rt) =>
      enabledResourceTypes.has(rt.name)
    );
  }, [assessmentResourceTypes, enabledResourceTypes]);

  if (!assessment) return null;
  return (
    <div className="flex flex-col w-full p-6 space-y-6">
      <div className="flex flex-row gap-6 flex-wrap md:flex-nowrap w-full">
        <div className="card bg-white border rounded-md p-4 space-y-2 w-full md:w-1/2">
          <h2 className="card-title">Overview</h2>
          <div className="flex flex-col gap-1">
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Server className="w-5 h-5" />
              Account: {extractAccountId(assessment.roleArn)}
            </div>
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Calendar className="w-5 h-5" />
              Created:{' '}
              {assessment.createdAt
                ? new Date(assessment.createdAt).toLocaleDateString()
                : 'N/A'}
            </div>
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Earth className="w-5 h-5" />
              {assessment.regions?.join(', ') || 'Global'}
            </div>
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Computer className="w-5 h-5" />
              Workflow:{' '}
              {Array.isArray(assessment.workflows)
                ? assessment.workflows.length
                  ? assessment.workflows.join(', ')
                  : '-'
                : assessment.workflows || '-'}
            </div>
          </div>
        </div>
        <div className="flex gap-6 w-full md:w-1/2">
          {/* Findings Panel */}
          <div className="card bg-white border rounded-lg p-4 w-1/2 flex flex-col">
            <h2 className="card-title text-center">Findings</h2>
            <div className="text-center flex-1 flex flex-col justify-center items-center">
              <div className="text-5xl font-bold text-primary font-light tracking-tighter">
                {assessment.graphData?.findings ?? 0}
              </div>
              <div className="text-sm text-base-content/70 mt-1">
                Total Issues Found
              </div>
            </div>
          </div>

          {/* Completion Panel */}
          <div className="card bg-white border rounded-lg p-4 w-1/2 flex flex-col">
            <h2 className="card-title text-center">Completion</h2>
            <div className="text-center flex-1 flex flex-col justify-center items-center">
              <div className="text-5xl font-bold text-success font-light tracking-tighter">
                {overallCompletion}%
              </div>
              <div className="text-sm text-base-content/70 mt-1">
                Overall Progress
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="card flex-1 bg-white border rounded-lg p-4 min-h-[300px]">
          <div className="flex flex-col h-full">
            <div className="">
              <h2 className="card-title">Pillar Completion</h2>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={pillarCompletionData}>
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey="pillar"
                    tick={{ fontSize: 13 }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <Radar
                    name="Completion %"
                    dataKey="completion"
                    stroke={getThemeColors().primary}
                    fill={getThemeColors().primary}
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-base-300 border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.pillar}</p>
                            <p className="text-sm">
                              Completion: {data.completion}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-[1] flex-col md:flex-row gap-6">
        <div className="card flex-1 bg-white border rounded-lg p-4 min-h-[300px] md:w-1/2 w-full">
          <div className="flex flex-col h-full">
            <div className="">
              <h2 className="card-title">Findings by Region</h2>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    verticalAlign="top"
                    align="center"
                    content={({ payload }) => (
                      <div className="flex flex-row flex-wrap w-full overflow-y-auto gap-x-4">
                        {payload?.map((entry, index) => {
                          const item = assessmentRegions[index];
                          const percentage =
                            totalRegionsCount > 0
                              ? (
                                  ((item?.value || 0) / totalRegionsCount) *
                                  100
                                ).toFixed(1)
                              : '0.0';

                          return (
                            <div
                              key={`legend-${index}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  backgroundColor: entry.color,
                                  borderRadius: 2,
                                }}
                              />
                              <span style={{ fontSize: '12px' }}>
                                {entry.value} ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  <Pie
                    data={assessmentRegions || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assessmentRegions
                      ? assessmentRegions.map((item, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getChartColorByIndex(index)}
                          />
                        ))
                      : []}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card flex-1 bg-white border rounded-lg p-4 min-h-[300px] md:w-1/2 w-full">
          <div className="flex flex-col h-full">
            <div className="">
              <h2 className="card-title">Findings Grouped by Severity</h2>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{ fontSize: '12px' }}
                    content={({ payload }) => (
                      <div className="flex flex-row flex-wrap w-full overflow-y-auto">
                        {payload?.map((entry, index) => {
                          const item = assessmentSeverities[index];
                          const percentage =
                            totalSeveritiesCount > 0
                              ? (
                                  ((item?.value || 0) / totalSeveritiesCount) *
                                  100
                                ).toFixed(1)
                              : '0.0';

                          return (
                            <div
                              key={`legend-${index}`}
                              style={{
                                width: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  backgroundColor: entry.color,
                                  borderRadius: 2,
                                }}
                              />
                              <span style={{ fontSize: '12px' }}>
                                {entry.value} ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  <Pie
                    data={assessmentSeverities}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={60}
                    paddingAngle={5}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assessmentSeverities.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getSeverityColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-[2] card bg-white border rounded-lg p-4 mb-10">
        <h2 className="card-title mb-4">Findings by Resource Type</h2>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={filteredResourceTypes}
              dataKey="value"
              aspectRatio={4 / 3}
              fill={getThemeColors().primary}
              stroke={'#fff'}
            >
              {filteredResourceTypes.map((entry, index) => (
                <Cell key={entry.name} />
              ))}
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-base-300 border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm">Count: {data.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
          {/* Legend for resource types */}
          <div className="mt-4">
            <p className="text-sm text-base-content/50 mb-2">
              Click to toggle resource type visibility
            </p>
            <div className="flex flex-row flex-wrap w-full gap-2">
              {assessmentResourceTypes.map((item, index) => {
                const isEnabled = enabledResourceTypes.has(item.name);
                return (
                  <button
                    key={index}
                    onClick={() => toggleResourceType(item.name)}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer hover:scale-105 ${
                      isEnabled
                        ? 'bg-base-100 border-base-300'
                        : 'bg-base-200 border-base-200 opacity-50'
                    }`}
                    title={`Click to ${isEnabled ? 'hide' : 'show'} ${
                      item.name
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isEnabled ? 'text-base-content' : 'text-base-content/50'
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`text-sm ${
                        isEnabled
                          ? 'text-base-content/70'
                          : 'text-base-content/30'
                      }`}
                    >
                      ({item.value})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentOverview;
