class Pet:
    def __init__(self, name, owner=None):
        self.name = name
        self.owner = owner

    def isAdopted(self):
        return self.owner != None


def find_pet(pets, name):
    for pet in pets:
        if pet.name == name or pet.owner == None and name == None:
            return pet
    return None


async def NotifyOwner(pet, mailer):
    if pet.owner == None:  # noqa: E711
        return
    await mailer.send(pet.owner, f"{pet.name} says hello")
