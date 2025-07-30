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
import { AddEventRequest } from '../types';
import { ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const addEventSchema = z.object({
  title: z.string().min(2, 'Event title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  event_date: z.string().min(1, 'Event date is required'),
  event_type: z.string().min(1, 'Event type is required'),
});

type AddEventFormData = z.infer<typeof addEventSchema>;

export const AddEventPage: React.FC = () => {
  const { id: familyId, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { currentFamily, loading, error, addMemberEvent, fetchFamily, clearError } = useFamily();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddEventFormData>({
    resolver: zodResolver(addEventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      event_type: 'Birth',
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

  const currentMember = currentFamily?.members?.find(m => m.id === memberId);

  const onSubmit = async (data: AddEventFormData) => {
    if (!familyId || !memberId) return;

    try {
      const eventData: AddEventRequest = {
        family_id: familyId,
        member_id: memberId,
        title: data.title,
        description: data.description,
        event_date: data.event_date,
        event_type: data.event_type,
      };

      await addMemberEvent(eventData);
      toast.success('Event added successfully!');
      navigate(`/family/${familyId}`);
    } catch (err) {
      toast.error('Failed to add event. Please try again.');
    }
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
          The family member you're trying to add an event for doesn't exist.
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
          Back to {currentFamily?.name || 'Family'}
        </Button>
        <h1 className="text-3xl font-bold">Add Event</h1>
        <p className="text-muted-foreground">
          Add a life event for {currentMember?.full_name || 'this family member'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Member Info */}
      {currentMember && (
        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {currentMember.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 className="font-medium">{currentMember.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentMember.relationship_to_admin}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Event Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <select
                id="event_type"
                {...register('event_type')}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.event_type ? 'border-red-500' : ''
                }`}
              >
                <option value="Birth">Birth</option>
                <option value="Death">Death</option>
                <option value="Marriage">Marriage</option>
                <option value="Divorce">Divorce</option>
                <option value="Education">Education</option>
                <option value="Career">Career</option>
                <option value="Military">Military Service</option>
                <option value="Immigration">Immigration</option>
                <option value="Achievement">Achievement</option>
                <option value="Other">Other</option>
              </select>
              {errors.event_type && (
                <p className="text-sm text-red-500">{errors.event_type.message}</p>
              )}
            </div>

            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Graduated from University, Started career at IBM"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                {...register('event_date')}
                className={errors.event_date ? 'border-red-500' : ''}
              />
              {errors.event_date && (
                <p className="text-sm text-red-500">{errors.event_date.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Provide more details about this event..."
                rows={4}
                className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
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
                  'Add Event'
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