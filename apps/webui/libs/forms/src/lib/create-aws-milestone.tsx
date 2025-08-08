import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { awsRegions, Region } from './regions';

type CreateAWSMilestoneProps = {
  onSubmit: (data: { region: Region; name: string }) => void;
  disabled?: boolean;
};

export function CreateAWSMilestone({
  onSubmit,
  disabled = false,
}: CreateAWSMilestoneProps) {
  const formSchema = z.object({
    region: z.enum(awsRegions),
    name: z.string().min(1, 'Name is required'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region: 'us-east-1',
    },
  });

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
      region: data.region,
      name: data.name,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="flex flex-col gap-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Region</legend>
          <select
            defaultValue="Pick a region"
            className="select"
            {...register('region')}
          >
            <option disabled={true}>Pick a region</option>
            {awsRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {errors.region && (
            <p className="fieldset-label text-error">
              {errors.region?.message}
            </p>
          )}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Name</legend>
          <input
            type="text"
            className="input"
            placeholder="Enter milestone name"
            {...register('name')}
          />
          {errors.name && (
            <p className="fieldset-label text-error">{errors.name?.message}</p>
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

export default CreateAWSMilestone;
