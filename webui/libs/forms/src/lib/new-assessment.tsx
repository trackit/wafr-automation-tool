import { zodResolver } from '@hookform/resolvers/zod';
import { Computer, Earth, KeyRound, Pen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const awsRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
  'me-south-1',
  'sa-east-1',
] as const;
type Region = (typeof awsRegions)[number];
type NewAssessmentProps = {
  onSubmit: (data: {
    name: string;
    roleArn?: string;
    regions?: Region[];
    workflows?: string[];
  }) => void;
  disabled?: boolean;
};

export function NewAssessment({
  onSubmit,
  disabled = false,
}: NewAssessmentProps) {
  const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    roleArn: z
      .string()
      .regex(
        /^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9_+=,.@-]+$/,
        'Invalid AWS role ARN format'
      )
      .optional()
      .or(z.literal('')),
    regions: z.array(z.enum(awsRegions)).optional(),
    workflows: z.string().optional().or(z.literal('')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      roleArn: '',
      regions: [],
      workflows: '',
    },
  });

  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);

  useEffect(() => {
    setValue('regions', selectedRegions);
  }, [selectedRegions, setValue]);

  const toggleRegion = (region: (typeof awsRegions)[number]) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    const workflows = data.workflows
      ? data.workflows
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean)
      : undefined;

    onSubmit({
      name: data.name,
      roleArn: data.roleArn || undefined,
      regions: data.regions,
      workflows,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="flex flex-col gap-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Name</legend>
          <div
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.name ? 'input-error' : ''
            }`}
          >
            <Pen className="w-4 opacity-80" />
            <input
              type="text"
              className="grow"
              placeholder="Enter assessment name"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="fieldset-label text-error">{errors.name?.message}</p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Role ARN</legend>
          <div
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.roleArn ? 'input-error' : ''
            }`}
          >
            <KeyRound className="w-4 opacity-80" />
            <input
              type="text"
              className="grow"
              placeholder="Enter AWS role ARN"
              {...register('roleArn')}
            />
          </div>
          {errors.roleArn && (
            <p className="fieldset-label text-error">
              {errors.roleArn?.message}
            </p>
          )}
          {!errors.roleArn && (
            <p className="fieldset-label">
              If no role is provided, the default role will be used.
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Regions</legend>
          <input type="hidden" {...register('regions')} />
          <div className="dropdown">
            <label
              tabIndex={0}
              className="input input-bordered flex items-center gap-2 w-full cursor-pointer"
            >
              <Earth className="w-4 opacity-80" />
              <span className="text-base-content/70">
                {selectedRegions.length > 0
                  ? `Selected Regions (${selectedRegions.length})`
                  : 'Select Regions'}
              </span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box mt-1 grid grid-flow-col grid-rows-5 gap-2"
            >
              {awsRegions.map((region) => (
                <li key={region} className="m-0">
                  <label className="label cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedRegions.includes(region)}
                      onChange={() => toggleRegion(region)}
                    />
                    <span>{region}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {errors.regions && (
            <p className="fieldset-label text-error">
              {errors.regions.message}
            </p>
          )}
          {!errors.regions && (
            <p className="fieldset-label">
              If no regions are provided, all regions will be scanned.
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Workflow</legend>
          <div
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.workflows ? 'input-error' : ''
            }`}
          >
            <Computer className="w-4 opacity-80" />
            <input
              type="text"
              className="grow"
              placeholder="Enter workflow"
              {...register('workflows')}
            />
          </div>
          {errors.workflows && (
            <p className="fieldset-label text-error">
              {errors.workflows?.message}
            </p>
          )}
          {!errors.workflows && (
            <p className="fieldset-label">
              You can enter multiple workflows separated by commas.
            </p>
          )}
        </fieldset>
      </div>

      <div className="flex justify-end mt-4">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          Submit
        </button>
      </div>
    </form>
  );
}

export default NewAssessment;
