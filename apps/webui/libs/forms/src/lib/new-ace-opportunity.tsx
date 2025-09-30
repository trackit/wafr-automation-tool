import { CountryCode, Industry } from '@aws-sdk/client-partnercentral-selling';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const regionNames =
  typeof Intl !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;
const countries = Object.values(CountryCode).map((code) => ({
  code,
  name: regionNames?.of(code) ?? code,
}));
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formSchema = z.object({
  companyName: z.string().min(1).max(120),
  duns: z.string().regex(/^[0-9]{9}$/, 'DUNS must be 9 digits'),
  industry: z
    .string()
    .pipe(
      z.nativeEnum(Industry, {
        errorMap: () => ({ message: 'Select an industry' }),
      })
    )
    .or(z.undefined())
    .refine((val) => val !== undefined, {
      message: 'Select an industry',
    }),
  city: z.string().max(255).optional().or(z.literal('')),
  companyWebsiteUrl: z.string().min(4).max(255).url(),
  monthlyRecurringRevenue: z
    .string()
    .regex(/^(0|([1-9][0-9]{0,30}))(\.[0-9]{0,2})?$/, 'Invalid amount format'),
  customerType: z.enum(['CUSTOMER', 'INTERNAL_WORKLOAD']),
  targetCloseDate: z
    .string()
    .regex(
      /^[1-9][0-9]{3}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,
      'Date must be YYYY-MM-DD'
    )
    .refine(
      (val) => {
        const d = new Date(val + 'T00:00:00');
        return !isNaN(d.getTime()) && d >= todayStart();
      },
      { message: 'Target close date cannot be in the past' }
    ),
  country: z
    .string()
    .pipe(
      z.nativeEnum(CountryCode, {
        errorMap: () => ({ message: 'Select a country' }),
      })
    )
    .or(z.undefined())
    .refine((val) => val !== undefined, {
      message: 'Select a country',
    }),
  postalCode: z.string().max(20),
  streetAddress: z.string().max(255).optional().or(z.literal('')),
});

type NewACEOpportunityProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  disabled?: boolean;
};

export function NewAceOpportunity({
  onSubmit,
  disabled = false,
}: NewACEOpportunityProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      duns: '',
      industry: undefined,
      city: '',
      companyWebsiteUrl: '',
      monthlyRecurringRevenue: '1000',
      customerType: 'CUSTOMER',
      targetCloseDate: '',
      country: undefined,
      postalCode: '',
      streetAddress: '',
    },
  });

  function normalize(s = '') {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  const countryValue = watch('country');
  const [visibleCountry, setVisibleCountry] = useState<string>('');
  useEffect(() => {
    if (!countryValue) {
      setVisibleCountry('');
      return;
    }

    setVisibleCountry(
      regionNames?.of(countryValue as string) ?? countryValue ?? ''
    );
  }, [countryValue]);

  const handleCountryBlur = (text: string) => {
    const v = (text ?? '').trim();
    if (!v) {
      setValue('country', undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setVisibleCountry('');
      return;
    }
    let match =
      countries.find(
        (c) =>
          normalize(c.name) === normalize(v) ||
          c.code.toLowerCase() === v.toLowerCase() ||
          normalize(`${c.name} (${c.code})`) === normalize(v)
      ) ?? null;
    if (!match) {
      match =
        countries.find((c) => normalize(c.name).includes(normalize(v))) ?? null;
    }
    if (match) {
      setValue('country', match.code, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setVisibleCountry(regionNames?.of(match.code) ?? match.code);
    } else {
      setValue('country', undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setVisibleCountry(v);
    }
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="flex flex-col gap-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Company Name*</legend>
          <div
            className={`input input-bordered flex items-center gap-2 w-full ${
              errors.companyName ? 'input-error' : ''
            }`}
          >
            <Pen className="w-4 opacity-80" />
            <input
              type="text"
              className="grow"
              placeholder="Customer company name"
              {...register('companyName')}
            />
          </div>
          {errors.companyName && (
            <p className="fieldset-label text-error">
              {errors.companyName.message}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">DUNS*</legend>
            <input
              type="text"
              className={`input input-bordered w-full ${
                errors.duns ? 'input-error' : ''
              }`}
              placeholder="123456789"
              {...register('duns')}
            />
            {errors.duns && (
              <p className="fieldset-label text-error">{errors.duns.message}</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Industry*</legend>
            <select
              className={`select w-full ${
                errors.industry ? 'select-error' : ''
              }`}
              {...register('industry')}
              defaultValue=""
            >
              <option value="">Select an industry</option>
              {Object.values(Industry).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="fieldset-label text-error">
                {errors.industry.message}
              </p>
            )}
          </fieldset>
        </div>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Company Website*</legend>
          <input
            type="url"
            className={`input input-bordered w-full ${
              errors.companyWebsiteUrl ? 'input-error' : ''
            }`}
            placeholder="https://example.com"
            {...register('companyWebsiteUrl')}
          />
          {errors.companyWebsiteUrl && (
            <p className="fieldset-label text-error">
              {errors.companyWebsiteUrl.message}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Country*</legend>

            <input
              list="country-list"
              className={`input w-full ${errors.country ? 'input-error' : ''}`}
              placeholder="Type country name or select..."
              value={visibleCountry}
              onChange={(e) => setVisibleCountry(e.target.value)}
              onBlur={(e) => handleCountryBlur(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />

            <datalist id="country-list">
              {countries.map((c) => (
                <option key={c.code} value={`${c.name}`} />
              ))}
            </datalist>
            <input type="hidden" {...register('country')} />

            {errors.country && (
              <p className="fieldset-label text-error">
                {errors.country.message}
              </p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Postal Code*</legend>
            <input
              type="text"
              className={`input input-bordered w-full ${
                errors.postalCode ? 'input-error' : ''
              }`}
              {...register('postalCode')}
            />
            {errors.postalCode && (
              <p className="fieldset-label text-error">
                {errors.postalCode.message}
              </p>
            )}
          </fieldset>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">City</legend>
            <input
              type="text"
              className={`input input-bordered w-full ${
                errors.city ? 'input-error' : ''
              }`}
              {...register('city')}
            />
            {errors.city && (
              <p className="fieldset-label text-error">{errors.city.message}</p>
            )}
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Street Address</legend>
            <input
              type="text"
              className={`input input-bordered w-full ${
                errors.streetAddress ? 'input-error' : ''
              }`}
              {...register('streetAddress')}
            />
            {errors.streetAddress && (
              <p className="fieldset-label text-error">
                {errors.streetAddress.message}
              </p>
            )}
          </fieldset>
        </div>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Target Close Date*</legend>
          <input
            type="date"
            className={`input input-bordered w-full ${
              errors.targetCloseDate ? 'input-error' : ''
            }`}
            {...register('targetCloseDate')}
          />
          {errors.targetCloseDate && (
            <p className="fieldset-label text-error">
              {errors.targetCloseDate.message}
            </p>
          )}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">
            Monthly Recurring Revenue (USD)*
          </legend>
          <div
            className={`input input-bordered w-full flex items-center ${
              errors.monthlyRecurringRevenue ? 'input-error' : ''
            }`}
          >
            <span className="px-2">$</span>
            <input
              type="text"
              className="grow"
              {...register('monthlyRecurringRevenue')}
            />
          </div>
          {errors.monthlyRecurringRevenue && (
            <p className="fieldset-label text-error">
              {errors.monthlyRecurringRevenue.message}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Customer Type*</legend>
          <div className="flex gap-4">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="CUSTOMER"
                {...register('customerType')}
                defaultChecked
              />
              <span className="ml-2">Customer</span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                value="INTERNAL_WORKLOAD"
                {...register('customerType')}
              />
              <span className="ml-2">Internal workload</span>
            </label>
          </div>
          {errors.customerType && (
            <p className="fieldset-label text-error">
              {errors.customerType.message}
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

export default NewAceOpportunity;
