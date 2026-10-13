//! Loading Dock Ledger: reference solution.

/// The direction of a stock movement.
#[derive(Debug, Clone, PartialEq)]
pub enum Kind {
    Inbound,
    Outbound,
}

/// One validated line of a ledger.
#[derive(Debug, Clone, PartialEq)]
pub struct Movement {
    pub sku: String,
    pub kind: Kind,
    pub quantity: u32,
}

/// Why a single line was rejected.
#[derive(Debug, Clone, PartialEq)]
pub enum ParseError {
    /// The line did not have exactly three fields. Carries the number found.
    WrongFieldCount(usize),
    /// Each of these carries the offending field, trimmed.
    InvalidSku(String),
    UnknownKind(String),
    InvalidQuantity(String),
}

/// A `ParseError` together with the 1-based number of the line it came from.
#[derive(Debug, Clone, PartialEq)]
pub struct LineError {
    pub line: usize,
    pub error: ParseError,
}

/// Parses one line of the form `SKU,KIND,QUANTITY`.
pub fn parse_movement(line: &str) -> Result<Movement, ParseError> {
    let fields: Vec<&str> = line.split(',').map(str::trim).collect();
    // A slice pattern checks the length and names the fields in one step.
    let [sku, kind, quantity] = fields[..] else {
        return Err(ParseError::WrongFieldCount(fields.len()));
    };
    // Field expressions run in the order they are written, so the first
    // invalid field from the left is the one that is reported.
    Ok(Movement {
        sku: parse_sku(sku)?,
        kind: parse_kind(kind)?,
        quantity: parse_quantity(quantity)?,
    })
}

fn parse_sku(field: &str) -> Result<String, ParseError> {
    let allowed = |c: char| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '-';
    // The rule is stated in characters, and `len()` counts bytes.
    let length = field.chars().count();
    if (3..=12).contains(&length) && field.chars().all(allowed) {
        Ok(field.to_string())
    } else {
        Err(ParseError::InvalidSku(field.to_string()))
    }
}

fn parse_kind(field: &str) -> Result<Kind, ParseError> {
    match field {
        "IN" => Ok(Kind::Inbound),
        "OUT" => Ok(Kind::Outbound),
        other => Err(ParseError::UnknownKind(other.to_string())),
    }
}

fn parse_quantity(field: &str) -> Result<u32, ParseError> {
    // `parse::<u32>` already rejects signs, decimals, text and values that do
    // not fit; zero is the one case left to rule out.
    match field.parse::<u32>() {
        Ok(quantity) if quantity > 0 => Ok(quantity),
        _ => Err(ParseError::InvalidQuantity(field.to_string())),
    }
}

/// Parses a whole upload, skipping blank lines and `#` comments.
pub fn parse_ledger(text: &str) -> Result<Vec<Movement>, LineError> {
    let mut movements = Vec::new();
    for (index, raw) in text.lines().enumerate() {
        let line = raw.trim();
        // Decide about skipping before splitting: a comment may contain commas.
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let movement = parse_movement(line).map_err(|error| LineError {
            line: index + 1,
            error,
        })?;
        movements.push(movement);
    }
    Ok(movements)
}

/// Inbound minus outbound quantity for one SKU.
pub fn net_quantity(movements: &[Movement], sku: &str) -> i64 {
    movements
        .iter()
        .filter(|movement| movement.sku == sku)
        // Widen to i64 before negating: the sum of many u32 values, and any
        // negative total, both need the larger signed type.
        .map(|movement| match movement.kind {
            Kind::Inbound => i64::from(movement.quantity),
            Kind::Outbound => -i64::from(movement.quantity),
        })
        .sum()
}
