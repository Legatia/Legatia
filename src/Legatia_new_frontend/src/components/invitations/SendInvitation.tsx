import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserSearchMatch, SendInvitationRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { 
  Mail, 
  User,
  Heart,
  MessageCircle,
  Send,
  ArrowLeft,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SendInvitationProps {
  familyId: string;
  familyName: string;
  targetUser: UserSearchMatch;
  onBack: () => void;
  onSuccess: () => void;
}

export const SendInvitation: React.FC<SendInvitationProps> = ({ 
  familyId, 
  familyName, 
  targetUser, 
  onBack, 
  onSuccess 
}) => {
  const { actor } = useAuth();
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const relationshipOptions = [
    'spouse',
    'child',
    'parent',
    'sibling',
    'grandparent',
    'grandchild',
    'aunt',
    'uncle',
    'cousin',
    'niece',
    'nephew',
    'in-law',
    'friend',
    'other'
  ];

  const handleSendInvitation = async () => {
    if (!actor) return;
    
    if (!relationship.trim()) {
      toast.error('Please select a relationship');
      return;
    }

    setLoading(true);

    const request: SendInvitationRequest = {
      family_id: familyId,
      user_id: targetUser.id,
      relationship_to_admin: relationship,
      message: message.trim() ? [message.trim()] : []
    };

    try {
      const result = await actor.send_family_invitation(request);
      
      if ('Ok' in result) {
        toast.success('Invitation sent successfully! The user will receive a notification.');
        // Navigate back after a short delay
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        toast.error(`Failed to send invitation: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewMessage = (): string => {
    if (!relationship) {
      return 'Please select a relationship to see the invitation preview.';
    }

    const messageText = message.trim() ? `\n\nPersonal message: "${message}"` : '';
    return `You have been invited to join the "${familyName}" family as their ${relationship}.${messageText}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center space-x-2">
          <Mail className="h-8 w-8" />
          <span>Send Family Invitation</span>
        </h2>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Target User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Inviting User</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-xl font-semibold">{targetUser.full_name}</div>
            <div className="text-muted-foreground">
              <span className="font-medium">Surname:</span> {targetUser.surname_at_birth}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">ID:</span> {targetUser.id}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Invitation Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Relationship Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Relationship to You (Family Admin) *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {relationshipOptions.map(option => (
                <Button
                  key={option}
                  variant={relationship === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRelationship(option)}
                  disabled={loading}
                  className="justify-start capitalize"
                >
                  {option}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select how {targetUser.full_name} is related to you in the family tree.
            </p>
          </div>

          {/* Personal Message */}
          <div className="space-y-3">
            <Label htmlFor="message" className="text-base font-semibold flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Personal Message (Optional)</span>
            </Label>
            <textarea
              id="message"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Add a personal message to explain why you're inviting them..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              This message will be included in their invitation notification.
            </p>
          </div>

          {/* Invitation Preview */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Invitation Preview</span>
            </Label>
            <div className="bg-muted p-4 rounded-md border">
              <p className="text-sm whitespace-pre-line">
                {generatePreviewMessage()}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={loading || !relationship.trim()}
              className="flex-1"
            >
              {loading ? (
                <>⏳ Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};