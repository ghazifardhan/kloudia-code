#include <ftxui/component/component.hpp>
#include <ftxui/component/screen_interactive.hpp>
#include <ftxui/dom/elements.hpp>
#include <string>

using namespace ftxui;

int main() {
    auto screen = ScreenInteractive::TerminalOutput();

    std::string display = "0";
    double stored_val = 0;
    char current_op = 0;
    bool new_input = true;

    auto press_num = [&](const std::string& digit) {
        if (new_input || display == "0") {
            display = digit;
            new_input = false;
        } else {
            display += digit;
        }
    };

    auto calculate = [&]() {
        if (current_op == 0) return;
        double val = std::stod(display);
        double res = 0;
        if (current_op == '+') res = stored_val + val;
        else if (current_op == '-') res = stored_val - val;
        else if (current_op == '*') res = stored_val * val;
        else if (current_op == '/') {
            if (val == 0) { display = "Error"; current_op = 0; new_input = true; return; }
            res = stored_val / val;
        }
        std::string s = std::to_string(res);
        s.erase(s.find_last_not_of('0') + 1, std::string::npos);
        if (s.back() == '.') s.pop_back();
        display = s;
        current_op = 0;
        new_input = true;
    };

    auto press_op = [&](char op) {
        if (current_op != 0 && !new_input) calculate();
        stored_val = std::stod(display == "Error" ? "0" : display);
        current_op = op;
        new_input = true;
    };

    auto btn = [&](std::string label, std::function<void()> onClick) {
        return Button(label, onClick, ButtonOption::Animated());
    };

    auto grid = Container::Vertical({
        Container::Horizontal({
            btn(" C ", [&] { display = "0"; stored_val = 0; current_op = 0; new_input = true; }),
            btn(" +/- ", [&] { if (display != "0" && display != "Error") display = (display[0] == '-') ? display.substr(1) : "-" + display; }),
            btn(" % ", [&] { if (display != "Error") display = std::to_string(std::stod(display) / 100.0); }),
            btn(" / ", [&] { press_op('/'); }),
        }),
        Container::Horizontal({
            btn(" 7 ", [&] { press_num("7"); }),
            btn(" 8 ", [&] { press_num("8"); }),
            btn(" 9 ", [&] { press_num("9"); }),
            btn(" * ", [&] { press_op('*'); }),
        }),
        Container::Horizontal({
            btn(" 4 ", [&] { press_num("4"); }),
            btn(" 5 ", [&] { press_num("5"); }),
            btn(" 6 ", [&] { press_num("6"); }),
            btn(" - ", [&] { press_op('-'); }),
        }),
        Container::Horizontal({
            btn(" 1 ", [&] { press_num("1"); }),
            btn(" 2 ", [&] { press_num("2"); }),
            btn(" 3 ", [&] { press_num("3"); }),
            btn(" + ", [&] { press_op('+'); }),
        }),
        Container::Horizontal({
            btn(" 0 ", [&] { press_num("0"); }),
            btn(" . ", [&] { if (display.find('.') == std::string::npos) { display += "."; new_input = false; } }),
            btn(" = ", [&] { calculate(); }),
            btn(" Exit ", screen.ExitLoopClosure()),
        }),
    });

    auto renderer = Renderer(grid, [&] {
        return vbox({
            text(" KALKULATOR TUI ") | bold | center,
            separator(),
            window(text(" Display "), text(display) | align_right | bold) | size(WIDTH, GREATER_THAN, 30),
            separator(),
            grid->Render() | center,
        }) | border | center;
    });

    screen.Loop(renderer);
    return 0;
}
