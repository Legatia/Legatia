import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ProfileForm } from '../components/profile/ProfileForm';
import { useAuth } from '../hooks/useAuth';
import { UpdateProfileRequest } from '../types';
import { Edit, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No profile found</p>
      </div>
    );
  }

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleUpdate = async (data: UpdateProfileRequest) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        
        <ProfileForm
          initialData={user}
          onSubmit={handleUpdate}
          loading={loading}
          title="Edit Your Profile"
          description="Update your personal information below."
          submitText="Update Profile"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <Avatar className="h-32 w-32">
              <AvatarImage src="" alt={user.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getUserInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-bold">{user.full_name}</h2>
                <p className="text-lg text-muted-foreground">
                  {user.surname_at_birth !== user.full_name.split(' ').pop() && (
                    `née ${user.surname_at_birth}`
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {user.sex && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{user.sex}</span>
                  </div>
                )}
                
                {user.birthday && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(user.birthday)}</span>
                  </div>
                )}
                
                {(user.birth_city || user.birth_country) && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[user.birth_city, user.birth_country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Legatia Member</Badge>
                <Badge variant="outline">
                  Since {format(new Date(Number(user.created_at) / 1000000), 'MMM yyyy')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-sm">{user.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Surname at Birth</label>
              <p className="text-sm">{user.surname_at_birth}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sex</label>
              <p className="text-sm">{user.sex || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Birth Information */}
        <Card>
          <CardHeader>
            <CardTitle>Birth Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="text-sm">{user.birthday ? formatDate(user.birthday) : 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Birth City</label>
              <p className="text-sm">{user.birth_city || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Birth Country</label>
              <p className="text-sm">{user.birth_country || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};