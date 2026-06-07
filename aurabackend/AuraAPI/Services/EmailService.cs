using AuraAPI.Model; // This line fixes the error

namespace AuraAPI.Services
{
    public class EmailService
    {
        public async Task NotifyAdminOfOrder(string adminEmail, Order order)
        {
            // Placeholder for Resend/SMTP logic
            await Task.Delay(100); 
            Console.WriteLine($"Email sent to Admin: New Order from {order.CustomerName}");
        }

        public async Task NotifyUsersOfNewItem(List<string> userEmails, Product product)
        {
            await Task.Delay(100);
            Console.WriteLine($"Email sent to {userEmails.Count} users: New item {product.Name} is live!");
        }
    }
}