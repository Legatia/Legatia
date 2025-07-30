import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useFamily } from '../hooks/useFamily';
import { AddFamilyMemberRequest } from '../types';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const addMemberSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  surname_at_birth: z.string().min(1, 'Surname at birth is required'),
  sex: z.string().min(1, 'Sex is required'),
  birthday: z.string().optional(),
  birth_city: z.string().optional(),
  birth_country: z.string().optional(),
  death_date: z.string().optional(),
  relationship_to_admin: z.string().min(1, 'Relationship to admin is required'),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

export const AddFamilyMemberPage: React.FC = () => {
  const { id: familyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentFamily, loading, error, addFamilyMember, fetchFamily, clearError } = useFamily();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      full_name: '',
      surname_at_birth: '',
      sex: '',
      birthday: '',
      birth_city: '',
      birth_country: '',
      death_date: '',
      relationship_to_admin: '',
    },
  });

  useEffect(() => {
    if (familyId && (!currentFamily || currentFamily.id !== familyId)) {
      fetchFamily(familyId);
    }
  }, [familyId, currentFamily, fetchFamily]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data: AddMemberFormData) => {
    if (!familyId) return;

    try {
      const memberData: AddFamilyMemberRequest = {
        family_id: familyId,
        full_name: data.full_name,
        surname_at_birth: data.surname_at_birth,
        sex: data.sex,
        birthday: data.birthday ? [data.birthday] : [],
        birth_city: data.birth_city ? [data.birth_city] : [],
        birth_country: data.birth_country ? [data.birth_country] : [],
        death_date: data.death_date ? [data.death_date] : [],
        relationship_to_admin: data.relationship_to_admin,
      };

      await addFamilyMember(memberData);
      toast.success('Family member added successfully!');
      navigate(`/family/${familyId}`);
    } catch (err) {
      toast.error('Failed to add family member. Please try again.');
    }
  };

  if (loading && !currentFamily) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading family..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/family/${familyId}`)}
          className="flex items-center mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {currentFamily?.name || 'Family'}
        </Button>
        <h1 className="text-3xl font-bold">Add Family Member</h1>
        <p className="text-muted-foreground">
          Add a new member to {currentFamily?.name || 'this family'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter full name"
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
                placeholder="Enter surname at birth"
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

            {/* Relationship to Admin */}
            <div className="space-y-2">
              <Label htmlFor="relationship_to_admin">Relationship to You *</Label>
              <Input
                id="relationship_to_admin"
                {...register('relationship_to_admin')}
                placeholder="e.g., Father, Mother, Sister, Grandmother, etc."
                className={errors.relationship_to_admin ? 'border-red-500' : ''}
              />
              {errors.relationship_to_admin && (
                <p className="text-sm text-red-500">{errors.relationship_to_admin.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birthday */}
              <div className="space-y-2">
                <Label htmlFor="birthday">Date of Birth</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...register('birthday')}
                />
              </div>

              {/* Death Date */}
              <div className="space-y-2">
                <Label htmlFor="death_date">Date of Death (if applicable)</Label>
                <Input
                  id="death_date"
                  type="date"
                  {...register('death_date')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birth City */}
              <div className="space-y-2">
                <Label htmlFor="birth_city">Birth City</Label>
                <Input
                  id="birth_city"
                  {...register('birth_city')}
                  placeholder="Enter birth city"
                />
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
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex-1"
                size="lg"
              >
                {isSubmitting || loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Add Family Member'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/family/${familyId}`)}
                disabled={isSubmitting || loading}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};