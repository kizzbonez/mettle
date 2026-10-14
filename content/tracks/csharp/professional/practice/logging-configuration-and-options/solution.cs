// Snowmaking Settings
//
// The controller of a ski resort's snow guns logs structured events through a
// small logger interface, and reads its settings from layered configuration
// into one options class that is checked before anything starts.

using System.Globalization;
using System.Text.RegularExpressions;

public enum Level { Trace, Debug, Information, Warning, Error, Critical, None }

/// <summary>Where finished log lines go: the console, a file, a log store.</summary>
public interface ILogSink
{
    void Write(string line);
}

/// <summary>A sink that keeps the lines in memory. The tests use it.</summary>
public sealed class ListSink : ILogSink
{
    public List<string> Lines { get; } = [];
    public void Write(string line) => Lines.Add(line);
}

/// <summary>The logger interface the controller's services depend on.</summary>
public interface ILog
{
    bool IsEnabled(Level level);
    void Log(Level level, string template, params object?[] args);
}

/// <summary>Writes each event as one line of key=value fields.</summary>
public sealed class LineLogger(string category, Level minimum, ILogSink sink) : ILog
{
    /// <summary>Field names whose values never reach a log, compared ignoring case.</summary>
    public static readonly string[] SecretNames = ["Password", "Token", "ApiKey", "ConnectionString"];

    private static readonly Regex Placeholder = new(@"\{(\w+)\}");

    public bool IsEnabled(Level level) => level != Level.None && level >= minimum;

    public void Log(Level level, string template, params object?[] args)
    {
        if (!IsEnabled(level)) return;   // the cheap check first: nothing is parsed or formatted

        string[] names = Placeholder.Matches(template).Select(match => match.Groups[1].Value).ToArray();
        if (names.Length != args.Length)
            throw new ArgumentException($"the template has {names.Length} placeholders and {args.Length} values were given", nameof(args));

        var line = new StringBuilder($"level={level} category={category} template=\"{template}\"");
        for (int i = 0; i < names.Length; i++)
        {
            // Placeholders bind to the values by position, not by name.
            string value = SecretNames.Contains(names[i], StringComparer.OrdinalIgnoreCase) ? "***" : Format(args[i]);
            line.Append(' ').Append(names[i]).Append('=').Append(value);
        }
        sink.Write(line.ToString());
    }

    private static string Format(object? value) => value switch
    {
        null => "null",
        IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
        _ => value.ToString() ?? "",
    };
}

/// <summary>The "Snow" section of the configuration.</summary>
public sealed class SnowOptions
{
    public string Endpoint { get; set; } = "";
    public int TargetDepthCm { get; set; } = 40;
    public int MaxPumps { get; set; } = 4;

    /// <summary>
    /// Layers the sources (a later one overrides an earlier one) and binds the
    /// keys of the "Snow" section. Keys ignore case; "__" stands for ":".
    /// </summary>
    public static SnowOptions Bind(params IReadOnlyDictionary<string, string>[] sources)
    {
        var config = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (IReadOnlyDictionary<string, string> source in sources)
            foreach (var (key, value) in source)
                config[key.Replace("__", ":")] = value;   // later sources win

        var options = new SnowOptions();
        if (config.TryGetValue("Snow:Endpoint", out string? endpoint)) options.Endpoint = endpoint;
        if (config.TryGetValue("Snow:TargetDepthCm", out string? depth)) options.TargetDepthCm = Number("Snow:TargetDepthCm", depth);
        if (config.TryGetValue("Snow:MaxPumps", out string? pumps)) options.MaxPumps = Number("Snow:MaxPumps", pumps);
        return options;
    }

    private static int Number(string key, string text) =>
        int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number)
            ? number
            : throw new FormatException($"{key} must be a whole number, and it is \"{text}\"");

    /// <summary>Every rule the settings break, in a fixed order. Empty when they are valid.</summary>
    public string[] Validate()
    {
        var errors = new List<string>();
        if (!Uri.TryCreate(Endpoint, UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            errors.Add("Endpoint must be an absolute http or https URL");
        if (TargetDepthCm is < 10 or > 200) errors.Add("TargetDepthCm must be 10 to 200");
        if (MaxPumps is < 1 or > 32) errors.Add("MaxPumps must be 1 to 32");
        return [.. errors];
    }
}
