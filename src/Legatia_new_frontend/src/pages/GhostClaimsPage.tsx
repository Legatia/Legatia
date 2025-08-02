import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClaimRequestsManager } from '../components/ghost/ClaimRequestsManager';

export const GhostClaimsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <ClaimRequestsManager 
      mode="user"
      onBack={handleBack}
    />
  );
};