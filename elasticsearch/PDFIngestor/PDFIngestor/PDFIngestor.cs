using PdfTools.FourHeights.PdfToolbox;
using PdfTools.FourHeights.PdfToolbox.Geometry.Real;
using PdfTools.FourHeights.PdfToolbox.Pdf.Content;
using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Document = PdfTools.FourHeights.PdfToolbox.Pdf.Document;

namespace PDFIngestor
{
    public class PDFIngestor
    {
        private readonly string? _elasticUsername;
        private readonly string? _elasticPassword;
        private readonly Uri _elasticUrl;
        private readonly HttpClient _client;

        public PDFIngestor(string? elasticUsername, string? elasticPassword, string elasticUrl)
        {
            _elasticUsername = elasticUsername;
            _elasticPassword = elasticPassword;
            _elasticUrl = new Uri(elasticUrl);

            var handler = new HttpClientHandler
            {
                ClientCertificateOptions = ClientCertificateOption.Manual,
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true
            };

            _client = new HttpClient(handler);
            
            if (!string.IsNullOrEmpty(_elasticUsername) && !string.IsNullOrEmpty(_elasticPassword))
            {
                string base64 = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_elasticUsername}:{_elasticPassword}"));
                _client.DefaultRequestHeaders.Add("Authorization", $"Basic {base64}");
            }
        }

        private static (string, HashSet<string>) WriteText(Text text)
        {
            string textPart = "";
            HashSet<string> elementFontList = new();

            // Write all text fragments
            // Determine heuristically if there is a space between two text fragments
            for (int iFragment = 0; iFragment < text.Count; iFragment++)
            {
                TextFragment currFragment = text[iFragment];
                elementFontList.Add(currFragment.Font.BaseFont);

                if (iFragment == 0)
                    textPart += currFragment.Text;
                else
                {
                    TextFragment lastFragment = text[iFragment - 1];
                    if (currFragment.CharacterSpacing != lastFragment.CharacterSpacing ||
                        currFragment.FontSize != lastFragment.FontSize ||
                        currFragment.HorizontalScaling != lastFragment.HorizontalScaling ||
                        currFragment.Rise != lastFragment.Rise ||
                        currFragment.WordSpacing != lastFragment.WordSpacing)
                        textPart += $" {currFragment.Text}";
                    else
                    {
                        Point currentBotLeft = currFragment.Transform.TransformRectangle(currFragment.BoundingBox).BottomLeft;
                        Point beforeBotRight = lastFragment.Transform.TransformRectangle(lastFragment.BoundingBox).BottomRight;

                        if (beforeBotRight.X < currentBotLeft.X - 0.7 * currFragment.FontSize ||
                            beforeBotRight.Y < currentBotLeft.Y - 0.1 * currFragment.FontSize ||
                            currentBotLeft.Y < beforeBotRight.Y - 0.1 * currFragment.FontSize)
                            textPart += $" {currFragment.Text}";
                        else
                            textPart += currFragment.Text;
                    }
                }
            }

            return (textPart, elementFontList);
        }

        private async Task ProcessPdfFile(string filePath)
        {
            StringBuilder builder = new();
            // Open input document
            using (Stream inStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            using (Document doc = Document.Open(inStream, null))
            {
                HashSet<string> fontNames = new();
                // Process each page
                foreach (var inPage in doc.Pages)
                {
                    ContentExtractor extractor = new ContentExtractor(inPage.Content);
                    extractor.Ungrouping = UngroupingSelection.All;

                    // Iterate over all content elements and only process text elements
                    foreach (ContentElement element in extractor)
                        if (element is TextElement textElement)
                        {
                            var result = WriteText(textElement.Text);
                            builder.Append(result.Item1);
                            foreach (var item in result.Item2)
                            {
                                fontNames.Add(item);
                            }
                        }
                }

                StringContent content = new(JsonSerializer.Serialize(new
                {
                    fileName = System.IO.Path.GetFileName(filePath),
                    data = builder.ToString(),
                    author = doc.Metadata.Author,
                    title = doc.Metadata.Title,
                    creator = doc.Metadata.Creator,
                    producer = doc.Metadata.Producer,
                    subject = doc.Metadata.Subject,
                    numberOfPages = doc.Pages.Count,
                    modDate = doc.Metadata.ModificationDate,
                    conformance = doc.Conformance.ToString(),
                    signatureFieldExists = doc.SignatureFields.Count > 0,
                    fontNames = fontNames
                }), Encoding.UTF8, "application/json");

                var response = await _client.PostAsync(_elasticUrl, content);
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Successfully added {filePath}.");
                }
                else
                {
                    Console.WriteLine($"Failed to add {filePath}. Error {response.ReasonPhrase}");
                }
            }
        }

        public async Task ProcessSingleExecution(string[] files)
        {
            foreach (var file in files)
            {
                if (File.Exists(file))
                {
                    await ProcessPdfFile(file);
                }
                else
                {
                    Console.WriteLine($"File not found: {file}");
                }
            }
        }

        public async Task WatchFolder(string folderPath)
        {
            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"Directory not found: {folderPath}");
                return;
            }

            // Process existing files
            string[] existingFiles = Directory.GetFiles(folderPath, "*.pdf");
            foreach (var file in existingFiles)
            {
                await ProcessPdfFile(file);
            }

            // Watch for new files
            using var watcher = new FileSystemWatcher(folderPath);
            watcher.NotifyFilter = NotifyFilters.Attributes
                                 | NotifyFilters.CreationTime
                                 | NotifyFilters.DirectoryName
                                 | NotifyFilters.FileName
                                 | NotifyFilters.LastAccess
                                 | NotifyFilters.LastWrite
                                 | NotifyFilters.Security
                                 | NotifyFilters.Size;

            watcher.Filter = "*.pdf";
            watcher.Created += async (sender, e) => await ProcessPdfFile(e.FullPath);
            watcher.EnableRaisingEvents = true;

            Console.WriteLine($"Watching folder {folderPath} for new PDF files. Press Ctrl+C to exit.");
            await Task.Delay(-1); // Run indefinitely
        }

        private static void ShowHelp()
        {
            Console.WriteLine("PDFIngestor - A tool to ingest PDF files into Elasticsearch");
            Console.WriteLine("\nUsage:");
            Console.WriteLine("  PDFIngestor watch <folder>      Watch a folder for new PDF files");
            Console.WriteLine("  PDFIngestor exec <file1> [file2...]  Process one or more PDF files");
            Console.WriteLine("\nOptional Parameters:");
            Console.WriteLine("  -e, --endpoint <url>   Elasticsearch endpoint URL");
            Console.WriteLine("                         (default: http://localhost:9200/convsrv/_doc)");
            Console.WriteLine("  -u, --username <user>  Elasticsearch username");
            Console.WriteLine("  -p, --password <pass>  Elasticsearch password");
            Console.WriteLine("\nEnvironment Variables:");
            Console.WriteLine("  The following environment variables can be set in a .env file:");
            Console.WriteLine("  ELASTIC_ENDPOINT  - Elasticsearch endpoint URL");
            Console.WriteLine("  ELASTIC_USER     - Elasticsearch username");
            Console.WriteLine("  ELASTIC_PASSWORD - Elasticsearch password");
        }

        private static async Task Main(string[] args)
        {
            try
            {
                if (args.Length == 0 || args[0] == "-h" || args[0] == "--help")
                {
                    ShowHelp();
                    return;
                }

                // Load configuration
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddEnvironmentVariables()
                    .AddDotEnvFile()
                    .Build();

                var licenseKey = configuration["PdfTools:LicenseKey"] 
                    ?? throw new InvalidOperationException("PdfTools:LicenseKey not found in configuration");
                
                Sdk.Initialize(licenseKey, "");

                string mode = args[0].ToLower();
                if (mode != "watch" && mode != "exec")
                {
                    Console.WriteLine("Invalid mode. Use 'watch' or 'exec'.");
                    return;
                }

                if (args.Length < 2)
                {
                    Console.WriteLine($"Error: {mode} mode requires at least one {(mode == "watch" ? "folder" : "file")} argument");
                    return;
                }

                // Parse optional parameters
                string endpoint = "http://localhost:9200/convsrv/_doc";
                string? username = null;
                string? password = null;
                List<string> targets = new();
                
                // Start from index 1 to skip the mode
                for (int i = 1; i < args.Length; i++)
                {
                    switch (args[i])
                    {
                        case "-e" or "--endpoint" when i + 1 < args.Length:
                            endpoint = args[++i];
                            break;
                        case "-u" or "--username" when i + 1 < args.Length:
                            username = args[++i];
                            break;
                        case "-p" or "--password" when i + 1 < args.Length:
                            password = args[++i];
                            break;
                        default:
                            if (!args[i].StartsWith("-"))
                                targets.Add(args[i]);
                            break;
                    }
                }

                // Check environment variables if credentials not provided
                endpoint = configuration["ELASTIC_ENDPOINT"] ?? endpoint;
                username = username ?? configuration["ELASTIC_USER"];
                password = password ?? configuration["ELASTIC_PASSWORD"];

                var ingestor = new PDFIngestor(username, password, endpoint);

                switch (mode)
                {
                    case "watch":
                        if (targets.Count != 1)
                        {
                            Console.WriteLine("Watch mode requires exactly one folder path.");
                            return;
                        }
                        await ingestor.WatchFolder(targets[0]);
                        break;

                    case "exec":
                        if (targets.Count == 0)
                        {
                            Console.WriteLine("Exec mode requires at least one file path.");
                            return;
                        }
                        await ingestor.ProcessSingleExecution(targets.ToArray());
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}