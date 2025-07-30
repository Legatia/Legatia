import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Family } from '../../types';
import { Users, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface FamilyCardProps {
  family: Family;
  className?: string;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ family, className }) => {
  const formatDate = (timestamp: bigint): string => {
    try {
      return format(new Date(Number(timestamp) / 1000000), 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`glass-card hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{family.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {family.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {family.is_visible ? (
              <Eye className="h-4 w-4 text-green-600" title="Public family" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" title="Private family" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Family members preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {family.members?.length || 0} member{(family.members?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Created {formatDate(family.created_at)}
            </Badge>
          </div>

          {/* Member avatars */}
          {(family.members?.length || 0) > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {family.members?.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {(family.members?.length || 0) > 4 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{(family.members?.length || 0) - 4}
                    </span>
                  </div>
                )}
              </div>
              {(family.members?.length || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  {family.members?.slice(0, 2).map(m => m.full_name.split(' ')[0]).join(', ')}
                  {(family.members?.length || 0) > 2 && ` and ${(family.members?.length || 0) - 2} more`}
                </span>
              )}
            </div>
          )}

          {/* Action button */}
          <Button asChild className="w-full mt-4">
            <Link to={`/family/${family.id}`}>
              View Family Tree
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};