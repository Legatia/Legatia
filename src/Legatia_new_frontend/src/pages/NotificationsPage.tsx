import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from '../components/notifications/NotificationCenter';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/profile');
  };

  const handleNavigate = (url: string) => {
    if (url.includes('/invitations/')) {
      navigate('/invitations');
    } else if (url.includes('/family/')) {
      const familyId = url.split('/family/')[1];
      navigate(`/family/${familyId}`);
    } else if (url.includes('/claims/')) {
      navigate('/ghost-claims');
    } else {
      // Fallback for other URLs
      navigate(url);
    }
  };

  return (
    <NotificationCenter 
      onBack={handleBack}
      onNavigate={handleNavigate}
    />
  );
};