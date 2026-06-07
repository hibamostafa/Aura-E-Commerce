public class Order
{
    public int Id { get; set; }
    public string UserEmail { get; set; } = string.Empty; // THE LINK
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Items { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending";
}