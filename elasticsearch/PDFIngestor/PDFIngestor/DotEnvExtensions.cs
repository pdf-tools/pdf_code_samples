using Microsoft.Extensions.Configuration;
using System.IO;

namespace PDFIngestor
{
    public static class DotEnvExtensions
    {
        public static IConfigurationBuilder AddDotEnvFile(this IConfigurationBuilder builder)
        {
            var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
            if (File.Exists(envPath))
            {
                var envLines = File.ReadAllLines(envPath);
                var envDictionary = new Dictionary<string, string?>();

                foreach (var line in envLines)
                {
                    var parts = line.Split('=', 2);
                    if (parts.Length == 2)
                    {
                        var key = parts[0].Trim();
                        var value = parts[1].Trim();
                        envDictionary[key] = value;
                    }
                }

                builder.AddInMemoryCollection(envDictionary);
            }
            return builder;
        }
    }
}
