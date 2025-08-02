import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClaimRequestsManager } from '../components/ghost/ClaimRequestsManager';

export const AdminClaimsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <ClaimRequestsManager 
      mode="admin"
      onBack={handleBack}
    />
  );
};