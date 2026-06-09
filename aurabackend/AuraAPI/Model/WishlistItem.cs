namespace AuraAPI.Model
{
    public class WishlistItem
    {
        public int Id { get; set; }
        public string UserEmail { get; set; } // Map directly to the user's email
        public int ProductId { get; set; }   // Map directly to the product's ID
    }
}