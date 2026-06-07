using System;
using System.Collections.Generic;

namespace AuraAPI.Model
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property for the unique wishlist
        public ICollection<Product> Wishlist { get; set; } = new List<Product>();
    }
}