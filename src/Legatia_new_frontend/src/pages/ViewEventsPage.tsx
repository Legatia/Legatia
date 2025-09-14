import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useFamily } from '../hooks/useFamily';
import { useAuth } from '../hooks/useAuth';
import { FamilyEvent } from '../types';
import { 
  ArrowLeft, 
  Calendar,
  Plus,
  Clock,
  User,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ViewEventsPage: React.FC = () => {
  const { id: familyId, memberId } = useParams<{ id: string; memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentFamily, loading, error, fetchFamily, clearError } = useFamily();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

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

  useEffect(() => {
    if (currentMember) {
      setEvents(currentMember.events || []);
    }
  }, [currentMember]);

  const formatEventDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTimestamp = (timestamp: bigint): string => {
    try {
      return format(new Date(Number(timestamp) / 1000000), 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    switch (eventType.toLowerCase()) {
      case 'birth':
        return 'bg-green-100 text-green-800';
      case 'death':
        return 'bg-gray-100 text-gray-800';
      case 'marriage':
        return 'bg-pink-100 text-pink-800';
      case 'divorce':
        return 'bg-red-100 text-red-800';
      case 'education':
        return 'bg-blue-100 text-blue-800';
      case 'career':
        return 'bg-purple-100 text-purple-800';
      case 'military':
        return 'bg-orange-100 text-orange-800';
      case 'immigration':
        return 'bg-teal-100 text-teal-800';
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.event_date);
    const dateB = new Date(b.event_date);
    return dateB.getTime() - dateA.getTime();
  });

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
          The family member you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate(`/family/${familyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Button>
      </div>
    );
  }

  if (!currentMember) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/family/${familyId}`)}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {currentFamily?.name || 'Family'}
          </Button>
        </div>
        
        <Button asChild>
          <Link to={`/family/${familyId}/member/${memberId}/add-event`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Link>
        </Button>
      </div>

      {/* Member Info */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(currentMember.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{currentMember.full_name}</h1>
              <p className="text-muted-foreground">
                {currentMember.relationship_to_admin}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                {currentMember.birthday && currentMember.birthday.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Born {formatEventDate(currentMember.birthday[0])}</span>
                  </div>
                )}
                <Badge variant="outline">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Life Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length > 0 ? (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={`text-xs ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatEventDate(event.event_date)}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-lg mb-2">{event.title}</h3>
                      <p className="text-muted-foreground mb-3">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Added {formatTimestamp(event.created_at)}</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-7"
                          asChild
                        >
                          <Link to={`/family/${familyId}/member/${memberId}/event/${event.id}/edit`}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events recorded</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting {currentMember.full_name}'s life story by adding their first event.
              </p>
              <Button asChild>
                <Link to={`/family/${familyId}/member/${memberId}/add-event`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Event
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline View */}
      {sortedEvents.length > 1 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedEvents.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    {index < sortedEvents.length - 1 && (
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{formatEventDate(event.event_date)}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.event_type}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};