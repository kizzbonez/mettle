"""Tool Library: the tools a neighbourhood lends to its members."""


class Tool:
    """A tool that members can borrow for a deposit."""

    made = 0

    def __init__(self, name, deposit):
        self.name = name
        self.deposit = deposit
        self.borrower = None
        self.loans = []
        Tool.made += 1

    def lend(self, person):
        """Lend the tool to person; ValueError if it is already lent."""
        if self.borrower is not None:
            raise ValueError(f"{self.name} is already lent to {self.borrower}")
        self.borrower = person
        self.loans.append(person)

    def give_back(self):
        """Take the tool back and return who had it; ValueError if it was not lent."""
        if self.borrower is None:
            raise ValueError(f"{self.name} is not lent")
        person = self.borrower
        self.borrower = None
        return person

    def is_available(self):
        return self.borrower is None

    def __repr__(self):
        return f"Tool({self.name!r}, {self.deposit!r})"

    def __str__(self):
        if self.borrower is None:
            return f"{self.name}: available"
        return f"{self.name}: lent to {self.borrower}"
