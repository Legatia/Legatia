import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { FamilyInvitation, ProcessInvitationRequest } from '../types';
import { 
  Mail, 
  User, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  Send,
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const InvitationsPage: React.FC = () => {
  const { actor } = useAuth();
  const [receivedInvitations, setReceivedInvitations] = useState<FamilyInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (!actor) return;
    
    setLoading(true);
    try {
      const [receivedResult, sentResult] = await Promise.all([
        actor.get_my_invitations(),
        actor.get_sent_invitations()
      ]);

      if ('Ok' in receivedResult) {
        setReceivedInvitations(receivedResult.Ok);
      } else {
        toast.error(`Failed to load received invitations: ${receivedResult.Err}`);
      }

      if ('Ok' in sentResult) {
        setSentInvitations(sentResult.Ok);
      } else {
        toast.error(`Failed to load sent invitations: ${sentResult.Err}`);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const processInvitation = async (invitationId: string, accept: boolean) => {
    if (!actor || processing) return;

    setProcessing(true);
    try {
      const request: ProcessInvitationRequest = {
        invitation_id: invitationId,
        accept: accept
      };

      const result = await actor.process_family_invitation(request);

      if ('Ok' in result) {
        toast.success(accept ? 'Invitation accepted!' : 'Invitation declined');
        // Reload invitations to reflect the change
        await loadInvitations();
      } else {
        toast.error(`Failed to process invitation: ${result.Err}`);
      }
    } catch (error) {
      console.error('Error processing invitation:', error);
      toast.error('Error processing invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusText = (status: FamilyInvitation['status']): string => {
    if ('Pending' in status) return 'Pending';
    if ('Accepted' in status) return 'Accepted';
    if ('Declined' in status) return 'Declined';
    if ('Expired' in status) return 'Expired';
    return 'Unknown';
  };

  const getStatusColor = (status: FamilyInvitation['status']): string => {
    if ('Pending' in status) return 'bg-yellow-100 text-yellow-800';
    if ('Accepted' in status) return 'bg-green-100 text-green-800';
    if ('Declined' in status) return 'bg-red-100 text-red-800';
    if ('Expired' in status) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: bigint): string => {
    try {
      return format(new Date(Number(timestamp) / 1000000), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown';
    }
  };

  const formatMessage = (message: [string] | [] | undefined): string => {
    if (!message || message.length === 0) return 'No message';
    return Array.isArray(message) ? message[0] : message;
  };

  const renderInvitation = (invitation: FamilyInvitation, isReceived: boolean) => (
    <Card key={invitation.id} className="transition-colors hover:bg-gray-50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold truncate">
                {isReceived ? `Invitation to join ${invitation.family_name}` : `Invitation sent for ${invitation.family_name}`}
              </h3>
              <Badge className={getStatusColor(invitation.status)}>
                {getStatusText(invitation.status)}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              <p className="text-sm text-gray-600">
                <strong>{isReceived ? 'From' : 'To'}:</strong> {isReceived ? invitation.inviter_name : invitation.invitee_id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Relationship:</strong> {invitation.relationship_to_admin}
              </p>
              {formatMessage(invitation.message) !== 'No message' && (
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {formatMessage(invitation.message)}
                </p>
              )}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {formatTimestamp(invitation.created_at)}
            </div>
          </div>
          
          {/* Actions for received invitations */}
          {isReceived && 'Pending' in invitation.status && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => processInvitation(invitation.id, true)}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => processInvitation(invitation.id, false)}
                disabled={processing}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading invitations..." />
      </div>
    );
  }

  const currentInvitations = activeTab === 'received' ? receivedInvitations : sentInvitations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family Invitations</h1>
        <p className="text-muted-foreground">
          Manage your family invitations and join new family trees
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Inbox className="h-4 w-4 mr-2 inline" />
          Received ({receivedInvitations.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="h-4 w-4 mr-2 inline" />
          Sent ({sentInvitations.length})
        </button>
      </div>

      {/* Invitations List */}
      {currentInvitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No {activeTab} invitations
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'received' 
                ? "You don't have any pending family invitations" 
                : "You haven't sent any family invitations yet"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentInvitations.map((invitation) => 
            renderInvitation(invitation, activeTab === 'received')
          )}
        </div>
      )}
    </div>
  );
};