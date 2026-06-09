using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuraAPI.Model
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Img { get; set; }
        public string Category { get; set; }
        public string Status { get; set; }
        public string Sizes { get; set; }
        public string Colors { get; set; }

        // Optional: tracks which users have wishlisted this item
        [JsonIgnore] 
        public ICollection<User> WishedByUsers { get; set; } = new List<User>();
    }
}