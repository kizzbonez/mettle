/**
 * The top of the generated `main.cpp`: the standard headers a test may need
 * (a test body is the inside of a function, so it cannot include its own),
 * the learner's file, and the checks every test body can call.
 *
 * A `main` in the learner's file is renamed while the file is included, so
 * keeping one for local experiments does not clash with the harness.
 */
export const CPP_PRELUDE = String.raw`#include <algorithm>
#include <array>
#include <atomic>
#include <chrono>
#include <cmath>
#include <concepts>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <functional>
#include <future>
#include <iostream>
#include <limits>
#include <map>
#include <memory>
#include <mutex>
#include <numeric>
#include <optional>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <thread>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <variant>
#include <vector>

#define main mettle_learner_main
#include "solution.cpp"
#undef main

#pragma GCC diagnostic ignored "-Wunused-variable"
#pragma GCC diagnostic ignored "-Wunused-but-set-variable"
#pragma GCC diagnostic ignored "-Wunused-parameter"
#pragma GCC diagnostic ignored "-Wsign-compare"

namespace mettle {

struct Failure {
    std::string message;
};

[[noreturn]] inline void fail(const std::string& message) { throw Failure{message}; }

template <typename T>
concept Printable = requires(std::ostream& out, const T& value) { out << value; };

template <typename T>
concept Listable = !Printable<T> && requires(const T& value) { std::begin(value); std::end(value); };

/** A value as text for a failure report: streamable values, and containers of them. */
template <typename T>
std::string show(const T& value) {
    std::ostringstream out;
    if constexpr (Printable<T>) {
        out << std::boolalpha << value;
    } else if constexpr (Listable<T>) {
        out << '[';
        bool first = true;
        for (const auto& item : value) {
            out << (first ? "" : ", ") << show(item);
            first = false;
        }
        out << ']';
    } else {
        out << "(a value that cannot be printed)";
    }
    return out.str();
}

template <typename Actual, typename Expected>
void check_eq(const Actual& actual, const Expected& expected, const std::string& message) {
    if (!(actual == expected)) fail(message + "\n  expected: " + show(expected) + "\n  actual:   " + show(actual));
}

}  // namespace mettle

#define CHECK(condition, message) \
    do { if (!(condition)) ::mettle::fail(message); } while (false)
#define CHECK_EQ(actual, expected, message) ::mettle::check_eq((actual), (expected), (message))
#define CHECK_THROWS(expression, exception_type, message) \
    do { \
        bool mettle_thrown = false; \
        try { (void)(expression); } catch (const exception_type&) { mettle_thrown = true; } catch (...) {} \
        if (!mettle_thrown) ::mettle::fail(message); \
    } while (false)
`;
