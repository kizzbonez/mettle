// The hotel's guest Wi-Fi lets guests choose their own password, and rates it
// while they type.
//
// The tests call passwordRating with different passwords. Lesson 7 explains
// functions; for now, write only inside the function, where it says YOUR CODE.

export function passwordRating(password: string): string {
  let digits = 0;
  let capitals = 0;
  let hasSpace = false;

  for (const char of password) {
    if (char === " ") {
      hasSpace = true;
      break;
    }
    if (char >= "0" && char <= "9") {
      digits++;
    } else if (char >= "A" && char <= "Z") {
      capitals++;
    }
  }

  if (hasSpace) {
    return "invalid";
  } else if (password.length < 8) {
    return "weak";
  } else if (password.length >= 12 && digits > 0 && capitals > 0) {
    return "strong";
  } else {
    return "fair";
  }
}
