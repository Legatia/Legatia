import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useFamily } from '../hooks/useFamily';
import { useAuth } from '../hooks/useAuth';
import { UpdateFamilyMemberRequest } from '../types';
import { ArrowLeft, User, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const editMemberSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  surname_at_birth: z.string().min(1, 'Surname at birth is required'),
  sex: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'Sex is required',
  }),
  birthday: z.string().optional(),
  birth_city: z.string().optional(),
  birth_country: z.string().optional(),
  death_date: z.string().optional(),
  relationship_to_admin: z.string().min(1, 'Relationship to admin is required'),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

export const EditFamilyMemberPage: React.FC = () => {
  const { id: familyId, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { user, principal } = useAuth();
  const { currentFamily, loading, error, fetchFamily, updateFamilyMember, clearError } = useFamily();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
  });

  useEffect(() => {
    if (familyId && (!currentFamily || currentFamily.id !== familyId)) {
      fetchFamily(familyId);
    }
  }, [familyId, currentFamily, fetchFamily]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const currentMember = currentFamily?.members?.find(m => m.id === memberId);
  const isAdmin = principal && currentFamily?.admin.toString() === principal.toString();
  const isGhostProfile = !currentMember?.profile_principal || currentMember.profile_principal.length === 0;

  // Populate form when member data is loaded
  useEffect(() => {
    if (currentMember) {
      reset({
        full_name: currentMember.full_name,
        surname_at_birth: currentMember.surname_at_birth,
        sex: currentMember.sex as 'Male' | 'Female' | 'Other',
        birthday: currentMember.birthday && currentMember.birthday.length > 0 ? currentMember.birthday[0] : '',
        birth_city: currentMember.birth_city && currentMember.birth_city.length > 0 ? currentMember.birth_city[0] : '',
        birth_country: currentMember.birth_country && currentMember.birth_country.length > 0 ? currentMember.birth_country[0] : '',
        death_date: currentMember.death_date && currentMember.death_date.length > 0 ? currentMember.death_date[0] : '',
        relationship_to_admin: currentMember.relationship_to_admin,
      });
    }
  }, [currentMember, reset]);

  const onSubmit = async (data: EditMemberFormData) => {
    if (!familyId || !memberId || !currentMember) return;

    try {
      // Convert form data to the expected format (using optional arrays for changes only)
      const updateData: UpdateFamilyMemberRequest = {
        family_id: familyId,
        member_id: memberId,
        full_name: data.full_name !== currentMember.full_name ? [data.full_name] : [],
        surname_at_birth: data.surname_at_birth !== currentMember.surname_at_birth ? [data.surname_at_birth] : [],
        sex: data.sex !== currentMember.sex ? [data.sex] : [],
        birthday: data.birthday !== (currentMember.birthday?.[0] || '') ? 
          (data.birthday ? [data.birthday] : []) : [],
        birth_city: data.birth_city !== (currentMember.birth_city?.[0] || '') ? 
          (data.birth_city ? [data.birth_city] : []) : [],
        birth_country: data.birth_country !== (currentMember.birth_country?.[0] || '') ? 
          (data.birth_country ? [data.birth_country] : []) : [],
        death_date: data.death_date !== (currentMember.death_date?.[0] || '') ? 
          (data.death_date ? [data.death_date] : []) : [],
        relationship_to_admin: data.relationship_to_admin !== currentMember.relationship_to_admin ? 
          [data.relationship_to_admin] : [],
      };

      await updateFamilyMember(updateData);
      toast.success('Family member updated successfully!');
      navigate(`/family/${familyId}`);
    } catch (err) {
      toast.error('Failed to update family member. Please try again.');
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && !currentFamily) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading family..." />
      </div>
    );
  }

  if (!currentMember && !loading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Member Not Found</h2>
        <p className="text-gray-600 mb-6">
          The family member you're trying to edit doesn't exist.
        </p>
        <Button onClick={() => navigate(`/family/${familyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Button>
      </div>
    );
  }

  if (!currentMember || !currentFamily) return null;

  // Check permissions - only admin can edit, and only ghost profiles should be editable
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          Only family administrators can edit member profiles.
        </p>
        <Button onClick={() => navigate(`/family/${familyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Button>
      </div>
    );
  }

  if (!isGhostProfile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Linked Profile</h2>
        <p className="text-gray-600 mb-6">
          This family member is linked to a user account and cannot be edited. 
          Only ghost profiles (unlinked members) can be edited by family administrators.
        </p>
        <Button onClick={() => navigate(`/family/${familyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Button>
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
          Back to {currentFamily.name}
        </Button>
        <h1 className="text-3xl font-bold">Edit Family Member</h1>
        <p className="text-muted-foreground">
          Update information for {currentMember.full_name}
        </p>
      </div>

      {/* Member Info */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(currentMember.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-medium">{currentMember.full_name}</h3>
              <p className="text-muted-foreground">{currentMember.relationship_to_admin}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Ghost Profile
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Editable by Admin
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Member Information</span>
          </CardTitle>
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
              <Label htmlFor="relationship_to_admin">Relationship to Admin *</Label>
              <Input
                id="relationship_to_admin"
                {...register('relationship_to_admin')}
                placeholder="e.g., Father, Mother, Spouse, Child"
                className={errors.relationship_to_admin ? 'border-red-500' : ''}
              />
              {errors.relationship_to_admin && (
                <p className="text-sm text-red-500">{errors.relationship_to_admin.message}</p>
              )}
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                {...register('birthday')}
                className={errors.birthday ? 'border-red-500' : ''}
              />
              {errors.birthday && (
                <p className="text-sm text-red-500">{errors.birthday.message}</p>
              )}
            </div>

            {/* Birth City */}
            <div className="space-y-2">
              <Label htmlFor="birth_city">Birth City</Label>
              <Input
                id="birth_city"
                {...register('birth_city')}
                placeholder="Enter birth city"
                className={errors.birth_city ? 'border-red-500' : ''}
              />
              {errors.birth_city && (
                <p className="text-sm text-red-500">{errors.birth_city.message}</p>
              )}
            </div>

            {/* Birth Country */}
            <div className="space-y-2">
              <Label htmlFor="birth_country">Birth Country</Label>
              <Input
                id="birth_country"
                {...register('birth_country')}
                placeholder="Enter birth country"
                className={errors.birth_country ? 'border-red-500' : ''}
              />
              {errors.birth_country && (
                <p className="text-sm text-red-500">{errors.birth_country.message}</p>
              )}
            </div>

            {/* Death Date */}
            <div className="space-y-2">
              <Label htmlFor="death_date">Death Date (if applicable)</Label>
              <Input
                id="death_date"
                type="date"
                {...register('death_date')}
                className={errors.death_date ? 'border-red-500' : ''}
              />
              {errors.death_date && (
                <p className="text-sm text-red-500">{errors.death_date.message}</p>
              )}
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
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
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