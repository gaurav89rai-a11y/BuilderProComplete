using System.ComponentModel.DataAnnotations;

namespace BuilderProAPI.Models;

public class SystemConfig
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Value { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Color { get; set; }

    public bool IsDefault { get; set; }

    public int SortOrder { get; set; }
}
