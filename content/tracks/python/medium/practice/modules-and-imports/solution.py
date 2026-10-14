"""Raffle Draw: the draw program for the school fair."""

import random

import raffle_data


def draw(tickets, prizes, seed):
    """Seed random, sample the winning tickets once and pair them with the prizes."""
    random.seed(seed)
    winners = random.sample(tickets, min(len(prizes), len(tickets)))
    return list(zip(prizes, winners))


def public_names(module):
    """The names dir(module) gives that do not start with an underscore."""
    return [name for name in dir(module) if not name.startswith("_")]


if __name__ == "__main__":
    for prize, ticket in draw(raffle_data.TICKETS, raffle_data.PRIZES, raffle_data.SEED):
        print(f"{prize}: ticket {ticket}")
