import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useFamily } from '../hooks/useFamily';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Eye, 
  EyeOff, 
  Settings, 
  Calendar,
  MapPin,
  Crown,
  UserPlus,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const FamilyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, principal } = useAuth();
  const { 
    currentFamily, 
    loading, 
    error, 
    fetchFamily, 
    toggleFamilyVisibility,
    clearError 
  } = useFamily();

  useEffect(() => {
    if (id) {
      fetchFamily(id);
    }
  }, [id, fetchFamily]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const formatDate = (timestamp: bigint): string => {
    try {
      return format(new Date(Number(timestamp) / 1000000), 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const formatEventDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
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

  const handleToggleVisibility = async () => {
    if (!currentFamily) return;
    
    try {
      await toggleFamilyVisibility(currentFamily.id, !currentFamily.is_visible);
      toast.success(`Family is now ${!currentFamily.is_visible ? 'public' : 'private'}`);
    } catch (err) {
      toast.error('Failed to update family visibility');
    }
  };

  if (loading && !currentFamily) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading family details..." />
      </div>
    );
  }

  if (!currentFamily && !loading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Family Not Found</h2>
        <p className="text-gray-600 mb-6">
          The family you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/families')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Families
        </Button>
      </div>
    );
  }

  if (!currentFamily) return null;

  const isAdmin = principal && currentFamily.admin.toString() === principal.toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/families')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Families
          </Button>
        </div>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            onClick={handleToggleVisibility}
            disabled={loading}
          >
            {currentFamily.is_visible ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Make Public
              </>
            )}
          </Button>
        )}
      </div>

      {/* Family Info Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{currentFamily.name}</CardTitle>
              <p className="text-muted-foreground text-lg mb-4">
                {currentFamily.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{currentFamily.members?.length || 0} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(currentFamily.created_at)}</span>
                </div>
                <Badge variant={currentFamily.is_visible ? "default" : "secondary"}>
                  {currentFamily.is_visible ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Crown className="h-3 w-3" />
                <span>Admin</span>
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={`/family/${currentFamily.id}/add-member`}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Family Member
          </Link>
        </Button>
        
        {isAdmin && (
          <>
            <Button variant="outline" asChild>
              <Link to={`/family/${currentFamily.id}/invite`}>
                <Plus className="mr-2 h-4 w-4" />
                Invite Users
              </Link>
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Manage Family
            </Button>
          </>
        )}
      </div>

      {/* Family Members */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Family Members ({currentFamily.members?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentFamily.members && currentFamily.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFamily.members.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{member.full_name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.surname_at_birth !== member.full_name.split(' ').pop() && 
                         `née ${member.surname_at_birth}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {member.relationship_to_admin}
                      </p>
                      
                      {(member.birthday && member.birthday.length > 0) && (
                        <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatEventDate(member.birthday[0])}</span>
                        </div>
                      )}
                      
                      {((member.birth_city && member.birth_city.length > 0) || 
                        (member.birth_country && member.birth_country.length > 0)) && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[
                              member.birth_city && member.birth_city.length > 0 ? member.birth_city[0] : '',
                              member.birth_country && member.birth_country.length > 0 ? member.birth_country[0] : ''
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.events && member.events.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {member.events.length} event{member.events.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {(!member.profile_principal || member.profile_principal.length === 0) && (
                          <Badge variant="secondary" className="text-xs">
                            Ghost Profile
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7"
                          asChild
                        >
                          <Link to={`/family/${currentFamily.id}/member/${member.id}/add-event`}>
                            Add Event
                          </Link>
                        </Button>
                        {member.events && member.events.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-7"
                            asChild
                          >
                            <Link to={`/family/${currentFamily.id}/member/${member.id}/events`}>
                              View Events
                            </Link>
                          </Button>
                        )}
                        {/* Edit button for ghost profiles (admin only) */}
                        {isAdmin && (!member.profile_principal || member.profile_principal.length === 0) ? (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="text-xs h-7"
                            asChild
                          >
                            <Link to={`/family/${currentFamily.id}/member/${member.id}/edit`}>
                              <Edit className="mr-1 h-3 w-3" />
                              Edit Ghost
                            </Link>
                          </Button>
                        ) : member.profile_principal && member.profile_principal.length > 0 ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            disabled
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Linked Profile
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No family members yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your family tree by adding the first family member.
              </p>
              <Button asChild>
                <Link to={`/family/${currentFamily.id}/add-member`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add First Member
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};