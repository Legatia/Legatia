import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FamilyInvitation, ProcessInvitationRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail,
  User,
  Calendar,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MyInvitationsProps {
  onBack: () => void;
  onViewFamily: (familyId: string) => void;
}

export const MyInvitations: React.FC<MyInvitationsProps> = ({ onBack, onViewFamily }) => {
  const { actor } = useAuth();
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitations, setProcessingInvitations] = useState(new Set<string>());

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (!actor) return;
    
    try {
      const result = await actor.get_my_invitations();
      
      if ('Ok' in result) {
        const sortedInvitations = result.Ok.sort((a, b) => {
          // Sort by status (pending first) then by creation date (newest first)
          if (isPending(a.status) !== isPending(b.status)) {
            return isPending(a.status) ? -1 : 1;
          }
          return Number(b.created_at - a.created_at);
        });
        setInvitations(sortedInvitations);
      } else {
        toast.error(`Failed to load invitations: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
      toast.error('Failed to load invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processInvitation = async (invitationId: string, accept: boolean) => {
    if (!actor) return;

    setProcessingInvitations(prev => new Set(prev).add(invitationId));

    const request: ProcessInvitationRequest = {
      invitation_id: invitationId,
      accept
    };

    try {
      const result = await actor.process_family_invitation(request);
      
      if ('Ok' in result) {
        // Update the invitation locally
        setInvitations(prev => prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: accept ? { Accepted: null } : { Declined: null } }
            : inv
        ));
        
        toast.success(accept 
          ? 'Invitation accepted! You are now a member of the family.'
          : 'Invitation declined.'
        );
      } else {
        toast.error(`Failed to process invitation: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to process invitation:', error);
      toast.error('Failed to process invitation. Please try again.');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const formatDate = (timestamp: bigint): string => {
    try {
      const date = new Date(Number(timestamp) / 1000000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return 'Unknown date';
    }
  };

  const getStatusText = (status: FamilyInvitation['status']): string => {
    const statusKey = Object.keys(status)[0];
    return statusKey.toLowerCase();
  };

  const getStatusIcon = (status: FamilyInvitation['status']) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      case 'Declined': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: FamilyInvitation['status']): "default" | "secondary" | "destructive" | "outline" => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'Pending': return 'default';
      case 'Accepted': return 'secondary';
      case 'Declined': return 'destructive';
      default: return 'outline';
    }
  };

  const isPending = (status: FamilyInvitation['status']): boolean => {
    return 'Pending' in status;
  };

  const isAccepted = (status: FamilyInvitation['status']): boolean => {
    return 'Accepted' in status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <Mail className="h-8 w-8" />
            <span>My Family Invitations</span>
          </h2>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading your invitations..." />
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => isPending(inv.status));
  const processedInvitations = invitations.filter(inv => !isPending(inv.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center space-x-2">
          <Mail className="h-8 w-8" />
          <span>My Family Invitations</span>
        </h2>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span>Pending Invitations ({pendingInvitations.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invitation.family_name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span>from <strong>{invitation.inviter_name}</strong></span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(invitation.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(invitation.status)} className="flex items-center space-x-1">
                      {getStatusIcon(invitation.status)}
                      <span>{getStatusText(invitation.status)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span><strong>Relationship:</strong> {invitation.relationship_to_admin}</span>
                  </div>
                  
                  {Array.isArray(invitation.message) && invitation.message.length > 0 && invitation.message[0] && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm italic">"{invitation.message[0]}"</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => processInvitation(invitation.id, true)}
                      disabled={processingInvitations.has(invitation.id)}
                      className="flex-1"
                    >
                      {processingInvitations.has(invitation.id) ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => processInvitation(invitation.id, false)}
                      disabled={processingInvitations.has(invitation.id)}
                      className="flex-1"
                    >
                      {processingInvitations.has(invitation.id) ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Invitations */}
      {processedInvitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Processed Invitations ({processedInvitations.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processedInvitations.map((invitation) => (
              <Card key={invitation.id} className={`border-l-4 ${isAccepted(invitation.status) ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invitation.family_name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span>from <strong>{invitation.inviter_name}</strong></span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(invitation.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(invitation.status)} className="flex items-center space-x-1">
                      {getStatusIcon(invitation.status)}
                      <span>{getStatusText(invitation.status)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span><strong>Relationship:</strong> {invitation.relationship_to_admin}</span>
                  </div>
                  
                  {Array.isArray(invitation.message) && invitation.message.length > 0 && invitation.message[0] && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm italic">"{invitation.message[0]}"</p>
                    </div>
                  )}

                  {isAccepted(invitation.status) && (
                    <Button
                      variant="outline"
                      onClick={() => onViewFamily(invitation.family_id)}
                      className="w-full"
                    >
                      👥 View Family
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Invitations */}
      {invitations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Family Invitations</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any family invitations yet. When family admins invite you to join their families, 
              the invitations will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};