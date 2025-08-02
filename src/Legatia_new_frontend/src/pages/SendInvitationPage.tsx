import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SendInvitation } from '../components/invitations/SendInvitation';
import { UserSearchMatch } from '../types';

interface LocationState {
  targetUser?: UserSearchMatch;
  familyName?: string;
}

export const SendInvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyId } = useParams<{ familyId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const handleBack = () => {
    if (familyId) {
      navigate(`/family/${familyId}`);
    } else {
      navigate('/families');
    }
  };

  const handleSuccess = () => {
    navigate(`/family/${familyId}`);
  };

  if (!familyId || !state?.targetUser || !state?.familyName) {
    // Redirect to search if we don't have the required data
    React.useEffect(() => {
      navigate(`/search?familyId=${familyId}&familyName=${state?.familyName || ''}`);
    }, []);
    
    return null;
  }

  return (
    <SendInvitation 
      familyId={familyId}
      familyName={state.familyName}
      targetUser={state.targetUser}
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
};