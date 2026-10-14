/** The namespaces a new console project imports, so a learner writes C# the usual way. */
export const CSHARP_USINGS = [
  'global using System;',
  'global using System.Collections.Generic;',
  'global using System.IO;',
  'global using System.Linq;',
  'global using System.Text;',
  'global using System.Threading;',
  'global using System.Threading.Tasks;',
  '',
].join('\n');

/**
 * The checks every C# test body can call. Arguments run actual, expected,
 * message, as in the other languages. `Printed.By(() => ...)` returns what
 * the code wrote to the console, so a lab about Console.WriteLine can check
 * the output itself.
 */
export const CSHARP_CHECKS = String.raw`static class Printed
{
    public static string By(Action action)
    {
        var original = Console.Out;
        var writer = new StringWriter();
        Console.SetOut(writer);
        try { action(); }
        finally { Console.SetOut(original); }
        return writer.ToString();
    }
}

sealed class CheckFailed(string message) : Exception(message);

static class Check
{
    public static void True(bool condition, string message)
    {
        if (!condition) throw new CheckFailed(message);
    }

    public static void Equal<T>(T actual, T expected, string message)
    {
        if (!EqualityComparer<T>.Default.Equals(actual, expected)) throw new CheckFailed(Report(message, actual, expected));
    }

    public static void SequenceEqual<T>(IEnumerable<T> actual, IEnumerable<T> expected, string message)
    {
        if (!actual.SequenceEqual(expected)) throw new CheckFailed(Report(message, actual, expected));
    }

    public static void Throws<TException>(Action action, string message) where TException : Exception
    {
        try { action(); }
        catch (TException) { return; }
        catch (Exception) { }
        throw new CheckFailed(message);
    }

    public static async Task ThrowsAsync<TException>(Func<Task> action, string message) where TException : Exception
    {
        try { await action(); }
        catch (TException) { return; }
        catch (Exception) { }
        throw new CheckFailed(message);
    }

    static string Report(string message, object? actual, object? expected) =>
        $"{message}\n  expected: {Show(expected)}\n  actual:   {Show(actual)}";

    static string Show(object? value) => value switch
    {
        null => "null",
        string text => "\"" + text + "\"",
        System.Collections.IEnumerable items => "[" + string.Join(", ", items.Cast<object?>().Select(Show)) + "]",
        IFormattable number => number.ToString(null, System.Globalization.CultureInfo.InvariantCulture),
        _ => value.ToString() ?? "",
    };
}
`;
