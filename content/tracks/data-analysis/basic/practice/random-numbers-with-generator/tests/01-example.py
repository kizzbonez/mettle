import numpy as np

rolls = roll_dice(np.random.default_rng(7), 3, 2)
assert isinstance(rolls, np.ndarray) and rolls.shape == (3, 2), "roll_dice(rng, 3, 2) has shape (3, 2)"
check_array(rolls, np.array([[6, 4], [5, 6], [4, 5]]), "roll_dice with seed 7, as in the example")

guests = np.array(["Ada", "Bea", "Cal", "Dot", "Eve"])
seats = seating(guests, np.random.default_rng(7))
assert isinstance(seats, np.ndarray), "seating returns an array"
check_array(seats, np.array(["Cal", "Ada", "Eve", "Bea", "Dot"]), "seating with seed 7, as in the example")
check_array(guests, np.array(["Ada", "Bea", "Cal", "Dot", "Eve"]), "seating leaves guests in their original order")

deck = np.array(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"])
hand = deal_hand(deck, 5, np.random.default_rng(7))
assert isinstance(hand, np.ndarray), "deal_hand returns an array"
check_array(hand, np.array(["7", "8", "9", "K", "J"]), "deal_hand with seed 7, as in the example")
