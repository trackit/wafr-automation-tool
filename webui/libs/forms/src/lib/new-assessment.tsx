import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, KeyRound, Pen } from 'lucide-react';

type NewAssessmentProps = {
  onSubmit: (data: { name: string; roleArn?: string }) => void;
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
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      roleArn: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
          <div className="label">
            <span className="label-text-alt text-error text-sm">
              {errors.name?.message}
            </span>
          </div>
        </label>

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
          <div className="label">
            <span className="label-text-alt text-error text-sm">
              {errors.roleArn?.message}
            </span>
          </div>
        </label>
      </div>
      <div role="alert" className="alert alert-info alert-soft mb-4">
        <Info className="w-6" />
        <span>Default role will be used if no role is provided.</span>
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
