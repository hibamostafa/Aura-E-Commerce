using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuraAPI.Model
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }

        [JsonIgnore]
        public string Password { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property for the unique wishlist
        [JsonIgnore]
        public ICollection<Product> Wishlist { get; set; } = new List<Product>();
    }
}