import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { UserSearchMatch } from '../types';
import { 
  Search, 
  User, 
  Users,
  Mail,
  UserPlus,
  Filter
} from 'lucide-react';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

export const UserSearchPage: React.FC = () => {
  const { actor } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!actor || query.length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const result = await actor.search_users(query);

        if ('Ok' in result) {
          setSearchResults(result.Ok);
          setHasSearched(true);
        } else {
          toast.error(`Search failed: ${result.Err}`);
          setSearchResults([]);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Search failed. Please try again.');
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 500),
    [actor]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      debouncedSearch.cancel();
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSendInvitation = (user: UserSearchMatch) => {
    // Navigate to send invitation page with user data
    navigate('/send-invitation', { 
      state: { 
        selectedUser: user 
      } 
    });
  };

  const formatUserName = (user: UserSearchMatch): string => {
    return `${user.full_name} (${user.surname_at_birth})`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Users</h1>
        <p className="text-muted-foreground">
          Find and invite family members to join your family tree
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name (at least 2 characters)..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 text-lg"
            />
          </div>
          
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-muted-foreground mt-2">
              Enter at least 2 characters to search
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" text="Searching users..." />
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Search Results
              {searchResults.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {searchResults.length} found
                </Badge>
              )}
            </h2>
          </div>

          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  No users match your search criteria. Try different keywords.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((user) => (
                <Card key={user.id} className="transition-colors hover:bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {formatUserName(user)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            User ID: {user.id}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleSendInvitation(user)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a name in the search box above to find family members
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Search by first name, last name, or surname at birth</li>
            <li>• Use at least 2 characters for better results</li>
            <li>• Search is case-insensitive</li>
            <li>• Only users with public profiles will appear in search results</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};