// Snowmaking Settings
//
// The controller of a ski resort's snow guns logs structured events through a
// small logger interface, and reads its settings from layered configuration
// into one options class that is checked before anything starts.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

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

    public bool IsEnabled(Level level)
    {
        throw new NotImplementedException();
    }

    public void Log(Level level, string template, params object?[] args)
    {
        throw new NotImplementedException();
    }
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
        throw new NotImplementedException();
    }

    /// <summary>Every rule the settings break, in a fixed order. Empty when they are valid.</summary>
    public string[] Validate()
    {
        throw new NotImplementedException();
    }
}
