import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateFamilyForm } from '../components/family/CreateFamilyForm';
import { useFamily } from '../hooks/useFamily';
import { CreateFamilyRequest } from '../types';
import toast from 'react-hot-toast';

export const CreateFamilyPage: React.FC = () => {
  const navigate = useNavigate();
  const { createFamily, loading, error, clearError } = useFamily();

  // Clear any existing errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: CreateFamilyRequest) => {
    try {
      await createFamily(data);
      toast.success('Family created successfully!');
      navigate('/families');
    } catch (err) {
      toast.error('Failed to create family. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Families
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <CreateFamilyForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};