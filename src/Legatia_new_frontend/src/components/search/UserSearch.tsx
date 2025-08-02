import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserSearchMatch } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { 
  Search, 
  User,
  Mail,
  Filter,
  X,
  ArrowLeft,
  Users,
  Lightbulb
} from 'lucide-react';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

interface UserSearchProps {
  familyId?: string;
  familyName?: string;
  onBack: () => void;
  onInviteUser?: (user: UserSearchMatch) => void;
  onSelectUser?: (user: UserSearchMatch) => void;
}

interface SearchFilters {
  minNameLength: number;
  exactMatch: boolean;
  includePartialMatches: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({ 
  familyId, 
  familyName, 
  onBack, 
  onInviteUser,
  onSelectUser 
}) => {
  const { actor } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minNameLength: 2,
    exactMatch: false,
    includePartialMatches: true
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!actor || query.trim().length < filters.minNameLength) {
        setSearchResults([]);
        setSearchPerformed(false);
        return;
      }

      setLoading(true);
      setSearchPerformed(false);

      try {
        const result = await actor.search_users(query.trim());
        
        if ('Ok' in result) {
          let results = result.Ok;
          
          // Apply client-side filters
          if (filters.exactMatch) {
            results = results.filter(user => 
              user.full_name.toLowerCase() === query.toLowerCase() ||
              user.surname_at_birth.toLowerCase() === query.toLowerCase()
            );
          }
          
          if (!filters.includePartialMatches) {
            results = results.filter(user =>
              user.full_name.toLowerCase().startsWith(query.toLowerCase()) ||
              user.surname_at_birth.toLowerCase().startsWith(query.toLowerCase())
            );
          }

          setSearchResults(results);
          setSearchPerformed(true);
        } else {
          toast.error(`Search failed: ${result.Err}`);
          setSearchResults([]);
          setSearchPerformed(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Search failed. Please try again.');
        setSearchResults([]);
        setSearchPerformed(true);
      } finally {
        setLoading(false);
      }
    }, 500),
    [actor, filters]
  );

  // Trigger search when query or filters change
  React.useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setSearchPerformed(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < filters.minNameLength) {
      toast.error(`Please enter at least ${filters.minNameLength} characters to search`);
      return;
    }

    if (searchQuery.length > 50) {
      toast.error('Search query too long (max 50 characters)');
      return;
    }

    // Basic sanitization
    const validPattern = /^[a-zA-Z0-9\s\-_.@]+$/;
    if (!validPattern.test(searchQuery.trim())) {
      toast.error('Search query contains invalid characters');
      return;
    }

    // Immediate search (bypassing debounce)
    debouncedSearch.cancel();
    debouncedSearch(searchQuery);
  };

  const handleInviteUser = (user: UserSearchMatch) => {
    if (onInviteUser) {
      onInviteUser(user);
    } else if (onSelectUser) {
      onSelectUser(user);
    }
  };

  const clearFilters = () => {
    setFilters({
      minNameLength: 2,
      exactMatch: false,
      includePartialMatches: true
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minNameLength !== 2) count++;
    if (filters.exactMatch) count++;
    if (!filters.includePartialMatches) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <Search className="h-8 w-8" />
            <span>Search Users</span>
          </h2>
          {familyName && (
            <p className="text-muted-foreground mt-2">
              Find users to invite to "{familyName}"
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search for Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, surname, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || searchQuery.trim().length < filters.minNameLength}>
              {loading ? (
                <>⏳ Searching...</>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Search Filters</h4>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Name Length</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={filters.minNameLength}
                      onChange={(e) => setFilters(prev => ({ ...prev, minNameLength: parseInt(e.target.value) || 2 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="exactMatch"
                        checked={filters.exactMatch}
                        onChange={(e) => setFilters(prev => ({ ...prev, exactMatch: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="exactMatch">Exact name match only</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="partialMatches"
                        checked={filters.includePartialMatches}
                        onChange={(e) => setFilters(prev => ({ ...prev, includePartialMatches: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="partialMatches">Include partial matches</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Tips */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Search Tips:</p>
                <p className="text-blue-700">
                  You can search by full name, surname, or unique user ID. 
                  Results show users who have registered profiles and can be invited to join your family.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Searching users..." />
        </div>
      )}

      {/* Search Results */}
      {searchPerformed && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Found {searchResults.length} user{searchResults.length === 1 ? '' : 's'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-lg">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>Surname:</strong> {user.surname_at_birth}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>ID:</strong> {user.id}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleInviteUser(user)}
                        className="w-full"
                        size="sm"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {onInviteUser ? 'Send Invitation' : 'Select User'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchPerformed && searchResults.length === 0 && !loading && searchQuery.trim() && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No users found matching "{searchQuery}"
            </h3>
            <div className="text-muted-foreground space-y-2 max-w-md mx-auto">
              <p className="font-medium">💡 Search Tips:</p>
              <ul className="text-left space-y-1">
                <li>• Try different spelling variations</li>
                <li>• Search by first name, last name, or surname at birth</li>
                <li>• Use partial names (e.g., "John" instead of "Jonathan")</li>
                <li>• Make sure the user has registered on the platform</li>
              </ul>
              <p className="text-sm pt-2">
                Only registered users can be invited to join families.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};