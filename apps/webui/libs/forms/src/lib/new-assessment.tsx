import { zodResolver } from '@hookform/resolvers/zod';
import { Computer, Earth, KeyRound, Pen, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { TagsInput } from '@webui/ui';

import { awsRegions, type Region } from './regions';
import WorkflowHintDialog from './workflow-hint-dialog';

type NewAssessmentProps = {
  onSubmit: (data: {
    name: string;
    roleArn: string;
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
        'Invalid AWS role ARN format',
      ),
    regions: z.array(z.enum(awsRegions)).optional(),
    workflows: z.array(z.string()).optional(),
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
      workflows: [],
    },
  });

  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setValue('regions', selectedRegions);
  }, [selectedRegions, setValue]);

  useEffect(() => {
    setValue('workflows', Array.from(selectedWorkflows));
  }, [selectedWorkflows, setValue]);

  const removeWorkflow = (workflow: string) => {
    setSelectedWorkflows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(workflow);
      return newSet;
    });
  };

  const toggleRegion = (region: (typeof awsRegions)[number]) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    );
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
      name: data.name,
      roleArn: data.roleArn,
      regions: data.regions,
      workflows: data.workflows,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="flex flex-col gap-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Name*</legend>
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
          <legend className="fieldset-legend">Role ARN*</legend>
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
          <legend className="fieldset-legend">
            Workflows
            <WorkflowHintDialog />
          </legend>
          <div
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.workflows ? 'input-error' : ''
            }`}
          >
            <Computer className="w-4 min-w-4 opacity-80" />
            <TagsInput
              tags={selectedWorkflows}
              setTags={setSelectedWorkflows}
              inputProps={{ placeholder: 'Enter a workflow name' }}
            />
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            {Array.from(selectedWorkflows).map((workflow) => (
              <span
                key={workflow}
                className="badge badge-sm badge-primary flex items-center"
              >
                {workflow}
                <button
                  type="button"
                  onClick={() => removeWorkflow(workflow)}
                  className="ml-1 text-base-content hover:text-error cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          {errors.workflows && (
            <p className="fieldset-label text-error">
              {errors.workflows?.message}
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
