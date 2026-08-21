# Base image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Image for building the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["BuilderProAPI/BuilderProAPI.csproj", "BuilderProAPI/"]
RUN dotnet restore "BuilderProAPI/BuilderProAPI.csproj"
COPY . .
WORKDIR "/src/BuilderProAPI"
RUN dotnet build "BuilderProAPI.csproj" -c Release -o /app/build

# Publish the app
FROM build AS publish
RUN dotnet publish "BuilderProAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy seeding SQL scripts
COPY BuilderProComplete_MaterialMaster_5000.sql .
COPY BuilderProComplete_MaterialMaster_5000_pg.sql .
ENTRYPOINT ["dotnet", "BuilderProAPI.dll"]
