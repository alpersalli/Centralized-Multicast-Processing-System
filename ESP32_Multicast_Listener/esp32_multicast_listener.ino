#include <WiFi.h>
#include <AsyncUDP.h>
#include <Preferences.h>

// -------------------- GLOBAL --------------------
Preferences prefs;
AsyncUDP udp;

// Config değişkenleri
String wifi_ssid;
String wifi_pass;

uint8_t ip1, ip2, ip3, ip4;
uint16_t port;

IPAddress multicastIP;

void loadConfig() {
  prefs.begin("config", true); // okuma modu

  wifi_ssid = prefs.getString("wifi_ssid", "");
  wifi_pass = prefs.getString("wifi_pass", "");

  ip1 = prefs.getUInt("ip1");
  ip2 = prefs.getUInt("ip2");
  ip3 = prefs.getUInt("ip3");
  ip4 = prefs.getUInt("ip4");

  port = prefs.getUInt("port");

  prefs.end();

  multicastIP = IPAddress(ip1, ip2, ip3, ip4);
}

void connectWiFi() {
  WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());
  Serial.print("trying to connect wifi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}


void setup() {
  Serial.begin(115200);
  delay(1000);

  loadConfig();

  Serial.println("Config:");
  Serial.println("SSID: " + wifi_ssid);
  Serial.print("Multicast IP: ");
  Serial.println(multicastIP);
  Serial.print("Port: ");
  Serial.println(port);

  connectWiFi();

  if (udp.listenMulticast(multicastIP, port)) {
    Serial.println("Multicast listening.");

    udp.onPacket([](AsyncUDPPacket packet) {
      Serial.print("Paket received: ");
      Serial.write(packet.data(), packet.length());
      Serial.println();
    });
  } else {
    Serial.println("Multicast isn't starting!");
  }
}


void loop() {}
