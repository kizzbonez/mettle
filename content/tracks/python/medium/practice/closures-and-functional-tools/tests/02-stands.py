lemon = make_stand(3)
carrot = make_stand(10)
assert callable(lemon), "make_stand returns a function"
assert lemon() == 1, "sell() without an argument sells one slice"
assert carrot(4) == 4, "a second stand sells from its own stock"
assert lemon(5) == 2, "a stand sells only what it has left"
assert lemon(1) == 0, "an empty stand sells nothing"
assert carrot(6) == 6, "selling at one stand does not change another stand's stock"
assert carrot() == 0, "a stand is empty after selling exactly its stock"

ginger = make_stand(4)
assert ginger(0) == 0, "asking for no slices sells none"
assert ginger(4) == 4, "asking for exactly what is left sells it all"
assert make_stand(0)(3) == 0, "a stand that starts with no slices sells nothing"

again = make_stand(3)
assert again(2) == 2 and make_stand(3)(3) == 3, "a new stand made with the same stock starts full"
