import { components } from '@shared/api-schema';
import { Calendar, Computer, Earth, Search, Server } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  getChartColorByIndex,
  getThemeColors,
  darkenColor,
  lightenColor,
} from '../../lib/theme-colors';

const extractAccountId = (roleArn: string | undefined) => {
  if (!roleArn) return '';
  const match = roleArn.match(/arn:aws:iam::(\d+):/);
  return match ? match[1] : '';
};

const RADIAN = Math.PI / 180;

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

function AssessmentOverview({
  assessment,
}: {
  assessment: components['schemas']['AssessmentContent'] | null;
}) {
  const [chartType, setChartType] = useState<'bar' | 'treemap'>('bar');
  const [enabledResourceTypes, setEnabledResourceTypes] = useState<Set<string>>(
    new Set()
  );

  // Consolidated useMemo for all data processing
  const processedData = useMemo(() => {
    if (!assessment?.graphData) return null;

    const { graphData } = assessment;

    // Process regions data
    const regions = graphData.regions
      ? Object.entries(graphData.regions)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map(([name, value]) => ({ name, value: value as number }))
      : [];

    // Process severities data
    const severities = graphData.severities
      ? Object.entries(graphData.severities)
          .sort((a, b) => SEVERITIES.indexOf(a[0]) - SEVERITIES.indexOf(b[0]))
          .map(([name, value]) => ({ name, value: value as number }))
      : [];

    // Process resource types data
    const resourceTypes = graphData.resourceTypes
      ? Object.entries(graphData.resourceTypes)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map(([name, value], index) => ({
            name,
            value: value as number,
            color: getChartColorByIndex(index),
          }))
      : [];

    return {
      regions,
      severities,
      resourceTypes,
      totalRegionsCount: regions.reduce((sum, item) => sum + item.value, 0),
      totalSeveritiesCount: severities.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    };
  }, [assessment?.graphData]);

  // Extract processed data
  const assessmentRegions = useMemo(
    () => processedData?.regions || [],
    [processedData?.regions]
  );
  const assessmentSeverities = useMemo(
    () => processedData?.severities || [],
    [processedData?.severities]
  );
  const assessmentResourceTypes = useMemo(
    () => processedData?.resourceTypes || [],
    [processedData?.resourceTypes]
  );
  const totalRegionsCount = useMemo(
    () => processedData?.totalRegionsCount || 0,
    [processedData?.totalRegionsCount]
  );
  const totalSeveritiesCount = useMemo(
    () => processedData?.totalSeveritiesCount || 0,
    [processedData?.totalSeveritiesCount]
  );

  // Initialize enabled resource types when resource types change
  useMemo(() => {
    if (assessmentResourceTypes.length > 0) {
      setEnabledResourceTypes(
        new Set(assessmentResourceTypes.map((rt) => rt.name))
      );
    }
  }, [assessmentResourceTypes]);

  // Get filtered resource types for charts
  const filteredResourceTypes = useMemo(() => {
    return assessmentResourceTypes.filter((rt) =>
      enabledResourceTypes.has(rt.name)
    );
  }, [assessmentResourceTypes, enabledResourceTypes]);

  // Calculate pillar completion percentages
  const pillarCompletionData = useMemo(() => {
    if (!assessment?.pillars) return [];

    return assessment.pillars
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
                  bestPractice.risk !== 'High' || bestPractice.checked === true
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
  const getSeverityColor = useMemo(() => {
    const colors = getThemeColors();
    return (severity: string): string => {
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
  }, []);

  // Toggle resource type visibility
  const toggleResourceType = useCallback((resourceTypeName: string) => {
    setEnabledResourceTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resourceTypeName)) {
        newSet.delete(resourceTypeName);
      } else {
        newSet.add(resourceTypeName);
      }
      return newSet;
    });
  }, []);

  if (!assessment) return null;
  return (
    <div className="flex flex-col w-full py-6 space-y-6">
      <div className="flex flex-row gap-6 flex-wrap md:flex-nowrap w-full">
        <div className="card bg-white border rounded-md p-4 space-y-2 w-full md:w-1/2">
          <h2 className="card-title">Overview</h2>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-base-content flex flex-row gap-2 items-center">
              <Server className="w-5 h-5" />
              Account: {extractAccountId(assessment.roleArn)}
            </div>
            <div className="text-sm text-base-content flex flex-row gap-2 items-center">
              <Calendar className="w-5 h-5" />
              Created:{' '}
              {assessment.createdAt
                ? new Date(assessment.createdAt).toLocaleDateString()
                : 'N/A'}
            </div>
            <div className="text-sm text-base-content flex flex-row gap-2 items-center">
              <Earth className="w-5 h-5" />
              {assessment.regions?.join(', ') || 'Global'}
            </div>
            <div className="text-sm text-base-content flex flex-row gap-2 items-center">
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

      <div className="flex flex-[1] flex-col md:flex-row gap-6 lg:flex-nowrap flex-wrap">
        <div className="flex gap-6 w-full lg:w-1/2">
          <div className="card bg-white border rounded-lg p-4 min-h-[300px] w-1/2 w-full">
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
          <div className="card  bg-white border rounded-lg p-4 min-h-[300px] w-1/2 w-full">
            <div className="flex flex-col h-full">
              <div className="">
                <h2 className="card-title">Findings by Severity</h2>
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
                                    ((item?.value || 0) /
                                      totalSeveritiesCount) *
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
        <div className="card bg-white border rounded-lg p-4 min-h-[300px] lg:w-1/2 w-full">
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

      <div className="flex-[2] card bg-white border rounded-lg p-4 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Findings by Resource Type</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">Bar Chart</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-xs"
                checked={chartType === 'treemap'}
                onChange={() =>
                  setChartType((prev) => (prev === 'bar' ? 'treemap' : 'bar'))
                }
              />
            </label>
            <span className="text-sm text-base-content/70">Treemap</span>
          </div>
        </div>

        {/* Bar Chart */}
        {chartType === 'bar' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={filteredResourceTypes}
                margin={{ top: 0, right: 0, left: 0, bottom: 55 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
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
                <Bar
                  dataKey="value"
                  fill={getThemeColors().primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'treemap' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <Treemap
                data={filteredResourceTypes}
                dataKey="value"
                aspectRatio={4 / 3}
                fill={lightenColor(getThemeColors().primary, 20)}
                stroke={'white'}
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
          </div>
        )}
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
                  title={`Click to ${isEnabled ? 'hide' : 'show'} ${item.name}`}
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
  );
}

export default AssessmentOverview;
