#include <iostream>
#include <cstring>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

std::string get_ip() {
    int sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) return "";

    sockaddr_in loopback{};
    loopback.sin_family = AF_INET;
    loopback.sin_addr.s_addr = inet_addr("8.8.8.8");
    loopback.sin_port = htons(53);

    if (connect(sock, (struct sockaddr*)&loopback, sizeof(loopback)) < 0) {
        close(sock);
        return "";
    }

    sockaddr_in name{};
    socklen_t len = sizeof(name);
    if (getsockname(sock, (struct sockaddr*)&name, &len) < 0) {
        close(sock);
        return "";
    }

    close(sock);
    return inet_ntoa(name.sin_addr);
}

int main() {
    std::cout << get_ip() << std::endl;
    return 0;
}
