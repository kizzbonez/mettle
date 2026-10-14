// Animal Shelter
//
// Two generic methods, one that needs a constraint and one that needs none,
// and a generic class whose constraints let it create and name its animals.

/// <summary>Every animal the shelter takes in.</summary>
public abstract class Animal
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public abstract string Sound { get; }
}

public class Dog : Animal
{
    public override string Sound => "woof";
}

public class Cat : Animal
{
    public override string Sound => "meow";
}

public static class Shelter
{
    /// <summary>The value, kept between low and high.</summary>
    public static T Clamp<T>(T value, T low, T high) where T : IComparable<T>
    {
        if (value.CompareTo(low) < 0) return low;     // allowed by the constraint
        if (value.CompareTo(high) > 0) return high;
        return value;
    }

    /// <summary>How many of the items are equal to the wanted value.</summary>
    public static int CountOf<T>(T[] items, T wanted)
    {
        int count = 0;
        foreach (T item in items)
        {
            // An unconstrained T has no ==, and item may be null.
            if (EqualityComparer<T>.Default.Equals(item, wanted)) count++;
        }
        return count;
    }
}

/// <summary>A kennel block for one kind of animal.</summary>
public class Kennel<TAnimal> where TAnimal : Animal, new()
{
    private readonly List<TAnimal> animals = new();
    private int nextId = 1;

    /// <summary>The number of animals in the kennel.</summary>
    public int Count => animals.Count;

    /// <summary>Creates, names, numbers and keeps a new animal.</summary>
    public TAnimal Admit(string name)
    {
        var animal = new TAnimal();   // allowed by new()
        animal.Id = nextId++;         // allowed by the Animal constraint
        animal.Name = name;
        animals.Add(animal);
        return animal;
    }

    /// <summary>The animal with this id, or null if there is none.</summary>
    public TAnimal? Find(int id)
    {
        foreach (TAnimal animal in animals)
        {
            if (animal.Id == id) return animal;
        }
        return null;   // TAnimal is a class, so TAnimal? can be null
    }
}
