// Input validation utilities for security

pub const MAX_NAME_LENGTH: usize = 100;
pub const MAX_DESCRIPTION_LENGTH: usize = 500;
pub const MAX_MESSAGE_LENGTH: usize = 1000;
pub const MAX_REASON_LENGTH: usize = 200;
pub const MIN_NAME_LENGTH: usize = 1;
pub const MAX_SEARCH_QUERY_LENGTH: usize = 50;

#[derive(Debug)]
pub enum ValidationError {
    TooShort(String),
    TooLong(String),
    InvalidCharacters(String),
    Empty(String),
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::TooShort(field) => write!(f, "{} is too short", field),
            ValidationError::TooLong(field) => write!(f, "{} is too long", field),
            ValidationError::InvalidCharacters(field) => write!(f, "{} contains invalid characters", field),
            ValidationError::Empty(field) => write!(f, "{} cannot be empty", field),
        }
    }
}

/// Validate a name field (user names, family names, etc.)
pub fn validate_name(name: &str, field_name: &str) -> Result<(), ValidationError> {
    let trimmed = name.trim();
    
    if trimmed.is_empty() {
        return Err(ValidationError::Empty(field_name.to_string()));
    }
    
    if trimmed.len() < MIN_NAME_LENGTH {
        return Err(ValidationError::TooShort(field_name.to_string()));
    }
    
    if trimmed.len() > MAX_NAME_LENGTH {
        return Err(ValidationError::TooLong(field_name.to_string()));
    }
    
    // Allow letters, numbers, spaces, hyphens, apostrophes, and periods
    let valid_chars = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || c == '-' || c == '\'' || c == '.'
    });
    
    if !valid_chars {
        return Err(ValidationError::InvalidCharacters(field_name.to_string()));
    }
    
    Ok(())
}

/// Validate a description field
pub fn validate_description(description: &str) -> Result<(), ValidationError> {
    let trimmed = description.trim();
    
    if trimmed.len() > MAX_DESCRIPTION_LENGTH {
        return Err(ValidationError::TooLong("description".to_string()));
    }
    
    // Allow most printable characters for descriptions
    let valid_chars = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || ".,!?;:-'\"()[]{}".contains(c)
    });
    
    if !valid_chars {
        return Err(ValidationError::InvalidCharacters("description".to_string()));
    }
    
    Ok(())
}

/// Validate a message field (invitations, etc.)
pub fn validate_message(message: &str) -> Result<(), ValidationError> {
    let trimmed = message.trim();
    
    if trimmed.len() > MAX_MESSAGE_LENGTH {
        return Err(ValidationError::TooLong("message".to_string()));
    }
    
    // Allow most printable characters for messages
    let valid_chars = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || ".,!?;:-'\"()[]{}@#$%&*+=_/|\\<>".contains(c)
    });
    
    if !valid_chars {
        return Err(ValidationError::InvalidCharacters("message".to_string()));
    }
    
    Ok(())
}

/// Validate a search query
pub fn validate_search_query(query: &str) -> Result<(), ValidationError> {
    let trimmed = query.trim();
    
    if trimmed.is_empty() {
        return Err(ValidationError::Empty("search query".to_string()));
    }
    
    if trimmed.len() < 2 {
        return Err(ValidationError::TooShort("search query".to_string()));
    }
    
    if trimmed.len() > MAX_SEARCH_QUERY_LENGTH {
        return Err(ValidationError::TooLong("search query".to_string()));
    }
    
    // Allow letters, numbers, spaces, hyphens, apostrophes, periods, and @ for email-like searches
    let valid_chars = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || c == '-' || c == '\'' || c == '.' || c == '@' || c == '_'
    });
    
    if !valid_chars {
        return Err(ValidationError::InvalidCharacters("search query".to_string()));
    }
    
    Ok(())
}

/// Validate a reason field for claims, etc.
pub fn validate_reason(reason: &str) -> Result<(), ValidationError> {
    let trimmed = reason.trim();
    
    if trimmed.is_empty() {
        return Err(ValidationError::Empty("reason".to_string()));
    }
    
    if trimmed.len() > MAX_REASON_LENGTH {
        return Err(ValidationError::TooLong("reason".to_string()));
    }
    
    // Allow most printable characters for reasons
    let valid_chars = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || ".,!?;:-'\"()[]{}".contains(c)
    });
    
    if !valid_chars {
        return Err(ValidationError::InvalidCharacters("reason".to_string()));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_name() {
        // Valid names
        assert!(validate_name("John Doe", "name").is_ok());
        assert!(validate_name("Mary O'Connor", "name").is_ok());
        assert!(validate_name("Jean-Pierre", "name").is_ok());
        assert!(validate_name("Dr. Smith", "name").is_ok());
        
        // Invalid names
        assert!(validate_name("", "name").is_err());
        assert!(validate_name("   ", "name").is_err());
        assert!(validate_name("John<script>", "name").is_err());
        assert!(validate_name(&"a".repeat(101), "name").is_err());
    }

    #[test]
    fn test_validate_search_query() {
        // Valid queries
        assert!(validate_search_query("john").is_ok());
        assert!(validate_search_query("john doe").is_ok());
        assert!(validate_search_query("john@example.com").is_ok());
        
        // Invalid queries
        assert!(validate_search_query("").is_err());
        assert!(validate_search_query(&"a".repeat(51)).is_err());
        assert!(validate_search_query("john<script>").is_err());
    }
}