---
title: Logging, Configuration and Options
summary: Emit structured logs through ILogger with the right level and template, layer configuration from files, environment and command line, bind it to validated options classes, and keep secrets out of both.
minutes: 30
objectives:
  - Write structured log calls with message templates, categories and levels, and explain why interpolation defeats them
  - Predict which configuration source wins when the same key is set in several places
  - Bind a configuration section to an options class, validate it at start-up, and choose between `IOptions`, `IOptionsSnapshot` and `IOptionsMonitor`
  - Decide what must never appear in logs or committed configuration
---

## Outline

1. Structured logging with `ILogger`
2. Log levels and filtering
3. Configuration sources
4. The options pattern
5. What not to log

## Structured logging with `ILogger`

A log line written for a human, `Order 4471 shipped to NO`, has to be taken apart with a regular
expression before a machine can count it. **Structured logging** keeps the values as named
fields next to the message, so a log store can filter `OrderId = 4471` or count shipments per
country. In .NET the API is `ILogger` from `Microsoft.Extensions.Logging`, a NuGet package that
ASP.NET Core and the generic host include. This fragment shows its use and does not run in the
sandbox:

```csharp
public sealed partial class ShippingService(ILogger<ShippingService> logger)
{
    public void Ship(int orderId, string country)
    {
        logger.LogInformation("Order {OrderId} shipped to {Country}", orderId, country);
        LogDelayed(logger, orderId, TimeSpan.FromHours(3));
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Order {OrderId} delayed by {Delay}")]
    static partial void LogDelayed(ILogger logger, int orderId, TimeSpan delay);
}
```

- The **category** is the type argument of `ILogger<T>`, conventionally the full class name. It
  says where an event came from and is what filters match on.
- The string is a **message template**, not a format string. Each `{Name}` placeholder becomes
  a field. Placeholders bind to arguments **by position**, not by name, so keep them in order.
- The `[LoggerMessage]` attribute makes a source generator write the logging method at compile
  time. Microsoft recommends it for hot paths: it is strongly typed and avoids work when the
  level is disabled. The trade-off is a little more code per message.
- Pass an exception as the first argument (`logger.LogError(ex, "...")`) so its stack trace is
  kept, rather than formatting `ex.Message` into the text.

The library is a **facade**: your code calls `ILogger`, and the application configures
**providers** (console, OpenTelemetry, a file sink) that decide where events go. To see what a
structured logger does with a template, here is a tiny one built on the base class library:

```csharp
using System.Text.RegularExpressions;

var log = new TinyLogger(minimum: Level.Information);
log.Write(Level.Information, "Order {OrderId} shipped to {Country}", 4471, "NO");
log.Write(Level.Debug, "Cart has {Count} lines", 3);              // below the minimum: dropped
int orderId = 4472;
log.Write(Level.Warning, $"Order {orderId} is late");              // interpolated: no fields

enum Level { Trace, Debug, Information, Warning, Error, Critical }

sealed class TinyLogger(Level minimum)
{
    public void Write(Level level, string template, params object[] args)
    {
        if (level < minimum) return;                               // cheap check first
        string[] names = Regex.Matches(template, @"\{(\w+)\}").Select(m => m.Groups[1].Value).ToArray();
        int i = 0;
        string message = Regex.Replace(template, @"\{\w+\}", _ => args[i++].ToString()!);
        var fields = names.Zip(args, (n, a) => $"\"{n}\":\"{a}\"");
        Console.WriteLine($"{{\"level\":\"{level}\",{string.Join(",", fields.Prepend($"\"msg\":\"{message}\""))}}}");
    }
}
```

```text
{"level":"Information","msg":"Order 4471 shipped to NO","OrderId":"4471","Country":"NO"}
{"level":"Warning","msg":"Order 4472 is late"}
```

The interpolated call produced text only: the order id is no longer a field, every distinct id
makes a distinct template, and the string was built even if the level had been off. Analyzer
rule CA2254 warns about exactly this.

## Log levels and filtering

`LogLevel` runs `Trace` (0), `Debug`, `Information`, `Warning`, `Error`, `Critical` (5) and `None`
(6). Information tracks normal flow, Warning flags something unexpected that the app survived,
Error is a failed operation, and Critical needs someone now. Trace may contain sensitive data
and should stay off in production. Filters choose a minimum level per category prefix, usually
in configuration:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Billing.Gateway": "Debug"
    }
  }
}
```

The most specific prefix wins, so `Billing.Gateway.Client` logs Debug and above while everything
from `Microsoft...` logs Warning and above. Without any setting, the default is Information.

## Configuration sources

.NET configuration reads key and value pairs from **providers**, each reading one source, and
presents them as one `IConfiguration`. Keys are hierarchical with `:` as the separator
(`Billing:RetryCount`); environment variables use `__` instead, because `:` is not allowed in
variable names on every platform. `Host.CreateApplicationBuilder` adds, from lowest to highest
priority: `appsettings.json`, `appsettings.{Environment}.json`, user secrets (Development only),
environment variables and command-line arguments. **A source added later overrides earlier
ones.** This sketch of the same idea runs anywhere:

```csharp
var appsettings = new Dictionary<string, string> { ["Billing:RetryCount"] = "3", ["Billing:Endpoint"] = "https://billing.internal" };
var environment = new Dictionary<string, string> { ["Billing__RetryCount"] = "5" };
var commandLine = new Dictionary<string, string> { ["Billing:TimeoutSeconds"] = "0" };

var config = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
foreach (var source in new[] { appsettings, environment, commandLine })
    foreach (var (key, value) in source)
        config[key.Replace("__", ":")] = value;            // later sources win

var options = new BillingOptions();
if (config.TryGetValue("Billing:Endpoint", out var endpoint)) options.Endpoint = endpoint;
if (config.TryGetValue("Billing:RetryCount", out var retries)) options.RetryCount = int.Parse(retries);
if (config.TryGetValue("Billing:TimeoutSeconds", out var timeout)) options.TimeoutSeconds = int.Parse(timeout);

Console.WriteLine($"RetryCount={options.RetryCount} TimeoutSeconds={options.TimeoutSeconds}");
string[] errors = options.Validate();
Console.WriteLine(errors.Length == 0 ? "valid" : "refusing to start: " + string.Join("; ", errors));

sealed class BillingOptions
{
    public string Endpoint { get; set; } = "";
    public int RetryCount { get; set; } = 2;
    public int TimeoutSeconds { get; set; } = 30;

    public string[] Validate()
    {
        var errors = new List<string>();
        if (!Uri.TryCreate(Endpoint, UriKind.Absolute, out _)) errors.Add("Endpoint must be an absolute URL");
        if (RetryCount is < 0 or > 10) errors.Add("RetryCount must be 0 to 10");
        if (TimeoutSeconds < 1) errors.Add("TimeoutSeconds must be at least 1");
        return errors.ToArray();
    }
}
```

```text
RetryCount=5 TimeoutSeconds=0
refusing to start: TimeoutSeconds must be at least 1
```

The environment variable beat the file, and a bad value stopped the program at start-up instead
of at the first billing call at 3 a.m.

## The options pattern

The **options pattern** binds one configuration section to one small class, so each component
depends only on its own settings. An options class needs a public parameterless constructor and
public read-write properties. With the real packages (not runnable here):

```csharp
builder.Services.AddOptions<BillingOptions>()
    .Bind(builder.Configuration.GetSection("Billing"))
    .ValidateDataAnnotations()                       // [Required], [Range], [Url] on the properties
    .Validate(o => o.TimeoutSeconds >= 1, "TimeoutSeconds must be at least 1")
    .ValidateOnStart();                              // fail at start-up, not on first use

public sealed class BillingClient(IOptions<BillingOptions> options) { /* options.Value */ }
```

Three interfaces deliver the values. `IOptions<T>` is a singleton, computed once; later file
changes are not seen. `IOptionsSnapshot<T>` is scoped and recomputed per request, so it cannot be
injected into a singleton. `IOptionsMonitor<T>` is a singleton whose `CurrentValue` follows
reloadable sources and which can notify you of changes. Use `IOptions<T>` unless you have a
reason to reload.

## What not to log

Logs are copied, shipped, indexed and kept for months, and many people can read them. Never log
passwords, tokens, API keys, connection strings, card numbers or full personal data; logging a
whole request object, or the `ToString()` of a settings record, can leak all of them. Redact or omit such
fields, log identifiers instead of contents, and keep secrets out of `appsettings.json` and
source control: use user secrets in development and a secret store or environment variables in
production. Also avoid logging inside tight loops; one summary line beats a million.

## Common mistakes

- String interpolation in log calls.
- `Information` for per-item detail that floods the store; `Error` for expected conditions.
- Reading `IConfiguration["..."]` all over the code instead of binding options once.
- Validating configuration lazily, so a typo surfaces hours after deployment.
- Secrets in committed configuration files or in log messages.

## Practice

1. Rewrite `logger.LogInformation($"User {user.Id} paid {amount}")` correctly.
2. `appsettings.json` sets `Billing:RetryCount` to 3, the environment has `Billing__RetryCount=5`,
   and the command line passes `--Billing:RetryCount=7`. Which value does the app see?
3. A singleton needs the latest `FeatureFlags` after the JSON file changes. Which interface?

### Answers

1. `logger.LogInformation("User {UserId} paid {Amount}", user.Id, amount);` so both values
   become fields and the template stays constant.
2. 7: the command line is added last and overrides the environment, which overrides the file.
3. `IOptionsMonitor<FeatureFlags>`, reading `CurrentValue` each time. `IOptions` never reloads
   and `IOptionsSnapshot` is scoped, so a singleton cannot take it.

## Key takeaways

- Log with templates and named placeholders; never interpolate.
- Pick levels deliberately and filter by category in configuration.
- Later configuration sources override earlier ones; environment variables use `__`.
- Bind sections to options classes and validate them at start-up.
- Secrets belong in a secret store, never in logs or committed files.

## Further reading

- [Logging in C# and .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/logging/overview)
- [Configuration in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/configuration)
- [Options pattern in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/options)
