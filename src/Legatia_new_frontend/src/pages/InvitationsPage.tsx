import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MyInvitations } from '../components/invitations/MyInvitations';

export const InvitationsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/profile');
  };

  const handleViewFamily = (familyId: string) => {
    navigate(`/family/${familyId}`);
  };

  return (
    <MyInvitations 
      onBack={handleBack}
      onViewFamily={handleViewFamily}
    />
  );
};