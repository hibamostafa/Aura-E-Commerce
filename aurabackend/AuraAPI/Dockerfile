# Change the build SDK to 10.0 to match your project target
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["AuraAPI.csproj", "./"]
RUN dotnet restore "./AuraAPI.csproj"
COPY . .
RUN dotnet publish "AuraAPI.csproj" -c Release -o /app/publish

# Change the runtime image to 10.0
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AuraAPI.dll"]