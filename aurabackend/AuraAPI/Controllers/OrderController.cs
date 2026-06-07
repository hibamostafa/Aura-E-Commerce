using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraAPI.Data;
using AuraAPI.Model;

namespace AuraAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Orders (Used by the Admin Dashboard to see all orders)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders.OrderByDescending(o => o.OrderDate).ToListAsync();
        }

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();
            return order;
        }

        // POST: api/Orders (Called when user clicks "Confirm Order" in React)
        [HttpPost]
        public async Task<ActionResult<Order>> PostOrder(Order order)
        {
            // 1. Set the date and initial status
            order.OrderDate = DateTime.UtcNow;
            order.Status = "Pending";

            // 2. Save to Supabase
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 3. TODO: SEND EMAIL NOTIFICATION
            // Logic: SendEmailToAdmin(order);
            Console.WriteLine($"New Order Alert: Order #{order.Id} received from {order.CustomerName}");

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        // PATCH: api/Orders/5/status (Used by Admin to mark as 'Delivered')
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = newStatus;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        // GET: api/Orders/my-orders?email=user@example.com
[HttpGet("my-orders")]
public async Task<ActionResult<IEnumerable<Order>>> GetMyOrders([FromQuery] string email)
{
    return await _context.Orders
        .Where(o => o.UserEmail == email)
        .OrderByDescending(o => o.OrderDate)
        .ToListAsync();
}
    }
}