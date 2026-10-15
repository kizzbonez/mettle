import numpy as np

deck = np.array([f"{rank}{suit}" for suit in "SHDC" for rank in ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]])
before = deck.copy()
hand = deal_hand(deck, 13, np.random.default_rng(1618))
assert isinstance(hand, np.ndarray) and hand.shape == (13,), "deal_hand returns size cards"
assert len(np.unique(hand)) == 13, "the cards in a hand are all different"
check_array(hand, np.random.default_rng(1618).choice(before, size=13, replace=False), "deal_hand makes the one draw the instructions describe")
check_array(deck, before, "deal_hand does not change deck")

rng = np.random.default_rng(8)
first = deal_hand(deck, 5, rng)
second = deal_hand(deck, 5, rng)
replay = np.random.default_rng(8)
check_array(first, replay.choice(before, size=5, replace=False), "deal_hand draws from the rng it is given")
check_array(second, replay.choice(before, size=5, replace=False), "a second call continues the same rng")

small = np.array(["red", "blue", "green"])
whole = deal_hand(small, 3, np.random.default_rng(3))
check_array(np.sort(whole), np.sort(small), "dealing the whole deck gives every card once")
none = deal_hand(small, 0, np.random.default_rng(3))
assert np.shape(none) == (0,), "a hand of 0 cards is empty"

try:
    deal_hand(small, 4, np.random.default_rng(3))
except ValueError:
    pass
else:
    raise AssertionError("asking for more cards than the deck holds raises ValueError")
