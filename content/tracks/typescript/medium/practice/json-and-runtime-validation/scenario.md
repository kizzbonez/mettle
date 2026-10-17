A neighbourhood's community fridge takes food donations logged through a phone form that sends
JSON. The form does not check much: names arrive with stray spaces, portions as text, and dates
that do not exist, so every message is checked before it reaches the fridge's list.
