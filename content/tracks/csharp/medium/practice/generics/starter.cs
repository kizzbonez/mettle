// Animal Shelter
//
// Two generic methods, one that needs a constraint and one that needs none,
// and a generic class whose constraints let it create and name its animals.
//
// Every "throw new NotImplementedException();" below marks code you still have to write.
// Until you replace one, the test that reaches it fails and says that part is not written yet.

/// <summary>Every animal the shelter takes in. Complete: do not change it.</summary>
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
    // TODO 1: add the constraint that lets the body call CompareTo.
    public static T Clamp<T>(T value, T low, T high)
    {
        throw new NotImplementedException();
    }

    /// <summary>How many of the items are equal to the wanted value.</summary>
    public static int CountOf<T>(T[] items, T wanted)
    {
        throw new NotImplementedException();
    }
}

/// <summary>A kennel block for one kind of animal.</summary>
// TODO 3: add the constraints that let Admit create a TAnimal and set its Id and Name.
public class Kennel<TAnimal>
{
    // TODO 3: add the fields the kennel needs.

    /// <summary>The number of animals in the kennel.</summary>
    public int Count => throw new NotImplementedException();

    /// <summary>Creates, names, numbers and keeps a new animal.</summary>
    public TAnimal Admit(string name)
    {
        throw new NotImplementedException();
    }

    /// <summary>The animal with this id, or null if there is none.</summary>
    public TAnimal? Find(int id)
    {
        throw new NotImplementedException();
    }
}
