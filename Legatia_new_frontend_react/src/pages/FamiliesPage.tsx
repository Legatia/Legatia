import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { FamilyCard } from '../components/family/FamilyCard';
import { useFamily } from '../hooks/useFamily';
import { Plus, Search, Users } from 'lucide-react';

export const FamiliesPage: React.FC = () => {
  const { families, loading, error, fetchFamilies, clearError } = useFamily();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const filteredFamilies = families.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && families.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your families..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">My Families</h1>
          <p className="text-muted-foreground">
            Manage and explore your family trees
          </p>
        </div>
        <Button asChild>
          <Link to="/create-family">
            <Plus className="mr-2 h-4 w-4" />
            Create Family
          </Link>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Search */}
      {families.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search families..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Families Grid */}
      {filteredFamilies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFamilies.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      ) : families.length === 0 ? (
        /* Empty State - No families */
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No families yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first family tree to start preserving your family's history and connecting with relatives.
          </p>
          <Button asChild size="lg">
            <Link to="/create-family">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Family
            </Link>
          </Button>
        </div>
      ) : (
        /* No search results */
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No families found</h3>
          <p className="text-muted-foreground mb-6">
            No families match your search for "{searchTerm}". Try a different search term.
          </p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {loading && families.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};