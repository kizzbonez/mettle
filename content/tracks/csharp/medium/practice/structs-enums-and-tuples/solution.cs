// Bakery Boxes
//
// A readonly struct for box sizes, a flags enum for allergens, an ordinary
// enum for cake sizes, and a method that returns two numbers as a tuple.

/// <summary>The inside of a cake box, in centimetres.</summary>
public readonly struct BoxSize
{
    public BoxSize(int width, int depth, int height)
    {
        Width = width;
        Depth = depth;
        Height = height;
    }

    public int Width { get; }
    public int Depth { get; }
    public int Height { get; }

    /// <summary>The space inside the box, in cubic centimetres.</summary>
    public int Volume => Width * Depth * Height;   // computed on every read

    /// <summary>Hands out the width, the depth and the height, in that order.</summary>
    public void Deconstruct(out int width, out int depth, out int height)
    {
        width = Width;
        depth = Depth;
        height = Height;
    }

    /// <summary>The size as it is printed on the box, such as 20x20x10.</summary>
    public override string ToString() => $"{Width}x{Depth}x{Height}";
}

/// <summary>The allergens in a recipe.</summary>
[Flags]
public enum Allergen
{
    None = 0,
    Gluten = 1,
    Milk = 2,
    Egg = 4,
    Nuts = 8,
}

/// <summary>The cake sizes on the price list, numbered by diameter in centimetres.</summary>
public enum CakeSize
{
    Small = 16,
    Medium = 20,
    Large = 24,
}

public static class Bakery
{
    /// <summary>Whether the recipe contains none of the allergens the customer avoids.</summary>
    public static bool IsSafeFor(Allergen recipe, Allergen avoided) =>
        (recipe & avoided) == Allergen.None;   // & keeps only the allergens in both

    /// <summary>The recipe with every removed allergen taken out.</summary>
    public static Allergen Without(Allergen recipe, Allergen removed) =>
        recipe & ~removed;                      // ~ flips the bits, & clears them

    /// <summary>The cake size with this diameter, or null if the price list has none.</summary>
    public static CakeSize? SizeFor(int centimetres)
    {
        var size = (CakeSize)centimetres;   // any int converts, so check it
        return Enum.IsDefined(size) ? size : null;
    }

    /// <summary>How many boxes the order fills completely, and how many cakes are left over.</summary>
    public static (int Full, int Left) Pack(int cakes, int perBox) =>
        (cakes / perBox, cakes % perBox);
}
