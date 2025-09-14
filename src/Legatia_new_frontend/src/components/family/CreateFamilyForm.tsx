import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { CreateFamilyRequest } from '../../types';

const createFamilySchema = z.object({
  name: z.string().min(2, 'Family name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  is_visible: z.union([z.boolean(), z.string()]).default(true),
});

type CreateFamilyFormData = z.infer<typeof createFamilySchema>;

interface CreateFamilyFormProps {
  onSubmit: (data: CreateFamilyRequest) => Promise<void>;
  loading?: boolean;
}

export const CreateFamilyForm: React.FC<CreateFamilyFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyFormData>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: '',
      description: '',
      is_visible: true,
    },
  });

  // Debug form errors
  console.log('Form errors:', errors);
  console.log('Form isSubmitting:', isSubmitting);

  const onFormSubmit = async (data: CreateFamilyFormData) => {
    console.log('Form submitted with data:', data);
    const createData: CreateFamilyRequest = {
      name: data.name,
      description: data.description,
      is_visible: [data.is_visible === 'true' || data.is_visible === true],
    };
    console.log('Converted data:', createData);
    await onSubmit(createData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Family</CardTitle>
        <p className="text-muted-foreground">
          Start building your family tree by creating a new family group.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered', e);
          handleSubmit(onFormSubmit)(e);
        }} className="space-y-6">
          {/* Family Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Family Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., The Smith Family, Johnson Family Tree"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Tell us about this family branch, its origins, or any special notes..."
              rows={4}
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label>Privacy Settings</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="public"
                  {...register('is_visible')}
                  value="true"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <Label htmlFor="public" className="cursor-pointer">
                  <span className="font-medium">Public Family</span>
                  <p className="text-sm text-muted-foreground">
                    Other users can discover and request to join this family
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="private"
                  {...register('is_visible')}
                  value="false"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <Label htmlFor="private" className="cursor-pointer">
                  <span className="font-medium">Private Family</span>
                  <p className="text-sm text-muted-foreground">
                    Only invited members can see and join this family
                  </p>
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full"
            size="lg"
            onClick={() => console.log('Create Family button clicked')}
          >
            {isSubmitting || loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Create Family'
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>You will be the administrator of this family and can invite others to join.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};