import { zodResolver } from '@hookform/resolvers/zod';
import { Info, KeyRound, Pen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';



const awsRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "af-south-1",
  "ap-east-1",
  "ap-south-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "eu-south-1",
  "me-south-1",
  "sa-east-1"
] as const;
type Region = (typeof awsRegions)[number];
type NewAssessmentProps = {
  onSubmit: (data: { name: string; roleArn?: string, regions: Region[]; workflow?: string }) => void;
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
    workflow: z.string().optional().or(z.literal('')),
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
      workflow: '',
    },
  });

  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);

  useEffect(() => {
    setValue('regions', selectedRegions);
  }, [selectedRegions, setValue]);

  const toggleRegion = (region: typeof awsRegions[number]) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} role="form">
      <div className="flex flex-col gap-1">
        <label className="form-control w-full">
          <label
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.name ? 'input-error' : ''
            }`}
          >
            <Pen className="w-6" />
            <span className="text-base-content/70">Assessment Name</span>
            <input
              type="text"
              className="grow "
              placeholder=""
              {...register('name')}
            />
          </label>
          {errors.name && (
            <div className="label">
              <span className="label-text-alt text-error text-sm">
                {errors.name?.message}
              </span>
            </div>
          )}
        </label>
        <div role="alert" className="mb-4"/>

        <label className="form-control w-full">
          <label
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.roleArn ? 'input-error' : ''
            }`}
          >
            <KeyRound className="w-6" />
            <span className="text-base-content/70">Role ARN</span>
            <input
              type="text"
              className="grow "
              placeholder=""
              {...register('roleArn')}
            />
          </label>
          {errors.roleArn && (
            <div className="label">
              <span className="label-text-alt text-error text-sm">
                {errors.roleArn?.message}
              </span>
            </div>
          )}
        </label>
        <div role="alert" className="alert alert-info alert-soft mb-4">
          <Info className="w-6" />
          <span>Default role will be used if no role is provided.</span>
        </div>

        <div className="form-control w-full">
          <input type="hidden" {...register("regions")} />
          <div className="dropdown">
            <label tabIndex={0} className="input input-bordered flex items-center gap-2 w-full">
              <KeyRound className="w-6" />
              <span className="text-base-content/70">
                {selectedRegions.length > 0
                  ? `Regions (${selectedRegions.length})`
                  : "Regions (Global)"}
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
            <div className="label">
              <span className="label-text-alt text-error text-sm">
                {errors.regions.message}
              </span>
            </div>
          )}
        </div>
        <div role="alert" className="alert alert-info alert-soft mb-4">
          <Info className="w-6" />
          <span>All regions will be used if no region is provided.</span>
        </div>

        <label className="form-control w-full">
          <label
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.workflow ? 'input-error' : ''
            }`}
          >
            <KeyRound className="w-6" />
            <span className="text-base-content/70">Workflow</span>
            <input
              type="text"
              className="grow "
              placeholder=""
              {...register('workflow')}
            />
          </label>
          {errors.workflow && (
            <div className="label">
              <span className="label-text-alt text-error text-sm">
                {errors.workflow?.message}
              </span>
            </div>
          )}
        </label>
        <div role="alert" className="alert alert-info alert-soft mb-4">
          <Info className="w-6" />
          <span>All the accounts will be process if no workflow is provided.</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          Submit
        </button>
      </div>
    </form>
  );
}

export default NewAssessment;
