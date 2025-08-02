import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GhostProfileMatch } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Ghost, 
  Users,
  User,
  MapPin,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GhostProfileMatchesProps {
  matches: GhostProfileMatch[];
  onBack: () => void;
  onClaimSuccess?: () => void;
}

export const GhostProfileMatches: React.FC<GhostProfileMatchesProps> = ({ 
  matches, 
  onBack, 
  onClaimSuccess 
}) => {
  const { actor } = useAuth();
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimedMatches, setClaimedMatches] = useState(new Set<string>());

  const handleClaimProfile = async (match: GhostProfileMatch) => {
    if (!actor || submittingClaim) return;

    setSubmittingClaim(true);

    try {
      const result = await actor.submit_ghost_profile_claim(match.family_id, match.member_id);

      if ('Ok' in result) {
        toast.success('Claim request submitted successfully! The family admin will review your request.');
        setClaimedMatches(prev => new Set(prev).add(`${match.family_id}-${match.member_id}`));
        onClaimSuccess?.();
      } else {
        toast.error(`Failed to submit claim: ${result.Err}`);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error(`Error submitting claim: ${error}`);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const getSimilarityVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 85) return 'secondary'; 
    if (score >= 80) return 'outline';
    return 'outline';
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getSimilarityText = (score: number): string => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 85) return 'Very Good Match';
    if (score >= 80) return 'Good Match';
    return 'Possible Match';
  };

  const getMatchId = (match: GhostProfileMatch): string => {
    return `${match.family_id}-${match.member_id}`;
  };

  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <Ghost className="h-8 w-8" />
            <span>Ghost Profile Matches</span>
          </h2>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>

        {/* No Matches */}
        <Card className="text-center py-12">
          <CardContent>
            <Ghost className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Matching Ghost Profiles Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any existing family profiles that match your information. 
              This means you can start creating your own family trees!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <Ghost className="h-8 w-8" />
            <span>Potential Family Connections Found!</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            We found {matches.length} existing family profile(s) that might be you. 
            Review the matches below and claim any that belong to you.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>

      {/* Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((match) => {
          const matchId = getMatchId(match);
          const isClaimed = claimedMatches.has(matchId);
          
          return (
            <Card key={matchId} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{match.ghost_profile_name}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                      <Users className="h-3 w-3" />
                      <span>Family: <strong>{match.family_name}</strong></span>
                    </div>
                  </div>
                  <Badge 
                    variant={getSimilarityVariant(match.similarity_score)}
                    className={`${getSimilarityColor(match.similarity_score)} font-semibold`}
                  >
                    {match.similarity_score}% {getSimilarityText(match.similarity_score)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Match Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Family ID:</strong> {match.family_id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Member ID:</strong> {match.member_id}</span>
                  </div>
                </div>

                {/* Claim Section */}
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">Is this you?</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Claim this profile to join the family and connect with your relatives.
                  </p>
                  
                  {isClaimed ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Claim request submitted!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleClaimProfile(match)}
                      disabled={submittingClaim}
                      className="w-full"
                    >
                      {submittingClaim ? (
                        <>⏳ Submitting...</>
                      ) : (
                        <>
                          <Ghost className="mr-2 h-4 w-4" />
                          Claim This Profile
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};