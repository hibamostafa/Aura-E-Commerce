using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuraAPI.Model
{
    public class Product
    {
        public int Id { get; set; }
        public string? Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Img { get; set; } = string.Empty;
        public string? Category { get; set; } = string.Empty;
        public string? Status { get; set; } = string.Empty;
        public string? Sizes { get; set; } = string.Empty;
        public string? Colors { get; set; } = string.Empty;

        // Optional: tracks which users have wishlisted this item
        [JsonIgnore] 
        public ICollection<User> WishedByUsers { get; set; } = new List<User>();
    }
}