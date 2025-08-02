import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ClaimRequest, ProcessClaimRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { 
  FileText, 
  User,
  Ghost,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ClaimRequestsManagerProps {
  mode: 'user' | 'admin';
  onBack: () => void;
}

export const ClaimRequestsManager: React.FC<ClaimRequestsManagerProps> = ({ mode, onBack }) => {
  const { actor } = useAuth();
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadClaimRequests();
  }, [mode]);

  const loadClaimRequests = async () => {
    if (!actor) return;
    
    setLoading(true);

    try {
      let result;
      
      if (mode === 'admin') {
        result = await actor.get_pending_claims_for_admin();
      } else {
        result = await actor.get_my_claim_requests();
      }

      if ('Ok' in result) {
        setClaimRequests(result.Ok);
      } else {
        toast.error(`Failed to load claims: ${result.Err}`);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
      toast.error('Error loading claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processClaim = async (claimId: string, approve: boolean) => {
    if (!actor || processing) return;

    setProcessing(true);

    try {
      const request: ProcessClaimRequest = {
        claim_id: claimId,
        approve: approve,
        admin_message: []
      };

      const result = await actor.process_ghost_profile_claim(request);

      if ('Ok' in result) {
        toast.success(result.Ok);
        // Reload the claims to reflect the change
        await loadClaimRequests();
      } else {
        toast.error(`Failed to process claim: ${result.Err}`);
      }
    } catch (error) {
      console.error('Error processing claim:', error);
      toast.error('Error processing claim. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusText = (status: ClaimRequest['status']): string => {
    if ('Pending' in status) return 'pending';
    if ('Approved' in status) return 'approved';
    if ('Rejected' in status) return 'rejected';
    if ('Expired' in status) return 'expired';
    return 'unknown';
  };

  const getStatusIcon = (status: ClaimRequest['status']) => {
    if ('Pending' in status) return <Clock className="h-4 w-4" />;
    if ('Approved' in status) return <CheckCircle className="h-4 w-4" />;
    if ('Rejected' in status) return <XCircle className="h-4 w-4" />;
    if ('Expired' in status) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusVariant = (status: ClaimRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    if ('Pending' in status) return 'outline';
    if ('Approved' in status) return 'secondary';
    if ('Rejected' in status) return 'destructive';
    if ('Expired' in status) return 'outline';
    return 'outline';
  };

  const formatTimestamp = (timestamp: bigint): string => {
    try {
      const date = new Date(Number(timestamp) / 1000000);
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  const isPending = (status: ClaimRequest['status']): boolean => {
    return 'Pending' in status;
  };

  const title = mode === 'admin' ? 'Family Admin - Claim Requests' : 'My Claim Requests';
  const emptyMessage = mode === 'admin' 
    ? 'No pending claim requests for your families.' 
    : 'You have not submitted any ghost profile claims yet.';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <FileText className="h-8 w-8" />
            <span>{title}</span>
          </h2>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading claim requests..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <FileText className="h-8 w-8" />
            <span>{title}</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            {mode === 'admin' 
              ? 'Review and approve/reject ghost profile claims for your families'
              : 'Track the status of your ghost profile claim requests'}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Claims */}
      {claimRequests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Claim Requests</h3>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claimRequests.map((claim) => (
            <Card key={claim.id} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {claim.requester_profile.full_name} → {claim.ghost_member.full_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted: {formatTimestamp(claim.created_at)}
                    </p>
                  </div>
                  <Badge 
                    variant={getStatusVariant(claim.status)}
                    className="flex items-center space-x-1"
                  >
                    {getStatusIcon(claim.status)}
                    <span className="capitalize">{getStatusText(claim.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requester Profile */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <h4 className="font-semibold">Requester Profile</h4>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-md space-y-2 text-sm">
                      <div><strong>Name:</strong> {claim.requester_profile.full_name}</div>
                      <div><strong>Birth Name:</strong> {claim.requester_profile.surname_at_birth}</div>
                      <div><strong>Sex:</strong> {claim.requester_profile.sex}</div>
                      <div><strong>Birthday:</strong> {claim.requester_profile.birthday}</div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span><strong>Birth Location:</strong> {claim.requester_profile.birth_city}, {claim.requester_profile.birth_country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ghost Profile */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Ghost className="h-4 w-4 text-purple-500" />
                      <h4 className="font-semibold">Ghost Profile</h4>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md space-y-2 text-sm">
                      <div><strong>Name:</strong> {claim.ghost_member.full_name}</div>
                      <div><strong>Birth Name:</strong> {claim.ghost_member.surname_at_birth}</div>
                      <div><strong>Sex:</strong> {claim.ghost_member.sex}</div>
                      <div>
                        <strong>Birthday:</strong> {
                          Array.isArray(claim.ghost_member.birthday) && claim.ghost_member.birthday.length > 0 
                            ? claim.ghost_member.birthday[0] 
                            : 'Not specified'
                        }
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          <strong>Birth Location:</strong> {
                            [
                              Array.isArray(claim.ghost_member.birth_city) && claim.ghost_member.birth_city.length > 0 
                                ? claim.ghost_member.birth_city[0] 
                                : 'N/A',
                              Array.isArray(claim.ghost_member.birth_country) && claim.ghost_member.birth_country.length > 0 
                                ? claim.ghost_member.birth_country[0] 
                                : 'N/A'
                            ].join(', ')
                          }
                        </span>
                      </div>
                      <div><strong>Relationship:</strong> {claim.ghost_member.relationship_to_admin}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {mode === 'admin' && isPending(claim.status) && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      onClick={() => processClaim(claim.id, true)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Claim
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => processClaim(claim.id, false)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Claim
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};