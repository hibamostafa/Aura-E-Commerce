using AuraAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Get Connection String
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Configure JSON to stay simple for React
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keeps names exactly like C# (Name, Price)
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. Update CORS Policy to include your production Render URL
// 4. Unified CORS Policy (Allows both local development and both production Render URLs)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "http://localhost:3001",
                "https://aurafrontend.onrender.com",       // Your Live Storefront
                "https://aura-dashboard-9dir.onrender.com" // Your Live Admin Dashboard
              ) 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
var app = builder.Build();

// 5. Enable Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 6. USE CORS (Must be exactly here: after Routing, before Authorization/Map)
app.UseRouting();
// Redirect HTTP to HTTPS and ensure CORS works with Render (quic issues often from protocol)
app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

app.UseAuthorization();
app.MapControllers();

app.Run();