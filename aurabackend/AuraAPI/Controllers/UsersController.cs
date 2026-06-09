using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraAPI.Data;
using AuraAPI.Model;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

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
        public async Task<ActionResult> Register([FromBody] User user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest("Invalid registration payload. Email and Password are required.");
            }

            string emailLower = user.Email.ToLower();

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == emailLower))
            {
                return BadRequest("This email is already part of the Aura community.");
            }

            user.Email = emailLower;

            _context.Users.Add(user);
            await _context.SaveChangesAsync(); 

            return Ok(new {
                fullName = user.FullName,
                email = user.Email,
                wishlist = new List<Product>()
            });
        }

        // 2. LOGIN: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] User loginData)
        {
            if (loginData == null || string.IsNullOrWhiteSpace(loginData.Email) || string.IsNullOrWhiteSpace(loginData.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => 
                    u.Email.ToLower() == loginData.Email.ToLower() && 
                    u.Password == loginData.Password);

            if (user == null) 
            {
                return Unauthorized("Invalid email or password.");
            }

            // Eagerly load the user's wishlist products from the decoupled join table
            var productIds = await _context.WishlistItems
                .Where(w => w.UserEmail.ToLower() == user.Email.ToLower())
                .Select(w => w.ProductId)
                .ToListAsync();

            var wishlistProducts = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            return Ok(new {
                fullName = user.FullName,
                email = user.Email,
                wishlist = wishlistProducts.Select(p => new {
                    id = p.Id,
                    name = p.Name,
                    price = p.Price,
                    img = p.Img,
                    category = p.Category,
                    status = p.Status
                }).ToList()
            });
        }
        
        // 3. GET ALL: api/Users (For Dashboard)
        [HttpGet]
        public async Task<ActionResult> GetUsers()
        {
            var usersList = await _context.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
            var results = new List<object>();

            foreach (var user in usersList)
            {
                var productIds = await _context.WishlistItems
                    .Where(w => w.UserEmail.ToLower() == user.Email.ToLower())
                    .Select(w => w.ProductId)
                    .ToListAsync();

                var wishlistProducts = await _context.Products
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                results.Add(new {
                    fullName = user.FullName,
                    email = user.Email,
                    wishlist = wishlistProducts
                });
            }

            return Ok(results);
        }

        // 4. UPDATE WISHLIST: api/Users/wishlist
        [HttpPut("wishlist")]
        public async Task<IActionResult> UpdateWishlist([FromBody] WishlistUpdateRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest("Invalid request payload. Email is required.");
                }

                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
                if (!userExists)
                {
                    return NotFound("User not found.");
                }

                // Remove existing wishlist records for this user
                var oldItems = _context.WishlistItems.Where(w => w.UserEmail.ToLower() == request.Email.ToLower());
                _context.WishlistItems.RemoveRange(oldItems);

                // Add the new wishlist records
                if (request.ProductIds != null && request.ProductIds.Count > 0)
                {
                    foreach (var productId in request.ProductIds)
                    {
                        _context.WishlistItems.Add(new WishlistItem 
                        { 
                            UserEmail = request.Email.ToLower(), 
                            ProductId = productId 
                        });
                    }
                }

                await _context.SaveChangesAsync();

                // Load the freshly synced list of products to return
                var productIds = request.ProductIds ?? new List<int>();
                var products = await _context.Products
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                return Ok(new {
                    email = request.Email,
                    wishlist = products.Select(p => new {
                        id = p.Id,
                        name = p.Name,
                        price = p.Price,
                        img = p.Img,
                        category = p.Category,
                        status = p.Status
                    }).ToList()
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new {
                    errorMessage = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }

    public class WishlistUpdateRequest
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("productIds")]
        public List<int> ProductIds { get; set; }
    }
}