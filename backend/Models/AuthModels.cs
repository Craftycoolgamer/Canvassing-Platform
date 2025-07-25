using System.ComponentModel.DataAnnotations;

namespace CanvassingBackend.Models
{
    public class LoginRequest
    {
        [Required]
        public string Email { get; set; } = string.Empty; // Can be email or username
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
    
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(3)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        public string? CompanyId { get; set; }
    }
    
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public User User { get; set; } = new();
    }
    
    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
    
    public class UserCreateRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(3)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        public string? Password { get; set; }
        
        public string Role { get; set; } = "User";
        
        public string? CompanyId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public bool CanManagePins { get; set; } = false;
    }

    public class ApprovalRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ApprovedByUserId { get; set; } = string.Empty;
    }

    public class RejectionRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string RejectedByUserId { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
} 