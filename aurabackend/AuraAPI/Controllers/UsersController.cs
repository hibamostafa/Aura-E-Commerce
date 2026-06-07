using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraAPI.Data;
using AuraAPI.Model;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AuraAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. REGISTER: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] User user) // Added [FromBody] to resolve model binding
        {
            // Null check prevents NullReferenceException when accessing user.Email
            if (user == null || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest("Invalid registration payload. Email and Password are required.");
            }

            // Normalize email to lowercase for comparison
            string emailLower = user.Email.ToLower();

            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == emailLower))
            {
                return BadRequest("This email is already part of the Aura community.");
            }

            // Ensure we save the email in a consistent format
            user.Email = emailLower;

            _context.Users.Add(user);
            
            // This line sends the data to Supabase
            await _context.SaveChangesAsync(); 

            return Ok(user);
        }

        // 2. LOGIN: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult<User>> Login([FromBody] User loginData)
        {
            if (loginData == null || string.IsNullOrWhiteSpace(loginData.Email) || string.IsNullOrWhiteSpace(loginData.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            // Search for user by email and password, including their unique Wishlist relationship
            var user = await _context.Users
                .Include(u => u.Wishlist)
                .FirstOrDefaultAsync(u => 
                    u.Email.ToLower() == loginData.Email.ToLower() && 
                    u.Password == loginData.Password);

            if (user == null) 
            {
                return Unauthorized("Invalid email or password.");
            }

            return Ok(user);
        }
        
        // 3. GET ALL: api/Users (For Dashboard)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users
                .Include(u => u.Wishlist)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        // 4. UPDATE WISHLIST: api/Users/wishlist
        // Keeps the database persistent and unique for each user
        [HttpPut("wishlist")]
        public async Task<IActionResult> UpdateWishlist([FromBody] WishlistUpdateRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Invalid request payload.");
            }

            var user = await _context.Users
                .Include(u => u.Wishlist)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.Wishlist ??= new List<Product>();
            user.Wishlist.Clear();

            if (request.ProductIds != null && request.ProductIds.Count > 0)
            {
                var products = await _context.Products
                    .Where(p => request.ProductIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var product in products)
                {
                    if (!user.Wishlist.Contains(product))
                    {
                        user.Wishlist.Add(product);
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Id,
                user.Email,
                Wishlist = user.Wishlist.Select(p => new { p.Id })
            });
        }
    }

    // DTO class to parse incoming update requests
    public class WishlistUpdateRequest
    {
        public string Email { get; set; }
        public List<int> ProductIds { get; set; }
    }
}