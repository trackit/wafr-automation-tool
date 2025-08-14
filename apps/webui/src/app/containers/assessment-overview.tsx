import { components } from '@webui/types';
import { Calendar, Computer, Earth, Search, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

function cleanTitle(raw: string): string {
  const noPrefix = raw.replace(/^aws/i, '');
  const withSpaces = noPrefix
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();

  return withSpaces;
}

function formatRegion(raw: string): string {
  return raw
    .split('-')
    .map((part) =>
      // Si c’est un code court (ex. "us", "eu"), on met tout en MAJ
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
  assessment: components['schemas']['Assessment'] | null;
}) {
  const [assessmentRegions, setAssessmentRegions] = useState<
    Array<[string, never]>
  >([]);
  const [totalRegionsCount, setTotalRegionsCount] = useState<number>(0);
  const [assessmentSeverities, setAssessmentSeverities] = useState<
    Array<[string, never]>
  >([]);
  const [totalSeveritiesCount, setTotalSeveritiesCount] = useState<number>(0);
  const [assessmentResourceTypes, setAssessmentResourceTypes] = useState<
    Array<[string, never]>
  >([]);

  useMemo(() => {
    if (assessment?.graph_datas?.regions) {
      setAssessmentRegions(
        Object.entries(assessment.graph_datas.regions).sort(
          (a, b) => b[1] - a[1]
        )
      );
    }
    if (assessment?.graph_datas?.severities) {
      setAssessmentSeverities(
        Object.entries(assessment.graph_datas.severities).sort(
          (a, b) => SEVERITIES.indexOf(a[0]) - SEVERITIES.indexOf(b[0])
        )
      );
    }
    if (assessment?.graph_datas?.resource_types) {
      setAssessmentResourceTypes(
        Object.entries(assessment.graph_datas.resource_types).sort(
          (a, b) => b[1] - a[1]
        )
      );
    }
  }, [assessment?.graph_datas]);

  useMemo(() => {
    setTotalRegionsCount(
      assessmentRegions.reduce((sum, [, count]) => sum + count, 0)
    );
  }, [assessmentRegions]);

  useMemo(() => {
    setTotalSeveritiesCount(
      assessmentSeverities.reduce((sum, [, count]) => sum + count, 0)
    );
  }, [assessmentSeverities]);

  if (!assessment) return null;
  return (
    <div className="flex flex-col w-full h-full p-6 space-y-6 overflow-none">
      <div className="flex flex-[1] gap-6">
        <div className="card flex-1 bg-base-200 border rounded-lg p-4 space-y-2 max-w-[25%]">
          <h2 className="card-title">Overview</h2>
          <div className="flex flex-col gap-1">
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Server className="w-5 h-5" />
              Account: {extractAccountId(assessment.role_arn)}
            </div>
            <div className="text-md text-base-content flex flex-row gap-2 items-center">
              <Calendar className="w-5 h-5" />
              Created:{' '}
              {assessment.created_at
                ? new Date(assessment.created_at).toLocaleDateString()
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
              Findings: {assessment.graph_datas?.findings ?? 0}
            </div>
          </div>
        </div>
        <div className="card flex-1 bg-base-200 border rounded-lg p-4">
          <div className="flex flex-row space-x-2 h-full">
            <div className="flex-1">
              <h2 className="card-title">Regions</h2>
              <ul className="list-disc flex-1 overflow-y-auto max-h-48 space-y-1">
                {assessmentRegions.map(([name, count], i) => {
                  const percentage = (count / totalRegionsCount) * 1000;
                  const roundedPercentage =
                    (percentage - Math.floor(percentage) >= 0.5
                      ? Math.ceil(percentage)
                      : Math.floor(percentage)) / 10;
                  return (
                    <li key={i} className="flex justify-between pr-2">
                      <span>
                        {formatRegion(name)}{' '}
                        <span className="text-sm text-gray-500">({count})</span>
                      </span>
                      <span className="text-sm">
                        {roundedPercentage.toFixed(1)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-none w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assessmentRegions.map((entry) => ({
                      name: entry[0],
                      value: entry[1],
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assessmentRegions.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={stringToColor(entry[0])}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card flex-1 bg-base-200 border rounded-lg p-4">
          <div className="flex flex-row space-x-2 h-full">
            <div className="flex-1">
              <h2 className="card-title">Severities</h2>
              <ul className="list-disc flex-1 overflow-y-auto max-h-48 space-y-1">
                {assessmentSeverities.map(([name, count], i) => {
                  const percentage = (count / totalSeveritiesCount) * 1000;
                  const roundedPercentage =
                    (percentage - Math.floor(percentage) >= 0.5
                      ? Math.ceil(percentage)
                      : Math.floor(percentage)) / 10;
                  return (
                    <li key={i} className="flex justify-between pr-2">
                      <span>
                        {name}{' '}
                        <span className="text-sm text-gray-500">({count})</span>
                      </span>
                      <span className="text-sm">
                        {roundedPercentage.toFixed(1)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-none w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assessmentSeverities.map((entry) => ({
                      name: entry[0],
                      value: entry[1],
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assessmentSeverities.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={stringToColor(entry[0])}
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
        <h2 className="card-title">Resources Types</h2>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
          {assessmentResourceTypes.map(([key, count], idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-base-200 border rounded-lg p-3"
            >
              <span className="font-medium">{cleanTitle(key)}</span>
              <span className="badge badge-outline">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AssessmentOverview;
