import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserSearch } from '../components/search/UserSearch';
import { UserSearchMatch } from '../types';

export const UserSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const familyId = searchParams.get('familyId');
  const familyName = searchParams.get('familyName');

  const handleBack = () => {
    if (familyId) {
      navigate(`/family/${familyId}`);
    } else {
      navigate('/families');
    }
  };

  const handleInviteUser = (user: UserSearchMatch) => {
    if (familyId && familyName) {
      navigate(`/family/${familyId}/invite`, {
        state: { targetUser: user, familyName }
      });
    }
  };

  return (
    <UserSearch 
      familyId={familyId || undefined}
      familyName={familyName || undefined}
      onBack={handleBack}
      onInviteUser={handleInviteUser}
    />
  );
};