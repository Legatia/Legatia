import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { CreateProfileRequest, UpdateProfileRequest, UserProfile } from '../../types';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  surname_at_birth: z.string().min(1, 'Surname at birth is required'),
  sex: z.string().min(1, 'Sex is required'),
  birthday: z.string().optional(),
  birth_city: z.string().optional(),
  birth_country: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: UserProfile | null;
  onSubmit: (data: CreateProfileRequest | UpdateProfileRequest) => Promise<void>;
  loading?: boolean;
  title: string;
  description: string;
  submitText: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  title,
  description,
  submitText,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      surname_at_birth: initialData?.surname_at_birth || '',
      sex: initialData?.sex || '',
      birthday: initialData?.birthday || '',
      birth_city: initialData?.birth_city || '',
      birth_country: initialData?.birth_country || '',
    },
  });

  const onFormSubmit = async (data: ProfileFormData) => {
    if (initialData) {
      // Update profile - convert to UpdateProfileRequest format
      const updateData: UpdateProfileRequest = {
        full_name: data.full_name !== initialData.full_name ? [data.full_name] : [],
        surname_at_birth: data.surname_at_birth !== initialData.surname_at_birth ? [data.surname_at_birth] : [],
        sex: data.sex !== initialData.sex ? [data.sex] : [],
        birthday: data.birthday !== initialData.birthday ? [data.birthday || ''] : [],
        birth_city: data.birth_city !== initialData.birth_city ? [data.birth_city || ''] : [],
        birth_country: data.birth_country !== initialData.birth_country ? [data.birth_country || ''] : [],
      };
      await onSubmit(updateData);
    } else {
      // Create profile
      const createData: CreateProfileRequest = {
        full_name: data.full_name,
        surname_at_birth: data.surname_at_birth,
        sex: data.sex,
        birthday: data.birthday || '',
        birth_city: data.birth_city || '',
        birth_country: data.birth_country || '',
      };
      await onSubmit(createData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Enter your full name"
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          {/* Surname at Birth */}
          <div className="space-y-2">
            <Label htmlFor="surname_at_birth">Surname at Birth *</Label>
            <Input
              id="surname_at_birth"
              {...register('surname_at_birth')}
              placeholder="Enter your surname at birth"
              className={errors.surname_at_birth ? 'border-red-500' : ''}
            />
            {errors.surname_at_birth && (
              <p className="text-sm text-red-500">{errors.surname_at_birth.message}</p>
            )}
          </div>

          {/* Sex */}
          <div className="space-y-2">
            <Label htmlFor="sex">Sex *</Label>
            <select
              id="sex"
              {...register('sex')}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.sex ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.sex && (
              <p className="text-sm text-red-500">{errors.sex.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Birthday */}
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                {...register('birthday')}
              />
            </div>

            {/* Birth City */}
            <div className="space-y-2">
              <Label htmlFor="birth_city">Birth City</Label>
              <Input
                id="birth_city"
                {...register('birth_city')}
                placeholder="Enter birth city"
              />
            </div>
          </div>

          {/* Birth Country */}
          <div className="space-y-2">
            <Label htmlFor="birth_country">Birth Country</Label>
            <Input
              id="birth_country"
              {...register('birth_country')}
              placeholder="Enter birth country"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full"
            size="lg"
          >
            {isSubmitting || loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              submitText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};