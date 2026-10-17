# Base image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
# Install libfontconfig1 for QuestPDF/SkiaSharp PDF rendering in Linux
RUN apt-get update \
    && apt-get install -y --no-install-recommends libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

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

# Final production image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy seeding SQL scripts to root and scripts/database/ for reliable discovery
COPY scripts/database/BuilderProComplete_MaterialMaster_5000.sql ./
COPY scripts/database/BuilderProComplete_MaterialMaster_5000_pg.sql ./
COPY scripts/database/BuilderProComplete_MaterialMaster_5000*.sql ./scripts/database/
ENTRYPOINT ["dotnet", "BuilderProAPI.dll"]
