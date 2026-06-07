using Microsoft.EntityFrameworkCore;
using AuraAPI.Model; // Matches your folder name

namespace AuraAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<User> Users { get; set; }
public DbSet<Order> Orders { get; set; }
    }
}