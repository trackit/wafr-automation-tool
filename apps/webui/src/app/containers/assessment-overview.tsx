import { components } from '@shared/api-schema';
import { Calendar, Computer, Earth, Search, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
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

  console.log(assessment);
  console.log(assessmentRegions);
  console.log(assessmentSeverities);
  console.log(assessmentResourceTypes);

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
    <div className="flex flex-col w-full h-full p-6 space-y-6 overflow-none">
      <div className="flex flex-row gap-6">
        <div className="card flex-1 bg-base-200 border rounded-lg p-4 space-y-2">
          <h2 className="card-title">Overview</h2>
          {/* <div className="flex flex-col gap-1">
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
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Search className="w-5 h-5" />
              Findings: {assessment.graphData?.findings ?? 0}
            </div>
          </div> */}
        </div>
      </div>
      <div className="flex flex-row gap-6"></div>
      <div className="flex flex-[1] gap-6">
        <div className="card flex-1 bg-base-200 border rounded-lg p-4">
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
                    outerRadius={90}
                    innerRadius={60}
                    paddingAngle={0}
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
        <div className="card flex-1 bg-base-200 border rounded-lg p-4">
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
                    outerRadius={90}
                    innerRadius={60}
                    paddingAngle={0}
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
      <div className="flex-[2] card bg-base-200 border rounded-lg p-4 min-h-0 space-y-2">
        <h2 className="card-title">Findings by Resource Type</h2>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={filteredResourceTypes}
              dataKey="value"
              aspectRatio={4 / 3}
            >
              {filteredResourceTypes.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color} />
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
