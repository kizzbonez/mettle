// Bakery Boxes
//
// A readonly struct for box sizes, a flags enum for allergens, an ordinary
// enum for cake sizes, and a method that returns two numbers as a tuple.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>The inside of a cake box, in centimetres.</summary>
public readonly struct BoxSize
{
    // Complete: nothing to write here.
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
    public int Volume => throw new NotImplementedException();

    /// <summary>Hands out the width, the depth and the height, in that order.</summary>
    public void Deconstruct(out int width, out int depth, out int height)
    {
        throw new NotImplementedException();
    }

    /// <summary>The size as it is printed on the box, such as 20x20x10.</summary>
    public override string ToString() => throw new NotImplementedException();
}

/// <summary>The allergens in a recipe. Complete: do not change it.</summary>
[Flags]
public enum Allergen
{
    None = 0,
    Gluten = 1,
    Milk = 2,
    Egg = 4,
    Nuts = 8,
}

/// <summary>The cake sizes on the price list, numbered by diameter in centimetres. Complete.</summary>
public enum CakeSize
{
    Small = 16,
    Medium = 20,
    Large = 24,
}

public static class Bakery
{
    /// <summary>Whether the recipe contains none of the allergens the customer avoids.</summary>
    public static bool IsSafeFor(Allergen recipe, Allergen avoided)
    {
        throw new NotImplementedException();
    }

    /// <summary>The recipe with every removed allergen taken out.</summary>
    public static Allergen Without(Allergen recipe, Allergen removed)
    {
        throw new NotImplementedException();
    }

    /// <summary>The cake size with this diameter, or null if the price list has none.</summary>
    public static CakeSize? SizeFor(int centimetres)
    {
        throw new NotImplementedException();
    }

    /// <summary>How many boxes the order fills completely, and how many cakes are left over.</summary>
    public static (int Full, int Left) Pack(int cakes, int perBox)
    {
        throw new NotImplementedException();
    }
}
