// Lobby Screen
//
// Each function below is a small program of its own, like `main` in the
// lesson. The tests call them and read what they print.

// Prints the welcome line.
pub fn welcome() {
    println!("Welcome to the Roxy!");
}

// Prints tonight's two showings, one per line.
pub fn showings() {
    println!("Screen 1: The Long Voyage");
    println!("Screen 2: Night Train");
}

// Prints the label that goes in front of a seat number.
pub fn seat_label() {
    print!("Your seat: ");
}
